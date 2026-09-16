import { AdminService } from './admin.service';
import { NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    report: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(mockPrisma as any);
  });

  it('promotes a user to ADMIN', async () => {
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', role: 'ADMIN' });
    const result = await service.setUserRole('u1', 'ADMIN');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'ADMIN' },
    });
    expect(result.role).toBe('ADMIN');
  });

  it('demotes an ADMIN back to USER', async () => {
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', role: 'USER' });
    await service.setUserRole('u1', 'USER');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'USER' },
    });
  });

  it('throws NotFoundException when deleting a non-existent user', async () => {
    mockPrisma.user.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.deleteUser('ghost')).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing user', async () => {
    mockPrisma.user.deleteMany.mockResolvedValue({ count: 1 });
    const result = await service.deleteUser('u1');
    expect(result.message).toBe('User deleted successfully');
  });
});
