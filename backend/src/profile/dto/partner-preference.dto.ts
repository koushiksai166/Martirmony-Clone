/**
 * ============================================================================
 * PARTNER PREFERENCE DTO
 * ============================================================================
 * Validates request body for PATCH /preferences.
 * All fields are optional — users can set as many or as few criteria as they wish.
 *
 * These values feed into MatchService to compute a compatibility percentage:
 * - Age range (minAge / maxAge) – Must be ≥ 18
 * - Height range (minHeight / maxHeight) – In centimeters
 * - Income range (minIncome / maxIncome) – In INR
 * - Text preferences: religion, caste, motherTongue, education, occupation
 * - Location preferences: country, state, city
 *
 * Validation:
 * - PreferencesService.validateRanges() ensures min ≤ max for all range pairs.
 * ============================================================================
 */

import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PartnerPreferenceDto {
  // ---- Age Range (years) ----

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18) // Legal minimum age for matrimony
  minAge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  maxAge?: number;

  // ---- Height Range (centimeters) ----

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minHeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxHeight?: number;

  // ---- Cultural / Lifestyle Text Filters ----

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caste?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motherTongue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  // ---- Income Range (INR per year) ----

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minIncome?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxIncome?: number;

  // ---- Location Preferences ----

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;
}
