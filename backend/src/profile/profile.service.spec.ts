import { BadRequestException } from '@nestjs/common';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const completeProfile = {
    id: 'profile-1', firstName: 'Sai', lastName: 'Prakash', gender: 'MALE',
    dateOfBirth: new Date('2000-01-01'), height: 178, religion: 'Hindu',
    caste: 'Kamma', motherTongue: 'Telugu', education: 'B.Tech',
    occupation: 'Engineer', annualIncome: 1200000, city: 'Hyderabad',
    state: 'Telangana', country: 'India', aboutMe: 'A complete profile description.',
    profilePicture: null, isProfileComplete: false,
  };

  it('marks a complete profile after creation', async () => {
    const prisma = {
      profile: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(completeProfile),
        update: jest.fn().mockResolvedValue({ ...completeProfile, isProfileComplete: true }),
      },
    };
    const service = new ProfileService(prisma as any);

    const result = await service.create('user-1', {
      ...completeProfile,
      dateOfBirth: '2000-01-01',
    } as any);

    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
      data: { isProfileComplete: true },
    });
    expect(result.isProfileComplete).toBe(true);
  });

  it('rejects duplicate profile creation before writing', async () => {
    const prisma = { profile: { findUnique: jest.fn().mockResolvedValue(completeProfile) } };
    const service = new ProfileService(prisma as any);

    await expect(service.create('user-1', {} as any)).rejects.toThrow(BadRequestException);
  });
});
