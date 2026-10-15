/**
 * ============================================================================
 * INTEREST MODULE
 * ============================================================================
 * Encapsulates the components responsible for the connection request flow.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { InterestController } from './interest.controller';
import { InterestService } from './interest.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [InterestController],
  providers: [InterestService],
})
export class InterestModule {}
