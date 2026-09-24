/**
 * ============================================================================
 * MATCH SERVICE
 * ============================================================================
 * Core recommendation engine for the matrimony platform.
 * Calculates compatibility scores between the authenticated user's preferences
 * and all other eligible candidate profiles in the system.
 *
 * Eligibility rules:
 * - Current user must have a completed profile (otherwise returns empty).
 * - Candidate profiles must have `isProfileComplete = true`.
 * - Candidates must not be blocked by the user, nor have blocked the user.
 * - Current user is excluded from their own match results.
 *
 * Scoring Algorithm (score()):
 * - Checks up to 8 criteria: Age, Height, Religion, Caste, Mother Tongue,
 *   Education, Occupation, and Location (City/State/Country).
 * - Only criteria where the user has set a preference are evaluated.
 * - Score = (Matched Criteria / Total Active Criteria) * 100
 * - Example: If user sets only Religion and Age preferences, and a candidate
 *   matches Religion but fails Age, the score is 50%.
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all eligible candidates and calculates a compatibility score for each.
   * Returns a list sorted by highest compatibility percentage.
   */
  async find(userId: string) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, preference: true },
    });

    // If the user hasn't completed their own profile, they can't get matches
    if (!current?.profile) {
      return { matches: [] };
    }

    // Fetch bidirectional blocks to exclude them from the candidate pool
    const blocks = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });

    const blockedUserIds = blocks.map((block) =>
      block.blockerId === userId ? block.blockedId : block.blockerId,
    );

    // Fetch all complete profiles except self and blocked users
    const candidates = await this.prisma.profile.findMany({
      where: {
        userId: { notIn: [userId, ...blockedUserIds] },
        isProfileComplete: true,
      },
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
        city: true,
        state: true,
        country: true,
        profilePicture: true,
        isVerified: true,
      },
    });

    // Calculate score for each candidate and sort descending
    const matches = candidates
      .map((profile) => ({
        profile,
        compatibility: this.score(current.preference, profile),
      }))
      .sort((a, b) => b.compatibility - a.compatibility);

    return { matches };
  }

  /**
   * Evaluates a candidate profile against the user's defined preferences.
   * Only criteria that the user explicitly provided are factored into the denominator.
   */
  private score(preference: any, profile: any): number {
    // If user has zero preferences set, return 0% (or could default to 100% depending on business logic)
    if (!preference) return 0;

    let points = 0;
    let criteriaCount = 0;
    const age = this.age(profile.dateOfBirth);

    // Array of [isCriteriaIgnored, doesCandidateMatch]
    const checks: Array<[boolean, boolean]> = [
      [
        preference.minAge == null && preference.maxAge == null,
        age >= (preference.minAge ?? 0) && age <= (preference.maxAge ?? 120),
      ],
      [
        preference.minHeight == null && preference.maxHeight == null,
        profile.height >= (preference.minHeight ?? 0) &&
          profile.height <= (preference.maxHeight ?? 300),
      ],
      [!preference.religion, profile.religion === preference.religion],
      [!preference.caste, profile.caste === preference.caste],
      [!preference.motherTongue, profile.motherTongue === preference.motherTongue],
      [!preference.education, profile.education === preference.education],
      [!preference.occupation, profile.occupation === preference.occupation],
      [
        !preference.city && !preference.state && !preference.country,
        profile.city === preference.city ||
          profile.state === preference.state ||
          profile.country === preference.country, // Location match is loose (any match counts)
      ],
    ];

    // Tally up active criteria and matched points
    checks.forEach(([unfiltered, matches]) => {
      if (!unfiltered) {
        criteriaCount += 1;
        if (matches) points += 1;
      }
    });

    // Calculate final percentage
    return criteriaCount === 0 ? 0 : Math.round((points / criteriaCount) * 100);
  }

  /**
   * Helper to calculate integer age from Date of Birth
   */
  private age(date: Date): number {
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();

    // Adjust if birthday hasn't occurred yet this year
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) {
      age -= 1;
    }
    return age;
  }
}
