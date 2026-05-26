import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Token de injeção para o cliente Stripe compartilhado.
 * Use `@Inject(STRIPE_CLIENT)` nos providers que precisam do Stripe.
 */
export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

/**
 * Módulo global que provê uma única instância do cliente Stripe para toda a aplicação.
 * Elimina a necessidade de cada serviço criar sua própria instância.
 */
@Global()
@Module({
  providers: [
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Stripe =>
        new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY')),
    },
  ],
  exports: [STRIPE_CLIENT],
})
export class StripeModule {}
