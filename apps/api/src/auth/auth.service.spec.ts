import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { BillingService } from '../modules/billing/billing.service';
import { MailService } from '../modules/mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import * as passwordUtil from '../common/utils/password.util';

jest.mock('../common/utils/password.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { compare: jest.Mock };

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('signed-token'),
};

const mockBilling = {
  createCustomerAndSubscription: jest.fn().mockResolvedValue(undefined),
};

const mockMail = {
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('http://localhost:5173'),
};

const adminUser = {
  id: 'user-1',
  email: 'admin@test.com',
  name: 'Admin',
  role: UserRole.ADMIN,
  tenantId: 'tenant-1',
  password: 'hashed-password',
  passwordResetToken: null,
  passwordResetExpiry: null,
};

const userWithResetToken = {
  ...adminUser,
  passwordResetToken: 'hashed-token',
  passwordResetExpiry: new Date(Date.now() + 30 * 60 * 1000),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: BillingService, useValue: mockBilling },
        { provide: MailService, useValue: mockMail },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('register()', () => {
    const dto = { name: 'Admin', email: 'admin@test.com', password: 'Password1', tenantName: 'Acme' };

    it('retorna accessToken e user quando o registro é bem-sucedido', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<typeof adminUser>) => {
        const tx = {
          tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
          user: { create: jest.fn().mockResolvedValue(adminUser) },
        };
        return fn(tx as unknown as typeof mockPrisma);
      });

      const result = await service.register(dto);

      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: 'user-1', email: 'admin@test.com', name: 'Admin', role: UserRole.ADMIN, tenantId: 'tenant-1' },
      });
    });

    it('lança ConflictException quando o e-mail já está cadastrado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('hasheia a senha antes de criar o usuário', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<typeof adminUser>) => {
        const tx = {
          tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
          user: { create: jest.fn().mockResolvedValue(adminUser) },
        };
        return fn(tx as unknown as typeof mockPrisma);
      });

      await service.register(dto);

      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('Password1');
    });

    it('retorna token mesmo se a criação do Stripe falhar', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<typeof adminUser>) => {
        const tx = {
          tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
          user: { create: jest.fn().mockResolvedValue(adminUser) },
        };
        return fn(tx as unknown as typeof mockPrisma);
      });
      mockBilling.createCustomerAndSubscription.mockRejectedValue(new Error('Stripe error'));

      const result = await service.register(dto);

      expect(result.accessToken).toBe('signed-token');
    });

    it('faz retry do Stripe após 10s em caso de falha', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<typeof adminUser>) => {
        const tx = {
          tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
          user: { create: jest.fn().mockResolvedValue(adminUser) },
        };
        return fn(tx as unknown as typeof mockPrisma);
      });
      mockBilling.createCustomerAndSubscription
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce(undefined);

      await service.register(dto);

      expect(mockBilling.createCustomerAndSubscription).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(10_001);
      await Promise.resolve();

      expect(mockBilling.createCustomerAndSubscription).toHaveBeenCalledTimes(2);
    });

    it('o payload do JWT contém sub, email, role e tenantId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<typeof adminUser>) => {
        const tx = {
          tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1' }) },
          user: { create: jest.fn().mockResolvedValue(adminUser) },
        };
        return fn(tx as unknown as typeof mockPrisma);
      });

      await service.register(dto);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', email: 'admin@test.com', role: UserRole.ADMIN, tenantId: 'tenant-1' }),
      );
    });
  });

  describe('login()', () => {
    const dto = { email: 'admin@test.com', password: 'Password1' };

    it('retorna accessToken e user com credenciais corretas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: 'user-1', email: 'admin@test.com', name: 'Admin', role: UserRole.ADMIN, tenantId: 'tenant-1' },
      });
    });

    it('lança UnauthorizedException quando o usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando a senha está errada', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword()', () => {
    it('retorna { ok: true } e envia e-mail quando o e-mail existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockPrisma.user.update.mockResolvedValue(adminUser);

      const result = await service.forgotPassword({ email: adminUser.email });

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: adminUser.id } }),
      );
      expect(mockMail.sendPasswordReset).toHaveBeenCalledWith(
        adminUser.email,
        expect.stringContaining('/redefinir-senha?token='),
      );
    });

    it('retorna { ok: true } silenciosamente quando o e-mail não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'naoexiste@test.com' });

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockMail.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword()', () => {
    it('redefine a senha e limpa o token quando o token é válido', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithResetToken);
      mockPrisma.user.update.mockResolvedValue(adminUser);

      const result = await service.resetPassword({ token: 'raw-token', password: 'NewPass1' });

      expect(result).toEqual({ ok: true });
      const updateArg = mockPrisma.user.update.mock.calls[0][0] as {
        where: { id: string };
        data: Record<string, unknown>;
      };
      expect(updateArg.where).toEqual({ id: adminUser.id });
      expect(updateArg.data.passwordResetToken).toBeNull();
      expect(updateArg.data.passwordResetExpiry).toBeNull();
    });

    it('lança BadRequestException quando o token é inválido (usuário não encontrado)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid', password: 'NewPass1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando o token está expirado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...userWithResetToken,
        passwordResetExpiry: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({ token: 'expired-token', password: 'NewPass1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
