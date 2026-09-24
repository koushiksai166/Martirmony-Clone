/**
 * ============================================================================
 * PAYMENT SERVICE
 * ============================================================================
 * Handles integration with Razorpay for premium membership subscriptions.
 * 
 * Flows:
 * 1. createOrder() – Initiates a payment order with Razorpay.
 * 2. verify()      – Frontend successfully completed payment; verifies signature
 *                    synchronously and provisions membership.
 * 3. webhook()     – Asynchronous fallback: Razorpay server calls our backend
 *                    to confirm payment capture or failure.
 * 
 * Security:
 * - HMAC SHA256 signatures are used to verify both frontend verify() payloads
 *   and backend webhook() payloads using Razorpay secrets.
 * - crypto.timingSafeEqual is used to prevent timing attacks during validation.
 * ============================================================================
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import * as crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentService {
  private readonly razorpay?: Razorpay;
  private readonly amount = Number(process.env.PREMIUM_PLAN_AMOUNT || 49900); // Amount in paise (499.00 INR)
  private readonly currency = process.env.PAYMENT_CURRENCY || 'INR';

  constructor(private readonly prisma: PrismaService) {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
  }

  /**
   * Initializes a new payment order with Razorpay.
   * Throws if the user already has an active premium membership.
   */
  async createOrder(userId: string) {
    if (!this.razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new BadRequestException('Payment provider is not configured');
    }

    const membership = await this.prisma.membership.findUnique({ where: { userId } });

    if (
      membership?.plan === 'PREMIUM' &&
      membership.status === 'ACTIVE' &&
      (!membership.expiresAt || membership.expiresAt > new Date())
    ) {
      throw new ConflictException('Premium membership is already active');
    }

    // Create an order on Razorpay servers
    const order = await this.razorpay.orders.create({
      amount: this.amount,
      currency: this.currency,
      receipt: `premium_${userId}_${Date.now()}`,
      notes: { userId, plan: 'PREMIUM' },
    });

    // Create a corresponding pending payment record in our DB
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        membershipId: membership?.id,
        providerOrderId: order.id,
        amount: this.amount,
        currency: this.currency,
        status: PaymentStatus.CREATED,
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
    };
  }

  /**
   * Synchronously verifies a payment completion reported by the frontend client.
   * Validates the cryptographic signature to prevent spoofing.
   */
  async verify(userId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerOrderId: dto.razorpayOrderId },
    });

    if (!payment || payment.userId !== userId) {
      throw new NotFoundException('Payment order not found');
    }

    // Reconstruct the expected signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (!this.signaturesMatch(expected, dto.razorpaySignature)) {
      throw new UnauthorizedException('Invalid payment signature');
    }

    // Provision the membership
    return this.capturePayment(dto.razorpayOrderId, dto.razorpayPaymentId);
  }

  /**
   * Asynchronous webhook handler for Razorpay server-to-server events.
   * Processes 'payment.captured' and 'payment.failed' events.
   * Required reading `rawBody` as Buffer in main.ts to validate HMAC.
   */
  async webhook(signature: string, rawBody: Buffer) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      throw new BadRequestException('Webhook secret is not configured');
    }

    // Verify webhook signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (!this.signaturesMatch(expected, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const eventId = payload.id;

    if (!eventId) {
      throw new BadRequestException('Webhook event ID is required');
    }

    // Idempotency check: Ensure we haven't processed this exact event before
    try {
      await this.prisma.paymentEvent.create({
        data: {
          providerEventId: eventId,
          eventType: payload.event || 'unknown',
          payload,
        },
      });
    } catch (error) {
      // P2002 means event already exists (we already processed it)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { received: true, duplicate: true };
      }
      throw error;
    }

    const entity = payload.payload?.payment?.entity;

    // Handle successful payment
    if (payload.event === 'payment.captured' && entity?.order_id && entity?.id) {
      await this.capturePayment(entity.order_id, entity.id);
    }

    // Handle failed payment
    if (payload.event === 'payment.failed' && entity?.order_id) {
      await this.prisma.payment.updateMany({
        where: { providerOrderId: entity.order_id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: entity.error_description || 'Payment failed',
        },
      });
    }

    return { received: true };
  }

  /**
   * Returns the user's payment history.
   */
  async history(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      select: {
        id: true,
        providerOrderId: true,
        providerPaymentId: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns the user's current membership status.
   */
  async membership(userId: string) {
    return this.prisma.membership.findUnique({
      where: { userId },
      select: { plan: true, status: true, startedAt: true, expiresAt: true },
    });
  }

  /**
   * Returns details about the Premium plan.
   */
  plan() {
    return { amount: this.amount, currency: this.currency, plan: 'PREMIUM', durationDays: 30 };
  }

  /**
   * Internal transactional helper to mark a payment as captured
   * and UPSERT the user's Premium membership (valid for 30 days).
   */
  private async capturePayment(orderId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerOrderId: orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment order not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day premium duration

    return this.prisma.$transaction(async (tx) => {
      // Upsert membership record
      const membership = await tx.membership.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          plan: 'PREMIUM',
          status: 'ACTIVE',
          expiresAt,
        },
        update: {
          plan: 'PREMIUM',
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt,
        },
      });

      // Update payment record to CAPTURED
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          membershipId: membership.id,
          providerPaymentId: paymentId,
          status: PaymentStatus.CAPTURED,
          paidAt: new Date(),
        },
      });

      return {
        message: 'Payment verified and membership activated',
        payment: { id: updated.id, status: updated.status },
        membership: {
          plan: membership.plan,
          status: membership.status,
          expiresAt: membership.expiresAt,
        },
      };
    });
  }

  /**
   * Secure signature comparison helper (prevents timing attacks).
   */
  private signaturesMatch(expected: string, received?: string): boolean {
    if (!received || expected.length !== received.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }
}
