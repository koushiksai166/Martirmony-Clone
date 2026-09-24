/**
 * ============================================================================
 * NOTIFICATION CONTROLLER
 * ============================================================================
 * Exposes REST endpoints for the in-app notification feed.
 * All endpoints are protected and act upon the authenticated user's data.
 *
 * Endpoints:
 * GET   /notifications          – List all notifications
 * PATCH /notifications/:id/read – Mark a specific notification as read
 * PATCH /notifications/read-all – Mark all unread notifications as read
 * ============================================================================
 */

import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  /** Retrieve all notifications for the current user */
  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  list(@GetUser() user: any) {
    return this.notifications.list(user.id);
  }

  /** Mark a single notification as read using its ID */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  read(@GetUser() user: any, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  /** Bulk operation: Mark all unread notifications as read */
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  readAll(@GetUser() user: any) {
    return this.notifications.markAllRead(user.id);
  }
}
