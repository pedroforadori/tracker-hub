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
    await this.$connect();
  }
}
