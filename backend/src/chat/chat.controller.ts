import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ChatService } from './chat.service';

class MessageDto { @IsString() content: string; }

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}
  @Post('conversations/:userId') create(@GetUser() user: any, @Param('userId') otherUserId: string) { return this.chat.createConversation(user.id, otherUserId); }
  @Get('conversations') list(@GetUser() user: any) { return this.chat.listConversations(user.id); }
  @Get('conversations/:id/messages') history(@GetUser() user: any, @Param('id') id: string) { return this.chat.history(user.id, id); }
  @Post('conversations/:id/messages') send(@GetUser() user: any, @Param('id') id: string, @Body() dto: MessageDto) { return this.chat.sendMessage(user.id, id, dto.content); }
  @Patch('messages/:id/read') read(@GetUser() user: any, @Param('id') id: string) { return this.chat.markRead(user.id, id); }
}
