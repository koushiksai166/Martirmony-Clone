/**
 * ============================================================================
 * PAYMENT SERVICE
 * ============================================================================
 * Handles Razorpay integration for tiered membership subscriptions.
 *
 * Plans: SILVER (30d), GOLD (90d), PLATINUM (365d)
 *
 * Flows:
 * 1. createOrder(plan)  – Initiates a Razorpay order for the chosen plan.
 * 2. verify()           – Frontend verifies payment; provisions membership.
 * 3. webhook()          – Razorpay server confirms capture or failure.
 * 4. refund()           – Admin/user requests partial or full refund.
 * 5. retry()            – Re-creates a Razorpay order for a failed payment.
 * 6. generateInvoice()  – Returns invoice data for a captured payment.
 * 7. toggleAutoRenew()  – User opts in/out of auto-renewal.
 * 8. renewExpiring()    – Cron: auto-renews memberships expiring within 3 days.
 * ============================================================================
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentStatus, Prisma } from '@prisma/client';
import * as crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PlanKey } from './dto/create-order.dto';

// ── Plan configuration ────────────────────────────────────────────────────────
const PLANS: Record<PlanKey, { label: string; amount: number; durationDays: number; features: string[] }> = {
  SILVER: {
    label: 'Silver',
    amount: Number(process.env.SILVER_PLAN_AMOUNT || 29900),
    durationDays: 30,
    features: ['Enhanced matching', 'Unlimited interests', 'Priority support'],
  },
  GOLD: {
    label: 'Gold',
    amount: Number(process.env.GOLD_PLAN_AMOUNT || 59900),
    durationDays: 90,
    features: ['All Silver benefits', 'Direct contact access', 'Priority listing', 'Profile boost'],
  },
  PLATINUM: {
    label: 'Platinum',
    amount: Number(process.env.PLATINUM_PLAN_AMOUNT || 99900),
    durationDays: 365,
    features: ['All Gold benefits', 'Dedicated relationship manager', 'Verified badge', 'Annual membership'],
  },
};

const MAX_RENEWAL_ATTEMPTS = 3;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly razorpay?: Razorpay;
  private readonly currency = process.env.PAYMENT_CURRENCY || 'INR';

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
  }

  // ── Public plan catalogue ──────────────────────────────────────────────────

  plans() {
    return Object.entries(PLANS).map(([key, config]) => ({
      key,
      ...config,
      currency: this.currency,
    }));
  }

  // ── Create order ───────────────────────────────────────────────────────────

  async createOrder(userId: string, planKey: PlanKey = PlanKey.SILVER) {
    this.requireRazorpay();

    const planConfig = PLANS[planKey];
    if (!planConfig) throw new BadRequestException('Invalid plan selected');

    const membership = await this.prisma.membership.findUnique({ where: { userId } });

    // Block if already on same or higher plan and still active
    if (
      membership &&
      membership.status === 'ACTIVE' &&
      membership.plan === planKey &&
      membership.expiresAt &&
      membership.expiresAt > new Date()
    ) {
      throw new ConflictException(`${planConfig.label} membership is already active`);
    }

    const order = await this.razorpay!.orders.create({
      amount: planConfig.amount,
      currency: this.currency,
      receipt: `${planKey.toLowerCase()}_${userId}_${Date.now()}`,
      notes: { userId, plan: planKey },
    });

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        plan: planKey,
        providerOrderId: order.id,
        amount: planConfig.amount,
        currency: this.currency,
        status: PaymentStatus.CREATED,
      },
    });

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) throw new BadRequestException('Payment provider is not configured');

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      paymentId: payment.id,
      plan: planKey,
      planLabel: planConfig.label,
    };
  }

  // ── Verify (frontend callback) ─────────────────────────────────────────────

  async verify(userId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerOrderId: dto.razorpayOrderId },
    });

    if (!payment || payment.userId !== userId) {
      throw new NotFoundException('Payment order not found');
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (!this.signaturesMatch(expected, dto.razorpaySignature)) {
      throw new UnauthorizedException('Invalid payment signature');
    }

    return this.capturePayment(dto.razorpayOrderId, dto.razorpayPaymentId);
  }

  // ── Webhook ────────────────────────────────────────────────────────────────

  async webhook(signature: string, rawBody: Buffer) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      throw new BadRequestException('Webhook secret is not configured');
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (!this.signaturesMatch(expected, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const eventId = payload.id;
    if (!eventId) throw new BadRequestException('Webhook event ID is required');

    try {
      await this.prisma.paymentEvent.create({
        data: { providerEventId: eventId, eventType: payload.event || 'unknown', payload },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { received: true, duplicate: true };
      }
      throw error;
    }

    const entity = payload.payload?.payment?.entity;

    if (payload.event === 'payment.captured' && entity?.order_id && entity?.id) {
      await this.capturePayment(entity.order_id, entity.id);
    }

    if (payload.event === 'payment.failed' && entity?.order_id) {
      await this.prisma.payment.updateMany({
        where: { providerOrderId: entity.order_id },
        data: { status: PaymentStatus.FAILED, failureReason: entity.error_description || 'Payment failed' },
      });
    }

    return { received: true };
  }

  // ── Refund (partial or full) ───────────────────────────────────────────────

  async refund(userId: string, paymentId: string, dto: RefundPaymentDto) {
    this.requireRazorpay();

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new BadRequestException('Only captured payments can be refunded');
    }
    if (!payment.providerPaymentId) {
      throw new BadRequestException('No Razorpay payment ID on record');
    }

    const refundAmount = dto.amount ?? payment.amount;
    if (refundAmount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds original payment');
    }

    await (this.razorpay!.payments as any).refund(payment.providerPaymentId, {
      amount: refundAmount,
      notes: { reason: dto.reason ?? 'User requested refund' },
    });

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: refundAmount === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.CAPTURED,
        refundedAmount: refundAmount,
      },
    });

    // Expire membership if full refund
    if (refundAmount === payment.amount && payment.membershipId) {
      await this.prisma.membership.update({
        where: { id: payment.membershipId },
        data: { status: 'CANCELLED' },
      });
    }

    return { refunded: true, refundedAmount: refundAmount, payment: updated };
  }

  // ── Retry failed payment ───────────────────────────────────────────────────

  async retry(userId: string, paymentId: string) {
    this.requireRazorpay();

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.FAILED) {
      throw new BadRequestException('Only failed payments can be retried');
    }

    const planKey = (payment.plan as PlanKey) ?? PlanKey.SILVER;
    const planConfig = PLANS[planKey];

    // Create a fresh Razorpay order for the same plan
    const order = await this.razorpay!.orders.create({
      amount: planConfig.amount,
      currency: this.currency,
      receipt: `retry_${planKey.toLowerCase()}_${userId}_${Date.now()}`,
      notes: { userId, plan: planKey, retryOf: payment.id },
    });

    const newPayment = await this.prisma.payment.create({
      data: {
        userId,
        plan: planKey,
        providerOrderId: order.id,
        amount: planConfig.amount,
        currency: this.currency,
        status: PaymentStatus.CREATED,
      },
    });

    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) throw new BadRequestException('Payment provider is not configured');

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      paymentId: newPayment.id,
      plan: planKey,
    };
  }

  // ── Invoice generation ─────────────────────────────────────────────────────

  async generateInvoice(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new BadRequestException('Invoice only available for successful payments');
    }

    // Generate invoice number if not already set
    let invoiceNumber = payment.invoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = `INV-${new Date().getFullYear()}-${payment.id.slice(-8).toUpperCase()}`;
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { invoiceNumber },
      });
    }

    const planConfig = PLANS[payment.plan as PlanKey] ?? PLANS.SILVER;

    return {
      invoiceNumber,
      issuedAt: payment.paidAt ?? payment.createdAt,
      customer: {
        name: payment.user.profile
          ? `${payment.user.profile.firstName} ${payment.user.profile.lastName}`
          : 'Valued Customer',
        email: payment.user.email,
      },
      item: {
        description: `Vivah ${planConfig.label} Membership`,
        durationDays: planConfig.durationDays,
        amount: payment.amount,
        currency: payment.currency,
      },
      amountPaid: payment.amount,
      refundedAmount: payment.refundedAmount ?? 0,
      currency: payment.currency,
      providerPaymentId: payment.providerPaymentId,
      providerOrderId: payment.providerOrderId,
    };
  }

  // ── Auto-renew toggle ──────────────────────────────────────────────────────

  async toggleAutoRenew(userId: string, enable: boolean) {
    const membership = await this.prisma.membership.findUnique({ where: { userId } });
    if (!membership) throw new NotFoundException('No membership found');

    return this.prisma.membership.update({
      where: { userId },
      data: { autoRenew: enable, renewalAttempts: enable ? 0 : membership.renewalAttempts },
    });
  }

  // ── Auto-renew cron ────────────────────────────────────────────────────────

  /**
   * Runs daily: finds memberships expiring within 3 days with autoRenew=true
   * and creates a new Razorpay order for them (up to MAX_RENEWAL_ATTEMPTS).
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async renewExpiring() {
    if (!this.razorpay) return;

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiring = await this.prisma.membership.findMany({
      where: {
        autoRenew: true,
        status: 'ACTIVE',
        expiresAt: { lte: threeDaysFromNow, gt: new Date() },
        renewalAttempts: { lt: MAX_RENEWAL_ATTEMPTS },
      },
      include: { user: { select: { email: true, profile: { select: { firstName: true } } } } },
    });

    for (const membership of expiring) {
      try {
        const planKey = (membership.plan as PlanKey) ?? PlanKey.SILVER;
        const planConfig = PLANS[planKey];

        const order = await this.razorpay.orders.create({
          amount: planConfig.amount,
          currency: this.currency,
          receipt: `renew_${planKey.toLowerCase()}_${membership.userId}_${Date.now()}`,
          notes: { userId: membership.userId, plan: planKey, renewal: 'true' },
        });

        await this.prisma.payment.create({
          data: {
            userId: membership.userId,
            membershipId: membership.id,
            plan: planKey,
            providerOrderId: order.id,
            amount: planConfig.amount,
            currency: this.currency,
            status: PaymentStatus.CREATED,
          },
        });

        await this.prisma.membership.update({
          where: { id: membership.id },
          data: { renewalAttempts: { increment: 1 } },
        });

        this.logger.log(`Renewal order created for user ${membership.userId}`);
      } catch (err) {
        this.logger.error(`Renewal failed for membership ${membership.id}: ${(err as Error).message}`);
      }
    }
  }

  // ── History & membership status ────────────────────────────────────────────

  async history(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      select: {
        id: true,
        plan: true,
        providerOrderId: true,
        providerPaymentId: true,
        amount: true,
        currency: true,
        status: true,
        refundedAmount: true,
        invoiceNumber: true,
        failureReason: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async membership(userId: string) {
    return this.prisma.membership.findUnique({
      where: { userId },
      select: { plan: true, status: true, startedAt: true, expiresAt: true, autoRenew: true },
    });
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private async capturePayment(orderId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerOrderId: orderId },
    });

    if (!payment) throw new NotFoundException('Payment order not found');

    const planKey = (payment.plan as PlanKey) ?? PlanKey.SILVER;
    const planConfig = PLANS[planKey];

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planConfig.durationDays);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${payment.id.slice(-8).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          plan: planKey as any,
          status: 'ACTIVE',
          expiresAt,
          renewalAttempts: 0,
        },
        update: {
          plan: planKey as any,
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt,
          renewalAttempts: 0,
        },
      });

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          membershipId: membership.id,
          providerPaymentId: paymentId,
          status: PaymentStatus.CAPTURED,
          invoiceNumber,
          paidAt: new Date(),
        },
      });

      return {
        message: 'Payment verified and membership activated',
        payment: { id: updated.id, status: updated.status, invoiceNumber },
        membership: { plan: membership.plan, status: membership.status, expiresAt: membership.expiresAt },
      };
    });
  }

  private requireRazorpay() {
    if (!this.razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new BadRequestException('Payment provider is not configured');
    }
  }

  private signaturesMatch(expected: string, received?: string): boolean {
    if (!received || expected.length !== received.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }
}
