import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { json } from 'express';
import { BillingCacheService } from './billing-cache.service';
import { BillingController } from './billing.controller';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';

// Parses raw body for Stripe webhook signature verification
function rawBodyMiddleware(req: any, _res: any, next: any) {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
  req.on('error', next);
}

@Module({
  controllers: [BillingController],
  providers: [BillingCacheService, BillingRepository, BillingService],
  exports: [BillingCacheService, BillingService],
})
export class BillingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(rawBodyMiddleware)
      .forRoutes({ path: 'billing/webhook', method: RequestMethod.POST });

    // Re-apply json parser for all other billing routes
    consumer
      .apply(json())
      .exclude({ path: 'billing/webhook', method: RequestMethod.POST })
      .forRoutes({ path: 'billing/*', method: RequestMethod.ALL });
  }
}
