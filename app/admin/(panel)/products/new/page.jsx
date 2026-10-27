import { getDb, schema } from '@/lib/db';
import { SLOTS } from '@/lib/defaults';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProduct() {
  const db = await getDb();
  const used = (await db.select({ slot: schema.products.slot }).from(schema.products)).map((r) => r.slot);
  const free = Object.keys(SLOTS).filter((k) => !used.includes(k));
  if (!free.length) {
    return (
      <>
        <div className="a-head"><h1>Add a product</h1></div>
        <div className="a-note info">Every place on the map is in use. Remove a product or move one to free a place first.</div>
        <a className="a-btn ghost" href="/admin/products">Back to products</a>
      </>
    );
  }
  const blank = { id: '', name: '', line: '', place: '', status: 'live', color: '#5BB8E6', url: 'https://', cta: 'Visit ↗', slot: free[0], style: 'tower', visible: true, inTour: true };
  return (
    <>
      <div className="a-head"><div><h1>Add a product</h1><p>Pick a free place on the map. Open plots and new islands get a building in the style you choose.</p></div></div>
      <ProductForm product={blank} usedSlots={used} />
    </>
  );
}
