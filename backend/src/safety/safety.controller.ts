import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';
import { ReportReason } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { SafetyService } from './safety.service';

class ReportDto {
  @IsEnum(ReportReason) reason: ReportReason;
  @IsOptional() @IsString() @MaxLength(1000) details?: string;
}

class PanicDto {
  @IsOptional() @IsString() @MaxLength(500) message?: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
}

class VerificationDto {
  @IsString() @MinLength(2) documentType: string;
  @IsString() @MinLength(5) documentUrl: string;
}

class FamilyLinkDto {
  @IsString() targetId: string;
  @IsString() @MinLength(2) @MaxLength(50) relation: string;
}

class FamilyLinkResponseDto {
  @IsBoolean() accept: boolean;
}

@ApiTags('Safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('safety')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  // ── Block / Unblock ────────────────────────────────────────────────────────

  @Post('blocks/:userId')
  @ApiOperation({ summary: 'Block a user' })
  block(@GetUser() user: any, @Param('userId') id: string) {
    return this.safety.block(user.id, id);
  }

  @Delete('blocks/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  unblock(@GetUser() user: any, @Param('userId') id: string) {
    return this.safety.unblock(user.id, id);
  }

  @Get('blocks')
  @ApiOperation({ summary: 'List blocked users' })
  blocked(@GetUser() user: any) {
    return this.safety.listBlocked(user.id);
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  @Post('reports/:userId')
  @ApiOperation({ summary: 'Report a user (AI-moderated)' })
  report(@GetUser() user: any, @Param('userId') id: string, @Body() dto: ReportDto) {
    return this.safety.report(user.id, id, dto.reason, dto.details);
  }

  // ── Panic Button ───────────────────────────────────────────────────────────

  @Post('panic')
  @ApiOperation({ summary: 'Trigger a panic / emergency alert' })
  panic(@GetUser() user: any, @Body() dto: PanicDto) {
    return this.safety.triggerPanic(user.id, dto.message, dto.location);
  }

  @Get('panic')
  @ApiOperation({ summary: 'List my panic alerts' })
  myPanics(@GetUser() user: any) {
    return this.safety.listPanicAlerts(user.id);
  }

  @Patch('panic/:alertId/resolve')
  @ApiOperation({ summary: 'Resolve a panic alert (admin)' })
  resolvePanic(@Param('alertId') alertId: string) {
    return this.safety.resolvePanic(alertId);
  }

  // ── Background Verification ────────────────────────────────────────────────

  @Post('verification')
  @ApiOperation({ summary: 'Submit background verification request' })
  requestVerification(@GetUser() user: any, @Body() dto: VerificationDto) {
    return this.safety.requestVerification(user.id, dto.documentType, dto.documentUrl);
  }

  @Get('verification')
  @ApiOperation({ summary: 'Get my verification status' })
  verificationStatus(@GetUser() user: any) {
    return this.safety.getVerificationStatus(user.id);
  }

  // ── Family Account Linking ─────────────────────────────────────────────────

  @Post('family')
  @ApiOperation({ summary: 'Send a family account link request' })
  requestFamily(@GetUser() user: any, @Body() dto: FamilyLinkDto) {
    return this.safety.requestFamilyLink(user.id, dto.targetId, dto.relation);
  }

  @Get('family')
  @ApiOperation({ summary: 'List my family links' })
  familyLinks(@GetUser() user: any) {
    return this.safety.getFamilyLinks(user.id);
  }

  @Patch('family/:linkId')
  @ApiOperation({ summary: 'Accept or reject a family link request' })
  respondFamily(
    @GetUser() user: any,
    @Param('linkId') linkId: string,
    @Body() dto: FamilyLinkResponseDto,
  ) {
    return this.safety.respondFamilyLink(linkId, user.id, dto.accept);
  }

  @Delete('family/:linkId')
  @ApiOperation({ summary: 'Remove a family link' })
  removeFamily(@GetUser() user: any, @Param('linkId') linkId: string) {
    return this.safety.removeFamilyLink(linkId, user.id);
  }

  // ── Video Call ─────────────────────────────────────────────────────────────

  @Post('video-token/:conversationId')
  @ApiOperation({ summary: 'Generate Agora video call token' })
  videoToken(@GetUser() user: any, @Param('conversationId') conversationId: string) {
    return this.safety.generateVideoToken(user.id, conversationId);
  }
}
