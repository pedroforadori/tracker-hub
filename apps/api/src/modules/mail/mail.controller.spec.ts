import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { STRIPE_CLIENT } from '../../stripe/stripe.module';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { CheckoutWelcomeDto } from './dto/checkout-welcome.dto';

const VALID_SECRET = 'super-secret-32-char-long-token!!';

function buildMockStripe() {
  return {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    },
  };
}

const mockMail = {
  sendCheckoutWelcome: jest.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  get: jest.fn().mockImplementation((key: string, def?: string) => {
    if (key === 'INTERNAL_API_SECRET') return VALID_SECRET;
    if (key === 'WEB_URL') return 'http://localhost:5173';
    return def;
  }),
};

const PAID_SESSION = {
  payment_status: 'paid',
  customer_details: { email: 'cliente@empresa.com' },
  metadata: {},
};

describe('MailController', () => {
  let controller: MailController;
  let mockStripe: ReturnType<typeof buildMockStripe>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStripe = buildMockStripe();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        { provide: MailService, useValue: mockMail },
        { provide: ConfigService, useValue: mockConfig },
        { provide: STRIPE_CLIENT, useValue: mockStripe },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
  });

  const dto: CheckoutWelcomeDto = { sessionId: 'cs_test_abc123' };

  describe('checkoutWelcome()', () => {
    describe('autenticação', () => {
      it('401 quando o segredo é inválido', async () => {
        await expect(controller.checkoutWelcome('wrong-secret', dto))
          .rejects.toThrow(UnauthorizedException);
      });

      it('401 quando o segredo está vazio', async () => {
        await expect(controller.checkoutWelcome('', dto))
          .rejects.toThrow(UnauthorizedException);
      });

      it('401 quando o cabeçalho está ausente (undefined)', async () => {
        await expect(controller.checkoutWelcome(undefined as unknown as string, dto))
          .rejects.toThrow(UnauthorizedException);
      });
    });

    describe('validação da sessão Stripe', () => {
      it('400 quando a sessão não existe no Stripe', async () => {
        mockStripe.checkout.sessions.retrieve.mockRejectedValue(
          new Error('No such checkout.session'),
        );
        await expect(controller.checkoutWelcome(VALID_SECRET, dto))
          .rejects.toThrow(BadRequestException);
      });

      it('400 quando payment_status não é paid', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue({
          ...PAID_SESSION,
          payment_status: 'unpaid',
        });
        await expect(controller.checkoutWelcome(VALID_SECRET, dto))
          .rejects.toThrow(BadRequestException);
      });

      it('400 quando não há e-mail na sessão', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue({
          ...PAID_SESSION,
          customer_details: null,
        });
        await expect(controller.checkoutWelcome(VALID_SECRET, dto))
          .rejects.toThrow(BadRequestException);
      });
    });

    describe('idempotência', () => {
      it('retorna { ok: true, skipped: true } quando sessão já foi processada', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue({
          ...PAID_SESSION,
          metadata: { emailSent: 'true' },
        });

        const result = await controller.checkoutWelcome(VALID_SECRET, dto);

        expect(result).toEqual({ ok: true, skipped: true });
        expect(mockMail.sendCheckoutWelcome).not.toHaveBeenCalled();
      });
    });

    describe('fluxo feliz', () => {
      beforeEach(() => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(PAID_SESSION);
      });

      it('retorna { ok: true } e envia o e-mail', async () => {
        const result = await controller.checkoutWelcome(VALID_SECRET, dto);

        expect(result).toEqual({ ok: true });
        expect(mockMail.sendCheckoutWelcome).toHaveBeenCalledWith(
          'cliente@empresa.com',
          'http://localhost:5173/cadastro',
        );
      });

      it('marca a sessão Stripe com emailSent=true', async () => {
        await controller.checkoutWelcome(VALID_SECRET, dto);

        expect(mockStripe.checkout.sessions.update).toHaveBeenCalledWith(
          dto.sessionId,
          { metadata: { emailSent: 'true' } },
        );
      });

      it('ainda retorna { ok: true } se o update da sessão Stripe falhar', async () => {
        mockStripe.checkout.sessions.update.mockRejectedValue(new Error('Stripe update failed'));

        const result = await controller.checkoutWelcome(VALID_SECRET, dto);

        expect(result).toEqual({ ok: true });
      });
    });

    describe('falha no envio de e-mail', () => {
      it('500 quando o MailService lança erro', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(PAID_SESSION);
        mockMail.sendCheckoutWelcome.mockRejectedValue(new Error('Resend timeout'));

        await expect(controller.checkoutWelcome(VALID_SECRET, dto))
          .rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
