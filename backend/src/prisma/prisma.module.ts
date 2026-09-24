/**
 * ============================================================================
 * PRISMA MODULE
 * ============================================================================
 * Exports PrismaService as a shared provider so that any feature module
 * (Auth, Users, Profile, Match, Chat, etc.) can inject and use it for DB queries.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}