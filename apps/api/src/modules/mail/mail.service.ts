import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('RESEND_FROM', '"Tracker Hub" <noreply@trackerhub.com.br>');
  }

  async sendPaymentFailed(to: string, reason: string, updateUrl: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Falha no pagamento — Tracker Hub',
        html: paymentFailedHtml(reason, updateUrl),
      });
    } catch (err) {
      this.logger.error(`Failed to send payment-failed email to ${to}`, err);
    }
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Redefinição de senha — Tracker Hub',
        html: passwordResetHtml(resetUrl),
      });
      this.logger.log(`Password-reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send password-reset email to ${to}`, err);
    }
  }

  /**
   * Envia o e-mail de boas-vindas após checkout.
   * Ao contrário de sendPaymentFailed (fire-and-forget de webhook), este método
   * propaga o erro — o controller precisa saber se o envio falhou para retornar
   * 500 ao chamador e alertar sobre a não-entrega do link de cadastro.
   */
  async sendCheckoutWelcome(to: string, registerUrl: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Bem-vindo ao Tracker Hub! Crie sua conta agora',
        html: checkoutWelcomeHtml(registerUrl),
      });

      if (error) {
        throw new Error(`Resend error: ${JSON.stringify(error)}`);
      }

      this.logger.log(`Checkout-welcome email sent to ${to} — id: ${data?.id}`);
    } catch (err) {
      this.logger.error(`Failed to send checkout-welcome email to ${to}`, err);
      throw err; // propaga para o controller — este e-mail é crítico
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function paymentFailedHtml(reason: string, updateUrl: string): string {
  const safeReason = escapeHtml(reason)
  const safeUpdateUrl = escapeHtml(updateUrl)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Falha no pagamento — Tracker Hub</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .header { background: #ef4444; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; }
    .body { padding: 32px 40px; }
    .body p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; }
    .reason { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; color: #991b1b; font-size: 14px; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500; }
    .footer { padding: 20px 40px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Falha no pagamento</h1></div>
    <div class="body">
      <p>Identificamos uma falha ao processar o pagamento da sua assinatura no <strong>Tracker Hub</strong>.</p>
      <div class="reason">${safeReason}</div>
      <p>Você tem <strong>3 dias</strong> para atualizar sua forma de pagamento antes que o acesso seja bloqueado.</p>
      <p><a href="${safeUpdateUrl}" class="btn">Atualizar forma de pagamento</a></p>
      <p>Se precisar de ajuda, entre em contato com nosso suporte.</p>
    </div>
    <div class="footer">Tracker Hub &mdash; e-mail automático.</div>
  </div>
</body>
</html>`;
}

function passwordResetHtml(resetUrl: string): string {
  const safeResetUrl = escapeHtml(resetUrl);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de senha — Tracker Hub</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .header { background: #1d1d1f; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; }
    .body { padding: 32px 40px; }
    .body p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 28px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; }
    .footer { padding: 20px 40px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Tracker Hub</h1></div>
    <div class="body">
      <p>Recebemos uma solicitação de redefinição de senha para sua conta no <strong>Tracker Hub</strong>.</p>
      <p>Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>30 minutos</strong>.</p>
      <p><a href="${safeResetUrl}" class="btn">Redefinir minha senha</a></p>
      <p>Se o botão não funcionar, copie e cole este link no navegador:<br /><a href="${safeResetUrl}">${safeResetUrl}</a></p>
      <p>Se você não solicitou esta redefinição, ignore este e-mail. Sua senha permanece a mesma.</p>
    </div>
    <div class="footer">Tracker Hub &mdash; e-mail automático.</div>
  </div>
</body>
</html>`;
}

function checkoutWelcomeHtml(registerUrl: string): string {
  const safeRegisterUrl = escapeHtml(registerUrl)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao Tracker Hub!</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .header { background: #1d1d1f; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; }
    .body { padding: 32px 40px; }
    .body p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 28px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; }
    .footer { padding: 20px 40px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Tracker Hub ✓</h1></div>
    <div class="body">
      <p>Sua contratação foi realizada com sucesso!</p>
      <p>Clique no botão abaixo para criar sua conta de administrador e começar a usar a plataforma.</p>
      <p><a href="${safeRegisterUrl}" class="btn">Criar minha conta</a></p>
      <p>Se o botão não funcionar, copie e cole este link no navegador:<br /><a href="${safeRegisterUrl}">${safeRegisterUrl}</a></p>
    </div>
    <div class="footer">Tracker Hub &mdash; e-mail automático.</div>
  </div>
</body>
</html>`;
}
