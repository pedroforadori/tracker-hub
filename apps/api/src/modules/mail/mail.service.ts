import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailer: MailerService) {}

  async sendPaymentFailed(to: string, reason: string, updateUrl: string): Promise<void> {
    try {
      await this.mailer.sendMail({
        to,
        subject: 'Falha no pagamento — Tracker Hub',
        template: 'payment-failed',
        context: { reason, updateUrl },
      });
    } catch (err) {
      this.logger.error(`Failed to send payment-failed email to ${to}`, err);
    }
  }
}
