import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private pair(first: string, second: string) {
    return first < second ? [first, second] : [second, first];
  }

  async createConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) throw new BadRequestException('You cannot start a conversation with yourself');
    const blocked = await this.prisma.userBlock.findFirst({ where: { OR: [{ blockerId: userId, blockedId: otherUserId }, { blockerId: otherUserId, blockedId: userId }] } });
    if (blocked) throw new ForbiddenException('Messaging is unavailable for this user');
    const [firstUserId, secondUserId] = this.pair(userId, otherUserId);
    return this.prisma.conversation.upsert({ where: { firstUserId_secondUserId: { firstUserId, secondUserId } }, create: { firstUserId, secondUserId }, update: {} });
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({ where: { OR: [{ firstUserId: userId }, { secondUserId: userId }] }, include: { firstUser: { include: { profile: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } } }, secondUser: { include: { profile: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } });
  }

  private async member(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) throw new ForbiddenException('You are not a member of this conversation');
    const otherUserId = conversation.firstUserId === userId ? conversation.secondUserId : conversation.firstUserId;
    const blocked = await this.prisma.userBlock.findFirst({ where: { OR: [{ blockerId: userId, blockedId: otherUserId }, { blockerId: otherUserId, blockedId: userId }] } });
    if (blocked) throw new ForbiddenException('Messaging is unavailable for this user');
    return conversation;
  }

  async history(userId: string, conversationId: string) {
    await this.member(userId, conversationId);
    return this.prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } } } });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.member(userId, conversationId);
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 2000) throw new BadRequestException('Message must be between 1 and 2000 characters');
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({ data: { conversationId, senderId: userId, content: trimmed }, include: { sender: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } } } });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      const recipientId = conversation.firstUserId === userId ? conversation.secondUserId : conversation.firstUserId;
      await tx.notification.create({ data: { userId: recipientId, type: 'NEW_MESSAGE', message: 'You received a new message' } });
      return message;
    });
  }

  async markRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    await this.member(userId, message.conversationId);
    return this.prisma.message.update({ where: { id: messageId }, data: { readAt: new Date() } });
  }
}
