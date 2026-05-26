import { timingSafeEqual } from 'crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Public } from '../../auth/public.decorator';
import { STRIPE_CLIENT } from '../../stripe/stripe.module';
import { CheckoutWelcomeDto } from './dto/checkout-welcome.dto';
import { MailService } from './mail.service';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe.Stripe,
  ) {}

  /**
   * Endpoint interno chamado pela landing-page após checkout bem-sucedido.
   *
   * Segurança em camadas:
   *  1. Cabeçalho `x-internal-secret` autentica chamadas server-to-server
   *     usando comparação timing-safe para evitar timing side-channel.
   *  2. O `sessionId` é validado diretamente no Stripe — o e-mail só é enviado
   *     se `payment_status === 'paid'`, impedindo que qualquer chamador externo
   *     dispare e-mails para endereços arbitrários.
   *  3. Idempotência via metadata da sessão Stripe — recarregamentos da página
   *     de sucesso não reenviam o e-mail.
   */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('checkout-welcome')
  @HttpCode(200)
  @ApiOperation({ summary: 'Envia e-mail de boas-vindas pós-checkout (endpoint interno)' })
  @ApiHeader({ name: 'x-internal-secret', required: true, description: 'Segredo compartilhado entre landing-page e API' })
  async checkoutWelcome(
    @Headers('x-internal-secret') secret: string,
    @Body() dto: CheckoutWelcomeDto,
  ) {
    // 1. Timing-safe secret validation
    const expectedSecret = this.config.get<string>('INTERNAL_API_SECRET', '');
    if (!expectedSecret || !this.isValidSecret(secret, expectedSecret)) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    // 2. Recupera e valida a sessão no Stripe
    let session: Awaited<ReturnType<Stripe.Stripe['checkout']['sessions']['retrieve']>>;
    try {
      session = await this.stripe.checkout.sessions.retrieve(dto.sessionId);
    } catch (err) {
      this.logger.error(`Failed to retrieve Stripe session "${dto.sessionId}"`, err);
      throw new BadRequestException('Invalid or expired session ID');
    }

    if (session.payment_status !== 'paid') {
      this.logger.warn(`Session "${dto.sessionId}" payment_status=${session.payment_status} — e-mail não enviado`);
      throw new BadRequestException('Session payment not completed');
    }

    // 3. Idempotência: sessão já processada não reenvia o e-mail
    if (session.metadata?.emailSent === 'true') {
      this.logger.log(`Session "${dto.sessionId}" já processada — e-mail ignorado`);
      return { ok: true, skipped: true };
    }

    const email = session.customer_details?.email;
    if (!email) {
      this.logger.error(`Session "${dto.sessionId}" não tem customer_details.email`);
      throw new BadRequestException('No customer email found in session');
    }

    // 4. Envia o e-mail de boas-vindas
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:5173');
    try {
      await this.mail.sendCheckoutWelcome(email, `${webUrl}/cadastro`);
    } catch (err) {
      this.logger.error('checkout-welcome email send failed', err);
      throw new InternalServerErrorException('Failed to send welcome email');
    }

    // 5. Marca a sessão como processada (best-effort — falha não bloqueia a resposta)
    try {
      await this.stripe.checkout.sessions.update(dto.sessionId, {
        metadata: { emailSent: 'true' },
      });
    } catch (err) {
      this.logger.warn(`Could not mark session "${dto.sessionId}" as processed in Stripe`, err);
    }

    return { ok: true };
  }

  /** Compara secrets usando timing-safe equal para evitar side-channel timing attacks. */
  private isValidSecret(provided: string, expected: string): boolean {
    try {
      const a = Buffer.from(provided ?? '');
      const b = Buffer.from(expected);
      // timingSafeEqual exige buffers do mesmo tamanho — comparação de tamanhos primeiro
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
