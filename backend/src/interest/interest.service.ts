/**
 * ============================================================================
 * INTEREST SERVICE
 * ============================================================================
 * Manages the "Expression of Interest" (connection request) flow between users.
 * 
 * Flows:
 * - send()         – Initiates a request to another user.
 * - sent()         – Lists all requests sent by the current user.
 * - received()     – Lists all requests received by the current user.
 * - updateStatus() – Handles Accept, Reject (by receiver), or Withdraw (by sender).
 * 
 * Notifications are automatically dispatched when interests are sent or accepted.
 * ============================================================================
 */

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InterestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class InterestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  // Reusable projection to avoid exposing sensitive profile data in lists
  private readonly profileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    gender: true,
    dateOfBirth: true,
    city: true,
    profilePicture: true,
    isVerified: true,
  } as const;

  /**
   * Send an interest request to a specific profile.
   * Target is identified by profileId (not userId) since users browse profiles.
   */
  async send(senderId: string, profileId: string) {
    // 1. Resolve target profile to their underlying userId
    const receiver = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!receiver) {
      throw new NotFoundException('Profile not found');
    }

    if (receiver.userId === senderId) {
      throw new BadRequestException('You cannot send interest to yourself');
    }

    // 2. Prevent duplicate pending interests
    const existing = await this.prisma.interest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId: receiver.userId } },
    });

    if (existing?.status === InterestStatus.PENDING) {
      throw new BadRequestException('Interest is already pending');
    }

    // 3. Upsert handles both brand-new requests and re-sending previously withdrawn/rejected ones
    const interest = await this.prisma.interest.upsert({
      where: { senderId_receiverId: { senderId, receiverId: receiver.userId } },
      create: { senderId, receiverId: receiver.userId },
      update: { status: InterestStatus.PENDING },
    });

    // 4. Notify the receiver
    await this.notifications.push(
      receiver.userId,
      'NEW_INTEREST',
      'You received a new interest',
    );

    return interest;
  }

  /**
   * Get all interests the user has sent.
   */
  async sent(userId: string) {
    return this.prisma.interest.findMany({
      where: { senderId: userId },
      include: {
        receiver: {
          include: { profile: { select: this.profileSelect } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get all interests the user has received.
   */
  async received(userId: string) {
    return this.prisma.interest.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          include: { profile: { select: this.profileSelect } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Modifies the state of an existing interest.
   * Enforces strict role-based state machine logic (only receiver can accept/reject,
   * only sender can withdraw, and only pending interests can be modified).
   */
  async updateStatus(userId: string, id: string, status: InterestStatus) {
    const interest = await this.prisma.interest.findUnique({ where: { id } });
    if (!interest) {
      throw new NotFoundException('Interest not found');
    }

    // Receiver actions
    if (status === InterestStatus.ACCEPTED || status === InterestStatus.REJECTED) {
      if (interest.receiverId !== userId) {
        throw new BadRequestException('Only the receiver can respond');
      }
      if (interest.status !== InterestStatus.PENDING) {
        throw new BadRequestException('Only pending interests can be responded to');
      }
    }

    // Sender actions
    if (status === InterestStatus.WITHDRAWN) {
      if (interest.senderId !== userId) {
        throw new BadRequestException('Only the sender can withdraw interest');
      }
      if (interest.status !== InterestStatus.PENDING) {
        throw new BadRequestException('Only pending interests can be withdrawn');
      }
    }

    const updated = await this.prisma.interest.update({
      where: { id },
      data: { status },
    });

    // Notify original sender if their request was accepted
    if (status === InterestStatus.ACCEPTED) {
      await this.notifications.push(
        interest.senderId,
        'INTEREST_ACCEPTED',
        'Your interest was accepted',
      );
    }

    return updated;
  }
}
