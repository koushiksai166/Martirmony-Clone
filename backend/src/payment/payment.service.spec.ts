import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = 'test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';
  });

  it('rejects order creation when Razorpay is not configured', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    const service = new PaymentService({} as any);
    await expect(service.createOrder('user-1')).rejects.toThrow(BadRequestException);
  });

  it('rejects malformed webhook signatures', async () => {
    const service = new PaymentService({} as any);
    await expect(service.webhook('invalid', Buffer.from('{"id":"evt_1"}'))).rejects.toThrow(UnauthorizedException);
  });
});
