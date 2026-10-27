import 'server-only';
import { sql, count } from 'drizzle-orm';
import * as schema from './schema';
import { DEFAULT_PRODUCTS, DEFAULT_CONTENT } from '../defaults';

// Production: Postgres on Neon (DATABASE_URL). Local development: an embedded Postgres (PGlite)
// stored in ./.data, so `npm run dev` works with no setup.
async function connect() {
  if (process.env.DATABASE_URL) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    return drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  if (process.env.VERCEL) throw new Error('DATABASE_URL is not set. Add a Neon Postgres database in Vercel → Storage.');
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const dir = process.env.PGLITE_DIR || '.data/pglite';
  (await import('node:fs')).mkdirSync(dir, { recursive: true });
  return drizzle(new PGlite(dir), { schema });
}

async function setup(db) {
  for (const stmt of schema.DDL) await db.execute(sql.raw(stmt));
  const [{ n }] = await db.select({ n: count() }).from(schema.products);
  if (Number(n) === 0) {
    await db.insert(schema.products).values(DEFAULT_PRODUCTS.map((p) => ({ ...p }))).onConflictDoNothing();
  }
  await db.insert(schema.siteContent).values({ id: 1, data: DEFAULT_CONTENT }).onConflictDoNothing();
  return db;
}

export function getDb() {
  const g = globalThis;
  if (!g.__ulDb) g.__ulDb = connect().then(setup).catch((e) => { g.__ulDb = null; throw e; });
  return g.__ulDb;
}

export { schema };
