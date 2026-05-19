import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PlanStatus, UserRole } from '@prisma/client';
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY, JwtAuthGuard, invalidateBillingCache } from './jwt-auth.guard';

const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const adminUser = { id: 'user-1', email: 'admin@test.com', role: UserRole.ADMIN, tenantId: 'tenant-1' };
const regularUser = { id: 'user-2', email: 'user@test.com', role: UserRole.USER, tenantId: 'tenant-1' };

function makeContext(
  user: typeof adminUser = adminUser,
  path = '/customers',
  headers: Record<string, string> = {},
): ExecutionContext {
  const responseHeaders: Record<string, string> = {};
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user, path, headers }),
      getResponse: () => ({
        setHeader: (key: string, val: string) => { responseHeaders[key] = val; },
        getHeaders: () => responseHeaders,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    invalidateBillingCache('tenant-1');

    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Reflector, useValue: reflector },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);

    // Stub super.canActivate to always pass
    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate').mockResolvedValue(true);
  });

  afterEach(() => {
    invalidateBillingCache('tenant-1');
    jest.useRealTimers();
  });

  describe('rotas públicas (@Public)', () => {
    it('retorna true sem verificar o Prisma quando @Public() está definido', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockPrisma.tenant.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('bypass de billing para /billing', () => {
    it('pula verificação de billing para paths que iniciam com /billing', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      const ctx = makeContext(adminUser, '/billing/status');

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockPrisma.tenant.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('tenant ACTIVE', () => {
    it('retorna true sem definir headers de aviso', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        planStatus: PlanStatus.ACTIVE,
        blockReason: null,
        gracePeriodEndsAt: null,
      });
      const ctx = makeContext();
      const res = ctx.switchToHttp().getResponse() as { getHeaders: () => Record<string, string> };

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(res.getHeaders()['x-payment-warning']).toBeUndefined();
    });
  });

  describe('tenant PAST_DUE dentro do grace period', () => {
    it('define headers x-payment-warning e x-grace-period-ends e retorna true', async () => {
      const gracePeriodEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // amanhã
      mockPrisma.tenant.findUnique.mockResolvedValue({
        planStatus: PlanStatus.PAST_DUE,
        blockReason: 'Cobrança recusada',
        gracePeriodEndsAt,
      });
      const responseHeaders: Record<string, string> = {};
      const ctx = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: adminUser, path: '/customers' }),
          getResponse: () => ({
            setHeader: (k: string, v: string) => { responseHeaders[k] = v; },
            getHeaders: () => responseHeaders,
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(responseHeaders['x-payment-warning']).toBe('true');
      expect(responseHeaders['x-grace-period-ends']).toBe(gracePeriodEndsAt.toISOString());
    });
  });

  describe('tenant PAST_DUE com grace period expirado', () => {
    it('promove para BLOCKED no banco e lança PaymentRequiredException', async () => {
      const expired = new Date(Date.now() - 1000);
      mockPrisma.tenant.findUnique.mockResolvedValue({
        planStatus: PlanStatus.PAST_DUE,
        blockReason: 'Cobrança recusada',
        gracePeriodEndsAt: expired,
      });
      mockPrisma.tenant.update.mockResolvedValue({});
      const ctx = makeContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(PaymentRequiredException);
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ planStatus: PlanStatus.BLOCKED }),
        }),
      );
    });

    it('invalida o cache após promoção para BLOCKED', async () => {
      const expired = new Date(Date.now() - 1000);
      mockPrisma.tenant.findUnique.mockResolvedValue({
        planStatus: PlanStatus.PAST_DUE,
        blockReason: 'erro',
        gracePeriodEndsAt: expired,
      });
      mockPrisma.tenant.update.mockResolvedValue({});

      try {
        await guard.canActivate(makeContext());
      } catch {}

      // Após invalidar o cache, a próxima chamada deve ir ao banco novamente
      mockPrisma.tenant.findUnique.mockResolvedValue({ planStatus: PlanStatus.BLOCKED, blockReason: 'erro', gracePeriodEndsAt: null });
      try {
        await guard.canActivate(makeContext());
      } catch {}

      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('tenant BLOCKED', () => {
    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        planStatus: PlanStatus.BLOCKED,
        blockReason: 'Pagamento não realizado',
        gracePeriodEndsAt: null,
      });
    });

    it('lança PaymentRequiredException com mensagem de ADMIN', async () => {
      await expect(guard.canActivate(makeContext(adminUser))).rejects.toThrow(PaymentRequiredException);
      await expect(guard.canActivate(makeContext(adminUser))).rejects.toThrow(/Atualize seu cartão/);
    });

    it('lança PaymentRequiredException com mensagem genérica para USER', async () => {
      invalidateBillingCache('tenant-1');
      await expect(guard.canActivate(makeContext(regularUser))).rejects.toThrow(/contate o administrador/);
    });
  });

  describe('tenant não encontrado no banco', () => {
    it('retorna true quando o tenant não existe', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      const result = await guard.canActivate(makeContext());
      expect(result).toBe(true);
    });
  });

  describe('cache de billing', () => {
    it('chama o Prisma apenas uma vez dentro do TTL de 15s', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        planStatus: PlanStatus.ACTIVE,
        blockReason: null,
        gracePeriodEndsAt: null,
      });

      await guard.canActivate(makeContext());
      await guard.canActivate(makeContext());

      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledTimes(1);
    });

    it('refaz a consulta ao banco após o TTL de 15s expirar', async () => {
      jest.useFakeTimers();
      mockPrisma.tenant.findUnique.mockResolvedValue({
        planStatus: PlanStatus.ACTIVE,
        blockReason: null,
        gracePeriodEndsAt: null,
      });

      await guard.canActivate(makeContext());
      jest.advanceTimersByTime(15_001);
      await guard.canActivate(makeContext());

      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleRequest()', () => {
    it('lança UnauthorizedException quando user é nulo', () => {
      expect(() => guard.handleRequest(null, null)).toThrow();
    });

    it('lança UnauthorizedException quando há erro', () => {
      expect(() => guard.handleRequest(new Error('jwt expired'), null)).toThrow();
    });

    it('retorna o user quando não há erro', () => {
      const result = guard.handleRequest(null, adminUser);
      expect(result).toBe(adminUser);
    });
  });
});
