import { Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InterestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { InterestService } from './interest.service';

@ApiTags('Interests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interests')
export class InterestController {
  constructor(private readonly interests: InterestService) {}

  @Post(':profileId') send(@GetUser() user: any, @Param('profileId') profileId: string) { return this.interests.send(user.id, profileId); }
  @Get('sent') sent(@GetUser() user: any) { return this.interests.sent(user.id); }
  @Get('received') received(@GetUser() user: any) { return this.interests.received(user.id); }
  @Patch(':id/accept') accept(@GetUser() user: any, @Param('id') id: string) { return this.interests.updateStatus(user.id, id, InterestStatus.ACCEPTED); }
  @Patch(':id/reject') reject(@GetUser() user: any, @Param('id') id: string) { return this.interests.updateStatus(user.id, id, InterestStatus.REJECTED); }
  @Delete(':id') withdraw(@GetUser() user: any, @Param('id') id: string) { return this.interests.updateStatus(user.id, id, InterestStatus.WITHDRAWN); }
}
