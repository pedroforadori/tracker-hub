import { ConflictException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

const tokenResponse = {
  accessToken: 'jwt-token',
  user: { id: 'u1', email: 'admin@test.com', role: 'ADMIN', tenantId: 't1' },
};

describe('AuthController (integration)', () => {
  let app: import('@nestjs/common').INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: APP_GUARD, useValue: { canActivate: () => true } },
        { provide: APP_GUARD, useValue: { canActivate: () => true } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(() => app.close());

  describe('POST /auth/register', () => {
    const validDto = {
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Senha123',
      tenantName: 'Acme',
    };

    it('201 retorna accessToken quando DTO é válido', async () => {
      mockAuthService.register.mockResolvedValue(tokenResponse);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validDto)
        .expect(201);

      expect(res.body.accessToken).toBe('jwt-token');
    });

    it('400 quando name tem menos de 2 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validDto, name: 'A' })
        .expect(400);
    });

    it('400 quando email é inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validDto, email: 'not-an-email' })
        .expect(400);
    });

    it('400 quando password tem menos de 8 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validDto, password: 'ab1' })
        .expect(400);
    });

    it('400 quando password não contém número', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validDto, password: 'SemNumero' })
        .expect(400);
    });

    it('400 quando password não contém letra', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validDto, password: '12345678' })
        .expect(400);
    });

    it('400 quando tenantName tem menos de 2 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validDto, tenantName: 'A' })
        .expect(400);
    });

    it('409 quando o serviço lança ConflictException', async () => {
      mockAuthService.register.mockRejectedValue(new ConflictException('E-mail já cadastrado'));

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validDto)
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    const validDto = { email: 'admin@test.com', password: 'Senha123' };

    it('201 retorna accessToken com credenciais válidas', async () => {
      mockAuthService.login.mockResolvedValue(tokenResponse);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validDto)
        .expect(201);

      expect(res.body.accessToken).toBe('jwt-token');
    });

    it('400 quando email é inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...validDto, email: 'invalido' })
        .expect(400);
    });

    it('400 quando password está ausente', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com' })
        .expect(400);
    });

    it('401 quando o serviço lança UnauthorizedException', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Credenciais inválidas'));

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(validDto)
        .expect(401);
    });
  });
});
