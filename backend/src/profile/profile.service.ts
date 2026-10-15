/**
 * ============================================================================
 * PROFILE SERVICE
 * ============================================================================
 * Handles all CRUD, search, privacy, and analytics for matrimony profiles.
 *
 * Fixes:
 * - isComplete() now requires only 10 core fields (religion/caste/income/
 *   motherTongue/occupation are optional — users may not want to disclose)
 * - phoneNumber masked for non-premium viewers
 * - visibilityMode: PUBLIC | MATCHES_ONLY | HIDDEN
 * - Profile views tracked in ProfileView table; owner notified on new view
 * - lastActiveAt updated via updateLastActive()
 * - Admin verification flow notifies user via NotificationService
 * ============================================================================
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchProfilesDto, SortBy } from './dto/search-profiles.dto';

export type VisibilityMode = 'PUBLIC' | 'MATCHES_ONLY' | 'HIDDEN';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  // ── Profile completeness ───────────────────────────────────────────────────

  /**
   * Only 10 core fields are required for a profile to be discoverable.
   * Sensitive/optional fields (religion, caste, income, motherTongue, occupation)
   * are NOT required — users may choose not to disclose them.
   */
  private isComplete(profile: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: Date;
    height: number;
    weight: number;
    education: string | null;
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
      profile.education,
      profile.city,
      profile.state,
      profile.country,
      profile.aboutMe,
    ].every((v) => v !== null && v !== undefined && v !== '');
  }

  // ── Last active tracking ───────────────────────────────────────────────────

  /** Called by auth middleware on each authenticated request */
  async updateLastActive(userId: string) {
    await this.prisma.profile.updateMany({
      where: { userId },
      data: { lastActiveAt: new Date() },
    });
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Profile already exists');

    try {
      const profile = await this.prisma.profile.create({
        data: { ...dto, dateOfBirth: new Date(dto.dateOfBirth), userId },
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

  async findMyProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return { message: 'Profile fetched successfully', profile };
  }

  /**
   * Returns a public profile, enforcing visibility rules and masking phone.
   * Records a profile view and notifies the owner (once per viewer).
   */
  async findPublicProfile(viewerUserId: string, profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        userId: true,
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
        phoneNumber: true,
        city: true,
        state: true,
        country: true,
        aboutMe: true,
        profilePicture: true,
        visibilityMode: true,
        isProfileComplete: true,
        isVerified: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    // Visibility enforcement
    if (profile.visibilityMode === 'HIDDEN' && profile.userId !== viewerUserId) {
      throw new ForbiddenException('This profile is private');
    }

    if (profile.visibilityMode === 'MATCHES_ONLY' && profile.userId !== viewerUserId) {
      // Check if viewer has an accepted interest with this user
      const match = await this.prisma.interest.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: viewerUserId, receiverId: profile.userId },
            { senderId: profile.userId, receiverId: viewerUserId },
          ],
        },
      });
      if (!match) throw new ForbiddenException('This profile is only visible to matches');
    }

    // Phone number: only visible to premium members
    let phoneNumber: string | null = null;
    if (profile.phoneNumber && viewerUserId !== profile.userId) {
      const membership = await this.prisma.membership.findUnique({
        where: { userId: viewerUserId },
        select: { plan: true, status: true, expiresAt: true },
      });
      const isPremium =
        membership &&
        membership.plan !== 'FREE' &&
        membership.status === 'ACTIVE' &&
        (!membership.expiresAt || membership.expiresAt > new Date());

      phoneNumber = isPremium ? profile.phoneNumber : null;
    } else if (viewerUserId === profile.userId) {
      phoneNumber = profile.phoneNumber;
    }

    // Record profile view (upsert — only notify on first view)
    if (viewerUserId !== profile.userId) {
      const existing = await this.prisma.profileView.findUnique({
        where: { viewerId_profileId: { viewerId: viewerUserId, profileId } },
      });

      await this.prisma.profileView.upsert({
        where: { viewerId_profileId: { viewerId: viewerUserId, profileId } },
        create: { viewerId: viewerUserId, profileId },
        update: { viewedAt: new Date() },
      });

      // Notify profile owner only on first-ever view
      if (!existing) {
        await this.notifications.push(
          profile.userId,
          'PROFILE_VIEW',
          'Someone viewed your profile',
        );
      }
    }

    return {
      profile: {
        ...profile,
        phoneNumber,
        phoneNumberVisible: !!phoneNumber,
      },
    };
  }

  // ── Profile views ──────────────────────────────────────────────────────────

  async getProfileViews(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const [views, total] = await Promise.all([
      this.prisma.profileView.findMany({
        where: { profileId: profile.id },
        orderBy: { viewedAt: 'desc' },
        take: 20,
        select: {
          viewerId: true,
          viewedAt: true,
        },
      }),
      this.prisma.profileView.count({ where: { profileId: profile.id } }),
    ]);

    return { total, recentViews: views };
  }

  // ── Visibility ─────────────────────────────────────────────────────────────

  async updateVisibility(userId: string, mode: VisibilityMode) {
    const allowed: VisibilityMode[] = ['PUBLIC', 'MATCHES_ONLY', 'HIDDEN'];
    if (!allowed.includes(mode)) {
      throw new BadRequestException('Invalid visibility mode. Use PUBLIC, MATCHES_ONLY, or HIDDEN');
    }

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.profile.update({
      where: { userId },
      data: { visibilityMode: mode },
      select: { id: true, visibilityMode: true },
    });
  }

  // ── Search ─────────────────────────────────────────────────────────────────

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
    const blockedUserIds = blocks.map((b) =>
      b.blockerId === userId ? b.blockedId : b.blockerId,
    );

    // Radius search via raw SQL (Haversine formula)
    let radiusProfileIds: string[] | null = null;
    if (query.lat !== undefined && query.lng !== undefined && query.radiusKm) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Profile"
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
          AND (
            6371 * acos(
              cos(radians(${query.lat})) * cos(radians(latitude))
              * cos(radians(longitude) - radians(${query.lng}))
              + sin(radians(${query.lat})) * sin(radians(latitude))
            )
          ) <= ${query.radiusKm}
      `;
      radiusProfileIds = rows.map((r) => r.id);
    }

    // Date-of-birth range from age filters
    const dateOfBirth: { gte?: Date; lte?: Date } = {};
    if (query.maxAge !== undefined) {
      dateOfBirth.gte = new Date(now.getFullYear() - query.maxAge - 1, now.getMonth(), now.getDate() + 1);
    }
    if (query.minAge !== undefined) {
      dateOfBirth.lte = new Date(now.getFullYear() - query.minAge, now.getMonth(), now.getDate());
    }

    // Exclusion filters
    const excludeCasteList = query.excludeCastes
      ? query.excludeCastes.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const excludeReligionList = query.excludeReligions
      ? query.excludeReligions.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const where: Prisma.ProfileWhereInput = {
      userId: { notIn: [userId, ...blockedUserIds] },
      isProfileComplete: true,
      visibilityMode: { not: 'HIDDEN' },
      ...(radiusProfileIds !== null && { id: { in: radiusProfileIds } }),
      ...(query.gender && { gender: query.gender }),
      ...(Object.keys(dateOfBirth).length > 0 && { dateOfBirth }),
      ...(query.minHeight !== undefined || query.maxHeight !== undefined
        ? { height: { ...(query.minHeight !== undefined && { gte: query.minHeight }), ...(query.maxHeight !== undefined && { lte: query.maxHeight }) } }
        : {}),
      ...(query.minIncome !== undefined || query.maxIncome !== undefined
        ? { annualIncome: { ...(query.minIncome !== undefined && { gte: query.minIncome }), ...(query.maxIncome !== undefined && { lte: query.maxIncome }) } }
        : {}),
      // Fuzzy partial-match filters (case-insensitive)
      ...this.textFilter('religion', query.religion),
      ...this.textFilter('caste', query.caste),
      ...this.textFilter('motherTongue', query.motherTongue),
      ...this.textFilter('education', query.education),
      ...this.textFilter('occupation', query.occupation),
      ...this.textFilter('country', query.country),
      ...this.textFilter('state', query.state),
      ...this.textFilter('city', query.city),
      // Exclusion filters
      ...(excludeCasteList.length > 0 && { caste: { notIn: excludeCasteList } }),
      ...(excludeReligionList.length > 0 && { religion: { notIn: excludeReligionList } }),
      // Full-text search across name, occupation, aboutMe, city, education
      ...(query.q && {
        OR: [
          { firstName: { contains: query.q, mode: 'insensitive' } },
          { lastName: { contains: query.q, mode: 'insensitive' } },
          { occupation: { contains: query.q, mode: 'insensitive' } },
          { aboutMe: { contains: query.q, mode: 'insensitive' } },
          { city: { contains: query.q, mode: 'insensitive' } },
          { education: { contains: query.q, mode: 'insensitive' } },
        ],
      }),
    };

    // Sort order
    let orderBy: Prisma.ProfileOrderByWithRelationInput;
    switch (query.sortBy) {
      case SortBy.NEWEST:        orderBy = { createdAt: 'desc' }; break;
      case SortBy.DISTANCE:
      case SortBy.COMPATIBILITY:
      case SortBy.LAST_ACTIVE:
      default:                   orderBy = { lastActiveAt: 'desc' };
    }

    const skip = (query.page - 1) * query.limit;

    const select = {
      id: true, firstName: true, lastName: true, gender: true,
      dateOfBirth: true, height: true, religion: true, education: true,
      occupation: true, city: true, state: true, country: true,
      latitude: true, longitude: true, profilePicture: true,
      isVerified: true, lastActiveAt: true, aboutMe: true,
    } as const;

    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({ where, select, skip, take: query.limit, orderBy }),
      this.prisma.profile.count({ where }),
    ]);

    // Post-query distance sort
    let sorted: any[] = profiles as any[];
    if (query.sortBy === SortBy.DISTANCE && query.lat !== undefined && query.lng !== undefined) {
      sorted = (profiles as any[])
        .map((p) => ({
          ...p,
          distanceKm: p.latitude && p.longitude
            ? this.haversine(query.lat!, query.lng!, p.latitude, p.longitude)
            : null,
        }))
        .sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
    }

    return {
      profiles: sorted,
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  private textFilter(field: string, value?: string) {
    return value ? { [field]: { contains: value, mode: 'insensitive' as const } } : {};
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: {
        ...dto,
        ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
      },
    });

    return this.prisma.profile.update({
      where: { id: updatedProfile.id },
      data: { isProfileComplete: this.isComplete(updatedProfile) },
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async remove(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    await this.prisma.profile.delete({ where: { userId } });
    return { message: 'Profile deleted successfully' };
  }

  // ── Admin verification (called from AdminService) ──────────────────────────

  async adminVerify(profileId: string, verified: boolean) {
    const profile = await this.prisma.profile.update({
      where: { id: profileId },
      data: { isVerified: verified },
      select: { id: true, userId: true, isVerified: true },
    });

    // Notify the user of the verification decision
    await this.notifications.push(
      profile.userId,
      'PROFILE_VERIFIED',
      verified
        ? 'Your profile has been verified ✅'
        : 'Your profile verification was not approved. Please review your details.',
    );

    return { profile };
  }
}
