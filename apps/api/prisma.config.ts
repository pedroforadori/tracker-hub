import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 CLI configuration.
 *
 * No Prisma 7, `url` e `directUrl` saíram do bloco `datasource` do schema.prisma
 * e passam a ser configurados aqui. Esta configuração é usada apenas pelo CLI
 * (`prisma generate`, `prisma migrate`) — não pelo PrismaClient em runtime.
 *
 * O PrismaClient em runtime recebe o adapter diretamente no constructor
 * (ver `src/prisma/prisma.service.ts`).
 *
 * - DIRECT_URL → conexão direta (non-pooler) para migrate/generate (Supabase).
 * - DATABASE_URL → fallback para dev local / Docker.
 *
 * @see https://pris.ly/d/config-datasource
 * @see https://pris.ly/d/prisma7-client-config
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),

  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
