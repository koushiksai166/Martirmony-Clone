import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}
  @Get() list(@GetUser() user: any) { return this.notifications.list(user.id); }
  @Patch(':id/read') read(@GetUser() user: any, @Param('id') id: string) { return this.notifications.markRead(user.id, id); }
  @Patch('read-all') readAll(@GetUser() user: any) { return this.notifications.markAllRead(user.id); }
}
