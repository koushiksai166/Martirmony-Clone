/**
 * ============================================================================
 * LOGIN DTO (Data Transfer Object)
 * ============================================================================
 * Validates the request body for POST /auth/login.
 * Requires a valid email and a password of at least 8 characters.
 * ============================================================================
 */

import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Registered email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass@123', description: 'Account password (minimum 8 characters)' })
  @IsString()
  @MinLength(8)
  password!: string;
}