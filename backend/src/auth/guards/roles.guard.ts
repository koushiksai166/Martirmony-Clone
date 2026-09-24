/**
 * ============================================================================
 * ROLES GUARD (Role-Based Access Control)
 * ============================================================================
 * Implements `CanActivate` to verify whether the currently authenticated user
 * has one of the roles declared on the route via the `@Roles(...)` decorator.
 *
 * Workflow:
 * 1. Checks handler (method) and class metadata for `ROLES_KEY`.
 * 2. If no `@Roles` decorator is present, the route is open to all authenticated users.
 * 3. Extracts `request.user` (populated previously by `JwtAuthGuard`).
 * 4. Checks if `user.role` matches any of the required roles.
 * 5. Returns `true` if permitted, or `false` (resulting in a 403 Forbidden).
 * ============================================================================
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Read required roles from method handler or class metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    // If no @Roles() decorator exists, access is granted to all authenticated users
    if (!requiredRoles) {
      return true;
    }

    // Retrieve user attached by JwtAuthGuard
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Reject if user is not authenticated or lacks required role
    if (!user || !user.role) {
      return false;
    }

    // Verify user role is among the permitted roles
    return requiredRoles.includes(user.role);
  }
}