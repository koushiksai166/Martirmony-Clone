import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { SafetyService } from './safety.service';

class ReportDto {
  @IsEnum(ReportReason) reason: ReportReason;
  @IsOptional() @IsString() @MaxLength(1000) details?: string;
}

@ApiTags('Safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('safety')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}
  @Post('blocks/:userId') block(@GetUser() user: any, @Param('userId') id: string) { return this.safety.block(user.id, id); }
  @Delete('blocks/:userId') unblock(@GetUser() user: any, @Param('userId') id: string) { return this.safety.unblock(user.id, id); }
  @Get('blocks') blocked(@GetUser() user: any) { return this.safety.listBlocked(user.id); }
  @Post('reports/:userId') report(@GetUser() user: any, @Param('userId') id: string, @Body() dto: ReportDto) { return this.safety.report(user.id, id, dto.reason, dto.details); }
}
