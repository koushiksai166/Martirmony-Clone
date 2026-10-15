import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [PrismaModule, EmailModule, ScheduleModule.forRoot()],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
