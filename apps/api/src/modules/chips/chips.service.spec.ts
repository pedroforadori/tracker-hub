import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { ChipsService } from './chips.service';
import { ChipsRepository } from './chips.repository';

const mockRepo = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByTrackerId: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByDateRange: jest.fn(),
  findTrackerByImei: jest.fn(),
};

const currentUser = { id: 'admin-1', email: 'admin@test.com', role: UserRole.ADMIN, tenantId: 'tenant-1' };
const chipEntity = { id: 'chip-1', iccid: '89550534000000000001', phoneNumber: '11999990001', provider: 'Vivo', trackerId: 'trk-1', tenantId: 'tenant-1' };

describe('ChipsService', () => {
  let service: ChipsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChipsService,
        { provide: ChipsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ChipsService>(ChipsService);
  });

  describe('findAll()', () => {
    it('delega ao repo.findAll com tenantId', () => {
      mockRepo.findAll.mockResolvedValue([]);
      service.findAll(currentUser);
      expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('findOne()', () => {
    it('retorna o chip quando encontrado', async () => {
      mockRepo.findOne.mockResolvedValue(chipEntity);
      const result = await service.findOne('chip-1', currentUser);
      expect(result).toEqual(chipEntity);
    });

    it('lança NotFoundException quando o chip não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('ghost', currentUser)).rejects.toThrow(NotFoundException);
    });

    it('mensagem de erro contém o id do chip', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('chip-ghost', currentUser)).rejects.toThrow('chip-ghost');
    });
  });

  describe('create()', () => {
    const dto = { iccid: '89550534000000000001', phoneNumber: '11999990001', provider: 'Vivo', trackerId: 'trk-1' };

    it('delega ao repo.create quando rastreador está disponível', async () => {
      mockRepo.findByTrackerId.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(chipEntity);
      await service.create(dto, currentUser);
      expect(mockRepo.create).toHaveBeenCalledWith(dto, 'tenant-1');
    });

    it('lança ConflictException quando rastreador já possui chip', async () => {
      mockRepo.findByTrackerId.mockResolvedValue(chipEntity);
      await expect(service.create(dto, currentUser)).rejects.toThrow(ConflictException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('chama findOne antes de atualizar', async () => {
      mockRepo.findOne.mockResolvedValue(chipEntity);
      mockRepo.update.mockResolvedValue(chipEntity);

      await service.update('chip-1', { provider: 'Claro' }, currentUser);

      expect(mockRepo.findOne).toHaveBeenCalledWith('chip-1', 'tenant-1');
      expect(mockRepo.update).toHaveBeenCalledWith('chip-1', 'tenant-1', { provider: 'Claro' });
    });

    it('propaga NotFoundException quando o chip não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('ghost', {}, currentUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('lança ConflictException ao tentar mudar para rastreador já ocupado', async () => {
      const otherChip = { ...chipEntity, id: 'chip-2' };
      mockRepo.findOne.mockResolvedValue(chipEntity);
      mockRepo.findByTrackerId.mockResolvedValue(otherChip);

      await expect(service.update('chip-1', { trackerId: 'trk-2' }, currentUser)).rejects.toThrow(ConflictException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('permite atualizar mantendo o mesmo trackerId', async () => {
      mockRepo.findOne.mockResolvedValue(chipEntity);
      mockRepo.findByTrackerId.mockResolvedValue(chipEntity); // mesmo chip
      mockRepo.update.mockResolvedValue(chipEntity);

      await service.update('chip-1', { trackerId: 'trk-1', provider: 'Tim' }, currentUser);
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('chama findOne antes de remover', async () => {
      mockRepo.findOne.mockResolvedValue(chipEntity);
      mockRepo.remove.mockResolvedValue(chipEntity);

      await service.remove('chip-1', currentUser);

      expect(mockRepo.remove).toHaveBeenCalledWith('chip-1', 'tenant-1');
    });

    it('propaga NotFoundException quando o chip não existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('ghost', currentUser)).rejects.toThrow(NotFoundException);
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('getImportTemplate()', () => {
    it('retorna buffer xlsx com filename chips.xlsx', () => {
      const result = service.getImportTemplate('xlsx');
      expect(result.filename).toBe('chips.xlsx');
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
    const trackerEntity = { id: 'trk-1', imei: '123456789012345' };

    it('importa linha válida após encontrar rastreador pelo IMEI', async () => {
      mockRepo.findTrackerByImei.mockResolvedValue(trackerEntity);
      mockRepo.findByTrackerId.mockResolvedValue(null);
      mockRepo.createMany.mockResolvedValue({ count: 1 });
      const result = await service.importFromFile(
        makeFile('ICCID,Número de Telefone,Operadora,IMEI do Rastreador\n"89550534000000000001",11999990001,Vivo,123456789012345'),
        currentUser,
      );
      expect(result.imported).toBe(1);
      expect(mockRepo.createMany).toHaveBeenCalledWith(
        [expect.objectContaining({ iccid: '89550534000000000001', trackerId: 'trk-1' })],
        'tenant-1',
      );
    });

    it('race condition P2002: fallback individual reporta conflito por linha', async () => {
      mockRepo.findTrackerByImei.mockResolvedValue(trackerEntity);
      mockRepo.findByTrackerId.mockResolvedValue(null);
      const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockRepo.createMany.mockRejectedValueOnce(p2002);
      mockRepo.create.mockRejectedValueOnce(Object.assign(new Error('conflict'), { code: 'P2002' }));
      const result = await service.importFromFile(
        makeFile('ICCID,Número de Telefone,Operadora,IMEI do Rastreador\n"89550534000000000001",11999990001,Vivo,123456789012345'),
        currentUser,
      );
      expect(result.imported).toBe(0);
      expect(result.errors[0].message).toContain('conflito');
    });

    it('registra erro quando rastreador não é encontrado pelo IMEI', async () => {
      mockRepo.findTrackerByImei.mockResolvedValue(null);
      const result = await service.importFromFile(
        makeFile('ICCID,Número de Telefone,Operadora,IMEI do Rastreador\n"89550534000000000001",11999990001,Vivo,123456789012345'),
        currentUser,
      );
      expect(result.imported).toBe(0);
      expect(result.errors[0].message).toContain('não encontrado');
    });

    it('registra erro quando rastreador já possui chip vinculado', async () => {
      mockRepo.findTrackerByImei.mockResolvedValue(trackerEntity);
      mockRepo.findByTrackerId.mockResolvedValue(chipEntity);
      const result = await service.importFromFile(
        makeFile('ICCID,Número de Telefone,Operadora,IMEI do Rastreador\n"89550534000000000001",11999990001,Vivo,123456789012345'),
        currentUser,
      );
      expect(result.imported).toBe(0);
      expect(result.errors[0].message).toContain('já possui chip');
    });

    it('registra erro quando ICCID está ausente', async () => {
      const result = await service.importFromFile(
        makeFile('ICCID,Número de Telefone,Operadora,IMEI do Rastreador\n,11999990001,Vivo,123456789012345'),
        currentUser,
      );
      expect(result.errors[0].message).toContain('ICCID');
    });
  });
});
