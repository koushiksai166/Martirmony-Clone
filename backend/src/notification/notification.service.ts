/**
 * ============================================================================
 * NOTIFICATION SERVICE
 * ============================================================================
 * Manages in-app user notifications with real-time push, email fallback for
 * offline users, and automatic cleanup of stale notifications.
 *
 * Capabilities:
 * - push()         – Create a DB notification, emit via WebSocket, email if offline
 * - list()         – Fetch paginated notifications with unread count
 * - markRead()     – Mark a single notification as read
 * - markAllRead()  – Mark all unread notifications as read
 * - deleteOne()    – Delete a specific notification
 * - cleanup()      – Delete read notifications older than 30 days (memory leak fix)
 * ============================================================================
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly gateway: NotificationGateway,
  ) {}

  /**
   * Central method used by all other services to create and deliver a notification.
   * 1. Persists to DB (offline persistence — user gets it on next load).
   * 2. Pushes via WebSocket if user is connected.
   * 3. Sends email if user is offline (no active socket).
   */
  async push(
    userId: string,
    type: NotificationType,
    message: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, message },
    });

    // Real-time push via WebSocket
    this.gateway.pushToUser(userId, notification);

    // Email fallback: send if user has no active socket connection
    const room = this.gateway.server?.sockets?.adapter?.rooms?.get(`user:${userId}`);
    const isOnline = room && room.size > 0;

    if (!isOnline) {
      await this.sendEmailNotification(userId, type, message);
    }

    return notification;
  }

  private async sendEmailNotification(
    userId: string,
    type: NotificationType,
    message: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          profile: { select: { firstName: true } },
        },
      });

      if (!user) return;

      const firstName = user.profile?.firstName ?? 'there';
      await this.email.sendNotification(user.email, firstName, type, message);
    } catch (err) {
      this.logger.error(`Email notification failed for user ${userId}: ${(err as Error).message}`);
    }
  }

  /**
   * Fetch all notifications for the user with unread count.
   */
  async list(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return { items, unreadCount };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async deleteOne(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.delete({ where: { id } });
  }

  /**
   * Cleanup: runs daily at midnight.
   * Deletes read notifications older than 30 days to prevent unbounded growth.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanup() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const { count } = await this.prisma.notification.deleteMany({
      where: {
        readAt: { not: null, lt: cutoff },
      },
    });

    if (count > 0) {
      this.logger.log(`Cleaned up ${count} old read notifications`);
    }
  }
}
