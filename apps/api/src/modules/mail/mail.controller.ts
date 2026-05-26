import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
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
import { CheckoutWelcomeDto } from './dto/checkout-welcome.dto';
import { MailService } from './mail.service';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  private readonly logger = new Logger(MailController.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {
    const stripeKey = this.config.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeKey);
  }

  /**
   * Endpoint interno chamado pela landing-page após checkout bem-sucedido.
   *
   * Segurança em camadas:
   *  1. Cabeçalho `x-internal-secret` autentica chamadas server-to-server.
   *  2. O `sessionId` é validado diretamente no Stripe — o e-mail só é enviado
   *     se `payment_status === 'paid'`, impedindo que qualquer chamador externo
   *     dispare e-mails para endereços arbitrários.
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
    // 1. Valida o segredo interno
    const expectedSecret = this.config.get<string>('INTERNAL_API_SECRET', '');
    if (!expectedSecret || secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    // 2. Recupera e valida a sessão no Stripe
    let session: Stripe.Checkout.Session;
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

    const email = session.customer_details?.email;
    if (!email) {
      this.logger.error(`Session "${dto.sessionId}" não tem customer_details.email`);
      throw new BadRequestException('No customer email found in session');
    }

    // 3. Envia o e-mail de boas-vindas
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:5173');
    try {
      await this.mail.sendCheckoutWelcome(email, `${webUrl}/cadastro`);
    } catch (err) {
      this.logger.error('checkout-welcome email send failed', err);
      throw new InternalServerErrorException('Failed to send welcome email');
    }

    return { ok: true };
  }
}
