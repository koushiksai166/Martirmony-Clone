/**
 * ============================================================================
 * SAFETY CONTROLLER
 * ============================================================================
 * Exposes endpoints for managing user safety features (blocking and reporting).
 * 
 * Endpoints:
 * GET    /safety/blocks          – List blocked users
 * POST   /safety/blocks/:id      – Block a user
 * DELETE /safety/blocks/:id      – Unblock a user
 * POST   /safety/reports/:id     – Report a user for moderation
 * ============================================================================
 */

import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { SafetyService } from './safety.service';

class ReportDto {
  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}

@ApiTags('Safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('safety')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  /** Block a specific user from interacting with you */
  @Post('blocks/:userId')
  @ApiOperation({ summary: 'Block a user' })
  block(@GetUser() user: any, @Param('userId') id: string) {
    return this.safety.block(user.id, id);
  }

  /** Unblock a previously blocked user */
  @Delete('blocks/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  unblock(@GetUser() user: any, @Param('userId') id: string) {
    return this.safety.unblock(user.id, id);
  }

  /** View a list of all users you have blocked */
  @Get('blocks')
  @ApiOperation({ summary: 'List blocked users' })
  blocked(@GetUser() user: any) {
    return this.safety.listBlocked(user.id);
  }

  /** Report a user for inappropriate behavior */
  @Post('reports/:userId')
  @ApiOperation({ summary: 'Report a user for moderation' })
  report(
    @GetUser() user: any,
    @Param('userId') id: string,
    @Body() dto: ReportDto,
  ) {
    return this.safety.report(user.id, id, dto.reason, dto.details);
  }
}
