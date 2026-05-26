import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration.
 *
 * A partir do Prisma 7, `url` e `directUrl` foram removidos do bloco `datasource`
 * no schema.prisma. As URLs de conexão são fornecidas aqui via driver adapter.
 *
 * O adapter é usado pelo CLI (`prisma migrate`, `prisma generate`) e pelo runtime
 * (`PrismaService`). Cada um cria sua própria instância (CLI usa DIRECT_URL quando
 * disponível para conexão direta; runtime usa DATABASE_URL).
 *
 * - DIRECT_URL → conexão direta (non-pooler) para migrate/generate (Supabase).
 * - DATABASE_URL → pooler URL para runtime (app em produção).
 *
 * @see https://pris.ly/d/config-datasource
 * @see https://pris.ly/d/prisma7-client-config
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),

  adapter: async () => {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'Missing database connection string. ' +
          'Set DIRECT_URL (preferred for migrations) or DATABASE_URL in your .env file.',
      );
    }

    return new PrismaPg(connectionString);
  },
});
