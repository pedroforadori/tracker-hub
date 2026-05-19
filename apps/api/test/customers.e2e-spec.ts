import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupTenant, loginAs, seedTenant } from './helpers/seed';

describe('Customers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let tenantId: string;

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
  });

  afterAll(async () => {
    await cleanupTenant(prisma, tenantId).catch(() => {});
    await app.close();
  });

  afterEach(async () => {
    await prisma.chip.deleteMany({ where: { tenantId } });
    await prisma.tracker.deleteMany({ where: { tenantId } });
    await prisma.vehicle.deleteMany({ where: { tenantId } });
    await prisma.customer.deleteMany({ where: { tenantId } });
  });

  const makeDto = (suffix: string | number) => ({
    name: `Cliente ${suffix}`,
    cnpj: String(suffix).padStart(14, '1'),
    email: `cli${suffix}@test.com`,
    phone: '11999999999',
  });

  describe('GET /customers', () => {
    it('200 retorna array vazio inicialmente', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('401 sem token', async () => {
      await request(app.getHttpServer()).get('/customers').expect(401);
    });
  });

  describe('POST /customers', () => {
    it('201 cria cliente', async () => {
      const uid = Date.now();
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Acme', cnpj: '12345678000199', email: `acme${uid}@test.com`, phone: '11988888888' })
        .expect(201);

      expect(res.body.id).toBeDefined();
    });

    it('400 quando cnpj tem menos de 14 dígitos', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X', cnpj: '123', email: 'x@test.com', phone: '11988888888' })
        .expect(400);
    });

    it('400 quando email é inválido', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X', cnpj: '12345678000199', email: 'invalido', phone: '11988888888' })
        .expect(400);
    });
  });

  describe('GET /customers/:id', () => {
    it('200 retorna cliente com vehicles', async () => {
      const uid = Date.now();
      const created = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'X', cnpj: String(uid).padStart(14, '0'), email: `x${uid}@test.com`, phone: '11999999999' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/customers/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.vehicles).toBeDefined();
    });

    it('404 para id desconhecido', async () => {
      await request(app.getHttpServer())
        .get('/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /customers/:id', () => {
    it('200 atualiza o cliente', async () => {
      const uid = Date.now();
      const created = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Original', cnpj: String(uid).padStart(14, '0'), email: `o${uid}@test.com`, phone: '11999999999' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/customers/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Atualizado' })
        .expect(200);

      expect(res.body.name).toBe('Atualizado');
    });
  });

  describe('DELETE /customers/:id', () => {
    it('200 deleta cliente e cascata para veículo, rastreador e chip', async () => {
      const uid = Date.now();
      const customer = await prisma.customer.create({
        data: { name: 'Del', cnpj: String(uid).padStart(14, '9'), email: `del${uid}@test.com`, phone: '11900000001', tenantId },
      });
      const vehicle = await prisma.vehicle.create({
        data: { plate: `DEL${uid % 9999}`, brand: 'X', model: 'Y', year: 2020, customerId: customer.id, tenantId },
      });
      const tracker = await prisma.tracker.create({
        data: { imei: String(uid % 999999999999999).padStart(15, '9'), model: 'X', brand: 'Y', vehicleId: vehicle.id, tenantId },
      });
      await prisma.chip.create({
        data: { iccid: String(uid).padStart(20, '8'), phoneNumber: '11900000001', provider: 'Claro', trackerId: tracker.id, tenantId },
      });

      await request(app.getHttpServer())
        .delete(`/customers/${customer.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const vCount = await prisma.vehicle.count({ where: { id: vehicle.id } });
      const tCount = await prisma.tracker.count({ where: { id: tracker.id } });
      const cCount = await prisma.chip.count({ where: { trackerId: tracker.id } });
      expect(vCount).toBe(0);
      expect(tCount).toBe(0);
      expect(cCount).toBe(0);
    });
  });
});
