import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private static readonly logger = new Logger('PrismaService');

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'Missing DATABASE_URL environment variable. Set it in your .env file.',
      );
    }

    // Strip Prisma-specific query params (e.g. ?pgbouncer=true) that the
    // native `pg` driver does not understand and would cause a parse error.
    const url = new URL(connectionString);
    url.searchParams.delete('pgbouncer');
    url.searchParams.delete('connection_limit');
    const cleanConnectionString = url.toString();

    // In production (Vercel / Supabase) SSL is required.
    // `rejectUnauthorized: false` trusts the server cert without CA verification,
    // which is standard for PaaS PostgreSQL deployments.
    const isProd = process.env.NODE_ENV === 'production';
    const pool = new Pool({
      connectionString: cleanConnectionString,
      ...(isProd && { ssl: { rejectUnauthorized: false } }),
    });

    // Surface pool-level errors instead of letting them crash the process.
    pool.on('error', (err) => {
      PrismaService.logger.error('pg pool error:', err.message);
    });

    const adapter = new PrismaPg(pool, { disposeExternalPool: true });
    super({ adapter });
  }

  async onModuleInit() {
    // With Prisma 7 driver adapters, $connect() is optional — the pg.Pool
    // establishes connections lazily on the first query.
    // We still attempt early connection so failures surface in logs at startup
    // rather than silently on the first request, but we swallow the error here
    // to prevent onModuleInit from rejecting the NestJS bootstrap promise,
    // which would crash every Vercel cold-start invocation with
    // FUNCTION_INVOCATION_FAILED before any request is even handled.
    try {
      await this.$connect();
    } catch (err) {
      PrismaService.logger.error(
        `pg.Pool initial connection failed — queries will retry on first use. ` +
          `Cause: ${(err as Error).message}`,
      );
    }
  }
}
