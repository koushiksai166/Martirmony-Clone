import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private isComplete(profile: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: Date;
    height: number;
    weight: number;
    religion: string | null;
    caste: string | null;
    motherTongue: string | null;
    education: string | null;
    occupation: string | null;
    annualIncome: number | null;
    city: string | null;
    state: string | null;
    country: string | null;
    aboutMe: string | null;
  }) {
    return [
      profile.firstName,
      profile.lastName,
      profile.gender,
      profile.dateOfBirth,
      profile.height,
      profile.weight,
      profile.religion,
      profile.caste,
      profile.motherTongue,
      profile.education,
      profile.occupation,
      profile.annualIncome,
      profile.city,
      profile.state,
      profile.country,
      profile.aboutMe,
    ].every((value) => value !== null && value !== undefined && value !== '');
  }

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

    try {
      const profile = await this.prisma.profile.create({
        data: {
          ...dto,
          dateOfBirth: new Date(dto.dateOfBirth),
          userId,
        },
      });

      return this.prisma.profile.update({
        where: { id: profile.id },
        data: { isProfileComplete: this.isComplete(profile) },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Profile already exists');
      }

      throw error;
    }
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

  async findPublicProfile(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        height: true,
        religion: true,
        caste: true,
        motherTongue: true,
        education: true,
        occupation: true,
        annualIncome: true,
        city: true,
        state: true,
        country: true,
        aboutMe: true,
        profilePicture: true,
        isProfileComplete: true,
        isVerified: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return { profile };
  }

  async search(userId: string, query: SearchProfilesDto) {
    if (
      (query.minAge !== undefined && query.maxAge !== undefined && query.minAge > query.maxAge) ||
      (query.minHeight !== undefined && query.maxHeight !== undefined && query.minHeight > query.maxHeight) ||
      (query.minIncome !== undefined && query.maxIncome !== undefined && query.minIncome > query.maxIncome)
    ) {
      throw new BadRequestException('Minimum filters cannot exceed maximum filters');
    }

    const now = new Date();
    const blocks = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedUserIds = blocks.map((block) => block.blockerId === userId ? block.blockedId : block.blockerId);
    const dateOfBirth: { gte?: Date; lte?: Date } = {};
    if (query.maxAge !== undefined) {
      dateOfBirth.gte = new Date(now.getFullYear() - query.maxAge - 1, now.getMonth(), now.getDate() + 1);
    }
    if (query.minAge !== undefined) {
      dateOfBirth.lte = new Date(now.getFullYear() - query.minAge, now.getMonth(), now.getDate());
    }

    const where: Prisma.ProfileWhereInput = {
      userId: { notIn: [userId, ...blockedUserIds] },
      isProfileComplete: true,
      ...(query.gender && { gender: query.gender }),
      ...(Object.keys(dateOfBirth).length > 0 && { dateOfBirth }),
      ...(query.minHeight !== undefined || query.maxHeight !== undefined
        ? { height: { ...(query.minHeight !== undefined && { gte: query.minHeight }), ...(query.maxHeight !== undefined && { lte: query.maxHeight }) } }
        : {}),
      ...(query.minIncome !== undefined || query.maxIncome !== undefined
        ? { annualIncome: { ...(query.minIncome !== undefined && { gte: query.minIncome }), ...(query.maxIncome !== undefined && { lte: query.maxIncome }) } }
        : {}),
      ...this.textFilter('religion', query.religion),
      ...this.textFilter('caste', query.caste),
      ...this.textFilter('motherTongue', query.motherTongue),
      ...this.textFilter('education', query.education),
      ...this.textFilter('occupation', query.occupation),
      ...this.textFilter('country', query.country),
      ...this.textFilter('state', query.state),
      ...this.textFilter('city', query.city),
    };

    const skip = (query.page - 1) * query.limit;
    const select = {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      dateOfBirth: true,
      height: true,
      religion: true,
      education: true,
      occupation: true,
      city: true,
      state: true,
      country: true,
      profilePicture: true,
      isVerified: true,
    } as const;

    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({ where, select, skip, take: query.limit, orderBy: { updatedAt: 'desc' } }),
      this.prisma.profile.count({ where }),
    ]);

    return { profiles, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  private textFilter(field: string, value?: string) {
    return value ? { [field]: { contains: value, mode: 'insensitive' as const } } : {};
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

    const updatedProfile = await this.prisma.profile.update({
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

    return this.prisma.profile.update({
      where: { id: updatedProfile.id },
      data: { isProfileComplete: this.isComplete(updatedProfile) },
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