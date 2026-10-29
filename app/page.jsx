import Site from '@/components/Site';
import { getSiteData } from '@/lib/site-data';
import { getPublishedPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';
// Points search engines at undauntedlab.com, so the .vercel.app copy never competes with it.
export const metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const [{ products, content }, posts] = await Promise.all([getSiteData(), getPublishedPosts().catch(() => [])]);
  return <Site products={products} content={content} posts={posts.map(({ slug, title, tag, summary }) => ({ slug, title, tag, summary }))} />;
}
