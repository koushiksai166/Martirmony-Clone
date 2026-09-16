import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import * as crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentService {
  private readonly razorpay?: Razorpay;
  private readonly amount = Number(process.env.PREMIUM_PLAN_AMOUNT || 49900);
  private readonly currency = process.env.PAYMENT_CURRENCY || 'INR';

  constructor(private readonly prisma: PrismaService) {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    }
  }

  async createOrder(userId: string) {
    if (!this.razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new BadRequestException('Payment provider is not configured');
    const membership = await this.prisma.membership.findUnique({ where: { userId } });
    if (membership?.plan === 'PREMIUM' && membership.status === 'ACTIVE' && (!membership.expiresAt || membership.expiresAt > new Date())) throw new ConflictException('Premium membership is already active');
    const order = await this.razorpay.orders.create({ amount: this.amount, currency: this.currency, receipt: `premium_${userId}_${Date.now()}`, notes: { userId, plan: 'PREMIUM' } });
    const payment = await this.prisma.payment.create({ data: { userId, membershipId: membership?.id, providerOrderId: order.id, amount: this.amount, currency: this.currency, status: PaymentStatus.CREATED } });
    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, paymentId: payment.id };
  }

  async verify(userId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { providerOrderId: dto.razorpayOrderId } });
    if (!payment || payment.userId !== userId) throw new NotFoundException('Payment order not found');
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`).digest('hex');
    if (!this.signaturesMatch(expected, dto.razorpaySignature)) throw new UnauthorizedException('Invalid payment signature');
    return this.capturePayment(dto.razorpayOrderId, dto.razorpayPaymentId);
  }

  async webhook(signature: string, rawBody: Buffer) {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '').update(rawBody).digest('hex');
    if (!this.signaturesMatch(expected, signature)) throw new UnauthorizedException('Invalid webhook signature');
    const payload = JSON.parse(rawBody.toString('utf8'));
    const eventId = payload.id;
    if (!eventId) throw new BadRequestException('Webhook event ID is required');
    try {
      await this.prisma.paymentEvent.create({ data: { providerEventId: eventId, eventType: payload.event || 'unknown', payload } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { received: true, duplicate: true };
      throw error;
    }
    const entity = payload.payload?.payment?.entity;
    if (payload.event === 'payment.captured' && entity?.order_id && entity?.id) await this.capturePayment(entity.order_id, entity.id);
    if (payload.event === 'payment.failed' && entity?.order_id) await this.prisma.payment.updateMany({ where: { providerOrderId: entity.order_id }, data: { status: PaymentStatus.FAILED, failureReason: entity.error_description || 'Payment failed' } });
    return { received: true };
  }

  async history(userId: string) {
    return this.prisma.payment.findMany({ where: { userId }, select: { id: true, providerOrderId: true, providerPaymentId: true, amount: true, currency: true, status: true, paidAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
  }

  async membership(userId: string) {
    return this.prisma.membership.findUnique({ where: { userId }, select: { plan: true, status: true, startedAt: true, expiresAt: true } });
  }

  plan() {
    return { amount: this.amount, currency: this.currency, plan: 'PREMIUM', durationDays: 30 };
  }

  private async capturePayment(orderId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { providerOrderId: orderId } });
    if (!payment) throw new NotFoundException('Payment order not found');
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 30);
    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.upsert({ where: { userId: payment.userId }, create: { userId: payment.userId, plan: 'PREMIUM', status: 'ACTIVE', expiresAt }, update: { plan: 'PREMIUM', status: 'ACTIVE', startedAt: new Date(), expiresAt } });
      const updated = await tx.payment.update({ where: { id: payment.id }, data: { membershipId: membership.id, providerPaymentId: paymentId, status: PaymentStatus.CAPTURED, paidAt: new Date() } });
      return { message: 'Payment verified and membership activated', payment: { id: updated.id, status: updated.status }, membership: { plan: membership.plan, status: membership.status, expiresAt: membership.expiresAt } };
    });
  }

  private signaturesMatch(expected: string, received?: string) {
    if (!received || expected.length !== received.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }
}
