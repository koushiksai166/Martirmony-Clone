/**
 * ============================================================================
 * USERS SERVICE
 * ============================================================================
 * Low-level data access layer for User records in PostgreSQL via Prisma.
 * Used internally by AuthService, AdminService, and JwtStrategy.
 *
 * Methods:
 * - findByEmail()         – Look up a user by email (for login and duplicate check)
 * - findById()            – Look up a user by their unique ID (for token validation)
 * - createUser()          – Create a new user record with email and hashed password
 * - updatePassword()      – Replace the stored bcrypt password hash
 * - updateRefreshToken()  – Store or replace the hashed refresh token
 * - removeRefreshToken()  – Clear the refresh token (logout / invalidate session)
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by their email address.
   * Used during login and registration duplicate-check flows.
   * @param email The email to search for
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find a user by their unique database ID.
   * Used by JwtStrategy to validate token subjects and by AuthService for getMe().
   * @param id Unique CUID identifier
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Create a new user record in the database.
   * Password must already be hashed with bcrypt before calling this method.
   * @param email Unique email address
   * @param password Bcrypt-hashed password string
   */
  async createUser(email: string, password: string) {
    return this.prisma.user.create({
      data: { email, password },
    });
  }

  /**
   * Update the bcrypt-hashed password stored for a user.
   * Called after successful password change validation in AuthService.
   * @param id The user's unique ID
   * @param password New bcrypt-hashed password
   */
  async updatePassword(id: string, password: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password },
    });
  }

  /**
   * Store or replace the hashed refresh token for a user.
   * Called after each login or refresh token rotation.
   * @param id The user's unique ID
   * @param refreshToken Bcrypt-hashed refresh token (or null to clear)
   */
  async updateRefreshToken(id: string, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  /**
   * Remove the stored refresh token, effectively invalidating all active sessions.
   * Called on logout.
   * @param id The user's unique ID
   */
  async removeRefreshToken(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken: null },
    });
  }
}