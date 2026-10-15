import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ProfileService } from './profile.service';
import { SearchProfilesDto } from './dto/search-profiles.dto';

@Injectable()
export class SavedSearchService {
  private readonly logger = new Logger(SavedSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly profileService: ProfileService,
  ) {}

  async save(userId: string, name: string, filters: Record<string, any>, alertEnabled = true) {
    return this.prisma.savedSearch.create({
      data: { userId, name, filters, alertEnabled },
    });
  }

  async list(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    const saved = await this.prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!saved) throw new NotFoundException('Saved search not found');
    await this.prisma.savedSearch.delete({ where: { id } });
    return { deleted: true };
  }

  async toggleAlert(userId: string, id: string, alertEnabled: boolean) {
    const saved = await this.prisma.savedSearch.findFirst({ where: { id, userId } });
    if (!saved) throw new NotFoundException('Saved search not found');
    return this.prisma.savedSearch.update({ where: { id }, data: { alertEnabled } });
  }

  /**
   * Runs every 6 hours: checks all alert-enabled saved searches,
   * runs the search, and notifies users if new profiles appeared since last alert.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async runAlerts() {
    const searches = await this.prisma.savedSearch.findMany({
      where: { alertEnabled: true },
    });

    for (const saved of searches) {
      try {
        const filters = saved.filters as Record<string, any>;
        const dto = Object.assign(new SearchProfilesDto(), filters, { page: 1, limit: 5 });
        const result = await this.profileService.search(saved.userId, dto);

        // Only alert if there are new profiles since last alert
        const cutoff = saved.lastAlertAt ?? saved.createdAt;
        const newProfiles = result.profiles.filter(
          (p: any) => p.lastActiveAt && new Date(p.lastActiveAt) > cutoff,
        );

        if (newProfiles.length > 0) {
          await this.notifications.push(
            saved.userId,
            'NEW_MATCH',
            `${newProfiles.length} new profile${newProfiles.length > 1 ? 's' : ''} match your saved search "${saved.name}"`,
          );

          await this.prisma.savedSearch.update({
            where: { id: saved.id },
            data: { lastAlertAt: new Date() },
          });
        }
      } catch (err) {
        this.logger.error(`Saved search alert failed for ${saved.id}: ${(err as Error).message}`);
      }
    }
  }
}
