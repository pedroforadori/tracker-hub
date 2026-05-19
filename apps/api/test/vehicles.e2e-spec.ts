import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupTenant, loginAs, seedTenant } from './helpers/seed';

describe('Vehicles (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let tenantId: string;
  let customerId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);
    const seeded = await seedTenant(prisma);
    tenantId = seeded.tenantId;
    token = await loginAs(app, seeded.adminEmail, seeded.adminPassword);

    const customer = await prisma.customer.create({
      data: { name: 'Base Customer', cnpj: '12345678000199', email: 'base@test.com', phone: '11999999999', tenantId },
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    await cleanupTenant(prisma, tenantId).catch(() => {});
    await app.close();
  });

  afterEach(async () => {
    await prisma.chip.deleteMany({ where: { tenantId } });
    await prisma.tracker.deleteMany({ where: { tenantId } });
    await prisma.vehicle.deleteMany({ where: { tenantId } });
  });

  describe('GET /vehicles', () => {
    it('200 retorna array vazio', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('401 sem token', async () => {
      await request(app.getHttpServer()).get('/vehicles').expect(401);
    });
  });

  describe('POST /vehicles', () => {
    it('201 cria veículo', async () => {
      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ plate: 'ABC1D23', brand: 'Toyota', model: 'Corolla', year: 2022, customerId })
        .expect(201);
      expect(res.body.id).toBeDefined();
    });

    it('400 quando year está fora do intervalo', async () => {
      await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ plate: 'XYZ9A87', brand: 'Ford', model: 'Ka', year: 1989, customerId })
        .expect(400);
    });

    it('400 quando plate está ausente', async () => {
      await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ brand: 'Ford', model: 'Ka', year: 2020, customerId })
        .expect(400);
    });
  });

  describe('GET /vehicles/:id', () => {
    it('200 retorna veículo com customer e trackers', async () => {
      const created = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ plate: 'DEF2E34', brand: 'Honda', model: 'Fit', year: 2019, customerId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/vehicles/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.customer).toBeDefined();
      expect(res.body.trackers).toBeDefined();
    });

    it('404 para id desconhecido', async () => {
      await request(app.getHttpServer())
        .get('/vehicles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('200 deleta veículo e cascata para rastreador e chip', async () => {
      const uid = Date.now();
      const vehicle = await prisma.vehicle.create({
        data: { plate: `GHI${uid % 9999}`, brand: 'X', model: 'Y', year: 2021, customerId, tenantId },
      });
      const tracker = await prisma.tracker.create({
        data: { imei: String(uid % 999999999999999).padStart(15, '5'), model: 'X', brand: 'Y', vehicleId: vehicle.id, tenantId },
      });
      await prisma.chip.create({
        data: { iccid: String(uid).padStart(20, '7'), phoneNumber: '11900000002', provider: 'TIM', trackerId: tracker.id, tenantId },
      });

      await request(app.getHttpServer())
        .delete(`/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(await prisma.tracker.count({ where: { id: tracker.id } })).toBe(0);
      expect(await prisma.chip.count({ where: { trackerId: tracker.id } })).toBe(0);
    });
  });
});
