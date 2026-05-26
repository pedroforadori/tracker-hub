import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PlanStatus } from '@prisma/client';
import Stripe from 'stripe';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { BillingService } from '../src/modules/billing/billing.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupTenant, loginAs, seedTenant } from './helpers/seed';

describe('Billing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let billingService: BillingService;
  const tenantIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);
    billingService = moduleRef.get(BillingService);

    // Mock Stripe to avoid real API calls in E2E
    (billingService as unknown as { stripe: unknown }).stripe = {
      paymentMethods: { retrieve: jest.fn().mockResolvedValue({ card: { last4: '4242', brand: 'visa' }, customer: null }) },
      setupIntents: { create: jest.fn().mockResolvedValue({ client_secret: 'seti_test_secret' }) },
      customers: { create: jest.fn().mockResolvedValue({ id: 'cus_test' }), update: jest.fn().mockResolvedValue({}) },
      subscriptions: { create: jest.fn().mockResolvedValue({ id: 'sub_test', trial_end: null }), update: jest.fn().mockResolvedValue({}) },
      invoices: { list: jest.fn().mockResolvedValue({ data: [] }), pay: jest.fn().mockResolvedValue({}) },
      webhooks: { constructEvent: jest.fn() },
    };
  });

  afterAll(async () => {
    for (const id of tenantIds) {
      await cleanupTenant(prisma, id).catch(() => {});
    }
    await app.close();
  });

  describe('GET /billing/status', () => {
    it('200 retorna status de billing', async () => {
      const seeded = await seedTenant(prisma);
      tenantIds.push(seeded.tenantId);
      const token = await loginAs(app, seeded.adminEmail, seeded.adminPassword);

      const res = await request(app.getHttpServer())
        .get('/billing/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('status');
    });

    it('401 sem token', async () => {
      await request(app.getHttpServer()).get('/billing/status').expect(401);
    });
  });

  describe('Billing Gate', () => {
    it('402 quando tenant está BLOCKED', async () => {
      const seeded = await seedTenant(prisma);
      tenantIds.push(seeded.tenantId);

      await prisma.tenant.update({
        where: { id: seeded.tenantId },
        data: { planStatus: PlanStatus.BLOCKED, blockedAt: new Date(), blockReason: 'Pagamento não realizado' },
      });

      const token = await loginAs(app, seeded.adminEmail, seeded.adminPassword);

      await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(402);
    });

    it('header x-payment-warning presente quando PAST_DUE com grace period ativo', async () => {
      const seeded = await seedTenant(prisma);
      tenantIds.push(seeded.tenantId);
      const gracePeriodEndsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      await prisma.tenant.update({
        where: { id: seeded.tenantId },
        data: { planStatus: PlanStatus.PAST_DUE, gracePeriodEndsAt, blockReason: 'Cartão expirado' },
      });

      const token = await loginAs(app, seeded.adminEmail, seeded.adminPassword);

      const res = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.headers['x-payment-warning']).toBe('true');
    });

    it('402 e promove para BLOCKED quando PAST_DUE com grace period expirado', async () => {
      const seeded = await seedTenant(prisma);
      tenantIds.push(seeded.tenantId);
      const expired = new Date(Date.now() - 1000);

      await prisma.tenant.update({
        where: { id: seeded.tenantId },
        data: { planStatus: PlanStatus.PAST_DUE, gracePeriodEndsAt: expired, blockReason: 'Vencido' },
      });

      const token = await loginAs(app, seeded.adminEmail, seeded.adminPassword);

      await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(402);

      const tenant = await prisma.tenant.findUnique({ where: { id: seeded.tenantId } });
      expect(tenant?.planStatus).toBe(PlanStatus.BLOCKED);
    });
  });

  describe('POST /billing/webhook', () => {
    function buildWebhookEvent(type: string, data: Record<string, unknown>, eventId: string) {
      const event = { id: eventId, type, data: { object: data } };
      const stripe = new Stripe('sk_test_dummy');
      const payload = JSON.stringify(event);
      const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: 'whsec_test_dummy',
      });
      return { payload, signature, event };
    }

    it('400 quando stripe-signature está ausente', async () => {
      await request(app.getHttpServer())
        .post('/billing/webhook')
        .send({})
        .expect(400);
    });

    it('400 quando a assinatura é inválida', async () => {
      await request(app.getHttpServer())
        .post('/billing/webhook')
        .set('stripe-signature', 'invalid-sig')
        .send(Buffer.from('{}'))
        .expect(400);
    });

    it('200 para evento invoice.payment_failed com assinatura válida', async () => {
      const seeded = await seedTenant(prisma);
      tenantIds.push(seeded.tenantId);

      await prisma.tenant.update({
        where: { id: seeded.tenantId },
        data: { stripeSubscriptionId: `sub_evt_${Date.now()}` },
      });
      const tenant = await prisma.tenant.findUnique({ where: { id: seeded.tenantId } });

      const { payload, signature } = buildWebhookEvent(
        'invoice.payment_failed',
        { subscription: tenant!.stripeSubscriptionId, last_payment_error: { message: 'Cartão recusado' } },
        `evt_pf_${Date.now()}`,
      );

      // Restore real constructEvent for this call
      const stripe = new Stripe('sk_test_dummy');
      (billingService as unknown as { stripe: { webhooks: { constructEvent: jest.Mock } } }).stripe.webhooks.constructEvent
        .mockImplementation((body: Buffer, sig: string, secret: string) =>
          stripe.webhooks.constructEvent(body, sig, secret),
        );

      const res = await request(app.getHttpServer())
        .post('/billing/webhook')
        .set('stripe-signature', signature)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(200);

      expect(res.body.received).toBe(true);
    });
  });
});
