import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.from = this.config.get<string>('RESEND_FROM', '"Tracker Hub" <noreply@trackerhub.com.br>');
  }

  async sendPaymentFailed(to: string, reason: string, updateUrl: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Falha no pagamento — Tracker Hub',
        html: `
          <h2>Falha no pagamento</h2>
          <p><strong>Motivo:</strong> ${reason}</p>
          <p>Regularize seu pagamento para retomar o acesso:
            <a href="${updateUrl}">${updateUrl}</a>
          </p>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send payment-failed email to ${to}`, err);
    }
  }

  async sendCheckoutWelcome(to: string, registerUrl: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Bem-vindo ao Tracker Hub!',
      html: `
        <h2>Bem-vindo ao Tracker Hub!</h2>
        <p>Seu plano foi ativado. Crie sua conta para começar:</p>
        <p><a href="${registerUrl}">${registerUrl}</a></p>
      `,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }
}
