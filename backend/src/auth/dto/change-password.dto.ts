import {
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'Password@123',
    description: 'Current password',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description: 'New password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}