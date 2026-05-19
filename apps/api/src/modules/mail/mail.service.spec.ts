import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

const mockMailer = {
  sendMail: jest.fn(),
};

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailer },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  describe('sendPaymentFailed()', () => {
    const to = 'admin@test.com';
    const reason = 'Cartão recusado pelo banco';
    const updateUrl = 'http://localhost:5173/billing';

    it('chama mailer.sendMail com o template correto', async () => {
      mockMailer.sendMail.mockResolvedValue({});
      await service.sendPaymentFailed(to, reason, updateUrl);

      expect(mockMailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          template: 'payment-failed',
          context: { reason, updateUrl },
        }),
      );
    });

    it('o subject contém "Falha no pagamento"', async () => {
      mockMailer.sendMail.mockResolvedValue({});
      await service.sendPaymentFailed(to, reason, updateUrl);

      const call = mockMailer.sendMail.mock.calls[0][0];
      expect(call.subject).toContain('Falha no pagamento');
    });

    it('não lança erro quando mailer.sendMail falha', async () => {
      mockMailer.sendMail.mockRejectedValue(new Error('SMTP connection refused'));

      await expect(service.sendPaymentFailed(to, reason, updateUrl)).resolves.not.toThrow();
    });

    it('não propaga o erro — encapsula a falha internamente', async () => {
      mockMailer.sendMail.mockRejectedValue(new Error('timeout'));
      const result = await service.sendPaymentFailed(to, reason, updateUrl);
      expect(result).toBeUndefined();
    });
  });
});
