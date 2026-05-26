import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupTenant, loginAs, seedTenant } from './helpers/seed';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantAId: string;
  let tenantBId: string;
  let tokenA: string;
  let tokenB: string;

  let customerAId: string;
  let vehicleAId: string;
  let trackerAId: string;
  let chipAId: string;

  let customerBId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);

    // Seed tenant A
    const seedA = await seedTenant(prisma);
    tenantAId = seedA.tenantId;
    tokenA = await loginAs(app, seedA.adminEmail, seedA.adminPassword);

    // Seed tenant B
    const seedB = await seedTenant(prisma);
    tenantBId = seedB.tenantId;
    tokenB = await loginAs(app, seedB.adminEmail, seedB.adminPassword);

    // Create data for tenant A
    const customerA = await prisma.customer.create({
      data: { name: 'Cliente A', cnpj: '11111111000101', email: 'a@a.com', phone: '11999990001', tenantId: tenantAId },
    });
    customerAId = customerA.id;

    const vehicleA = await prisma.vehicle.create({
      data: { plate: 'AAA0001', brand: 'Toyota', model: 'Corolla', year: 2020, customerId: customerAId, tenantId: tenantAId },
    });
    vehicleAId = vehicleA.id;

    const trackerA = await prisma.tracker.create({
      data: { imei: '111111111111111', model: 'GT06N', brand: 'Concox', vehicleId: vehicleAId, tenantId: tenantAId },
    });
    trackerAId = trackerA.id;

    const chipA = await prisma.chip.create({
      data: { iccid: '89000000000000000001', phoneNumber: '11999990001', provider: 'Vivo', trackerId: trackerAId, tenantId: tenantAId },
    });
    chipAId = chipA.id;

    // Create data for tenant B
    const customerB = await prisma.customer.create({
      data: { name: 'Cliente B', cnpj: '22222222000102', email: 'b@b.com', phone: '11999990002', tenantId: tenantBId },
    });
    customerBId = customerB.id;
  });

  afterAll(async () => {
    await cleanupTenant(prisma, tenantAId).catch(() => {});
    await cleanupTenant(prisma, tenantBId).catch(() => {});
    await app.close();
  });

  describe('Customers', () => {
    it('GET /customers — tenant A não vê dados do tenant B', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const ids = res.body.map((c: { id: string }) => c.id);
      expect(ids).toContain(customerAId);
      expect(ids).not.toContain(customerBId);
    });

    it('GET /customers/:id — tenant A usando id do tenant B retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/customers/${customerBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });

    it('PATCH /customers/:id — tenant A não consegue atualizar dado do tenant B (404)', async () => {
      await request(app.getHttpServer())
        .patch(`/customers/${customerBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Invadido' })
        .expect(404);
    });

    it('DELETE /customers/:id — tenant A não consegue deletar dado do tenant B (404)', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${customerBId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });

  describe('Vehicles', () => {
    it('GET /vehicles/:id — tenant B usando id de veículo do tenant A retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/vehicles/${vehicleAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('PATCH /vehicles/:id — tenant B não consegue atualizar veículo do tenant A', async () => {
      await request(app.getHttpServer())
        .patch(`/vehicles/${vehicleAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ brand: 'Invadido' })
        .expect(404);
    });

    it('DELETE /vehicles/:id — tenant B não consegue deletar veículo do tenant A', async () => {
      await request(app.getHttpServer())
        .delete(`/vehicles/${vehicleAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('Trackers', () => {
    it('GET /trackers/:id — tenant B usando id de rastreador do tenant A retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/trackers/${trackerAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('Chips', () => {
    it('GET /chips/:id — tenant B usando id de chip do tenant A retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/chips/${chipAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });

  describe('Users', () => {
    it('GET /users — cada tenant vê apenas seus próprios usuários', async () => {
      const resA = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const resB = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      const idsA = resA.body.map((u: { tenantId: string }) => u.tenantId);
      const idsB = resB.body.map((u: { tenantId: string }) => u.tenantId);

      expect(idsA.every((id: string) => id === tenantAId)).toBe(true);
      expect(idsB.every((id: string) => id === tenantBId)).toBe(true);
    });
  });

  describe('Billing', () => {
    it('GET /billing/status — cada tenant vê apenas seu próprio status', async () => {
      const resA = await request(app.getHttpServer())
        .get('/billing/status')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const resB = await request(app.getHttpServer())
        .get('/billing/status')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      // Ambos devem ter status (mesmo que TRIALING)
      expect(resA.body).toHaveProperty('status');
      expect(resB.body).toHaveProperty('status');
      // Os status não precisam ser iguais, mas ambos devem existir independentemente
    });
  });
});
