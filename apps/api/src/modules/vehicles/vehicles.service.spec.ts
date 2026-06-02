import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './vehicles.repository';

const mockRepo = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByDateRange: jest.fn(),
  findCustomerByCnpj: jest.fn(),
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

  describe('getImportTemplate()', () => {
    it('retorna buffer xlsx com filename veiculos.xlsx', () => {
      const result = service.getImportTemplate('xlsx');
      expect(result.filename).toBe('veiculos.xlsx');
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('retorna buffer csv com filename veiculos.csv', () => {
      const result = service.getImportTemplate('csv');
      expect(result.filename).toBe('veiculos.csv');
    });
  });

  describe('exportByDateRange()', () => {
    it('chama repo.findByDateRange com tenantId e datas corretas', async () => {
      mockRepo.findByDateRange.mockResolvedValue([]);
      await service.exportByDateRange('2025-06-01', '2025-06-30', 'xlsx', currentUser);
      expect(mockRepo.findByDateRange).toHaveBeenCalledWith('tenant-1', expect.any(Date), expect.any(Date));
    });

    it('retorna buffer mesmo com lista vazia', async () => {
      mockRepo.findByDateRange.mockResolvedValue([]);
      const result = await service.exportByDateRange('2025-01-01', '2025-12-31', 'csv', currentUser);
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('importFromFile()', () => {
    const makeFile = (csv: string) => ({ buffer: Buffer.from(csv, 'utf8'), originalname: 'data.csv' });
    const customerEntity = { id: 'cust-1', name: 'Cliente A', cnpj: '12345678000199', tenantId: 'tenant-1' };

    it('importa linha válida após encontrar cliente por CNPJ', async () => {
      mockRepo.findCustomerByCnpj.mockResolvedValue(customerEntity);
      mockRepo.createMany.mockResolvedValue({ count: 1 });
      const result = await service.importFromFile(
        makeFile('Placa,Marca,Modelo,Ano,CNPJ do Cliente\nABC1D23,Toyota,Corolla,2022,12345678000199'),
        currentUser,
      );
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockRepo.createMany).toHaveBeenCalledWith(
        [expect.objectContaining({ plate: 'ABC1D23', customerId: 'cust-1' })],
        'tenant-1',
      );
    });

    it('registra erro quando cliente não é encontrado pelo CNPJ', async () => {
      mockRepo.findCustomerByCnpj.mockResolvedValue(null);
      const result = await service.importFromFile(
        makeFile('Placa,Marca,Modelo,Ano,CNPJ do Cliente\nXYZ5E67,Ford,Ka,2020,12345678000199'),
        currentUser,
      );
      expect(result.imported).toBe(0);
      expect(result.errors[0].message).toContain('não encontrado');
    });

    it('registra erro quando Placa está ausente', async () => {
      const result = await service.importFromFile(
        makeFile('Placa,Marca,Modelo,Ano,CNPJ do Cliente\n,Ford,Ka,2020,12345678000199'),
        currentUser,
      );
      expect(result.errors[0].message).toContain('Placa');
    });

    it('registra erro quando Ano é inválido', async () => {
      const result = await service.importFromFile(
        makeFile('Placa,Marca,Modelo,Ano,CNPJ do Cliente\nXYZ5E67,Ford,Ka,1800,12345678000199'),
        currentUser,
      );
      expect(result.errors[0].message).toContain('Ano');
    });
  });
});
