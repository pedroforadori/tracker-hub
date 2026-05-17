-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'BLOCKED', 'CANCELED');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "planStatus"            "PlanStatus" NOT NULL DEFAULT 'TRIALING',
ADD COLUMN     "stripeCustomerId"      TEXT,
ADD COLUMN     "stripeSubscriptionId"  TEXT,
ADD COLUMN     "stripePaymentMethodId" TEXT,
ADD COLUMN     "blockReason"           TEXT,
ADD COLUMN     "gracePeriodEndsAt"     TIMESTAMP(3),
ADD COLUMN     "blockedAt"             TIMESTAMP(3),
ADD COLUMN     "trialEndsAt"           TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeSubscriptionId_key" ON "Tenant"("stripeSubscriptionId");
