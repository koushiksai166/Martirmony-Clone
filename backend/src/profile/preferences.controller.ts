/**
 * ============================================================================
 * PREFERENCES CONTROLLER
 * ============================================================================
 * Endpoints for managing partner matching preferences.
 * Preferences drive the compatibility scoring engine in MatchService.
 *
 * Endpoints:
 * GET   /preferences  – Retrieve stored partner preferences
 * PATCH /preferences  – Create or update (upsert) partner preferences
 * ============================================================================
 */

import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { PartnerPreferenceDto } from './dto/partner-preference.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('Partner preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  /** Retrieve the authenticated user's saved partner preferences */
  @Get()
  @ApiOperation({ summary: 'Get my partner preferences' })
  find(@GetUser() user: any) {
    return this.preferencesService.find(user.id);
  }

  /** Create or update partner preferences (upsert semantics) */
  @Patch()
  @ApiOperation({ summary: 'Create or update partner preferences' })
  upsert(@GetUser() user: any, @Body() dto: PartnerPreferenceDto) {
    return this.preferencesService.upsert(user.id, dto);
  }
}
