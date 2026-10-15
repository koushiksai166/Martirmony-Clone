import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
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

  /** Retrieve notifications + unread count for the current user */
  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  list(@GetUser() user: any) {
    return this.notifications.list(user.id);
  }

  /** Mark a single notification as read */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  read(@GetUser() user: any, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  /** Mark all unread notifications as read */
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  readAll(@GetUser() user: any) {
    return this.notifications.markAllRead(user.id);
  }

  /** Delete a specific notification */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@GetUser() user: any, @Param('id') id: string) {
    return this.notifications.deleteOne(user.id, id);
  }
}
