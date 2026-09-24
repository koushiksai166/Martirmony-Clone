/**
 * ============================================================================
 * AUTH SERVICE
 * ============================================================================
 * Provides all authentication business logic for the Saanjh platform.
 *
 * Responsibilities:
 * 1. register()       – Hash password, create user, send welcome email.
 * 2. login()          – Validate credentials, issue access + refresh tokens.
 * 3. refresh()        – Rotate refresh tokens (token rotation strategy).
 * 4. logout()         – Remove refresh token from DB to invalidate session.
 * 5. getMe()          – Fetch current authenticated user's profile.
 * 6. changePassword() – Verify current password and update with new hash.
 *
 * Token Strategy:
 * - Access Token:  Short-lived JWT (e.g. 15m) extracted by JwtAuthGuard on every protected request.
 * - Refresh Token: Long-lived JWT (e.g. 7d) stored as bcrypt hash in the DB.
 *   The plaintext token is issued to the client and used only to obtain new access tokens.
 * ============================================================================
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

import { StringValue } from 'ms';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // ===========================
  // Private Helper Methods
  // ===========================

  /**
   * Signs a short-lived access token.
   * Payload contains: sub (userId), email, role.
   * Expiry controlled by JWT_EXPIRES_IN environment variable (e.g. '15m').
   */
  private async generateAccessToken(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
    });
  }

  /**
   * Signs a long-lived refresh token.
   * Payload: sub (userId), email, role.
   * Expiry controlled by JWT_REFRESH_EXPIRES_IN environment variable (e.g. '7d').
   * The token is hashed with bcrypt before being stored in the database.
   */
  private async generateRefreshToken(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,
    });
  }

  // ===========================
  // Register
  // ===========================

  /**
   * Creates a new user account.
   * Steps:
   * 1. Check for duplicate email -> ConflictException if found.
   * 2. Hash the plain-text password with bcrypt (10 salt rounds).
   * 3. Persist the new User record in PostgreSQL.
   * 4. Fire-and-forget welcome email (email failure does NOT break registration).
   * @returns User metadata (id, email, createdAt) without sensitive data.
   */
  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Prevent duplicate accounts
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password securely (10 salt rounds ~= 100ms computation)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser(email, hashedPassword);

    // Fire-and-forget — email failure must not break registration flow
    void this.emailService.sendWelcome(user.email, user.email.split('@')[0]);

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  // ===========================
  // Login
  // ===========================

  /**
   * Authenticates a user with email/password credentials.
   * Steps:
   * 1. Look up user by email -> 401 if not found (no user enumeration disclosure).
   * 2. Compare plain password against stored bcrypt hash.
   * 3. Issue a new access token and refresh token.
   * 4. Store bcrypt hash of refresh token in the database.
   * @returns access_token, refresh_token, and user metadata.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    // Use generic error message to avoid user enumeration attacks
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT access token and refresh token
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Store hashed refresh token (security: never store plaintext tokens)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  // ===========================
  // Get Current User
  // ===========================

  /**
   * Returns the authenticated user's profile data.
   * Called via GET /auth/me after JwtAuthGuard validates the access token.
   */
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User fetched successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  // ===========================
  // Refresh Token Rotation
  // ===========================

  /**
   * Issues a new access token and rotates the refresh token.
   * Token rotation strategy: on every use, the refresh token is replaced
   * and the old one is invalidated to prevent replay attacks.
   * @param refreshToken Plain-text refresh token from client storage.
   */
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Verify refresh token signature and expiry
    let payload: { sub: string; email: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Confirm token matches stored hash (invalidates previously stolen tokens)
    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshToken || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Issue new tokens and rotate storage
    const newAccessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);
    await this.usersService.updateRefreshToken(
      user.id,
      await bcrypt.hash(newRefreshToken, 10),
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  // ===========================
  // Logout
  // ===========================

  /**
   * Logs the user out by removing their refresh token hash from the database.
   * Access tokens remain valid until expiry but cannot be renewed.
   */
  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  // ===========================
  // Change Password
  // ===========================

  /**
   * Updates the user's password after verifying the current one.
   * Steps:
   * 1. Fetch user by ID.
   * 2. Verify currentPassword against stored hash -> 401 if mismatch.
   * 3. Reject if newPassword equals currentPassword -> 400 Bad Request.
   * 4. Hash and persist the new password.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password is correct
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Prevent setting the same password as before
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    // Hash and store new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }
}