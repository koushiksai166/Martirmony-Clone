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
    description: 'Gender of the user',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    example: '2002-08-15',
    description: 'Date of birth',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    example: 178,
    description: 'Height in centimeters',
  })
  @IsNumber()
  height: number;

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
  @IsNumber()
  annualIncome: number;

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