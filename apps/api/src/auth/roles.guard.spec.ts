import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';

function makeContext(role: UserRole): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(async () => {
    reflector = { getAllAndOverride: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: reflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('retorna true quando não há @Roles() definido no endpoint', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext(UserRole.USER))).toBe(true);
  });

  it('retorna true quando o role do usuário está na lista de roles requeridos', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(makeContext(UserRole.ADMIN))).toBe(true);
  });

  it('lança ForbiddenException quando o role do usuário não está na lista', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(makeContext(UserRole.USER))).toThrow(ForbiddenException);
  });

  it('lança ForbiddenException com mensagem correta', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(makeContext(UserRole.USER))).toThrow('Acesso negado: permissão insuficiente');
  });

  it('retorna true quando múltiplos roles são aceitos e o usuário tem um deles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.USER]);
    expect(guard.canActivate(makeContext(UserRole.USER))).toBe(true);
  });

  it('usa a chave ROLES_KEY ao consultar o reflector', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeContext(UserRole.ADMIN);
    guard.canActivate(ctx);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
