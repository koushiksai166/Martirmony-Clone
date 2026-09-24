/**
 * ============================================================================
 * CHAT CONTROLLER
 * ============================================================================
 * Exposes REST HTTP endpoints for the chat messaging system.
 * (Note: Real-time messaging is handled by chat.gateway.ts, but these endpoints
 * provide a fallback/REST approach for fetching history and initializing chats).
 *
 * Endpoints:
 * POST  /chat/conversations/:userId – Start a chat with a specific user
 * GET   /chat/conversations         – List my active inbox/chats
 * GET   /chat/conversations/:id/messages – Get chronological chat history
 * POST  /chat/conversations/:id/messages – Send a message via REST
 * PATCH /chat/messages/:id/read     – Mark a specific message as read
 * ============================================================================
 */

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ChatService } from './chat.service';

/** Inline DTO for message sending */
class MessageDto {
  @IsString()
  content: string;
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /** Initialize or fetch a conversation room with another user */
  @Post('conversations/:userId')
  @ApiOperation({ summary: 'Create or get a conversation with a user' })
  create(@GetUser() user: any, @Param('userId') otherUserId: string) {
    return this.chat.createConversation(user.id, otherUserId);
  }

  /** List all active conversations for the authenticated user's inbox */
  @Get('conversations')
  @ApiOperation({ summary: 'List all my conversations' })
  list(@GetUser() user: any) {
    return this.chat.listConversations(user.id);
  }

  /** Retrieve the chronological message history for a specific conversation */
  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get message history for a conversation' })
  history(@GetUser() user: any, @Param('id') id: string) {
    return this.chat.history(user.id, id);
  }

  /** Send a message to a conversation via REST */
  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message' })
  send(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto: MessageDto,
  ) {
    return this.chat.sendMessage(user.id, id, dto.content);
  }

  /** Mark a message as read (updates the readAt timestamp) */
  @Patch('messages/:id/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  read(@GetUser() user: any, @Param('id') id: string) {
    return this.chat.markRead(user.id, id);
  }
}
