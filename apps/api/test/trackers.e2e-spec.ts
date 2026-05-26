import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupTenant, loginAs, seedTenant } from './helpers/seed';

describe('Trackers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let tenantId: string;
  let vehicleId: string;

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
      data: { name: 'Base', cnpj: '33333333000103', email: 'base@trk.com', phone: '11999999999', tenantId },
    });
    const vehicle = await prisma.vehicle.create({
      data: { plate: 'TRK0001', brand: 'VW', model: 'Gol', year: 2018, customerId: customer.id, tenantId },
    });
    vehicleId = vehicle.id;
  });

  afterAll(async () => {
    await cleanupTenant(prisma, tenantId).catch(() => {});
    await app.close();
  });

  afterEach(async () => {
    await prisma.chip.deleteMany({ where: { tenantId } });
    await prisma.tracker.deleteMany({ where: { tenantId } });
  });

  describe('GET /trackers', () => {
    it('200 retorna array vazio', async () => {
      const res = await request(app.getHttpServer())
        .get('/trackers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /trackers', () => {
    it('201 cria rastreador', async () => {
      const res = await request(app.getHttpServer())
        .post('/trackers')
        .set('Authorization', `Bearer ${token}`)
        .send({ imei: '123456789012345', model: 'GT06N', brand: 'Concox', vehicleId })
        .expect(201);
      expect(res.body.id).toBeDefined();
    });

    it('400 quando imei tem menos de 15 dígitos', async () => {
      await request(app.getHttpServer())
        .post('/trackers')
        .set('Authorization', `Bearer ${token}`)
        .send({ imei: '123', model: 'GT06N', brand: 'Concox', vehicleId })
        .expect(400);
    });
  });

  describe('GET /trackers/:id', () => {
    it('200 retorna rastreador com vehicle e chip', async () => {
      const created = await request(app.getHttpServer())
        .post('/trackers')
        .set('Authorization', `Bearer ${token}`)
        .send({ imei: '222222222222222', model: 'TK103', brand: 'Coban', vehicleId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/trackers/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.vehicle).toBeDefined();
    });

    it('404 para id desconhecido', async () => {
      await request(app.getHttpServer())
        .get('/trackers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('DELETE /trackers/:id', () => {
    it('200 deleta rastreador e cascata para chip', async () => {
      const uid = Date.now();
      const tracker = await prisma.tracker.create({
        data: { imei: String(uid % 999999999999999).padStart(15, '3'), model: 'X', brand: 'Y', vehicleId, tenantId },
      });
      await prisma.chip.create({
        data: { iccid: String(uid).padStart(20, '6'), phoneNumber: '11900000003', provider: 'Oi', trackerId: tracker.id, tenantId },
      });

      await request(app.getHttpServer())
        .delete(`/trackers/${tracker.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(await prisma.chip.count({ where: { trackerId: tracker.id } })).toBe(0);
    });
  });
});
