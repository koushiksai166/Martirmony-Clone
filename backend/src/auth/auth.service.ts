import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

import { StringValue } from 'ms';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  // ===========================
  // Helper Methods
  // ===========================

  private async generateAccessToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
    });
  }

  private async generateRefreshToken(user: any): Promise<string> {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return this.jwtService.signAsync(payload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn:
      process.env.JWT_REFRESH_EXPIRES_IN as StringValue,
  });
}

  // ===========================
  // Register
  // ===========================

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    const existingUser =
      await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'Email already registered',
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10,
    );

    const user = await this.usersService.createUser(
      email,
      hashedPassword,
    );

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  // ===========================
  // Login
  // ===========================

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user =
      await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const accessToken =
      await this.generateAccessToken(user);

    const refreshToken =
      await this.generateRefreshToken(user);

    const hashedRefreshToken =
      await bcrypt.hash(refreshToken, 10);

    await this.usersService.updateRefreshToken(
      user.id,
      hashedRefreshToken,
    );

    return {
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  // ===========================
  // Get Current User
  // ===========================

  async getMe(userId: string) {
    const user =
      await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return {
      message: 'User fetched successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  // ===========================
  // Change Password
  // ===========================

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ) {
    const { currentPassword, newPassword } = dto;

    const user =
      await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const isCurrentPasswordValid =
      await bcrypt.compare(
        currentPassword,
        user.password,
      );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    const isSamePassword =
      await bcrypt.compare(
        newPassword,
        user.password,
      );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(
      userId,
      hashedPassword,
    );

    return {
      message: 'Password changed successfully',
    };
  }
}