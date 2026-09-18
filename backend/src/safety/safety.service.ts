import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportReason } from '@prisma/client';

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException('You cannot block yourself');
    const user = await this.prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.userBlock.upsert({ where: { blockerId_blockedId: { blockerId, blockedId } }, create: { blockerId, blockedId }, update: {} });
  }

  async unblock(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  }

  listBlocked(userId: string) {
    return this.prisma.userBlock.findMany({ where: { blockerId: userId }, include: { blocked: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, profilePicture: true } } } } }, orderBy: { createdAt: 'desc' } });
  }

  async report(reporterId: string, reportedId: string, reason: ReportReason, details?: string) {
    if (reporterId === reportedId) throw new BadRequestException('You cannot report yourself');
    const user = await this.prisma.user.findUnique({ where: { id: reportedId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.report.create({ data: { reporterId, reportedId, reason, details } });
  }
}
