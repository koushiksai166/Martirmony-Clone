import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Delete,
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

  @Post()
  @ApiOperation({
    summary: 'Create profile',
  })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
  })
  create(
    @GetUser() user: any,
    @Body() dto: CreateProfileDto,
  ) {
    return this.profileService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get my profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile fetched successfully',
  })
  findMyProfile(@GetUser() user: any) {
    return this.profileService.findMyProfile(user.id);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update my profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  update(
    @GetUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.id, dto);
  }
@Delete()
@ApiOperation({
  summary: 'Delete my profile',
})
@ApiResponse({
  status: 200,
  description: 'Profile deleted successfully',
})
remove(@GetUser() user: any) {
  return this.profileService.remove(user.id);
}

}