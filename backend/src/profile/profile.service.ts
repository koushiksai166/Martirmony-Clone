/**
 * ============================================================================
 * PROFILE SERVICE
 * ============================================================================
 * Handles all CRUD and search operations for matrimony candidate profiles.
 *
 * Operations:
 * - create()           – Create a new profile for the authenticated user
 * - findMyProfile()    – Fetch the authenticated user's own profile
 * - findPublicProfile()– Fetch a publicly visible profile by profile ID (for browsing)
 * - search()           – Paginated, multi-filter profile discovery with block exclusion
 * - update()           – Update the authenticated user's profile fields
 * - remove()           – Delete the authenticated user's profile
 *
 * Profile Completion:
 * isProfileComplete is computed via isComplete() which checks that all 16 key
 * demographic fields are populated. Incomplete profiles are excluded from search results.
 *
 * Search Engine:
 * The search() method supports 12 filters (gender, age, height, income, religion, caste,
 * motherTongue, education, occupation, city, state, country) with pagination.
 * Blocked users are automatically excluded from all search results.
 * ============================================================================
 */

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

  /**
   * Checks whether all required profile fields are populated.
   * A profile must have all 16 fields completed before it is considered
   * discoverable (isProfileComplete = true) and eligible to appear in search results.
   */
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
  }): boolean {
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
   * Creates a new profile linked to the authenticated user.
   * Throws 400 if a profile already exists (one profile per account).
   * Automatically computes isProfileComplete after creation.
   * @param userId The authenticated user's ID from JWT
   * @param dto    Validated profile field values
   */
  async create(userId: string, dto: CreateProfileDto) {
    // Prevent duplicate profiles per user account
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Profile already exists');
    }

    try {
      const profile = await this.prisma.profile.create({
        data: {
          ...dto,
          dateOfBirth: new Date(dto.dateOfBirth), // Convert ISO date string to Date object
          userId,
        },
      });

      // Evaluate and persist the completeness flag
      return this.prisma.profile.update({
        where: { id: profile.id },
        data: { isProfileComplete: this.isComplete(profile) },
      });
    } catch (error) {
      // Handle race condition duplicate inserts (P2002 = unique constraint violation)
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
   * Returns the authenticated user's complete profile record.
   * Throws 404 if no profile exists for this user.
   */
  async findMyProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      message: 'Profile fetched successfully',
      profile,
    };
  }

  /**
   * Returns a sanitized public view of a profile for discovery/browsing.
   * Excludes sensitive fields like weight. Identified by profile.id (not userId).
   * @param id Profile unique ID
   */
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

  /**
   * Paginated profile search with up to 12 concurrent filter criteria.
   *
   * Filter logic:
   * - Age filters use date-of-birth arithmetic for accurate matching.
   * - Text filters (religion, caste, etc.) use case-insensitive partial matching.
   * - Height and income filters use numeric range comparisons.
   * - Blocked users (in both directions) are automatically excluded.
   * - Only complete profiles (isProfileComplete = true) appear in results.
   *
   * @param userId Authenticated user ID (excluded from their own search results)
   * @param query  Validated filter and pagination parameters
   */
  async search(userId: string, query: SearchProfilesDto) {
    // Validate range filters — min cannot exceed max
    if (
      (query.minAge !== undefined && query.maxAge !== undefined && query.minAge > query.maxAge) ||
      (query.minHeight !== undefined && query.maxHeight !== undefined && query.minHeight > query.maxHeight) ||
      (query.minIncome !== undefined && query.maxIncome !== undefined && query.minIncome > query.maxIncome)
    ) {
      throw new BadRequestException('Minimum filters cannot exceed maximum filters');
    }

    const now = new Date();

    // Fetch all user IDs the current user has blocked or been blocked by
    const blocks = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedUserIds = blocks.map((block) =>
      block.blockerId === userId ? block.blockedId : block.blockerId,
    );

    // Translate age bounds to date-of-birth range
    const dateOfBirth: { gte?: Date; lte?: Date } = {};
    if (query.maxAge !== undefined) {
      // Older than maxAge years: born before (now - maxAge years - 1 day)
      dateOfBirth.gte = new Date(
        now.getFullYear() - query.maxAge - 1,
        now.getMonth(),
        now.getDate() + 1,
      );
    }
    if (query.minAge !== undefined) {
      // Younger than minAge years: born after (now - minAge years)
      dateOfBirth.lte = new Date(
        now.getFullYear() - query.minAge,
        now.getMonth(),
        now.getDate(),
      );
    }

    // Build Prisma where clause from active filters
    const where: Prisma.ProfileWhereInput = {
      userId: { notIn: [userId, ...blockedUserIds] }, // Exclude self and blocked users
      isProfileComplete: true,                          // Only show complete profiles
      ...(query.gender && { gender: query.gender }),
      ...(Object.keys(dateOfBirth).length > 0 && { dateOfBirth }),
      ...(query.minHeight !== undefined || query.maxHeight !== undefined
        ? {
            height: {
              ...(query.minHeight !== undefined && { gte: query.minHeight }),
              ...(query.maxHeight !== undefined && { lte: query.maxHeight }),
            },
          }
        : {}),
      ...(query.minIncome !== undefined || query.maxIncome !== undefined
        ? {
            annualIncome: {
              ...(query.minIncome !== undefined && { gte: query.minIncome }),
              ...(query.maxIncome !== undefined && { lte: query.maxIncome }),
            },
          }
        : {}),
      // Case-insensitive partial text matching for lifestyle fields
      ...this.textFilter('religion', query.religion),
      ...this.textFilter('caste', query.caste),
      ...this.textFilter('motherTongue', query.motherTongue),
      ...this.textFilter('education', query.education),
      ...this.textFilter('occupation', query.occupation),
      ...this.textFilter('country', query.country),
      ...this.textFilter('state', query.state),
      ...this.textFilter('city', query.city),
    };

    // Pagination offset
    const skip = (query.page - 1) * query.limit;

    // Fields to return for each profile card in search results
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

    // Execute paginated query and total count in a single transaction
    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        select,
        skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' }, // Most recently updated profiles first
      }),
      this.prisma.profile.count({ where }),
    ]);

    return {
      profiles,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Builds a case-insensitive partial-match filter for text fields.
   * Returns empty object if value is not provided (filter is skipped).
   * @param field  Database column name
   * @param value  Optional search term
   */
  private textFilter(field: string, value?: string) {
    return value
      ? { [field]: { contains: value, mode: 'insensitive' as const } }
      : {};
  }

  /**
   * Updates editable fields on the authenticated user's profile.
   * Recomputes isProfileComplete after every update.
   * @param userId The authenticated user's ID
   * @param dto    Partial set of profile fields to update (all optional via PartialType)
   */
  async update(userId: string, dto: UpdateProfileDto) {
    // Ensure profile exists before attempting update
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: {
        ...dto,
        // Convert ISO date string to Date object only if dateOfBirth is included
        ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
      },
    });

    // Re-evaluate profile completeness after update
    return this.prisma.profile.update({
      where: { id: updatedProfile.id },
      data: { isProfileComplete: this.isComplete(updatedProfile) },
    });
  }

  /**
   * Permanently deletes the authenticated user's profile.
   * This removes the profile from all search results and match engines.
   * The user account (email, password) remains intact.
   * @param userId The authenticated user's ID
   */
  async remove(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.prisma.profile.delete({ where: { userId } });

    return { message: 'Profile deleted successfully' };
  }
}