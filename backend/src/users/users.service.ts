import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Create a new user
   */
  async createUser(
    email: string,
    password: string,
  ) {
    return this.prisma.user.create({
      data: {
        email,
        password,
      },
    });
  }

  /**
   * Update user's password
   */
  async updatePassword(
    id: string,
    password: string,
  ) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
      },
    });
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  async removeRefreshToken(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        refreshToken: null,
      },
    });
  }
}