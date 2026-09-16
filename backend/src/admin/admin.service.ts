import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true, profile: { select: { id: true, firstName: true, lastName: true, isVerified: true, isProfileComplete: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async deleteUser(id: string) {
    const result = await this.prisma.user.deleteMany({ where: { id } });
    if (!result.count) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  async setUserRole(id: string, role: 'USER' | 'ADMIN') {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  pendingProfiles() { return this.prisma.profile.findMany({ where: { isVerified: false }, select: { id: true, firstName: true, lastName: true, userId: true, createdAt: true } }); }

  async verifyProfile(id: string, verified: boolean) {
    const profile = await this.prisma.profile.update({ where: { id }, data: { isVerified: verified } });
    return { profile };
  }

  reports() { return this.prisma.report.findMany({ where: { resolvedAt: null }, include: { reporter: { select: { id: true, email: true } }, reported: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } }, orderBy: { createdAt: 'asc' } }); }

  async resolveReport(id: string) {
    const result = await this.prisma.report.updateMany({ where: { id, resolvedAt: null }, data: { resolvedAt: new Date() } });
    if (!result.count) throw new NotFoundException('Report not found');
    return { message: 'Report resolved' };
  }
}
