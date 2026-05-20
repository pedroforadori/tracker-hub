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
  update: jest.fn(),
  remove: jest.fn(),
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
});
