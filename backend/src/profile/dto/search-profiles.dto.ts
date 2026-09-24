/**
 * ============================================================================
 * SEARCH PROFILES DTO
 * ============================================================================
 * Validates request query parameters for GET /profile/search.
 * Uses @Type(() => Number) extensively because query parameters are always parsed
 * as strings by Express, but class-validator needs them as numbers for @Min/@Max.
 *
 * Filter criteria:
 * - Pagination: page (default 1) & limit (default 20, max 50)
 * - Gender, Age range, Height range, Income range
 * - Religion, Caste, Mother Tongue, Education, Occupation
 * - Location: Country, State, City
 *
 * Validation:
 * - All fields are optional (@IsOptional) so users can filter by any combination.
 * - ProfileService handles the complex Prisma `where` clause construction and
 *   range validation (ensuring min <= max).
 * ============================================================================
 */

import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class SearchProfilesDto {
  // ---- Core Filters ----

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  // Age limits are translated to dateOfBirth ranges in the service layer
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  minAge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  maxAge?: number;

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

  // ---- Cultural / Lifestyle Filters ----

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt() // Note: missing @Type(() => Number), though Next.js query might pass string.
  @Min(0)
  minIncome?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxIncome?: number;

  // ---- Location Filters ----

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

  // ---- Pagination (with sane defaults and maximums) ----

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50) // Hard cap on page size to prevent DoS via massive DB queries
  limit = 20;
}
