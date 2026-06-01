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
  findByDateRange: jest.fn(),
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

  describe('getImportTemplate()', () => {
    it('retorna buffer xlsx com filename clientes.xlsx', () => {
      const result = service.getImportTemplate('xlsx');
      expect(result.filename).toBe('clientes.xlsx');
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.mimeType).toContain('spreadsheetml');
    });

    it('retorna buffer csv com filename clientes.csv', () => {
      const result = service.getImportTemplate('csv');
      expect(result.filename).toBe('clientes.csv');
      expect(result.mimeType).toContain('text/csv');
    });
  });

  describe('exportByDateRange()', () => {
    it('chama repo.findByDateRange com datas corretas incluindo fim do dia', async () => {
      mockRepo.findByDateRange.mockResolvedValue([]);
      await service.exportByDateRange('2025-01-01', '2025-01-31', 'xlsx', currentUser);
      const [tenantId, fromDate, toDate] = mockRepo.findByDateRange.mock.calls[0];
      expect(tenantId).toBe('tenant-1');
      expect(fromDate).toEqual(new Date('2025-01-01'));
      expect(toDate.getHours()).toBe(23);
      expect(toDate.getMinutes()).toBe(59);
    });

    it('retorna buffer não vazio mesmo com lista vazia', async () => {
      mockRepo.findByDateRange.mockResolvedValue([]);
      const result = await service.exportByDateRange('2025-01-01', '2025-01-31', 'xlsx', currentUser);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('mapeia os campos do cliente para as colunas corretas', async () => {
      mockRepo.findByDateRange.mockResolvedValue([{
        ...customerEntity, monthlyFee: 299.9, status: 'ATIVO', createdAt: new Date('2025-01-01'),
      }]);
      const result = await service.exportByDateRange('2025-01-01', '2025-01-31', 'csv', currentUser);
      const csv = result.buffer.toString('utf8');
      expect(csv).toContain('Acme LTDA');
    });
  });

  describe('importFromFile()', () => {
    const makeFile = (csv: string, name = 'data.csv') => ({
      buffer: Buffer.from(csv, 'utf8'),
      originalname: name,
    });

    it('importa linha válida e retorna {imported:1, errors:[]}', async () => {
      mockRepo.create.mockResolvedValue(customerEntity);
      const result = await service.importFromFile(
        makeFile('Nome,CNPJ,Email,Telefone,Mensalidade,Status\nEmpresa A,12345678000199,a@test.com,11999999999,200,ATIVO'),
        currentUser,
      );
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('registra erro quando Nome está vazio', async () => {
      const result = await service.importFromFile(
        makeFile('Nome,CNPJ,Email,Telefone,Mensalidade,Status\n,12345678000199,a@test.com,11999999999,0,ATIVO'),
        currentUser,
      );
      expect(result.imported).toBe(0);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].message).toContain('Nome');
    });

    it('registra erro quando CNPJ não tem 14 dígitos', async () => {
      const result = await service.importFromFile(
        makeFile('Nome,CNPJ,Email,Telefone,Mensalidade,Status\nEmpresa,12345,a@test.com,11999999999,0,ATIVO'),
        currentUser,
      );
      expect(result.errors[0].message).toContain('CNPJ');
    });

    it('registra erro quando Status é inválido', async () => {
      const result = await service.importFromFile(
        makeFile('Nome,CNPJ,Email,Telefone,Mensalidade,Status\nEmpresa,12345678000199,a@test.com,11999999999,0,PENDENTE'),
        currentUser,
      );
      expect(result.errors[0].message).toContain('Status');
    });

    it('erro no repo não interrompe as demais linhas', async () => {
      mockRepo.create
        .mockRejectedValueOnce(new Error('CNPJ duplicado'))
        .mockResolvedValueOnce(customerEntity);
      const csv = 'Nome,CNPJ,Email,Telefone,Mensalidade,Status\nEmpresa A,12345678000199,a@test.com,11999999999,0,ATIVO\nEmpresa B,98765432000100,b@test.com,11988888888,0,ATIVO';
      const result = await service.importFromFile(makeFile(csv), currentUser);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});
