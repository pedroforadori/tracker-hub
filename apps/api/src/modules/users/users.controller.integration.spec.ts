import { ExecutionContext, ForbiddenException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { RolesGuard } from '../../auth/roles.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const adminUser = { id: 'admin-1', email: 'admin@test.com', role: UserRole.ADMIN, tenantId: 'tenant-1' };
const regularUser = { id: 'user-1', email: 'user@test.com', role: UserRole.USER, tenantId: 'tenant-1' };

const userEntity = { id: '00000000-0000-0000-0000-000000000002', name: 'Maria', email: 'maria@test.com', role: UserRole.USER, tenantId: 'tenant-1', createdAt: new Date().toISOString() };

function makeAuthGuard(user: typeof adminUser) {
  return {
    canActivate: (ctx: ExecutionContext) => {
      ctx.switchToHttp().getRequest().user = user;
      return true;
    },
  };
}

async function buildApp(user: typeof adminUser) {
  jest.clearAllMocks();

  const module: TestingModule = await Test.createTestingModule({
    controllers: [UsersController],
    providers: [
      { provide: UsersService, useValue: mockUsersService },
      Reflector,
      RolesGuard,
      // APP_GUARD intercepts every request and sets req.user before RolesGuard runs
      { provide: APP_GUARD, useValue: makeAuthGuard(user) },
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

describe('UsersController (integration)', () => {
  describe('como ADMIN', () => {
    let app: import('@nestjs/common').INestApplication;

    beforeEach(async () => { app = await buildApp(adminUser); });
    afterEach(() => app.close());

    describe('GET /users', () => {
      it('200 retorna lista de usuários', async () => {
        mockUsersService.findAll.mockResolvedValue([userEntity]);
        const res = await request(app.getHttpServer()).get('/users').expect(200);
        expect(res.body).toHaveLength(1);
      });
    });

    describe('POST /users', () => {
      const validDto = { name: 'Maria', email: 'maria@test.com', password: 'senha123' };

      it('201 cria o usuário com DTO válido', async () => {
        mockUsersService.create.mockResolvedValue(userEntity);
        const res = await request(app.getHttpServer()).post('/users').send(validDto).expect(201);
        expect(res.body.email).toBe('maria@test.com');
      });

      it('400 quando name está ausente', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({ email: 'maria@test.com', password: 'senha123' })
          .expect(400);
      });

      it('400 quando email é inválido', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({ ...validDto, email: 'invalido' })
          .expect(400);
      });

      it('400 quando password tem menos de 6 caracteres', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({ ...validDto, password: '123' })
          .expect(400);
      });

      it('403 quando o serviço lança ForbiddenException (limite atingido)', async () => {
        mockUsersService.create.mockRejectedValue(new ForbiddenException('Limite atingido'));
        await request(app.getHttpServer()).post('/users').send(validDto).expect(403);
      });
    });

    describe('PATCH /users/:id', () => {
      it('200 atualiza o usuário', async () => {
        mockUsersService.update.mockResolvedValue({ ...userEntity, name: 'Novo Nome' });
        const res = await request(app.getHttpServer())
          .patch(`/users/${userEntity.id}`)
          .send({ name: 'Novo Nome' })
          .expect(200);
        expect(res.body.name).toBe('Novo Nome');
      });

      it('404 quando o usuário não é encontrado', async () => {
        mockUsersService.update.mockRejectedValue(new NotFoundException('Usuário não encontrado'));
        await request(app.getHttpServer())
          .patch(`/users/${userEntity.id}`)
          .send({ name: 'Novo' })
          .expect(404);
      });

    });

    describe('DELETE /users/:id', () => {
      it('200 remove o usuário', async () => {
        mockUsersService.remove.mockResolvedValue(userEntity);
        await request(app.getHttpServer()).delete(`/users/${userEntity.id}`).expect(200);
      });

      it('404 quando o usuário não é encontrado', async () => {
        mockUsersService.remove.mockRejectedValue(new NotFoundException('Usuário não encontrado'));
        await request(app.getHttpServer()).delete(`/users/${userEntity.id}`).expect(404);
      });
    });
  });

  describe('como USER (role insuficiente)', () => {
    let app: import('@nestjs/common').INestApplication;

    beforeEach(async () => { app = await buildApp(regularUser); });
    afterEach(() => app.close());

    it('GET /users → 403', async () => {
      await request(app.getHttpServer()).get('/users').expect(403);
    });

    it('POST /users → 403', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'X', email: 'x@test.com', password: 'senha123' })
        .expect(403);
    });

    it('PATCH /users/:id → 403', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userEntity.id}`)
        .send({ name: 'X' })
        .expect(403);
    });

    it('DELETE /users/:id → 403', async () => {
      await request(app.getHttpServer()).delete(`/users/${userEntity.id}`).expect(403);
    });
  });
});
