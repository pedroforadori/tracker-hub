import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import * as request from 'supertest';
import { hashPassword } from '../src/common/utils/password.util';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupTenant, loginAs, seedTenant } from './helpers/seed';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let adminToken: string;
  let userToken: string;
  let seeded: Awaited<ReturnType<typeof seedTenant>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await cleanupTenant(prisma, tenantId).catch(() => {});
    await app.close();
  });

  beforeEach(async () => {
    seeded = await seedTenant(prisma);
    tenantId = seeded.tenantId;
    adminToken = await loginAs(app, seeded.adminEmail, seeded.adminPassword);

    // Cria um usuário USER para testar acesso com role insuficiente
    const userPass = await hashPassword('Senha123');
    const uid = Date.now();
    const userRecord = await prisma.user.create({
      data: { name: 'Regular User', email: `user-${uid}@test.com`, password: userPass, role: UserRole.USER, tenantId },
    });
    userToken = await loginAs(app, userRecord.email, 'Senha123');
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { tenantId, role: UserRole.USER } });
  });

  describe('GET /users', () => {
    it('200 retorna lista de usuários do tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('403 quando autenticado como USER', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /users', () => {
    const makeDto = (suffix: string) => ({
      name: `Novo User ${suffix}`,
      email: `novo-${suffix}@test.com`,
      password: 'senha123',
    });

    it('201 cria o primeiro usuário (count=0)', async () => {
      const uid = `${Date.now()}a`;
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(makeDto(uid))
        .expect(201);
    });

    it('403 ao tentar criar o quarto usuário (MAX=3)', async () => {
      for (let i = 0; i < 3; i++) {
        const uid = `${Date.now()}${i}`;
        await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(makeDto(uid))
          .expect(201);
      }

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(makeDto(`${Date.now()}x`))
        .expect(403);
    });

    it('400 quando e-mail é inválido', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X', email: 'invalido', password: 'senha123' })
        .expect(400);
    });

    it('403 quando autenticado como USER', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(makeDto('blocked'))
        .expect(403);
    });
  });

  describe('PATCH /users/:id', () => {
    it('200 atualiza nome do usuário', async () => {
      const uid = Date.now();
      const created = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Original', email: `orig-${uid}@test.com`, password: 'senha123' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/users/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Atualizado' })
        .expect(200);

      expect(res.body.name).toBe('Atualizado');
    });

    it('404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .patch(`/users/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })
        .expect(404);
    });

    it('403 quando autenticado como USER', async () => {
      await request(app.getHttpServer())
        .patch(`/users/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'X' })
        .expect(403);
    });
  });

  describe('DELETE /users/:id', () => {
    it('200 remove o usuário', async () => {
      const uid = Date.now();
      const created = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Para deletar', email: `del-${uid}@test.com`, password: 'senha123' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/users/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .delete(`/users/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('403 quando autenticado como USER', async () => {
      await request(app.getHttpServer())
        .delete(`/users/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
