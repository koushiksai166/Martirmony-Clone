/**
 * ============================================================================
 * CHAT SERVICE
 * ============================================================================
 * Manages 1-on-1 private messaging between users.
 *
 * Capabilities:
 * - createConversation()    – Initialize or fetch a chat room between two users
 * - listConversations()     – Fetch all active chats for a user (with latest message)
 * - history()               – Retrieve message history for a specific conversation
 * - sendMessage()           – Append a message, update conversation timestamp, and notify
 * - markConversationRead()  – Mark all unread messages in a conversation as read
 * - markDelivered()         – Mark a message as delivered to recipient's socket
 * - editMessage()           – Edit a sent message (sender only, non-deleted)
 * - deleteMessage()         – Soft-delete a message (sender only)
 *
 * Security & Blocking:
 * All methods inherently check the `UserBlock` table. If either user has blocked
 * the other, the conversation cannot be created, and messages cannot be sent or read.
 * ============================================================================
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// In-memory online user registry: userId -> Set of socketIds
const onlineUsers = new Map<string, Set<string>>();

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Online status ──────────────────────────────────────────────────────────

  addOnline(userId: string, socketId: string) {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socketId);
  }

  removeOnline(userId: string, socketId: string) {
    onlineUsers.get(userId)?.delete(socketId);
    if (onlineUsers.get(userId)?.size === 0) onlineUsers.delete(userId);
  }

  isOnline(userId: string): boolean {
    return (onlineUsers.get(userId)?.size ?? 0) > 0;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private pair(first: string, second: string): [string, string] {
    return first < second ? [first, second] : [second, first];
  }

  private readonly MESSAGE_SELECT = {
    id: true,
    conversationId: true,
    senderId: true,
    content: true,
    createdAt: true,
    readAt: true,
    deliveredAt: true,
    editedAt: true,
    deletedAt: true,
    sender: {
      select: {
        id: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    },
  };

  // ── Conversation management ────────────────────────────────────────────────

  async createConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }

    const blocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });

    if (blocked) throw new ForbiddenException('Messaging is unavailable for this user');

    const [firstUserId, secondUserId] = this.pair(userId, otherUserId);

    return this.prisma.conversation.upsert({
      where: { firstUserId_secondUserId: { firstUserId, secondUserId } },
      create: { firstUserId, secondUserId },
      update: {},
    });
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ firstUserId: userId }, { secondUserId: userId }] },
      include: {
        firstUser: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, profilePicture: true },
            },
          },
        },
        secondUser: {
          include: {
            profile: {
              select: { id: true, firstName: true, lastName: true, profilePicture: true },
            },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async member(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const otherUserId =
      conversation.firstUserId === userId
        ? conversation.secondUserId
        : conversation.firstUserId;

    const blocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });

    if (blocked) throw new ForbiddenException('Messaging is unavailable for this user');

    return conversation;
  }

  // ── Message operations ─────────────────────────────────────────────────────

  async history(userId: string, conversationId: string) {
    await this.member(userId, conversationId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: this.MESSAGE_SELECT,
    });

    // Mask deleted message content
    return messages.map((m) =>
      m.deletedAt ? { ...m, content: null } : m,
    );
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.member(userId, conversationId);

    const trimmed = content?.trim();
    if (!trimmed || trimmed.length > 2000) {
      throw new BadRequestException('Message must be between 1 and 2000 characters');
    }

    const recipientId =
      conversation.firstUserId === userId
        ? conversation.secondUserId
        : conversation.firstUserId;

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversationId, senderId: userId, content: trimmed },
        select: this.MESSAGE_SELECT,
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      await tx.notification.create({
        data: { userId: recipientId, type: 'NEW_MESSAGE', message: 'You received a new message' },
      });

      return { message, recipientId };
    });
  }

  async markDelivered(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { deliveredAt: new Date() },
      select: this.MESSAGE_SELECT,
    });
  }

  /** Mark all messages in a conversation as read for the given user (recipient only) */
  async markConversationRead(userId: string, conversationId: string) {
    await this.member(userId, conversationId);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId }, // Only mark messages sent by the other person
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    // Return updated unread message ids for broadcasting
    return this.prisma.message.findMany({
      where: { conversationId, senderId: { not: userId }, readAt: { not: null } },
      select: { id: true, readAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Cannot edit another user\'s message');
    if (message.deletedAt) throw new BadRequestException('Cannot edit a deleted message');

    const trimmed = content?.trim();
    if (!trimmed || trimmed.length > 2000) {
      throw new BadRequestException('Message must be between 1 and 2000 characters');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content: trimmed, editedAt: new Date() },
      select: this.MESSAGE_SELECT,
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Cannot delete another user\'s message');
    if (message.deletedAt) throw new BadRequestException('Message already deleted');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      select: this.MESSAGE_SELECT,
    });
  }

  // Legacy single-message read (kept for REST endpoint compatibility)
  async markRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    await this.member(userId, message.conversationId);

    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }
}
