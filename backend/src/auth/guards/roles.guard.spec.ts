import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

describe('RolesGuard', () => {
  const context = (user: any) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as any;

  it('allows users with a required role', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context({ role: Role.ADMIN }))).toBe(true);
  });

  it('rejects users without a required role', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context({ role: Role.USER }))).toBe(false);
  });
});
