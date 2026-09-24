/**
 * ============================================================================
 * JWT AUTH GUARD (Route Protection)
 * ============================================================================
 * Extends `@nestjs/passport`'s `AuthGuard('jwt')`.
 *
 * Responsibilities:
 * - Intercepts incoming HTTP requests on protected controller endpoints.
 * - Extracts Bearer JWT token from `Authorization: Bearer <token>` header.
 * - Triggers Passport's `JwtStrategy.validate(payload)`.
 * - Throws 401 Unauthorized if the token is missing, expired, or invalid.
 * - Attaches authenticated user payload to `req.user` if valid.
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}