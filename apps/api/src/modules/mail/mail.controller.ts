import { Body, Controller, HttpCode, InternalServerErrorException, Logger, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../auth/public.decorator';
import { CheckoutWelcomeDto } from './dto/checkout-welcome.dto';
import { MailService } from './mail.service';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('checkout-welcome')
  @HttpCode(200)
  @ApiOperation({ summary: 'Envia e-mail de boas-vindas pós-checkout' })
  async checkoutWelcome(@Body() dto: CheckoutWelcomeDto) {
    const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:5173');
    try {
      await this.mail.sendCheckoutWelcome(dto.email, `${webUrl}/cadastro`);
    } catch (err) {
      this.logger.error('checkout-welcome failed', err);
      throw new InternalServerErrorException((err as Error).message);
    }
    return { ok: true };
  }
}
