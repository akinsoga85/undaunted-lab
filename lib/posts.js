import 'server-only';
import { unstable_cache } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from './db';

// Published Lab notes for the panel and the sitemap. Cached with the rest of the site: admin saves revalidate 'site'.
// Dates come back from the cache as strings.
export const getPublishedPosts = unstable_cache(async () => {
  const db = await getDb();
  const p = schema.posts;
  return db.select({ slug: p.slug, title: p.title, tag: p.tag, summary: p.summary, publishedAt: p.publishedAt, updatedAt: p.updatedAt })
    .from(p).where(eq(p.published, true)).orderBy(desc(p.publishedAt));
}, ['posts-v1'], { tags: ['site'], revalidate: 3600 });

// One note by slug, published or not; the page decides who may see a draft.
export async function getPost(slug) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const db = await getDb();
  const [row] = await db.select().from(schema.posts).where(eq(schema.posts.slug, slug));
  return row || null;
}
