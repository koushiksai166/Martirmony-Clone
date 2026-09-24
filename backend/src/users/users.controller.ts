/**
 * ============================================================================
 * USERS CONTROLLER
 * ============================================================================
 * Exposes raw user endpoints for authenticated users and admin-only routes.
 * Used primarily to demonstrate role-based access control (RBAC) patterns.
 *
 * Endpoints:
 * GET /users/profile  – Return the authenticated user's JWT payload (any logged-in user)
 * GET /users/admin    – Admin-only protected endpoint (requires Role.ADMIN)
 * ============================================================================
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  /**
   * Returns the authenticated user's JWT payload.
   * Accessible to any logged-in user.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated user payload (any authenticated user)' })
  getProfile(@GetUser() user: any) {
    return {
      message: 'Protected profile endpoint',
      user,
    };
  }

  /**
   * Admin-only endpoint.
   * Requires both JwtAuthGuard (valid token) and RolesGuard (ADMIN role).
   * Returns 403 Forbidden if user does not have ADMIN role.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  @ApiOperation({ summary: 'Admin-only route demonstrating RBAC' })
  getAdminData() {
    return { message: 'Welcome Admin' };
  }
}