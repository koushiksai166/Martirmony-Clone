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
 * - Weighted criteria: Religion (25), Caste (20), Mother Tongue (15),
 *   Age (15), Height (10), Education (8), Occupation (5), Location (2).
 * - Only criteria where the user has set a preference are evaluated.
 * - Final score = (earned weight / total active weight) * 100
 * - If user has NO preferences set, score defaults to 100% (open to all).
 * - Mutual compatibility: average of user→candidate and candidate→user scores.
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Weights reflect cultural importance in matrimony matchmaking
const WEIGHTS = {
  religion: 25,
  caste: 20,
  motherTongue: 15,
  age: 15,
  height: 10,
  education: 8,
  occupation: 5,
  location: 2,
};

@Injectable()
export class MatchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all eligible candidates and calculates a mutual compatibility score.
   * Returns a list sorted by highest compatibility percentage.
   */
  async find(userId: string) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, preference: true },
    });

    if (!current?.profile) {
      return { matches: [] };
    }

    const blocks = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });

    const blockedUserIds = blocks.map((block) =>
      block.blockerId === userId ? block.blockedId : block.blockerId,
    );

    // Fetch candidates with their preferences for inverse scoring
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
        user: { select: { preference: true } },
      },
    });

    const matches = candidates
      .map((candidate) => {
        const forwardScore = this.score(current.preference, candidate);
        const inverseScore = this.score(
          candidate.user?.preference,
          current.profile,
        );
        // Mutual compatibility: average of both directions
        const compatibility = Math.round((forwardScore + inverseScore) / 2);
        const { user: _user, ...profile } = candidate;
        return { profile, compatibility };
      })
      .sort((a, b) => b.compatibility - a.compatibility);

    return { matches };
  }

  /**
   * Calculates a weighted compatibility score of a candidate against preferences.
   * Returns 100 if no preferences are set (open to all candidates).
   */
  private score(preference: any, profile: any): number {
    if (!preference) return 100;

    const age = this.age(profile.dateOfBirth);
    let earned = 0;
    let total = 0;

    const check = (weight: number, isSet: boolean, matches: boolean) => {
      if (isSet) {
        total += weight;
        if (matches) earned += weight;
      }
    };

    check(
      WEIGHTS.age,
      preference.minAge != null || preference.maxAge != null,
      age >= (preference.minAge ?? 0) && age <= (preference.maxAge ?? 120),
    );

    check(
      WEIGHTS.height,
      preference.minHeight != null || preference.maxHeight != null,
      profile.height >= (preference.minHeight ?? 0) &&
        profile.height <= (preference.maxHeight ?? 300),
    );

    check(
      WEIGHTS.religion,
      !!preference.religion,
      profile.religion === preference.religion,
    );

    check(
      WEIGHTS.caste,
      !!preference.caste,
      profile.caste === preference.caste,
    );

    check(
      WEIGHTS.motherTongue,
      !!preference.motherTongue,
      profile.motherTongue === preference.motherTongue,
    );

    check(
      WEIGHTS.education,
      !!preference.education,
      profile.education === preference.education,
    );

    check(
      WEIGHTS.occupation,
      !!preference.occupation,
      profile.occupation === preference.occupation,
    );

    check(
      WEIGHTS.location,
      !!(preference.city || preference.state || preference.country),
      profile.city === preference.city ||
        profile.state === preference.state ||
        profile.country === preference.country,
    );

    // No active criteria means user is open to all → full score
    return total === 0 ? 100 : Math.round((earned / total) * 100);
  }

  /**
   * Calculates integer age from Date of Birth.
   */
  private age(date: Date): number {
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();

    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() < birth.getDate())
    ) {
      age -= 1;
    }
    return age;
  }
}
