/**
 * ============================================================================
 * CHAT GATEWAY (WebSockets)
 * ============================================================================
 * Provides real-time bidirectional communication for the chat system using Socket.io.
 *
 * Namespace: `/chat`
 * Authentication: Validates JWT tokens passed in handshake auth or headers.
 * Rooms: Clients join `conversation:<id>` rooms to receive messages for specific chats.
 *
 * Events:
 * - `conversation:join` (Client->Server): User joins a specific chat room
 * - `message:send`      (Client->Server): User sends a message
 * - `message:new`       (Server->Client): Broadcasts a new message to the room
 * ============================================================================
 */

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly chat: ChatService,
  ) {}

  /**
   * Handles new WebSocket connections.
   * Extracts the JWT from handshake, verifies it, and attaches the userId to the socket.
   * If validation fails, the connection is immediately terminated.
   */
  async handleConnection(client: Socket) {
    const raw =
      client.handshake.auth?.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!raw) {
      return client.disconnect();
    }

    try {
      const payload = await this.jwt.verifyAsync(raw);
      // Store userId in socket data for use in event handlers
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  /**
   * Called when a client opens a specific chat window.
   * 1. Validates they have access to the conversation via chat.history()
   * 2. Adds their socket to the Socket.io room for broadcasting
   */
  @SubscribeMessage('conversation:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    // history() inherently validates membership and blocks
    await this.chat.history(client.data.userId, data.conversationId);
    
    // Join the socket room
    await client.join(`conversation:${data.conversationId}`);
    return { joined: true };
  }

  /**
   * Called when a client sends a message in the UI.
   * 1. Persists the message to the DB (which also handles validation/blocking)
   * 2. Broadcasts the saved message to all clients in the conversation room
   */
  @SubscribeMessage('message:send')
  async send(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    // Persist message (and trigger DB-level notification creation)
    const message = await this.chat.sendMessage(
      client.data.userId,
      data.conversationId,
      data.content,
    );

    // Broadcast the new message to everyone in the room (including the sender)
    this.server.to(`conversation:${data.conversationId}`).emit('message:new', message);
    
    return message;
  }
}
