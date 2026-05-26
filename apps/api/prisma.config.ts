import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma configuration file — required from Prisma engines v7+.
 *
 * The `url` / `directUrl` properties were removed from the `datasource` block in
 * schema.prisma when `prisma.config.ts` is present. Connection URLs must be
 * provided here instead.
 *
 * `engine: 'classic'` keeps the battle-tested Rust-based schema engine for
 * migrations and introspection.
 *
 * - `datasource.url`       → pooler URL used by the schema engine at runtime.
 * - `datasource.directUrl` → direct (non-pooler) URL for migrate/generate
 *                            (required by Supabase; falls back to url if unset).
 *
 * @see https://pris.ly/d/config-datasource
 * @see https://pris.ly/d/prisma7-client-config
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),

  engine: 'classic',

  datasource: {
    url: process.env.DATABASE_URL ?? '',
    directUrl: process.env.DIRECT_URL,
  },
});
