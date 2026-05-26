import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './vehicles.repository';

const mockRepo = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const currentUser = { id: 'admin-1', email: 'admin@test.com', role: UserRole.ADMIN, tenantId: 'tenant-1' };
const vehicleEntity = { id: 'veh-1', plate: 'ABC1D23', brand: 'Toyota', model: 'Corolla', year: 2022, customerId: 'cust-1', tenantId: 'tenant-1', trackers: [] };

describe('VehiclesService', () => {
  let service: VehiclesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: VehiclesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('findAll()', () => {
    it('delega ao repo.findAll com tenantId', () => {
      mockRepo.findAll.mockResolvedValue([]);
      service.findAll(currentUser);
      expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('findOne()', () => {
    it('retorna o veículo quando encontrado', async () => {
      mockRepo.findOne.mockResolvedValue(vehicleEntity);
      const result = await service.findOne('veh-1', currentUser);
      expect(result).toEqual(vehicleEntity);
    });

    it('lança NotFoundException quando o veículo não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost', currentUser)).rejects.toThrow(NotFoundException);
    });

    it('mensagem de erro contém o id do veículo', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('veh-ghost', currentUser)).rejects.toThrow('veh-ghost');
    });
  });

  describe('create()', () => {
    it('delega ao repo.create com dto e tenantId', async () => {
      mockRepo.create.mockResolvedValue(vehicleEntity);
      const dto = { plate: 'XYZ9A87', brand: 'Ford', model: 'Ka', year: 2020, customerId: 'cust-1' };
      await service.create(dto, currentUser);
      expect(mockRepo.create).toHaveBeenCalledWith(dto, 'tenant-1');
    });
  });

  describe('update()', () => {
    it('chama findOne antes de atualizar', async () => {
      mockRepo.findOne.mockResolvedValue(vehicleEntity);
      mockRepo.update.mockResolvedValue(vehicleEntity);

      await service.update('veh-1', { brand: 'Honda' }, currentUser);

      expect(mockRepo.findOne).toHaveBeenCalledWith('veh-1', 'tenant-1');
      expect(mockRepo.update).toHaveBeenCalledWith('veh-1', 'tenant-1', { brand: 'Honda' });
    });

    it('propaga NotFoundException quando o veículo não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('ghost', {}, currentUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('chama findOne antes de remover', async () => {
      mockRepo.findOne.mockResolvedValue(vehicleEntity);
      mockRepo.remove.mockResolvedValue(vehicleEntity);

      await service.remove('veh-1', currentUser);

      expect(mockRepo.remove).toHaveBeenCalledWith('veh-1', 'tenant-1');
    });

    it('propaga NotFoundException quando o veículo não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('ghost', currentUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });
  });
});
