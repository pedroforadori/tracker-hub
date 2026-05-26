import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const datasourceUrl = process.env.DATABASE_URL;

    if (!datasourceUrl) {
      throw new Error(
        'Missing DATABASE_URL environment variable. Set it in your .env file.',
      );
    }

    // Pass the connection URL explicitly via `datasourceUrl` instead of
    // relying on the `url` property in schema.prisma (removed in engines v7+
    // when prisma.config.ts is present).
    super({ datasourceUrl });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
