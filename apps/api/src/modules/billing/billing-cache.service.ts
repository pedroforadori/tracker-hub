import { Injectable } from '@nestjs/common';
import { PlanStatus } from '@prisma/client';

export interface BillingCacheEntry {
  planStatus: PlanStatus;
  blockReason: string | null;
  gracePeriodEndsAt: Date | null;
}

interface StoredEntry extends BillingCacheEntry {
  expiresAt: number;
}

const CACHE_TTL_MS = 15_000;

/**
 * In-process billing status cache.
 *
 * NOTE: This cache is per-process. In multi-instance deployments, invalidation
 * is not propagated across instances. The 15-second TTL limits the maximum
 * drift. For true consistency at scale, replace with a shared Redis cache.
 */
@Injectable()
export class BillingCacheService {
  private readonly cache = new Map<string, StoredEntry>();

  get(tenantId: string): BillingCacheEntry | undefined {
    const entry = this.cache.get(tenantId);
    if (!entry) return undefined;
    if (entry.expiresAt > Date.now()) {
      const { expiresAt: _, ...data } = entry;
      return data;
    }
    this.cache.delete(tenantId);
    return undefined;
  }

  set(tenantId: string, data: BillingCacheEntry): void {
    this.cache.set(tenantId, { ...data, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
  }
}
