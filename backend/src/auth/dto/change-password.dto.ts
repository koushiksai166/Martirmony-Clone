/**
 * ============================================================================
 * CHANGE PASSWORD DTO (Data Transfer Object)
 * ============================================================================
 * Validates the request body for PATCH /auth/change-password.
 * Requires both the current password (for verification) and the new password.
 * Business rules checked in AuthService:
 *   - currentPassword must match the stored bcrypt hash.
 *   - newPassword must differ from the current password.
 * ============================================================================
 */

import {
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'Password@123',
    description: 'Current account password (used to verify identity)',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description: 'New password (minimum 8 characters, must differ from current)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}