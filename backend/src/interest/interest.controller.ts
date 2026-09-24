/**
 * ============================================================================
 * INTEREST CONTROLLER
 * ============================================================================
 * Exposes REST endpoints for managing connection requests (interests).
 * 
 * Endpoints:
 * GET    /interests/sent        – View requests I've sent
 * GET    /interests/received    – View requests I've received
 * POST   /interests/:profileId  – Send a request to a profile
 * PATCH  /interests/:id/accept  – Accept an incoming request
 * PATCH  /interests/:id/reject  – Reject an incoming request
 * DELETE /interests/:id         – Withdraw a pending sent request
 * ============================================================================
 */

import { Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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

  /** Send a new interest request to a candidate's profile */
  @Post(':profileId')
  @ApiOperation({ summary: 'Send interest to a profile' })
  send(@GetUser() user: any, @Param('profileId') profileId: string) {
    return this.interests.send(user.id, profileId);
  }

  /** View all pending or resolved requests sent by the current user */
  @Get('sent')
  @ApiOperation({ summary: 'List interests sent by me' })
  sent(@GetUser() user: any) {
    return this.interests.sent(user.id);
  }

  /** View all pending or resolved requests received by the current user */
  @Get('received')
  @ApiOperation({ summary: 'List interests received by me' })
  received(@GetUser() user: any) {
    return this.interests.received(user.id);
  }

  /** Accept a pending request (receiver only) */
  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept an interest' })
  accept(@GetUser() user: any, @Param('id') id: string) {
    return this.interests.updateStatus(user.id, id, InterestStatus.ACCEPTED);
  }

  /** Reject a pending request (receiver only) */
  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an interest' })
  reject(@GetUser() user: any, @Param('id') id: string) {
    return this.interests.updateStatus(user.id, id, InterestStatus.REJECTED);
  }

  /** Withdraw a pending request (sender only) */
  @Delete(':id')
  @ApiOperation({ summary: 'Withdraw a sent interest' })
  withdraw(@GetUser() user: any, @Param('id') id: string) {
    return this.interests.updateStatus(user.id, id, InterestStatus.WITHDRAWN);
  }
}
