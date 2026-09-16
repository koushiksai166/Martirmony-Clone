import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InterestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InterestService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly profileSelect = {
    id: true, firstName: true, lastName: true, gender: true,
    dateOfBirth: true, city: true, profilePicture: true, isVerified: true,
  } as const;

  async send(senderId: string, profileId: string) {
    const receiver = await this.prisma.profile.findUnique({ where: { id: profileId }, select: { userId: true } });
    if (!receiver) throw new NotFoundException('Profile not found');
    if (receiver.userId === senderId) throw new BadRequestException('You cannot send interest to yourself');

    const existing = await this.prisma.interest.findUnique({ where: { senderId_receiverId: { senderId, receiverId: receiver.userId } } });
    if (existing?.status === InterestStatus.PENDING) throw new BadRequestException('Interest is already pending');

    const interest = await this.prisma.interest.upsert({
      where: { senderId_receiverId: { senderId, receiverId: receiver.userId } },
      create: { senderId, receiverId: receiver.userId },
      update: { status: InterestStatus.PENDING },
    });
    await this.prisma.notification.create({
      data: { userId: receiver.userId, type: 'NEW_INTEREST', message: 'You received a new interest' },
    });
    return interest;
  }

  async sent(userId: string) {
    return this.prisma.interest.findMany({ where: { senderId: userId }, include: { receiver: { include: { profile: { select: this.profileSelect } } } }, orderBy: { updatedAt: 'desc' } });
  }

  async received(userId: string) {
    return this.prisma.interest.findMany({ where: { receiverId: userId }, include: { sender: { include: { profile: { select: this.profileSelect } } } }, orderBy: { updatedAt: 'desc' } });
  }

  async updateStatus(userId: string, id: string, status: InterestStatus) {
    const interest = await this.prisma.interest.findUnique({ where: { id } });
    if (!interest) throw new NotFoundException('Interest not found');
    if (status === InterestStatus.ACCEPTED || status === InterestStatus.REJECTED) {
      if (interest.receiverId !== userId) throw new BadRequestException('Only the receiver can respond');
      if (interest.status !== InterestStatus.PENDING) throw new BadRequestException('Only pending interests can be responded to');
    }
    if (status === InterestStatus.WITHDRAWN) {
      if (interest.senderId !== userId) throw new BadRequestException('Only the sender can withdraw interest');
      if (interest.status !== InterestStatus.PENDING) throw new BadRequestException('Only pending interests can be withdrawn');
    }
    const updated = await this.prisma.interest.update({ where: { id }, data: { status } });
    if (status === InterestStatus.ACCEPTED) {
      await this.prisma.notification.create({
        data: { userId: interest.senderId, type: 'INTEREST_ACCEPTED', message: 'Your interest was accepted' },
      });
    }
    return updated;
  }
}
