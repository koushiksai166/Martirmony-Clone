/**
 * ============================================================================
 * PREFERENCES SERVICE
 * ============================================================================
 * Manages partner preference CRUD with range validation.
 * Preferences are used by MatchService to calculate compatibility scores.
 *
 * Business rules:
 * - minAge <= maxAge, minHeight <= maxHeight, minIncome <= maxIncome
 * - Uses upsert: creates preferences if missing, updates if present
 * ============================================================================
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { PartnerPreferenceDto } from './dto/partner-preference.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that all min/max range pairs are logically consistent.
   * Throws BadRequestException if any minimum exceeds its corresponding maximum.
   */
  private validateRanges(dto: PartnerPreferenceDto) {
    if (dto.minAge !== undefined && dto.maxAge !== undefined && dto.minAge > dto.maxAge) {
      throw new BadRequestException('Minimum age cannot exceed maximum age');
    }
    if (dto.minHeight !== undefined && dto.maxHeight !== undefined && dto.minHeight > dto.maxHeight) {
      throw new BadRequestException('Minimum height cannot exceed maximum height');
    }
    if (dto.minIncome !== undefined && dto.maxIncome !== undefined && dto.minIncome > dto.maxIncome) {
      throw new BadRequestException('Minimum income cannot exceed maximum income');
    }
  }

  /**
   * Retrieves the stored partner preferences for a user.
   * Returns { preference: null } if none have been set yet.
   */
  async find(userId: string) {
    const preference = await this.prisma.partnerPreference.findUnique({ where: { userId } });
    return { preference };
  }

  /**
   * Creates or updates partner preferences using Prisma's upsert.
   * If no record exists for the user, one is created. Otherwise, existing values are overwritten.
   * @param userId Authenticated user's ID
   * @param dto    Validated preference values
   */
  async upsert(userId: string, dto: PartnerPreferenceDto) {
    this.validateRanges(dto);
    const preference = await this.prisma.partnerPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
    return { message: 'Preferences saved successfully', preference };
  }
}
