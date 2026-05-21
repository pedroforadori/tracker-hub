import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

const mockResendSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('re_test_key'),
  get: jest.fn().mockReturnValue('"Tracker Hub" <noreply@trackerhub.com.br>'),
};

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  describe('sendPaymentFailed()', () => {
    const to = 'admin@test.com';
    const reason = 'Cartão recusado pelo banco';
    const updateUrl = 'http://localhost:5173/billing';

    it('chama resend.emails.send com os dados corretos', async () => {
      mockResendSend.mockResolvedValue({ data: {}, error: null });
      await service.sendPaymentFailed(to, reason, updateUrl);

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({ to, subject: expect.stringContaining('Falha no pagamento') }),
      );
    });

    it('não lança erro quando resend.emails.send falha', async () => {
      mockResendSend.mockRejectedValue(new Error('network error'));
      await expect(service.sendPaymentFailed(to, reason, updateUrl)).resolves.not.toThrow();
    });
  });

  describe('sendCheckoutWelcome()', () => {
    const to = 'novo@empresa.com';
    const registerUrl = 'http://localhost:5173/cadastro';

    it('chama resend.emails.send com subject de boas-vindas', async () => {
      mockResendSend.mockResolvedValue({ data: {}, error: null });
      await service.sendCheckoutWelcome(to, registerUrl);

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({ to, subject: expect.stringContaining('Bem-vindo') }),
      );
    });

    it('lança erro quando resend retorna error no response', async () => {
      mockResendSend.mockResolvedValue({ data: null, error: { message: 'timeout' } });
      await expect(service.sendCheckoutWelcome(to, registerUrl)).rejects.toThrow('Resend error');
    });
  });
});
