import Site from '@/components/Site';
import { getSiteData } from '@/lib/site-data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { products, content } = await getSiteData();
  return <Site products={products} content={content} />;
}
