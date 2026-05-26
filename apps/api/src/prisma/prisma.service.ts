import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'Missing DATABASE_URL environment variable. Set it in your .env file.',
      );
    }

    // The adapter replaces the `url` property that was previously read from
    // schema.prisma. With `prisma.config.ts` present, the datasource block
    // no longer accepts `url` (engines v7+), so the connection is passed here.
    const adapter = new PrismaPg(connectionString);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
