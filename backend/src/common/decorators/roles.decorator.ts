/**
 * ============================================================================
 * ROLES CUSTOM METADATA DECORATOR (@Roles)
 * ============================================================================
 * Attaches metadata specifying which roles are permitted to access a given
 * route handler or entire controller class.
 *
 * Used in conjunction with `RolesGuard` to enforce Role-Based Access Control (RBAC).
 *
 * Example Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * @Get('admin/dashboard')
 * getAdminDashboard() { ... }
 * ============================================================================
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '../../auth/enums/role.enum';

/**
 * Metadata key used to attach and retrieve allowed roles via Reflector.
 */
export const ROLES_KEY = 'roles';

/**
 * Attaches required roles array to route handler metadata.
 * @param roles One or more allowed roles (e.g. Role.ADMIN, Role.USER)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);