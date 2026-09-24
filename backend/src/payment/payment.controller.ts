/**
 * ============================================================================
 * PAYMENT CONTROLLER
 * ============================================================================
 * Exposes REST endpoints for managing Razorpay premium subscriptions.
 * 
 * Endpoints:
 * GET  /payments/plan       – Fetch pricing details for the premium plan
 * GET  /payments/membership – Get the current user's membership status
 * GET  /payments/history    – List the user's past payments
 * POST /payments/orders     – Initialize a Razorpay order
 * POST /payments/verify     – Synchronously verify successful client payment
 * POST /payments/webhook    – Public webhook endpoint for Razorpay servers
 * ============================================================================
 */

import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  /**
   * Public webhook endpoint for Razorpay.
   * Requires rawBuffer attached to `req.rawBody` by the main.ts bootstrap.
   */
  @Post('webhook')
  webhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() request: any,
  ) {
    // request.rawBody is populated by main.ts using express.json({ verify: ... })
    const body = request.rawBody || Buffer.from(JSON.stringify(request.body));
    return this.payments.webhook(signature, body);
  }

  /**
   * Initialize a new premium payment order.
   */
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createOrder(@GetUser() user: any) {
    return this.payments.createOrder(user.id);
  }

  /**
   * Get pricing details for the premium plan.
   */
  @Get('plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  plan() {
    return this.payments.plan();
  }

  /**
   * Verify a successful payment received from the frontend Razorpay checkout.
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  verify(@GetUser() user: any, @Body() dto: VerifyPaymentDto) {
    return this.payments.verify(user.id, dto);
  }

  /**
   * Retrieve the user's payment history.
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  history(@GetUser() user: any) {
    return this.payments.history(user.id);
  }

  /**
   * Retrieve the user's current membership (plan, status, expiry).
   */
  @Get('membership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  membership(@GetUser() user: any) {
    return this.payments.membership(user.id);
  }
}
