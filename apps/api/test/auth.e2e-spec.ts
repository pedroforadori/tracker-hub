import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupTenant, loginAs, seedTenant } from './helpers/seed';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tenantIds: string[] = [];

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
    for (const id of tenantIds) {
      await cleanupTenant(prisma, id).catch(() => {});
    }
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('201 retorna accessToken e user', async () => {
      const uid = Date.now();
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Admin', email: `reg-${uid}@test.com`, password: 'Senha123', tenantName: `Acme-${uid}` })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
      tenantIds.push(res.body.user.tenantId);
    });

    it('400 quando password não contém número', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Admin', email: 'test@test.com', password: 'SoLetras', tenantName: 'Acme' })
        .expect(400);
    });

    it('400 quando tenantName tem 1 caractere', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Admin', email: 'test@test.com', password: 'Senha123', tenantName: 'X' })
        .expect(400);
    });

    it('409 quando o e-mail já está cadastrado', async () => {
      const uid = Date.now();
      const email = `dup-${uid}@test.com`;
      const payload = { name: 'Admin', email, password: 'Senha123', tenantName: `Dup-${uid}` };

      const res = await request(app.getHttpServer()).post('/auth/register').send(payload).expect(201);
      tenantIds.push(res.body.user.tenantId);

      await request(app.getHttpServer()).post('/auth/register').send(payload).expect(409);
    });

    it('registra dois e-mails diferentes com sucesso', async () => {
      const uid = Date.now();
      const res1 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'A1', email: `a1-${uid}@test.com`, password: 'Senha123', tenantName: `T1-${uid}` })
        .expect(201);
      const res2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'A2', email: `a2-${uid}@test.com`, password: 'Senha123', tenantName: `T2-${uid}` })
        .expect(201);

      tenantIds.push(res1.body.user.tenantId, res2.body.user.tenantId);
      expect(res1.body.user.tenantId).not.toBe(res2.body.user.tenantId);
    });
  });

  describe('POST /auth/login', () => {
    let seeded: Awaited<ReturnType<typeof seedTenant>>;

    beforeAll(async () => {
      seeded = await seedTenant(prisma);
      tenantIds.push(seeded.tenantId);
    });

    it('200 retorna accessToken após registro válido', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: seeded.adminEmail, password: seeded.adminPassword })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
    });

    it('401 com senha errada', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: seeded.adminEmail, password: 'SenhaErrada1' })
        .expect(401);
    });

    it('401 com e-mail desconhecido', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'naoexiste@test.com', password: 'Senha123' })
        .expect(401);
    });

    it('400 com e-mail malformado', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalido', password: 'Senha123' })
        .expect(400);
    });
  });

  describe('Validação de token em rotas protegidas', () => {
    it('401 GET /customers sem token', async () => {
      await request(app.getHttpServer()).get('/customers').expect(401);
    });

    it('401 GET /customers com token malformado', async () => {
      await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', 'Bearer nao.e.um.jwt.valido')
        .expect(401);
    });

    it('200 GET /customers com token válido', async () => {
      const seeded = await seedTenant(prisma);
      tenantIds.push(seeded.tenantId);
      const token = await loginAs(app, seeded.adminEmail, seeded.adminPassword);

      await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
