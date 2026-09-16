import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService refresh and logout', () => {
  it('rejects a missing refresh token', async () => {
    const service = new AuthService({} as any, {} as any);
    await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
  });

  it('revokes the stored refresh token on logout', async () => {
    const users = { removeRefreshToken: jest.fn().mockResolvedValue({}) };
    const service = new AuthService(users as any, {} as any);

    await expect(service.logout('user-1')).resolves.toEqual({ message: 'Logged out successfully' });
    expect(users.removeRefreshToken).toHaveBeenCalledWith('user-1');
  });
});
