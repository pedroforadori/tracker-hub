import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { Public } from '../../auth/public.decorator';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import type { CurrentUser } from '../../common/types/current-user.type';
import { BillingService } from './billing.service';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('status')
  getStatus(@CurrentUserDecorator() user: CurrentUser) {
    return this.billing.getStatus(user.tenantId);
  }

  @Post('setup-intent')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createSetupIntent(@CurrentUserDecorator() user: CurrentUser) {
    return this.billing.createSetupIntent(user.tenantId);
  }

  @Post('payment-method')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  updatePaymentMethod(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.billing.updatePaymentMethod(user.tenantId, dto.paymentMethodId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleWebhook(@Req() req: any) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody as Buffer | undefined;

    if (!signature) throw new BadRequestException('Missing stripe-signature header.');
    if (!rawBody || rawBody.length === 0) throw new BadRequestException('Missing or empty request body.');

    await this.billing.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
