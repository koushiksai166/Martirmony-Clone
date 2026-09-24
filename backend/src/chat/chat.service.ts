/**
 * ============================================================================
 * CHAT SERVICE
 * ============================================================================
 * Manages 1-on-1 private messaging between users.
 *
 * Capabilities:
 * - createConversation() – Initialize or fetch a chat room between two users
 * - listConversations()  – Fetch all active chats for a user (with latest message)
 * - history()            – Retrieve message history for a specific conversation
 * - sendMessage()        – Append a message, update conversation timestamp, and notify
 * - markRead()           – Mark a specific message as read
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

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to ensure deterministic ordering of user IDs.
   * This guarantees that UserA + UserB and UserB + UserA always map to the
   * exact same database composite key (firstUserId_secondUserId).
   */
  private pair(first: string, second: string): [string, string] {
    return first < second ? [first, second] : [second, first];
  }

  /**
   * Creates or retrieves a conversation between two users.
   * Prevents messaging if a block exists in either direction.
   *
   * @param userId      The authenticated user initiating the chat
   * @param otherUserId The target user
   */
  async createConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }

    // Check for blocking in either direction
    const blocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });

    if (blocked) {
      throw new ForbiddenException('Messaging is unavailable for this user');
    }

    // Sort IDs to match the unique compound index
    const [firstUserId, secondUserId] = this.pair(userId, otherUserId);

    // Upsert ensures we don't duplicate conversation rooms
    return this.prisma.conversation.upsert({
      where: {
        firstUserId_secondUserId: { firstUserId, secondUserId },
      },
      create: { firstUserId, secondUserId },
      update: {}, // No-op if it already exists
    });
  }

  /**
   * Lists all conversations the user is a part of.
   * Orders by most recently updated (latest message first).
   * Includes the profile details of both participants and the 1 most recent message.
   */
  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ firstUserId: userId }, { secondUserId: userId }],
      },
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
        // Fetch only the latest message for preview in the inbox UI
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Validation helper: Ensures the user is part of the conversation
   * and that no blocks have been put in place since the conversation started.
   */
  private async member(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const otherUserId =
      conversation.firstUserId === userId ? conversation.secondUserId : conversation.firstUserId;

    const blocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });

    if (blocked) {
      throw new ForbiddenException('Messaging is unavailable for this user');
    }

    return conversation;
  }

  /**
   * Retrieves the full chronological message history for a conversation.
   * Validates membership and block status before returning data.
   */
  async history(userId: string, conversationId: string) {
    await this.member(userId, conversationId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }, // Oldest first for chat bubbles
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  /**
   * Sends a new message in a conversation.
   * This is a transactional operation:
   * 1. Validates membership/blocks.
   * 2. Creates the message record.
   * 3. Bumps the conversation's updatedAt timestamp (to bubble it up in the inbox).
   * 4. Creates a notification for the recipient.
   */
  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.member(userId, conversationId);

    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 2000) {
      throw new BadRequestException('Message must be between 1 and 2000 characters');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Save message
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: trimmed,
        },
        include: {
          sender: {
            select: { id: true, profile: { select: { firstName: true, lastName: true } } },
          },
        },
      });

      // 2. Bump conversation updated timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // 3. Notify recipient
      const recipientId =
        conversation.firstUserId === userId
          ? conversation.secondUserId
          : conversation.firstUserId;

      await tx.notification.create({
        data: {
          userId: recipientId,
          type: 'NEW_MESSAGE',
          message: 'You received a new message',
        },
      });

      return message;
    });
  }

  /**
   * Marks a specific message as read.
   * Usually called when the recipient opens the chat window.
   */
  async markRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is in the conversation before allowing them to mark read
    await this.member(userId, message.conversationId);

    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }
}
