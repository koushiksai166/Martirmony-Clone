import { BadRequestException } from '@nestjs/common';
import { InterestService } from './interest.service';
import { InterestStatus } from '@prisma/client';

describe('InterestService', () => {
  it('rejects sending an interest to yourself', async () => {
    const prisma = { profile: { findUnique: jest.fn().mockResolvedValue({ userId: 'user-1' }) } };
    const service = new InterestService(prisma as any);

    await expect(service.send('user-1', 'profile-1')).rejects.toThrow(BadRequestException);
  });

  it('allows only the receiver to accept a pending interest', async () => {
    const prisma = {
      interest: { findUnique: jest.fn().mockResolvedValue({ id: 'interest-1', senderId: 'sender', receiverId: 'receiver', status: InterestStatus.PENDING }) },
    };
    const service = new InterestService(prisma as any);

    await expect(service.updateStatus('sender', 'interest-1', InterestStatus.ACCEPTED)).rejects.toThrow('Only the receiver can respond');
  });
});
