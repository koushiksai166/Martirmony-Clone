/**
 * ============================================================================
 * NOTIFICATION SERVICE
 * ============================================================================
 * Manages in-app user notifications (e.g., new messages, profile views,
 * verification updates).
 *
 * Capabilities:
 * - list()        – Fetch all notifications for a user, sorted newest first
 * - markRead()    – Mark a specific single notification as read
 * - markAllRead() – Mark all unread notifications for a user as read
 * ============================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all notifications for the authenticated user.
   * Ordered descending by creation date (newest at the top of the feed).
   */
  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark a single specific notification as read.
   * Ensures the notification exists and belongs to the calling user.
   */
  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  /**
   * Bulk action: Mark all unread notifications as read for the user.
   * Useful for a "Mark all as read" button in the UI.
   */
  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
