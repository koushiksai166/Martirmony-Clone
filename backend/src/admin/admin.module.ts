/**
 * ============================================================================
 * ADMIN MODULE
 * ============================================================================
 * Encapsulates all admin moderation features.
 * Imported in AppModule to register admin HTTP routes.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule],  // Provides database access via PrismaService
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
