/**
 * ============================================================================
 * CHAT GATEWAY (WebSockets)
 * ============================================================================
 * Namespace: `/chat`
 * Authentication: JWT validated on handshake.
 *
 * Client → Server events:
 * - `conversation:join`   Join a conversation room + mark messages as read
 * - `message:send`        Send a new message
 * - `message:edit`        Edit a sent message
 * - `message:delete`      Soft-delete a message
 * - `message:read`        Mark all messages in a conversation as read
 * - `typing:start`        Broadcast typing indicator to the other participant
 * - `typing:stop`         Stop typing indicator
 *
 * Server → Client events:
 * - `message:new`         New message broadcast to room
 * - `message:delivered`   Delivery receipt to sender
 * - `message:updated`     Edited message broadcast to room
 * - `message:deleted`     Deleted message broadcast to room
 * - `message:read`        Read receipt broadcast to sender
 * - `typing:start`        Typing indicator to other participant
 * - `typing:stop`         Stop typing indicator
 * - `user:online`         User came online
 * - `user:offline`        User went offline
 * ============================================================================
 */

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly chat: ChatService,
  ) {}

  // ── Connection lifecycle ───────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    const raw =
      client.handshake.auth?.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!raw) return client.disconnect();

    try {
      const payload = await this.jwt.verifyAsync(raw);
      client.data.userId = payload.sub;

      // Register online and broadcast to everyone
      this.chat.addOnline(payload.sub, client.id);
      this.server.emit('user:online', { userId: payload.sub });
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    this.chat.removeOnline(userId, client.id);

    // Only broadcast offline if no other sockets remain for this user
    if (!this.chat.isOnline(userId)) {
      this.server.emit('user:offline', { userId });
    }
  }

  // ── Room management ────────────────────────────────────────────────────────

  @SubscribeMessage('conversation:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.chat.history(client.data.userId, data.conversationId);
    await client.join(`conversation:${data.conversationId}`);

    // Mark all messages as read when joining the conversation
    const readMessages = await this.chat.markConversationRead(
      client.data.userId,
      data.conversationId,
    );

    // Notify the other participant their messages were read
    if (readMessages.length > 0) {
      client
        .to(`conversation:${data.conversationId}`)
        .emit('message:read', { conversationId: data.conversationId, readMessages });
    }

    return { joined: true };
  }

  // ── Messaging ──────────────────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async send(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const { message, recipientId } = await this.chat.sendMessage(
      client.data.userId,
      data.conversationId,
      data.content,
    );

    // Broadcast to everyone in the room (including sender for multi-device)
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('message:new', message);

    // Delivery receipt: if recipient is in the room, mark delivered immediately
    const room = this.server.sockets.adapter.rooms.get(
      `conversation:${data.conversationId}`,
    );
    const recipientSockets = [...(room ?? [])].filter(
      (sid) => sid !== client.id,
    );

    if (recipientSockets.length > 0) {
      const delivered = await this.chat.markDelivered(message.id);
      // Notify sender of delivery
      client.emit('message:delivered', {
        messageId: message.id,
        deliveredAt: delivered.deliveredAt,
      });
    }

    // If recipient is offline, message is already persisted in DB — they'll
    // load it via history() when they reconnect (offline persistence handled).
    void recipientId;

    return message;
  }

  @SubscribeMessage('message:edit')
  async edit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    const updated = await this.chat.editMessage(
      client.data.userId,
      data.messageId,
      data.content,
    );

    this.server
      .to(`conversation:${updated.conversationId}`)
      .emit('message:updated', updated);

    return updated;
  }

  @SubscribeMessage('message:delete')
  async delete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const deleted = await this.chat.deleteMessage(
      client.data.userId,
      data.messageId,
    );

    this.server
      .to(`conversation:${deleted.conversationId}`)
      .emit('message:deleted', {
        messageId: deleted.id,
        conversationId: deleted.conversationId,
        deletedAt: deleted.deletedAt,
      });

    return { deleted: true };
  }

  @SubscribeMessage('message:read')
  async markRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const readMessages = await this.chat.markConversationRead(
      client.data.userId,
      data.conversationId,
    );

    // Notify the other participant
    client
      .to(`conversation:${data.conversationId}`)
      .emit('message:read', { conversationId: data.conversationId, readMessages });

    return { ok: true };
  }

  // ── Typing indicators ──────────────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('typing:start', {
      userId: client.data.userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('typing:stop')
  typingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      userId: client.data.userId,
      conversationId: data.conversationId,
    });
  }
}


