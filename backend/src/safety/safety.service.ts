import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ReportReason } from '@prisma/client';

@Injectable()
export class SafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Block / Unblock ────────────────────────────────────────────────────────

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException('You cannot block yourself');
    const user = await this.prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async unblock(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  }

  listBlocked(userId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, profilePicture: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Report (with AI moderation) ────────────────────────────────────────────

  async report(reporterId: string, reportedId: string, reason: ReportReason, details?: string) {
    if (reporterId === reportedId) throw new BadRequestException('You cannot report yourself');
    const user = await this.prisma.user.findUnique({ where: { id: reportedId }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    let aiFlag = false;
    let aiScore: number | undefined;

    if (details) {
      const result = await this.moderateText(details);
      aiFlag = result.flagged;
      aiScore = result.score;
    }

    return this.prisma.report.create({
      data: { reporterId, reportedId, reason, details, aiFlag, aiScore },
    });
  }

  private async moderateText(text: string): Promise<{ flagged: boolean; score: number }> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) return { flagged: false, score: 0 };

    try {
      const res = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ input: text }),
      });
      const json = await res.json() as any;
      const result = json.results?.[0];
      const scores = Object.values(result?.category_scores ?? {}) as number[];
      const score = scores.length ? Math.max(...scores) : 0;
      return { flagged: result?.flagged ?? false, score };
    } catch {
      return { flagged: false, score: 0 };
    }
  }

  // ── Panic Button ───────────────────────────────────────────────────────────

  async triggerPanic(userId: string, message?: string, location?: string) {
    return this.prisma.panicAlert.create({ data: { userId, message, location } });
  }

  async resolvePanic(alertId: string) {
    return this.prisma.panicAlert.update({
      where: { id: alertId },
      data: { resolvedAt: new Date() },
    });
  }

  listPanicAlerts(userId: string) {
    return this.prisma.panicAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Background Verification ────────────────────────────────────────────────

  async requestVerification(userId: string, documentType: string, documentUrl: string) {
    return this.prisma.verificationRequest.upsert({
      where: { userId },
      create: { userId, documentType, documentUrl },
      update: { documentType, documentUrl, status: 'PENDING', reviewedAt: null },
    });
  }

  getVerificationStatus(userId: string) {
    return this.prisma.verificationRequest.findUnique({ where: { userId } });
  }

  // ── Family Account Linking ─────────────────────────────────────────────────

  async requestFamilyLink(requesterId: string, targetId: string, relation: string) {
    if (requesterId === targetId) throw new BadRequestException('Cannot link to yourself');
    const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) throw new NotFoundException('User not found');
    return this.prisma.familyLink.upsert({
      where: { requesterId_targetId: { requesterId, targetId } },
      create: { requesterId, targetId, relation },
      update: { relation, status: 'PENDING' },
    });
  }

  async respondFamilyLink(linkId: string, userId: string, accept: boolean) {
    const link = await this.prisma.familyLink.findUnique({ where: { id: linkId } });
    if (!link || link.targetId !== userId) throw new NotFoundException('Link request not found');
    return this.prisma.familyLink.update({
      where: { id: linkId },
      data: { status: accept ? 'ACCEPTED' : 'REJECTED' },
    });
  }

  async removeFamilyLink(linkId: string, userId: string) {
    const link = await this.prisma.familyLink.findUnique({ where: { id: linkId } });
    if (!link || (link.requesterId !== userId && link.targetId !== userId)) {
      throw new NotFoundException('Link not found');
    }
    return this.prisma.familyLink.delete({ where: { id: linkId } });
  }

  getFamilyLinks(userId: string) {
    return this.prisma.familyLink.findMany({
      where: { OR: [{ requesterId: userId }, { targetId: userId }] },
      include: {
        requester: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, profilePicture: true } } } },
        target: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, profilePicture: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Video Call Token ───────────────────────────────────────────────────────

  async generateVideoToken(userId: string, conversationId: string) {
    const appId = this.config.get<string>('AGORA_APP_ID');
    const appCertificate = this.config.get<string>('AGORA_APP_CERTIFICATE');

    if (!appId) return { appId: null, token: null, channel: conversationId, uid: userId };

    // If no certificate, return unsigned token (dev mode)
    if (!appCertificate) return { appId, token: null, channel: conversationId, uid: userId };

    // Dynamic token generation using Agora RTC token builder
    try {
      const { RtcTokenBuilder, RtcRole } = await import('agora-token');
      const expireTime = 3600;
      const currentTime = Math.floor(Date.now() / 1000);
      const privilegeExpireTime = currentTime + expireTime;
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId, appCertificate, conversationId, 0, RtcRole.PUBLISHER, privilegeExpireTime, privilegeExpireTime,
      );
      return { appId, token, channel: conversationId, uid: userId };
    } catch {
      return { appId, token: null, channel: conversationId, uid: userId };
    }
  }
}
