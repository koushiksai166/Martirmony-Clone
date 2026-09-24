/**
 * ============================================================================
 * PASSPORT JWT STRATEGY
 * ============================================================================
 * Handles decoding, cryptographic signature verification, and user lookup
 * for incoming JSON Web Tokens (JWT).
 *
 * Verification Lifecycle:
 * 1. Passport extracts the JWT from the `Authorization: Bearer <token>` header.
 * 2. Passport verifies token signature using `process.env.JWT_SECRET`.
 * 3. Passport ensures token has not expired (`ignoreExpiration: false`).
 * 4. Calls `validate(payload)` with decoded token contents.
 * 5. Queries database to confirm user still exists (invalidates deleted accounts).
 * 6. Returns sanitized user object, which NestJS automatically assigns to `req.user`.
 * ============================================================================
 */

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
  ) {
    super({
      // Extract token from HTTP 'Authorization: Bearer <token>' header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Automatically reject expired tokens
      ignoreExpiration: false,
      // Secret key used to sign and verify access tokens
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-for-dev',
    });
  }

  /**
   * Called by Passport after signature & expiration checks succeed.
   * @param payload Decoded JWT token payload ({ sub: userId, email, role, iat, exp })
   * @returns Sanitized user object attached to req.user
   */
  async validate(payload: { sub: string; email: string; role: string }) {
    // Confirm user exists in the database
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    // Return safe user profile (excluding sensitive fields like password hash)
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}