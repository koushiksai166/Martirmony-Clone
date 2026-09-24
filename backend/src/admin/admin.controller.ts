/**
 * ============================================================================
 * ADMIN CONTROLLER
 * ============================================================================
 * Exposes all admin moderation endpoints under the `/admin` prefix.
 * Every route is protected by JwtAuthGuard + RolesGuard requiring Role.ADMIN.
 *
 * Endpoints:
 * GET    /admin/users              – List all user accounts
 * DELETE /admin/users/:id          – Delete a user account
 * PATCH  /admin/users/:id/role     – Change a user's system role
 * GET    /admin/profiles/pending   – List profiles awaiting verification
 * PATCH  /admin/profiles/:id/verify – Approve a profile's verified badge
 * PATCH  /admin/profiles/:id/reject – Reject a profile's verified badge
 * GET    /admin/reports            – List all open abuse reports
 * PATCH  /admin/reports/:id/resolve – Mark a report as resolved
 * ============================================================================
 */

import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AdminService } from './admin.service';

/**
 * Inline DTO for updating a user's role.
 * Used only within this controller to keep the file self-contained.
 */
class RoleDto {
  @IsEnum(Role)
  role: Role;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Double guard: valid JWT + ADMIN role required
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** List all platform users with their profile summaries */
  @Get('users')
  @ApiOperation({ summary: 'List all users (admin only)' })
  users() {
    return this.admin.listUsers();
  }

  /** Permanently delete a user account and all associated data */
  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user account (admin only)' })
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  /** Promote or demote a user to a different role (USER or ADMIN) */
  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role (admin only)' })
  role(@Param('id') id: string, @Body() dto: RoleDto) {
    return this.admin.setUserRole(id, dto.role);
  }

  /** List all profiles not yet verified by admin */
  @Get('profiles/pending')
  @ApiOperation({ summary: 'List profiles pending admin verification' })
  pending() {
    return this.admin.pendingProfiles();
  }

  /** Grant a profile the verified badge */
  @Patch('profiles/:id/verify')
  @ApiOperation({ summary: 'Approve profile verification' })
  verify(@Param('id') id: string) {
    return this.admin.verifyProfile(id, true);
  }

  /** Revoke or reject profile verification */
  @Patch('profiles/:id/reject')
  @ApiOperation({ summary: 'Reject profile verification' })
  reject(@Param('id') id: string) {
    return this.admin.verifyProfile(id, false);
  }

  /** List all unresolved abuse / harassment / spam reports */
  @Get('reports')
  @ApiOperation({ summary: 'List all unresolved reports' })
  reports() {
    return this.admin.reports();
  }

  /** Mark a report as investigated and resolved */
  @Patch('reports/:id/resolve')
  @ApiOperation({ summary: 'Resolve an abuse report' })
  resolve(@Param('id') id: string) {
    return this.admin.resolveReport(id);
  }
}
