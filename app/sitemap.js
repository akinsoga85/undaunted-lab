// Served at /sitemap.xml: the map (the panels, #story, #notes …, are parts of it, not pages) and every published Lab note.
import { siteUrl, PUBLIC_URL } from '@/lib/site-url';
import { getPublishedPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';

const SITE = siteUrl() || PUBLIC_URL;

export default async function sitemap() {
  const posts = await getPublishedPosts().catch(() => []);
  return [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    ...posts.map((p) => ({ url: `${SITE}/notes/${p.slug}`, lastModified: new Date(p.updatedAt || p.publishedAt), changeFrequency: 'monthly', priority: 0.7 }))
  ];
}
