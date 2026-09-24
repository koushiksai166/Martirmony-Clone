/**
 * ============================================================================
 * ROOT APPLICATION MODULE (AppModule)
 * ============================================================================
 * The central hub of the NestJS application dependency graph.
 *
 * Responsibilities:
 * 1. Load global environment variables from `.env` via `ConfigModule`.
 * 2. Configure global API rate limiting (Throttling) to prevent abuse and brute-force attacks.
 * 3. Import and wire together all domain modules (Auth, Users, Profile, Match, Chat, etc.).
 * 4. Register global guards (ThrottlerGuard) applied across all HTTP controllers.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { InterestModule } from './interest/interest.module';
import { MatchModule } from './match/match.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { SafetyModule } from './safety/safety.module';
import { AdminModule } from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    /**
     * ConfigModule:
     * Loads environment variables from `.env` file into `process.env`.
     * `isGlobal: true` ensures ConfigService and variables are accessible everywhere.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    /**
     * ThrottlerModule:
     * Rate-limits incoming client requests to safeguard against DDoS and brute-force attacks.
     * Configuration: Maximum 100 requests per 60 seconds (60000 ms) per IP address.
     */
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    /**
     * Domain Feature Modules:
     * Each module encapsulates its respective controllers, services, repositories, and logic.
     */
    PrismaModule,        // Database ORM connection & queries
    UsersModule,         // User accounts & credential records
    AuthModule,          // JWT tokens, registration, login & security guards
    ProfileModule,       // Candidate profiles & partner preferences
    InterestModule,      // Sending, accepting, rejecting & withdrawing matchmaking interests
    MatchModule,         // Matchmaking compatibility scoring engine
    ChatModule,          // Real-time messaging (Socket.IO & REST endpoints)
    NotificationModule,  // Real-time & stored user notifications
    SafetyModule,        // User blocking and reporting system
    AdminModule,         // Admin review, profile verification, and moderation
    PaymentModule,       // Razorpay payments, plans & webhook validation
    UploadModule,        // Profile photo uploads and local disk/cloud storage
  ],
  controllers: [AppController],
  providers: [
    AppService,
    /**
     * Global ThrottlerGuard:
     * Binds rate-limiting checks to all incoming HTTP routes in the system.
     */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}