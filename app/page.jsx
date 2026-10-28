import Site from '@/components/Site';
import { getSiteData } from '@/lib/site-data';

export const dynamic = 'force-dynamic';
// Points search engines at undauntedlab.com, so the .vercel.app copy never competes with it.
export const metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const { products, content } = await getSiteData();
  return <Site products={products} content={content} />;
}
