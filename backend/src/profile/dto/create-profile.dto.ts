/**
 * ============================================================================
 * CREATE PROFILE DTO
 * ============================================================================
 * Validates request body for POST /profile.
 *
 * Required fields: firstName, lastName, gender, dateOfBirth, height, weight, annualIncome
 * Optional fields: religion, caste, motherTongue, education, occupation,
 *                  city, state, country, aboutMe, profilePicture
 *
 * All 16 fields (required + optional) are checked by ProfileService.isComplete()
 * to determine whether the profile is discoverable in search results.
 * ============================================================================
 */

import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreateProfileDto {
  // ---- Required Personal Information ----

  @ApiProperty({
    example: 'Sai',
    description: 'First name of the user',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Prakash',
    description: 'Last name of the user',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Gender of the user (MALE or FEMALE)',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    example: '2002-08-15',
    description: 'Date of birth in ISO 8601 format (YYYY-MM-DD)',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    example: 178,
    description: 'Height in centimeters',
  })
  @Type(() => Number) // Transform query string numbers for multipart/form-data
  @IsNumber()
  height: number;

  @ApiProperty({
    example: 75,
    description: 'Weight in kilograms',
  })
  @Type(() => Number)
  @IsNumber()
  weight: number;

  // ---- Optional Cultural & Professional Fields ----

  @ApiPropertyOptional({
    example: 'Hindu',
  })
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiPropertyOptional({
    example: 'Kamma',
  })
  @IsOptional()
  @IsString()
  caste?: string;

  @ApiPropertyOptional({
    example: 'Telugu',
  })
  @IsOptional()
  @IsString()
  motherTongue?: string;

  @ApiPropertyOptional({
    example: 'B.Tech',
  })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({
    example: 'Software Engineer',
  })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({
    example: 1200000,
    description: 'Annual income in INR',
  })
  @Type(() => Number)
  @IsNumber()
  annualIncome: number;

  // ---- Optional Location Fields ----

  @ApiPropertyOptional({
    example: 'Hyderabad',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'Telangana',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    example: 'India',
  })
  @IsOptional()
  @IsString()
  country?: string;

  // ---- Optional Bio & Media ----

  @ApiPropertyOptional({ example: '+91 98765 43210', description: 'Phone number (visible to premium members only)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Passionate Full Stack Developer looking for a life partner.',
  })
  @IsOptional()
  @IsString()
  aboutMe?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}