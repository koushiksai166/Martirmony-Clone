/**
 * ============================================================================
 * UPDATE PROFILE DTO
 * ============================================================================
 * Extends CreateProfileDto using NestJS PartialType — all fields become optional.
 * Used for PATCH /profile to allow updating any subset of profile fields
 * without requiring the full object.
 * ============================================================================
 */

import { PartialType } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

export class UpdateProfileDto extends PartialType(
  CreateProfileDto,
) {}