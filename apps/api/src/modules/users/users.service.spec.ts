import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { MAX_SECONDARY_USERS } from '../../common/constants/business.constants';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

const mockRepo = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  countByRole: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const adminUser = { id: 'admin-1', email: 'admin@test.com', role: UserRole.ADMIN, tenantId: 'tenant-1' };
const userEntity = { id: 'user-1', name: 'João', email: 'joao@test.com', role: UserRole.USER, tenantId: 'tenant-1', createdAt: new Date() };

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll()', () => {
    it('delega ao repo.findAll com o tenantId correto', () => {
      mockRepo.findAll.mockResolvedValue([userEntity]);
      service.findAll(adminUser);
      expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('findOne()', () => {
    it('retorna o usuário quando encontrado', async () => {
      mockRepo.findOne.mockResolvedValue(userEntity);
      const result = await service.findOne('user-1', adminUser);
      expect(result).toEqual(userEntity);
    });

    it('lança NotFoundException quando o usuário não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost-id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('a mensagem de erro contém o id do usuário', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost-id', adminUser)).rejects.toThrow('ghost-id');
    });
  });

  describe('create()', () => {
    const dto = { name: 'Maria', email: 'maria@test.com', password: 'Pass123' };

    it('cria o usuário quando count < MAX_SECONDARY_USERS', async () => {
      mockRepo.countByRole.mockResolvedValue(MAX_SECONDARY_USERS - 1);
      mockRepo.create.mockResolvedValue(userEntity);

      const result = await service.create(dto, adminUser);

      expect(mockRepo.create).toHaveBeenCalledWith(dto, 'tenant-1');
      expect(result).toEqual(userEntity);
    });

    it('lança ForbiddenException quando count === MAX_SECONDARY_USERS', async () => {
      mockRepo.countByRole.mockResolvedValue(MAX_SECONDARY_USERS);
      await expect(service.create(dto, adminUser)).rejects.toThrow(ForbiddenException);
    });

    it('lança ForbiddenException quando count > MAX_SECONDARY_USERS (defensivo)', async () => {
      mockRepo.countByRole.mockResolvedValue(MAX_SECONDARY_USERS + 1);
      await expect(service.create(dto, adminUser)).rejects.toThrow(ForbiddenException);
    });

    it('conta apenas usuários com role USER', async () => {
      mockRepo.countByRole.mockResolvedValue(0);
      mockRepo.create.mockResolvedValue(userEntity);

      await service.create(dto, adminUser);

      expect(mockRepo.countByRole).toHaveBeenCalledWith('tenant-1', UserRole.USER);
    });
  });

  describe('update()', () => {
    const dto = { name: 'João Atualizado' };

    it('chama findOne antes de atualizar e retorna o usuário atualizado', async () => {
      mockRepo.findOne.mockResolvedValue(userEntity);
      mockRepo.update.mockResolvedValue({ ...userEntity, name: 'João Atualizado' });

      const result = await service.update('user-1', dto, adminUser);

      expect(mockRepo.findOne).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(mockRepo.update).toHaveBeenCalledWith('user-1', 'tenant-1', dto);
      expect(result.name).toBe('João Atualizado');
    });

    it('propaga NotFoundException do findOne quando o usuário não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('ghost-id', dto, adminUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('chama findOne antes de remover', async () => {
      mockRepo.findOne.mockResolvedValue(userEntity);
      mockRepo.remove.mockResolvedValue(userEntity);

      await service.remove('user-1', adminUser);

      expect(mockRepo.findOne).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(mockRepo.remove).toHaveBeenCalledWith('user-1', 'tenant-1');
    });

    it('propaga NotFoundException do findOne quando o usuário não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('ghost-id', adminUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });
  });
});
