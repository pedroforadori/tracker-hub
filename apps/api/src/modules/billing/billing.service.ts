import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from '../../stripe/stripe.module';
import { BillingCacheEntry, BillingCacheService } from './billing-cache.service';
import { BillingRepository } from './billing.repository';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly repo: BillingRepository,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe.Stripe,
    private readonly cache: BillingCacheService,
  ) {
    // Fail fast if Stripe is configured (secret key present) but price ID is missing
    const priceId = this.config.get<string>('STRIPE_PRICE_ID');
    if (!priceId) {
      this.logger.warn(
        'STRIPE_PRICE_ID is not set — subscription creation will be skipped. ' +
          'Set this variable in production to enable billing.',
      );
    }
  }

  /**
   * Returns the cached billing status for a tenant, refreshing from the DB on a
   * cache miss. Used by JwtAuthGuard on every authenticated request.
   */
  async getBillingStatusCached(tenantId: string): Promise<BillingCacheEntry | null> {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;

    const tenant = await this.repo.findById(tenantId);
    if (!tenant) return null;

    const entry: BillingCacheEntry = {
      planStatus: tenant.planStatus,
      blockReason: tenant.blockReason,
      gracePeriodEndsAt: tenant.gracePeriodEndsAt,
    };
    this.cache.set(tenantId, entry);
    return entry;
  }

  /**
   * Promotes a PAST_DUE tenant whose grace period has expired to BLOCKED.
   * Called fire-and-forget from JwtAuthGuard — errors are logged but not thrown.
   */
  async promoteExpiredToBlocked(tenantId: string): Promise<void> {
    try {
      await this.repo.setBlocked(tenantId);
      this.cache.invalidate(tenantId);
      this.logger.log(`Tenant ${tenantId} promoted to BLOCKED (grace period expired)`);
    } catch (err) {
      this.logger.error(`Failed to promote tenant ${tenantId} to BLOCKED`, err);
    }
  }

  async getStatus(tenantId: string) {
    const tenant = await this.repo.findById(tenantId);
    if (!tenant) return null;

    let lastFour: string | null = null;
    let cardBrand: string | null = null;

    if (tenant.stripePaymentMethodId) {
      try {
        const pm = await this.stripe.paymentMethods.retrieve(tenant.stripePaymentMethodId);
        lastFour = pm.card?.last4 ?? null;
        cardBrand = pm.card?.brand ?? null;
      } catch {
        // PM may have been detached — ignore
      }
    }

    return {
      status: tenant.planStatus,
      blockReason: tenant.blockReason,
      gracePeriodEndsAt: tenant.gracePeriodEndsAt?.toISOString() ?? null,
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      lastFour,
      cardBrand,
    };
  }

  async createSetupIntent(tenantId: string) {
    const tenant = await this.repo.findById(tenantId);
    if (!tenant?.stripeCustomerId) {
      throw new BadRequestException('Stripe customer not found for this tenant.');
    }

    const intent = await this.stripe.setupIntents.create({
      customer: tenant.stripeCustomerId,
      payment_method_types: ['card'],
    });

    return { clientSecret: intent.client_secret };
  }

  async updatePaymentMethod(tenantId: string, paymentMethodId: string) {
    const tenant = await this.repo.findById(tenantId);
    if (!tenant?.stripeCustomerId || !tenant.stripeSubscriptionId) {
      throw new BadRequestException('Stripe customer or subscription not found.');
    }

    // Verify that the payment method is not already attached to a different customer (IDOR guard)
    const pm = await this.stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer && pm.customer !== tenant.stripeCustomerId) {
      throw new BadRequestException('Payment method does not belong to this customer.');
    }

    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: tenant.stripeCustomerId,
    });

    await this.stripe.customers.update(tenant.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    await this.stripe.subscriptions.update(tenant.stripeSubscriptionId, {
      default_payment_method: paymentMethodId,
    });

    // Attempt to pay any open invoice immediately
    const invoices = await this.stripe.invoices.list({
      customer: tenant.stripeCustomerId,
      status: 'open',
      limit: 1,
    });
    if (invoices.data.length > 0) {
      try {
        await this.stripe.invoices.pay(invoices.data[0].id);
      } catch (err) {
        this.logger.warn(`Could not immediately pay open invoice: ${(err as Error).message}`);
      }
    }

    await this.repo.savePaymentMethod(tenantId, paymentMethodId);
  }

  async createCustomerAndSubscription(
    tenantId: string,
    email: string,
    name: string,
  ): Promise<void> {
    const priceId = this.config.get<string>('STRIPE_PRICE_ID');
    if (!priceId) {
      this.logger.warn('STRIPE_PRICE_ID not set — skipping Stripe subscription creation');
      return;
    }

    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { tenantId },
    });

    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 14,
    });

    const trialEndsAt = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await this.repo.saveStripeIds(tenantId, {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      trialEndsAt,
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: Record<string, any>;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) as Record<string, any>;
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    // Idempotency: skip events already processed in this process lifetime.
    // NOTE: not distributed-safe — use a shared store (Redis / DB) for multi-instance deploys.
    const eventId = event.id as string;
    if (this.processedEvents.has(eventId)) {
      this.logger.debug(`Skipping duplicate Stripe event: ${eventId}`);
      return;
    }
    this.processedEvents.add(eventId);
    if (this.processedEvents.size > BillingService.MAX_PROCESSED_EVENTS) {
      this.processedEvents.delete(this.processedEvents.values().next().value as string);
    }

    const obj = event.data?.object as Record<string, unknown> | undefined;
    if (!obj) return;

    switch (event.type as string) {
      case 'invoice.payment_failed': {
        const subscriptionId = this.extractId(obj['subscription']);
        if (!subscriptionId) break;

        const tenant = await this.repo.findByStripeSubscriptionId(subscriptionId);
        if (!tenant) break;

        const reason =
          (obj['last_payment_error'] as { message?: string } | undefined)?.message ??
          'Cobrança recusada pelo banco emissor do cartão';

        await this.repo.setPastDue(tenant.id, reason);
        this.cache.invalidate(tenant.id);

        const admin = await this.repo.findAdminEmail(tenant.id);
        if (admin?.email) {
          const webUrl = this.config.get<string>('WEB_URL', 'http://localhost:5173');
          await this.mail.sendPaymentFailed(admin.email, reason, `${webUrl}/billing`);
        }
        break;
      }

      case 'invoice.paid': {
        const subscriptionId = this.extractId(obj['subscription']);
        if (!subscriptionId) break;

        const tenant = await this.repo.findByStripeSubscriptionId(subscriptionId);
        if (tenant) {
          await this.repo.setActive(tenant.id);
          this.cache.invalidate(tenant.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscriptionId = this.extractId(obj['id']);
        if (!subscriptionId) break;

        const tenant = await this.repo.findByStripeSubscriptionId(subscriptionId);
        if (tenant) {
          await this.repo.setBlocked(tenant.id);
          this.cache.invalidate(tenant.id);
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type as string}`);
    }
  }

  // Bounded in-memory set for per-process webhook idempotency
  private readonly processedEvents = new Set<string>();
  private static readonly MAX_PROCESSED_EVENTS = 2000;

  private extractId(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'id' in value) return (value as { id: string }).id;
    return null;
  }
}
