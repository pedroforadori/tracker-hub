import { Injectable } from '@nestjs/common';
import { PlanStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByStripeSubscriptionId(stripeSubscriptionId: string) {
    return this.prisma.tenant.findFirst({
      where: { stripeSubscriptionId },
      select: {
        id: true,
        planStatus: true,
        blockReason: true,
        gracePeriodEndsAt: true,
        stripeCustomerId: true,
        stripePaymentMethodId: true,
        stripeSubscriptionId: true,
        trialEndsAt: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      select: {
        planStatus: true,
        blockReason: true,
        gracePeriodEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePaymentMethodId: true,
        trialEndsAt: true,
      },
    });
  }

  findAdminEmail(tenantId: string) {
    return this.prisma.user.findFirst({
      where: { tenantId, role: 'ADMIN' },
      select: { email: true },
    });
  }

  setPastDue(id: string, blockReason: string) {
    const gracePeriodEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return this.prisma.tenant.update({
      where: { id },
      data: { planStatus: PlanStatus.PAST_DUE, blockReason, gracePeriodEndsAt, blockedAt: null },
    });
  }

  setBlocked(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { planStatus: PlanStatus.BLOCKED, blockedAt: new Date() },
    });
  }

  setActive(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        planStatus: PlanStatus.ACTIVE,
        blockReason: null,
        blockedAt: null,
        gracePeriodEndsAt: null,
      },
    });
  }

  saveStripeIds(
    id: string,
    data: {
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      trialEndsAt: Date;
    },
  ) {
    return this.prisma.tenant.update({
      where: { id },
      data: { ...data, planStatus: PlanStatus.TRIALING },
    });
  }

  savePaymentMethod(id: string, stripePaymentMethodId: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { stripePaymentMethodId },
    });
  }
}
