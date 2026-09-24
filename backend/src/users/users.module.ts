/**
 * ============================================================================
 * USERS MODULE
 * ============================================================================
 * Encapsulates user data access and exports UsersService for other modules.
 * AuthModule imports UsersModule to use UsersService for credential checks.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],        // Provides database connection via PrismaService
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],        // Exported so AuthModule can inject UsersService
})
export class UsersModule {}