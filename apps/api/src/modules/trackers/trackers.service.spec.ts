import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { TrackersService } from './trackers.service';
import { TrackersRepository } from './trackers.repository';

const mockRepo = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByDateRange: jest.fn(),
  findVehicleByPlate: jest.fn(),
};

const currentUser = { id: 'admin-1', email: 'admin@test.com', role: UserRole.ADMIN, tenantId: 'tenant-1' };
const trackerEntity = { id: 'trk-1', imei: '123456789012345', model: 'GT06N', brand: 'Concox', vehicleId: 'veh-1', tenantId: 'tenant-1', chip: null };

describe('TrackersService', () => {
  let service: TrackersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackersService,
        { provide: TrackersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<TrackersService>(TrackersService);
  });

  describe('findAll()', () => {
    it('delega ao repo.findAll com tenantId', () => {
      mockRepo.findAll.mockResolvedValue([]);
      service.findAll(currentUser);
      expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('findOne()', () => {
    it('retorna o rastreador quando encontrado', async () => {
      mockRepo.findOne.mockResolvedValue(trackerEntity);
      const result = await service.findOne('trk-1', currentUser);
      expect(result).toEqual(trackerEntity);
    });

    it('lança NotFoundException quando o rastreador não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost', currentUser)).rejects.toThrow(NotFoundException);
    });

    it('mensagem de erro contém o id do rastreador', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('trk-ghost', currentUser)).rejects.toThrow('trk-ghost');
    });
  });

  describe('create()', () => {
    it('delega ao repo.create com dto e tenantId', async () => {
      mockRepo.create.mockResolvedValue(trackerEntity);
      const dto = { imei: '123456789012345', model: 'GT06N', brand: 'Concox', vehicleId: 'veh-1' };
      await service.create(dto, currentUser);
      expect(mockRepo.create).toHaveBeenCalledWith(dto, 'tenant-1');
    });
  });

  describe('update()', () => {
    it('chama findOne antes de atualizar', async () => {
      mockRepo.findOne.mockResolvedValue(trackerEntity);
      mockRepo.update.mockResolvedValue(trackerEntity);

      await service.update('trk-1', { model: 'TK103' }, currentUser);

      expect(mockRepo.findOne).toHaveBeenCalledWith('trk-1', 'tenant-1');
      expect(mockRepo.update).toHaveBeenCalledWith('trk-1', 'tenant-1', { model: 'TK103' });
    });

    it('propaga NotFoundException quando o rastreador não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('ghost', {}, currentUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('chama findOne antes de remover', async () => {
      mockRepo.findOne.mockResolvedValue(trackerEntity);
      mockRepo.remove.mockResolvedValue(trackerEntity);

      await service.remove('trk-1', currentUser);

      expect(mockRepo.remove).toHaveBeenCalledWith('trk-1', 'tenant-1');
    });

    it('propaga NotFoundException quando o rastreador não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('ghost', currentUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('getImportTemplate()', () => {
    it('retorna buffer xlsx com filename rastreadores.xlsx', () => {
      const result = service.getImportTemplate('xlsx');
      expect(result.filename).toBe('rastreadores.xlsx');
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('exportByDateRange()', () => {
    it('chama repo.findByDateRange com tenantId correto', async () => {
      mockRepo.findByDateRange.mockResolvedValue([]);
      await service.exportByDateRange('2025-01-01', '2025-12-31', 'xlsx', currentUser);
      expect(mockRepo.findByDateRange).toHaveBeenCalledWith('tenant-1', expect.any(Date), expect.any(Date));
    });
  });

  describe('importFromFile()', () => {
    const makeFile = (csv: string) => ({ buffer: Buffer.from(csv, 'utf8'), originalname: 'data.csv' });
    const vehicleEntity = { id: 'veh-1', plate: 'ABC1D23' };

    it('importa linha válida após encontrar veículo pela placa', async () => {
      mockRepo.findVehicleByPlate.mockResolvedValue(vehicleEntity);
      mockRepo.create.mockResolvedValue(trackerEntity);
      const result = await service.importFromFile(
        makeFile('IMEI,Marca,Modelo,Placa do Veículo\n123456789012345,Concox,GT06N,ABC1D23'),
        currentUser,
      );
      expect(result.imported).toBe(1);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ imei: '123456789012345', vehicleId: 'veh-1' }), 'tenant-1');
    });

    it('registra erro quando veículo não é encontrado pela placa', async () => {
      mockRepo.findVehicleByPlate.mockResolvedValue(null);
      const result = await service.importFromFile(
        makeFile('IMEI,Marca,Modelo,Placa do Veículo\n123456789012345,Concox,GT06N,XYZ1234'),
        currentUser,
      );
      expect(result.imported).toBe(0);
      expect(result.errors[0].message).toContain('não encontrado');
    });

    it('registra erro quando IMEI não tem 15 dígitos', async () => {
      const result = await service.importFromFile(
        makeFile('IMEI,Marca,Modelo,Placa do Veículo\n12345,Concox,GT06N,ABC1D23'),
        currentUser,
      );
      expect(result.errors[0].message).toContain('IMEI');
    });
  });
});
