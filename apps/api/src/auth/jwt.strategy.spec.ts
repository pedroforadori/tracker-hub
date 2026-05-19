import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

const mockConfig = {
  get: jest.fn().mockReturnValue('test-jwt-secret'),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate()', () => {
    const payload = {
      sub: 'user-id-123',
      email: 'admin@test.com',
      role: 'ADMIN',
      tenantId: 'tenant-1',
    };

    it('mapeia payload.sub para a propriedade id', () => {
      const result = strategy.validate(payload);
      expect(result.id).toBe('user-id-123');
    });

    it('retorna o shape correto { id, email, role, tenantId }', () => {
      const result = strategy.validate(payload);
      expect(result).toEqual({
        id: 'user-id-123',
        email: 'admin@test.com',
        role: 'ADMIN',
        tenantId: 'tenant-1',
      });
    });
  });
});
