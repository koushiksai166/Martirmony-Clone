import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PartnerPreferenceDto } from './dto/partner-preference.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateRanges(dto: PartnerPreferenceDto) {
    if (dto.minAge !== undefined && dto.maxAge !== undefined && dto.minAge > dto.maxAge) {
      throw new BadRequestException('Minimum age cannot exceed maximum age');
    }
    if (dto.minHeight !== undefined && dto.maxHeight !== undefined && dto.minHeight > dto.maxHeight) {
      throw new BadRequestException('Minimum height cannot exceed maximum height');
    }
    if (dto.minIncome !== undefined && dto.maxIncome !== undefined && dto.minIncome > dto.maxIncome) {
      throw new BadRequestException('Minimum income cannot exceed maximum income');
    }
  }

  async find(userId: string) {
    const preference = await this.prisma.partnerPreference.findUnique({ where: { userId } });
    return { preference };
  }

  async upsert(userId: string, dto: PartnerPreferenceDto) {
    this.validateRanges(dto);
    const preference = await this.prisma.partnerPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
    return { message: 'Preferences saved successfully', preference };
  }
}
