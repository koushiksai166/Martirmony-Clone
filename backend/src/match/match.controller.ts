/**
 * ============================================================================
 * MATCH CONTROLLER
 * ============================================================================
 * Exposes the recommendation engine endpoints.
 *
 * Endpoints:
 * GET /matches – Get a list of compatible profiles sorted by score
 * ============================================================================
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { MatchService } from './match.service';

@ApiTags('Matches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchController {
  constructor(private readonly matches: MatchService) {}

  /**
   * Fetch a list of recommended matches for the currently authenticated user.
   * Calculates dynamic compatibility scores based on their PartnerPreferences.
   */
  @Get()
  @ApiOperation({ summary: 'Get personalized match recommendations' })
  find(@GetUser() user: any) {
    return this.matches.find(user.id);
  }
}
