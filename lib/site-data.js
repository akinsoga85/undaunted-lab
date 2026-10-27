import 'server-only';
import { unstable_cache } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { getDb, schema } from './db';
import { DEFAULT_PRODUCTS, DEFAULT_CONTENT } from './defaults';

export function mergeContent(stored) {
  const out = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  const walk = (dst, src) => {
    for (const k of Object.keys(src || {})) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) walk(dst[k], src[k]);
      else if (src[k] !== undefined && src[k] !== null) dst[k] = src[k];
    }
  };
  walk(out, stored);
  return out;
}

async function load() {
  const db = await getDb();
  const rows = await db.select().from(schema.products).orderBy(asc(schema.products.sort), asc(schema.products.name));
  const [c] = await db.select().from(schema.siteContent).where(eq(schema.siteContent.id, 1));
  return {
    products: rows.filter((p) => p.visible).map(({ updatedAt, ...p }) => p),
    content: mergeContent(c ? c.data : null)
  };
}

// Cached and tagged: the admin calls revalidateTag('site') after every save.
// A failed load is not cached; visitors see the built-in defaults until the database answers.
const cached = unstable_cache(load, ['site-data-v1'], { tags: ['site'], revalidate: 3600 });
export async function getSiteData() {
  try { return await cached(); } catch (e) {
    console.error('[site-data] using defaults:', e.message);
    return { products: DEFAULT_PRODUCTS, content: DEFAULT_CONTENT };
  }
}
