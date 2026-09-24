/**
 * ============================================================================
 * MATCH MODULE
 * ============================================================================
 * Bundles the MatchService and MatchController.
 * Relies heavily on Prisma for fetching users, profiles, and preferences.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';

@Module({
  imports: [PrismaModule],
  controllers: [MatchController],
  providers: [MatchService],
})
export class MatchModule {}
