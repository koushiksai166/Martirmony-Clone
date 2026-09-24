/**
 * ============================================================================
 * PROFILE CONTROLLER
 * ============================================================================
 * Exposes HTTP endpoints for managing matrimony candidate profiles.
 * All endpoints are protected by JwtAuthGuard (bearer token required).
 *
 * Endpoints:
 * POST   /profile         – Create a new profile for the authenticated user
 * GET    /profile         – Get the authenticated user's own profile
 * GET    /profile/search  – Search/filter public profiles with pagination
 * GET    /profile/:id     – View a single public profile by profile ID
 * PATCH  /profile         – Update the authenticated user's profile fields
 * DELETE /profile         – Delete the authenticated user's profile
 * ============================================================================
 */

import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ProfileService } from './profile.service';

import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
  ) {}

  /** Create a new profile linked to the authenticated user's account */
  @Post()
  @ApiOperation({ summary: 'Create profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  create(
    @GetUser() user: any,
    @Body() dto: CreateProfileDto,
  ) {
    return this.profileService.create(user.id, dto);
  }

  /** Get the authenticated user's own complete profile */
  @Get()
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully' })
  findMyProfile(@GetUser() user: any) {
    return this.profileService.findMyProfile(user.id);
  }

  /** Search public profiles with multi-criteria filters and pagination */
  @Get('search')
  @ApiOperation({ summary: 'Search public profiles' })
  search(@GetUser() user: any, @Query() query: SearchProfilesDto) {
    return this.profileService.search(user.id, query);
  }

  /** View any public profile by its profile ID (for discovery/browsing) */
  @Get(':id')
  @ApiOperation({ summary: 'Get a public profile by ID' })
  findPublicProfile(@Param('id') id: string) {
    return this.profileService.findPublicProfile(id);
  }

  /** Update the authenticated user's profile fields (partial update) */
  @Patch()
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  update(
    @GetUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.id, dto);
  }

  /** Permanently delete the authenticated user's profile */
  @Delete()
  @ApiOperation({ summary: 'Delete my profile' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  remove(@GetUser() user: any) {
    return this.profileService.remove(user.id);
  }
}