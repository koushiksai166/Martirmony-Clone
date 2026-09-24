/**
 * ============================================================================
 * ADMIN SERVICE
 * ============================================================================
 * Provides admin-level moderation operations accessible only to ADMIN role users.
 *
 * Capabilities:
 * - listUsers()       – Retrieve all user accounts with profile summaries
 * - deleteUser()      – Remove a user account and all related data (cascade)
 * - setUserRole()     – Promote or demote a user between USER and ADMIN roles
 * - pendingProfiles() – List profiles awaiting verification review
 * - verifyProfile()   – Approve or reject a candidate's profile verification
 * - reports()         – List all unresolved abuse / harassment reports
 * - resolveReport()   – Mark a flagged report as reviewed and resolved
 * ============================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all user accounts ordered by newest first.
   * Includes a profile summary (name, verification status) for each user.
   * Used by Admin dashboard to manage platform members.
   */
  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isVerified: true,
            isProfileComplete: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Permanently deletes a user account and all cascaded data
   * (profile, interests, messages, notifications, payments, etc.).
   * Throws NotFoundException if user does not exist.
   * @param id Target user's unique ID
   */
  async deleteUser(id: string) {
    const result = await this.prisma.user.deleteMany({ where: { id } });
    if (!result.count) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  /**
   * Promotes or demotes a user's system role.
   * @param id    Target user's unique ID
   * @param role  New role to assign ('USER' or 'ADMIN')
   */
  async setUserRole(id: string, role: 'USER' | 'ADMIN') {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  /**
   * Returns all profiles that have not yet been verified by an admin.
   * Used by Admin to review candidate profile accuracy before granting the
   * verified badge (ShieldCheck icon on the public profile).
   */
  pendingProfiles() {
    return this.prisma.profile.findMany({
      where: { isVerified: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userId: true,
        createdAt: true,
      },
    });
  }

  /**
   * Sets the `isVerified` flag on a profile.
   * @param id       Profile unique ID (not userId)
   * @param verified true = approved, false = rejected
   */
  async verifyProfile(id: string, verified: boolean) {
    const profile = await this.prisma.profile.update({
      where: { id },
      data: { isVerified: verified },
    });
    return { profile };
  }

  /**
   * Returns all unresolved abuse/spam/harassment reports ordered oldest first.
   * Includes reporter and reported user information for investigation.
   */
  reports() {
    return this.prisma.report.findMany({
      where: { resolvedAt: null },
      include: {
        reporter: { select: { id: true, email: true } },
        reported: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Marks a report as resolved by recording the resolution timestamp.
   * Throws NotFoundException if the report does not exist or is already resolved.
   * @param id Report unique ID
   */
  async resolveReport(id: string) {
    const result = await this.prisma.report.updateMany({
      where: { id, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });
    if (!result.count) {
      throw new NotFoundException('Report not found or already resolved');
    }
    return { message: 'Report resolved' };
  }
}
