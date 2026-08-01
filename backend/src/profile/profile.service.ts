import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create Profile
   */
  async create(userId: string, dto: CreateProfileDto) {
    // Check if profile already exists
    const existingProfile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    if (existingProfile) {
      throw new BadRequestException(
        'Profile already exists',
      );
    }

    return this.prisma.profile.create({
      data: {
        ...dto,
        dateOfBirth: new Date(dto.dateOfBirth),
        userId,
      },
    });
  }

  /**
   * Get Logged-in User Profile
   */
  async findMyProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found',
      );
    }

    return {
      message: 'Profile fetched successfully',
      profile,
    };
  }

  /**
   * Update Profile
   */
  async update(
    userId: string,
    dto: UpdateProfileDto,
  ) {
    // Check if profile exists
    const profile = await this.prisma.profile.findUnique({
      where: {
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found',
      );
    }

    return this.prisma.profile.update({
      where: {
        userId,
      },
      data: {
        ...dto,

        ...(dto.dateOfBirth && {
          dateOfBirth: new Date(dto.dateOfBirth),
        }),
      },
    });
  }

/**
 * Delete Profile
 */
async remove(userId: string) {
  // Check if profile exists
  const profile = await this.prisma.profile.findUnique({
    where: {
      userId,
    },
  });

  if (!profile) {
    throw new NotFoundException(
      'Profile not found',
    );
  }

  // Delete profile
  await this.prisma.profile.delete({
    where: {
      userId,
    },
  });

  return {
    message: 'Profile deleted successfully',
  };
}


}

