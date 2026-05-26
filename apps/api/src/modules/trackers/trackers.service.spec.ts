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
});
