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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ProfileService, VisibilityMode } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

class VisibilityDto {
  @IsEnum(['PUBLIC', 'MATCHES_ONLY', 'HIDDEN'])
  mode: VisibilityMode;
}

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create profile' })
  create(@GetUser() user: any, @Body() dto: CreateProfileDto) {
    return this.profileService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my profile' })
  findMyProfile(@GetUser() user: any) {
    return this.profileService.findMyProfile(user.id);
  }

  @Get('views')
  @ApiOperation({ summary: 'Get who viewed my profile' })
  views(@GetUser() user: any) {
    return this.profileService.getProfileViews(user.id);
  }

  @Patch('visibility')
  @ApiOperation({ summary: 'Update profile visibility (PUBLIC | MATCHES_ONLY | HIDDEN)' })
  visibility(@GetUser() user: any, @Body() dto: VisibilityDto) {
    return this.profileService.updateVisibility(user.id, dto.mode);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search public profiles' })
  search(@GetUser() user: any, @Query() query: SearchProfilesDto) {
    return this.profileService.search(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public profile by ID' })
  findPublicProfile(@GetUser() user: any, @Param('id') id: string) {
    return this.profileService.findPublicProfile(user.id, id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update my profile' })
  update(@GetUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(user.id, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete my profile' })
  remove(@GetUser() user: any) {
    return this.profileService.remove(user.id);
  }
}
