import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchService {
  constructor(private readonly prisma: PrismaService) {}

  async find(userId: string) {
    const current = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true, preference: true } });
    if (!current?.profile) return { matches: [] };
    const blocks = await this.prisma.userBlock.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] }, select: { blockerId: true, blockedId: true } });
    const blockedUserIds = blocks.map((block) => block.blockerId === userId ? block.blockedId : block.blockerId);

    const candidates = await this.prisma.profile.findMany({
      where: { userId: { notIn: [userId, ...blockedUserIds] }, isProfileComplete: true },
      select: { id: true, userId: true, firstName: true, lastName: true, gender: true, dateOfBirth: true, height: true, religion: true, caste: true, motherTongue: true, education: true, occupation: true, city: true, state: true, country: true, profilePicture: true, isVerified: true },
    });
    const matches = candidates.map((profile) => ({ profile, compatibility: this.score(current.preference, profile) })).sort((a, b) => b.compatibility - a.compatibility);
    return { matches };
  }

  private score(preference: any, profile: any) {
    if (!preference) return 0;
    let points = 0;
    let criteria = 0;
    const age = this.age(profile.dateOfBirth);
    const checks: Array<[boolean, boolean]> = [
      [preference.minAge == null && preference.maxAge == null, age >= (preference.minAge ?? 0) && age <= (preference.maxAge ?? 120)],
      [preference.minHeight == null && preference.maxHeight == null, profile.height >= (preference.minHeight ?? 0) && profile.height <= (preference.maxHeight ?? 300)],
      [!preference.religion, profile.religion === preference.religion],
      [!preference.caste, profile.caste === preference.caste],
      [!preference.motherTongue, profile.motherTongue === preference.motherTongue],
      [!preference.education, profile.education === preference.education],
      [!preference.occupation, profile.occupation === preference.occupation],
      [!preference.city && !preference.state && !preference.country, profile.city === preference.city || profile.state === preference.state || profile.country === preference.country],
    ];
    checks.forEach(([unfiltered, matches]) => { if (!unfiltered) { criteria += 1; if (matches) points += 1; } });
    return criteria === 0 ? 0 : Math.round((points / criteria) * 100);
  }

  private age(date: Date) {
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
    return age;
  }
}
