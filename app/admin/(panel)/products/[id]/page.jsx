import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import ProductForm from '@/components/admin/ProductForm';

export default async function EditProduct({ params }) {
  const db = await getDb();
  const [p] = await db.select().from(schema.products).where(eq(schema.products.id, params.id));
  if (!p) notFound();
  const used = (await db.select({ slot: schema.products.slot }).from(schema.products)).map((r) => r.slot);
  const { updatedAt, sort, ...product } = p;
  return (
    <>
      <div className="a-head"><div><h1>Edit {p.name}</h1><p>Last changed {new Date(updatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.</p></div></div>
      <ProductForm product={product} usedSlots={used} />
    </>
  );
}
