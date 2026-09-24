/**
 * ============================================================================
 * AUTH MODULE
 * ============================================================================
 * Wires together all authentication providers, guards, and strategies.
 *
 * Dependencies:
 * - UsersModule: Provides UsersService for credential lookups.
 * - EmailModule: Provides EmailService for sending welcome emails after registration.
 * - JwtModule: Configures JWT signing with `JWT_SECRET` and `JWT_EXPIRES_IN` from .env.
 * - JwtStrategy: Passport strategy for validating Bearer token on each protected request.
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    // Provides UsersService for email lookups and user creation
    UsersModule,
    // Provides EmailService for registration welcome emails
    EmailModule,
    // Configures JWT signing secret and access token expiry
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,    // Contains all authentication business logic
    JwtStrategy,    // Passport strategy that validates incoming JWT tokens
  ],
})
export class AuthModule {}