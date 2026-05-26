import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';

const mockRepo = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const currentUser = { id: 'admin-1', email: 'admin@test.com', role: UserRole.ADMIN, tenantId: 'tenant-1' };
const customerEntity = { id: 'cust-1', name: 'Acme LTDA', cnpj: '12345678000199', email: 'acme@test.com', phone: '11999999999', tenantId: 'tenant-1', vehicles: [] };

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: CustomersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('findAll()', () => {
    it('delega ao repo.findAll com o tenantId correto', () => {
      mockRepo.findAll.mockResolvedValue([customerEntity]);
      service.findAll(currentUser);
      expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('findOne()', () => {
    it('retorna o cliente quando encontrado', async () => {
      mockRepo.findOne.mockResolvedValue(customerEntity);
      const result = await service.findOne('cust-1', currentUser);
      expect(result).toEqual(customerEntity);
    });

    it('lança NotFoundException quando o cliente não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost', currentUser)).rejects.toThrow(NotFoundException);
    });

    it('a mensagem de erro contém o id do cliente', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost-id', currentUser)).rejects.toThrow('ghost-id');
    });
  });

  describe('create()', () => {
    const dto = { name: 'Nova Empresa', cnpj: '12345678000199', email: 'nova@test.com', phone: '11988888888' };

    it('delega ao repo.create com dto e tenantId', async () => {
      mockRepo.create.mockResolvedValue(customerEntity);
      await service.create(dto, currentUser);
      expect(mockRepo.create).toHaveBeenCalledWith(dto, 'tenant-1');
    });
  });

  describe('update()', () => {
    it('chama findOne antes de atualizar', async () => {
      mockRepo.findOne.mockResolvedValue(customerEntity);
      mockRepo.update.mockResolvedValue(customerEntity);

      await service.update('cust-1', { name: 'Novo Nome' }, currentUser);

      expect(mockRepo.findOne).toHaveBeenCalledWith('cust-1', 'tenant-1');
      expect(mockRepo.update).toHaveBeenCalledWith('cust-1', 'tenant-1', { name: 'Novo Nome' });
    });

    it('propaga NotFoundException quando o cliente não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('ghost', {}, currentUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('chama findOne antes de remover', async () => {
      mockRepo.findOne.mockResolvedValue(customerEntity);
      mockRepo.remove.mockResolvedValue(customerEntity);

      await service.remove('cust-1', currentUser);

      expect(mockRepo.findOne).toHaveBeenCalledWith('cust-1', 'tenant-1');
      expect(mockRepo.remove).toHaveBeenCalledWith('cust-1', 'tenant-1');
    });

    it('propaga NotFoundException quando o cliente não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('ghost', currentUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });
  });
});
