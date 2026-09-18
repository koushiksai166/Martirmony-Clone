import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true } })
export class ChatGateway {
  @WebSocketServer() server: Server;
  constructor(private readonly jwt: JwtService, private readonly chat: ChatService) {}

  async handleConnection(client: Socket) {
    const raw = client.handshake.auth?.token || client.handshake.headers.authorization?.replace('Bearer ', '');
    if (!raw) return client.disconnect();
    try {
      const payload = await this.jwt.verifyAsync(raw);
      client.data.userId = payload.sub;
    } catch { client.disconnect(); }
  }

  @SubscribeMessage('conversation:join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    await this.chat.history(client.data.userId, data.conversationId);
    await client.join(`conversation:${data.conversationId}`);
    return { joined: true };
  }

  @SubscribeMessage('message:send')
  async send(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; content: string }) {
    const message = await this.chat.sendMessage(client.data.userId, data.conversationId, data.content);
    this.server.to(`conversation:${data.conversationId}`).emit('message:new', message);
    return message;
  }
}
