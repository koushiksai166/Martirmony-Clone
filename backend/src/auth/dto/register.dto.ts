/**
 * ============================================================================
 * AUTH DTOs (Data Transfer Objects)
 * ============================================================================
 * DTOs define and validate the exact shape of incoming request bodies.
 * class-validator decorators enforce validation rules before reaching the service.
 * ============================================================================
 */

import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * RegisterDto - Validates request body for POST /auth/register.
 * Requires a valid email and a password of at least 8 characters.
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Valid email address for the account' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass@123', description: 'Password (minimum 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;
}