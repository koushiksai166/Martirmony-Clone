/**
 * ============================================================================
 * NOTIFICATION GATEWAY (WebSockets)
 * ============================================================================
 * Namespace: `/notifications`
 * Pushes real-time notification events to authenticated connected clients.
 *
 * Server → Client events:
 * - `notification:new`  – A new notification was created for the user
 * ============================================================================
 */

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    const raw =
      client.handshake.auth?.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!raw) return client.disconnect();

    try {
      const payload = await this.jwt.verifyAsync(raw);
      client.data.userId = payload.sub;
      // Each user joins their own private room for targeted pushes
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  /**
   * Push a notification object to all sockets of a specific user.
   */
  pushToUser(userId: string, notification: object) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }
}
