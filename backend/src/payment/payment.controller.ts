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

  @Post('webhook')
  webhook(@Headers('x-razorpay-signature') signature: string, @Req() request: any) {
    return this.payments.webhook(signature, request.rawBody || Buffer.from(JSON.stringify(request.body)));
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createOrder(@GetUser() user: any) { return this.payments.createOrder(user.id); }

  @Get('plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  plan() { return this.payments.plan(); }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  verify(@GetUser() user: any, @Body() dto: VerifyPaymentDto) { return this.payments.verify(user.id, dto); }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  history(@GetUser() user: any) { return this.payments.history(user.id); }

  @Get('membership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  membership(@GetUser() user: any) { return this.payments.membership(user.id); }
}
