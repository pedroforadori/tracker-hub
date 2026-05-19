import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as passwordUtil from '../../common/utils/password.util';
import { UsersRepository } from './users.repository';

jest.mock('../../common/utils/password.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('bcrypt-hashed'),
}));

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const tenantId = 'tenant-1';
const userId = 'user-1';

describe('UsersRepository', () => {
  let repo: UsersRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repo = module.get<UsersRepository>(UsersRepository);
  });

  describe('findAll()', () => {
    it('consulta com filtro de tenantId', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repo.findAll(tenantId);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId } }),
      );
    });

    it('não inclui a senha no select', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repo.findAll(tenantId);
      const call = mockPrisma.user.findMany.mock.calls[0][0];
      expect(call.select?.password).toBeUndefined();
    });
  });

  describe('findOne()', () => {
    it('consulta com id E tenantId (previne acesso entre tenants)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await repo.findOne(userId, tenantId);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: userId, tenantId } }),
      );
    });
  });

  describe('countByRole()', () => {
    it('passa tenantId e role para prisma.user.count', async () => {
      mockPrisma.user.count.mockResolvedValue(2);
      await repo.countByRole(tenantId, UserRole.USER);
      expect(mockPrisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId, role: UserRole.USER } }),
      );
    });
  });

  describe('create()', () => {
    const dto = { name: 'Maria', email: 'maria@test.com', password: 'Pass123' };

    it('hasheia a senha antes de armazenar', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: userId, ...dto, role: UserRole.USER, tenantId });
      await repo.create(dto, tenantId);
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('Pass123');
    });

    it('define o role como USER independente do DTO', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: userId, ...dto, role: UserRole.USER, tenantId });
      await repo.create(dto, tenantId);
      const call = mockPrisma.user.create.mock.calls[0][0];
      expect(call.data.role).toBe(UserRole.USER);
    });

    it('não inclui a senha no select de retorno', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: userId, name: 'Maria', email: 'maria@test.com', role: UserRole.USER, tenantId, createdAt: new Date() });
      await repo.create(dto, tenantId);
      const call = mockPrisma.user.create.mock.calls[0][0];
      expect(call.select?.password).toBeUndefined();
    });

    it('armazena a senha hasheada e não o texto puro', async () => {
      mockPrisma.user.create.mockResolvedValue({});
      await repo.create(dto, tenantId);
      const call = mockPrisma.user.create.mock.calls[0][0];
      expect(call.data.password).toBe('bcrypt-hashed');
      expect(call.data.password).not.toBe('Pass123');
    });
  });

  describe('update()', () => {
    it('hasheia a senha quando dto.password está presente', async () => {
      mockPrisma.user.update.mockResolvedValue({});
      await repo.update(userId, tenantId, { password: 'NovaPass1' });
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith('NovaPass1');
    });

    it('não inclui o campo password quando dto.password está ausente', async () => {
      mockPrisma.user.update.mockResolvedValue({});
      await repo.update(userId, tenantId, { name: 'Novo Nome' });
      const call = mockPrisma.user.update.mock.calls[0][0];
      expect(call.data.password).toBeUndefined();
      expect(passwordUtil.hashPassword).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('deleta com id E tenantId (previne deleção entre tenants)', async () => {
      mockPrisma.user.delete.mockResolvedValue({});
      await repo.remove(userId, tenantId);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: userId, tenantId } }),
      );
    });
  });
});
