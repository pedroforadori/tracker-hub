import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupTenant, loginAs, seedTenant } from './helpers/seed';

describe('Chips (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let tenantId: string;
  let trackerId: string;

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
      data: { name: 'Base', cnpj: '44444444000104', email: 'base@chip.com', phone: '11999999999', tenantId },
    });
    const vehicle = await prisma.vehicle.create({
      data: { plate: 'CHP0001', brand: 'Fiat', model: 'Palio', year: 2017, customerId: customer.id, tenantId },
    });
    const tracker = await prisma.tracker.create({
      data: { imei: '444444444444444', model: 'GT06N', brand: 'Concox', vehicleId: vehicle.id, tenantId },
    });
    trackerId = tracker.id;
  });

  afterAll(async () => {
    await cleanupTenant(prisma, tenantId).catch(() => {});
    await app.close();
  });

  afterEach(async () => {
    await prisma.chip.deleteMany({ where: { tenantId } });
  });

  describe('GET /chips', () => {
    it('200 retorna array vazio', async () => {
      const res = await request(app.getHttpServer())
        .get('/chips')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /chips', () => {
    it('201 cria chip', async () => {
      const uid = Date.now();
      const res = await request(app.getHttpServer())
        .post('/chips')
        .set('Authorization', `Bearer ${token}`)
        .send({
          iccid: String(uid).padStart(20, '4'),
          phoneNumber: '11999990004',
          provider: 'Vivo',
          trackerId,
        })
        .expect(201);
      expect(res.body.id).toBeDefined();
    });

    it('400 quando trackerId está ausente', async () => {
      await request(app.getHttpServer())
        .post('/chips')
        .set('Authorization', `Bearer ${token}`)
        .send({ iccid: '89550000000000000001', phoneNumber: '11999999999', provider: 'Vivo' })
        .expect(400);
    });
  });

  describe('GET /chips/:id', () => {
    it('200 retorna chip com tracker', async () => {
      const uid = Date.now();
      const created = await request(app.getHttpServer())
        .post('/chips')
        .set('Authorization', `Bearer ${token}`)
        .send({ iccid: String(uid).padStart(20, '5'), phoneNumber: '11999990005', provider: 'TIM', trackerId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/chips/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.tracker).toBeDefined();
    });

    it('404 para id desconhecido', async () => {
      await request(app.getHttpServer())
        .get('/chips/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /chips/:id', () => {
    it('200 atualiza o chip', async () => {
      const uid = Date.now();
      const created = await request(app.getHttpServer())
        .post('/chips')
        .set('Authorization', `Bearer ${token}`)
        .send({ iccid: String(uid).padStart(20, '6'), phoneNumber: '11999990006', provider: 'Claro', trackerId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/chips/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ provider: 'Oi' })
        .expect(200);

      expect(res.body.provider).toBe('Oi');
    });
  });

  describe('DELETE /chips/:id', () => {
    it('200 remove o chip', async () => {
      const uid = Date.now();
      const created = await request(app.getHttpServer())
        .post('/chips')
        .set('Authorization', `Bearer ${token}`)
        .send({ iccid: String(uid).padStart(20, '7'), phoneNumber: '11999990007', provider: 'Nextel', trackerId })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/chips/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/chips/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
