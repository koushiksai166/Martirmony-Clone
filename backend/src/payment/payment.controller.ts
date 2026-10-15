import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  /** Public webhook — no auth guard */
  @Post('webhook')
  webhook(@Headers('x-razorpay-signature') signature: string, @Req() request: any) {
    const body = request.rawBody || Buffer.from(JSON.stringify(request.body));
    return this.payments.webhook(signature, body);
  }

  /** All available membership plans with pricing */
  @Get('plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available membership plans' })
  plans() {
    return this.payments.plans();
  }

  /** Create a Razorpay order for the chosen plan */
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment order for a plan' })
  createOrder(@GetUser() user: any, @Body() dto: CreateOrderDto) {
    return this.payments.createOrder(user.id, dto.plan);
  }

  /** Verify payment signature from frontend Razorpay checkout */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a completed payment' })
  verify(@GetUser() user: any, @Body() dto: VerifyPaymentDto) {
    return this.payments.verify(user.id, dto);
  }

  /** Retry a failed payment — creates a fresh order for the same plan */
  @Post(':id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry a failed payment' })
  retry(@GetUser() user: any, @Param('id') id: string) {
    return this.payments.retry(user.id, id);
  }

  /** Request a partial or full refund for a captured payment */
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a payment (partial or full)' })
  refund(@GetUser() user: any, @Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.payments.refund(user.id, id, dto);
  }

  /** Get invoice data for a captured payment */
  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice for a payment' })
  invoice(@GetUser() user: any, @Param('id') id: string) {
    return this.payments.generateInvoice(user.id, id);
  }

  /** Toggle auto-renewal on/off */
  @Patch('membership/auto-renew')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle membership auto-renewal' })
  autoRenew(@GetUser() user: any, @Body() body: { enable: boolean }) {
    return this.payments.toggleAutoRenew(user.id, body.enable);
  }

  /** Current membership status */
  @Get('membership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current membership status' })
  membership(@GetUser() user: any) {
    return this.payments.membership(user.id);
  }

  /** Payment history */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history' })
  history(@GetUser() user: any) {
    return this.payments.history(user.id);
  }
}
