import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PlanStatus } from '@prisma/client';
import { BillingCacheService } from './billing-cache.service';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';
import { MailService } from '../mail/mail.service';

// Module-level processedEvents Set is reset by using jest.isolateModules in idempotency tests

function buildMockStripe() {
  return {
    paymentMethods: {
      retrieve: jest.fn(),
      attach: jest.fn().mockResolvedValue({}),
    },
    customers: {
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    subscriptions: {
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    setupIntents: {
      create: jest.fn(),
    },
    invoices: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      pay: jest.fn().mockResolvedValue({}),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };
}

const mockRepo = {
  findById: jest.fn(),
  findByStripeSubscriptionId: jest.fn(),
  findAdminEmail: jest.fn(),
  setPastDue: jest.fn().mockResolvedValue({}),
  setBlocked: jest.fn().mockResolvedValue({}),
  setActive: jest.fn().mockResolvedValue({}),
  saveStripeIds: jest.fn().mockResolvedValue({}),
  savePaymentMethod: jest.fn().mockResolvedValue({}),
};

const mockMail = {
  sendPaymentFailed: jest.fn().mockResolvedValue(undefined),
};

const mockCache = {
  get: jest.fn().mockReturnValue(undefined),
  set: jest.fn(),
  invalidate: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn().mockImplementation((key: string) => {
    if (key === 'STRIPE_SECRET_KEY') return 'sk_test_dummy';
    if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test';
    return key;
  }),
  get: jest.fn().mockImplementation((key: string, def?: string) => {
    if (key === 'STRIPE_PRICE_ID') return 'price_test';
    if (key === 'WEB_URL') return 'http://localhost:5173';
    return def;
  }),
};

const tenantRecord = {
  planStatus: PlanStatus.TRIALING,
  blockReason: null,
  gracePeriodEndsAt: null,
  stripeCustomerId: 'cus_test',
  stripeSubscriptionId: 'sub_test',
  stripePaymentMethodId: null,
  trialEndsAt: null,
};

describe('BillingService', () => {
  let service: BillingService;
  let mockStripe: ReturnType<typeof buildMockStripe>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStripe = buildMockStripe();
    mockCache.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: BillingRepository, useValue: mockRepo },
        { provide: MailService, useValue: mockMail },
        { provide: ConfigService, useValue: mockConfig },
        { provide: BillingCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    (service as unknown as { stripe: typeof mockStripe }).stripe = mockStripe;
  });

  describe('getStatus()', () => {
    it('retorna null quando o tenant não é encontrado', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await service.getStatus('tenant-1');
      expect(result).toBeNull();
    });

    it('retorna status sem dados de cartão quando não há stripePaymentMethodId', async () => {
      mockRepo.findById.mockResolvedValue({ ...tenantRecord, stripePaymentMethodId: null });
      const result = await service.getStatus('tenant-1');
      expect(result?.lastFour).toBeNull();
      expect(result?.cardBrand).toBeNull();
    });

    it('busca lastFour e cardBrand do Stripe quando há PM', async () => {
      mockRepo.findById.mockResolvedValue({ ...tenantRecord, stripePaymentMethodId: 'pm_test' });
      mockStripe.paymentMethods.retrieve.mockResolvedValue({
        card: { last4: '4242', brand: 'visa' },
      });

      const result = await service.getStatus('tenant-1');

      expect(result?.lastFour).toBe('4242');
      expect(result?.cardBrand).toBe('visa');
    });

    it('retorna lastFour=null quando o Stripe lança erro (PM desvinculado)', async () => {
      mockRepo.findById.mockResolvedValue({ ...tenantRecord, stripePaymentMethodId: 'pm_old' });
      mockStripe.paymentMethods.retrieve.mockRejectedValue(new Error('No such payment method'));

      const result = await service.getStatus('tenant-1');

      expect(result?.lastFour).toBeNull();
    });
  });

  describe('createSetupIntent()', () => {
    it('lança BadRequestException quando o tenant não tem stripeCustomerId', async () => {
      mockRepo.findById.mockResolvedValue({ ...tenantRecord, stripeCustomerId: null });
      await expect(service.createSetupIntent('tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('retorna { clientSecret } em caso de sucesso', async () => {
      mockRepo.findById.mockResolvedValue(tenantRecord);
      mockStripe.setupIntents.create.mockResolvedValue({ client_secret: 'seti_test_secret' });

      const result = await service.createSetupIntent('tenant-1');

      expect(result).toEqual({ clientSecret: 'seti_test_secret' });
    });
  });

  describe('updatePaymentMethod()', () => {
    const pm = { customer: 'cus_test', card: { last4: '4242' } };

    it('lança BadRequestException quando tenant não tem stripeCustomerId', async () => {
      mockRepo.findById.mockResolvedValue({ ...tenantRecord, stripeCustomerId: null });
      await expect(service.updatePaymentMethod('tenant-1', 'pm_new')).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException (IDOR) quando o PM pertence a outro customer', async () => {
      mockRepo.findById.mockResolvedValue(tenantRecord);
      mockStripe.paymentMethods.retrieve.mockResolvedValue({ customer: 'cus_other' });

      await expect(service.updatePaymentMethod('tenant-1', 'pm_new')).rejects.toThrow(BadRequestException);
    });

    it('executa attach, atualiza customer e subscription', async () => {
      mockRepo.findById.mockResolvedValue(tenantRecord);
      mockStripe.paymentMethods.retrieve.mockResolvedValue(pm);

      await service.updatePaymentMethod('tenant-1', 'pm_new');

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_new', { customer: 'cus_test' });
      expect(mockStripe.customers.update).toHaveBeenCalled();
      expect(mockStripe.subscriptions.update).toHaveBeenCalled();
    });

    it('paga invoice aberta imediatamente quando existe', async () => {
      mockRepo.findById.mockResolvedValue(tenantRecord);
      mockStripe.paymentMethods.retrieve.mockResolvedValue(pm);
      mockStripe.invoices.list.mockResolvedValue({ data: [{ id: 'inv_open' }] });

      await service.updatePaymentMethod('tenant-1', 'pm_new');

      expect(mockStripe.invoices.pay).toHaveBeenCalledWith('inv_open');
    });

    it('não lança erro quando o pagamento da invoice falhar', async () => {
      mockRepo.findById.mockResolvedValue(tenantRecord);
      mockStripe.paymentMethods.retrieve.mockResolvedValue(pm);
      mockStripe.invoices.list.mockResolvedValue({ data: [{ id: 'inv_open' }] });
      mockStripe.invoices.pay.mockRejectedValue(new Error('Card declined'));

      await expect(service.updatePaymentMethod('tenant-1', 'pm_new')).resolves.not.toThrow();
    });

    it('salva o PM no banco após todas as chamadas Stripe', async () => {
      mockRepo.findById.mockResolvedValue(tenantRecord);
      mockStripe.paymentMethods.retrieve.mockResolvedValue(pm);

      await service.updatePaymentMethod('tenant-1', 'pm_new');

      expect(mockRepo.savePaymentMethod).toHaveBeenCalledWith('tenant-1', 'pm_new');
    });
  });

  describe('createCustomerAndSubscription()', () => {
    it('retorna early sem chamar Stripe quando STRIPE_PRICE_ID não está definido', async () => {
      mockConfig.get.mockImplementation((key: string) => (key === 'STRIPE_PRICE_ID' ? undefined : undefined));

      await service.createCustomerAndSubscription('tenant-1', 'admin@test.com', 'Acme');

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('cria customer Stripe com metadados corretos', async () => {
      mockConfig.get.mockImplementation((key: string, def?: string) => (key === 'STRIPE_PRICE_ID' ? 'price_test' : def));
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockStripe.subscriptions.create.mockResolvedValue({ id: 'sub_new', trial_end: null });

      await service.createCustomerAndSubscription('tenant-1', 'admin@test.com', 'Acme');

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@test.com', name: 'Acme', metadata: { tenantId: 'tenant-1' } }),
      );
    });

    it('cria subscription com trial de 14 dias', async () => {
      mockConfig.get.mockImplementation((key: string, def?: string) => (key === 'STRIPE_PRICE_ID' ? 'price_test' : def));
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockStripe.subscriptions.create.mockResolvedValue({ id: 'sub_new', trial_end: null });

      await service.createCustomerAndSubscription('tenant-1', 'admin@test.com', 'Acme');

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({ trial_period_days: 14 }),
      );
    });

    it('usa trial_end da subscription quando disponível', async () => {
      mockConfig.get.mockImplementation((key: string, def?: string) => (key === 'STRIPE_PRICE_ID' ? 'price_test' : def));
      const trialEnd = Math.floor(Date.now() / 1000) + 14 * 86400;
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockStripe.subscriptions.create.mockResolvedValue({ id: 'sub_new', trial_end: trialEnd });

      await service.createCustomerAndSubscription('tenant-1', 'admin@test.com', 'Acme');

      const call = mockRepo.saveStripeIds.mock.calls[0][1];
      expect(call.trialEndsAt.getTime()).toBeCloseTo(trialEnd * 1000, -3);
    });

    it('salva stripeCustomerId, stripeSubscriptionId e trialEndsAt no banco', async () => {
      mockConfig.get.mockImplementation((key: string, def?: string) => (key === 'STRIPE_PRICE_ID' ? 'price_test' : def));
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockStripe.subscriptions.create.mockResolvedValue({ id: 'sub_new', trial_end: null });

      await service.createCustomerAndSubscription('tenant-1', 'admin@test.com', 'Acme');

      expect(mockRepo.saveStripeIds).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ stripeCustomerId: 'cus_new', stripeSubscriptionId: 'sub_new' }),
      );
    });
  });

  describe('handleWebhook()', () => {
    const rawBody = Buffer.from('{}');
    const signature = 'valid-sig';

    it('lança BadRequestException quando a assinatura do webhook é inválida', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(service.handleWebhook(rawBody, signature)).rejects.toThrow(BadRequestException);
    });

    describe('invoice.payment_failed', () => {
      let evtCounter = 0;
      const makeEvent = (overrides: Record<string, unknown> = {}) => ({
        id: `evt_pf_${++evtCounter}_${Date.now()}`,
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_test',
            last_payment_error: { message: 'Cartão recusado' },
            ...overrides,
          },
        },
      });

      beforeEach(() => {
        mockRepo.findByStripeSubscriptionId.mockResolvedValue({ id: 'tenant-1' });
        mockRepo.findAdminEmail.mockResolvedValue({ email: 'admin@test.com' });
      });

      it('chama repo.setPastDue com o motivo correto', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue(makeEvent());
        await service.handleWebhook(rawBody, signature);
        expect(mockRepo.setPastDue).toHaveBeenCalledWith('tenant-1', 'Cartão recusado');
      });

      it('envia e-mail de pagamento falho para o admin', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue(makeEvent());
        await service.handleWebhook(rawBody, signature);
        expect(mockMail.sendPaymentFailed).toHaveBeenCalledWith(
          'admin@test.com',
          'Cartão recusado',
          expect.stringContaining('/billing'),
        );
      });

      it('usa motivo padrão quando last_payment_error.message não existe', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          id: `evt_pf_noerr_${Date.now()}`,
          type: 'invoice.payment_failed',
          data: { object: { subscription: 'sub_test' } },
        });

        await service.handleWebhook(rawBody, signature);

        expect(mockRepo.setPastDue).toHaveBeenCalledWith('tenant-1', expect.stringContaining('banco emissor'));
      });

      it('não faz nada quando o tenant não é encontrado para a subscription', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue(makeEvent());
        mockRepo.findByStripeSubscriptionId.mockResolvedValue(null);

        await service.handleWebhook(rawBody, signature);

        expect(mockRepo.setPastDue).not.toHaveBeenCalled();
      });
    });

    describe('invoice.paid', () => {
      it('chama repo.setActive', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          id: `evt_paid_${Date.now()}`,
          type: 'invoice.paid',
          data: { object: { subscription: 'sub_test' } },
        });
        mockRepo.findByStripeSubscriptionId.mockResolvedValue({ id: 'tenant-1' });

        await service.handleWebhook(rawBody, signature);

        expect(mockRepo.setActive).toHaveBeenCalledWith('tenant-1');
      });

      it('não faz nada quando o tenant não é encontrado', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          id: `evt_paid_notfound_${Date.now()}`,
          type: 'invoice.paid',
          data: { object: { subscription: 'sub_test' } },
        });
        mockRepo.findByStripeSubscriptionId.mockResolvedValue(null);

        await service.handleWebhook(rawBody, signature);

        expect(mockRepo.setActive).not.toHaveBeenCalled();
      });
    });

    describe('customer.subscription.deleted', () => {
      it('chama repo.setBlocked', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          id: `evt_deleted_${Date.now()}`,
          type: 'customer.subscription.deleted',
          data: { object: { id: 'sub_test' } },
        });
        mockRepo.findByStripeSubscriptionId.mockResolvedValue({ id: 'tenant-1' });

        await service.handleWebhook(rawBody, signature);

        expect(mockRepo.setBlocked).toHaveBeenCalledWith('tenant-1');
      });
    });

    describe('idempotência', () => {
      it('processa o mesmo eventId apenas uma vez', async () => {
        const fixedId = `evt_idem_${Date.now()}`;
        mockStripe.webhooks.constructEvent.mockReturnValue({
          id: fixedId,
          type: 'invoice.paid',
          data: { object: { subscription: 'sub_test' } },
        });
        mockRepo.findByStripeSubscriptionId.mockResolvedValue({ id: 'tenant-1' });

        await service.handleWebhook(rawBody, signature);
        await service.handleWebhook(rawBody, signature);

        expect(mockRepo.findByStripeSubscriptionId).toHaveBeenCalledTimes(1);
      });
    });

    describe('evento desconhecido', () => {
      it('não lança erro para evento não tratado', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          id: 'evt_unknown',
          type: 'payment_intent.created',
          data: { object: {} },
        });

        await expect(service.handleWebhook(rawBody, signature)).resolves.not.toThrow();
      });
    });
  });
});
