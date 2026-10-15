import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export enum SortBy {
  LAST_ACTIVE = 'lastActive',
  NEWEST = 'newest',
  COMPATIBILITY = 'compatibility',
  DISTANCE = 'distance',
}

export class SearchProfilesDto {
  // ---- Full-text / fuzzy ----

  @ApiPropertyOptional({ description: 'Full-text search across name, occupation, aboutMe' })
  @IsOptional()
  @IsString()
  q?: string;

  // ---- Core filters ----

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

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

  // ---- Cultural filters ----

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

  // ---- Exclusion filters (comma-separated values) ----

  @ApiPropertyOptional({ description: 'Comma-separated castes to exclude e.g. "Kamma,Reddy"' })
  @IsOptional()
  @IsString()
  excludeCastes?: string;

  @ApiPropertyOptional({ description: 'Comma-separated religions to exclude e.g. "Christian,Sikh"' })
  @IsOptional()
  @IsString()
  excludeReligions?: string;

  // ---- Income ----

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

  // ---- Location filters ----

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

  // ---- Radius search ----

  @ApiPropertyOptional({ description: 'Viewer latitude for radius search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Viewer longitude for radius search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometres (requires lat & lng)', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number;

  // ---- Sorting ----

  @ApiPropertyOptional({ enum: SortBy, default: SortBy.LAST_ACTIVE })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.LAST_ACTIVE;

  // ---- Pagination ----

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
  @Max(50)
  limit = 20;
}
