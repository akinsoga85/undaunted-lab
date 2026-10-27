import { asc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { SLOTS, STATUS, STYLES } from '@/lib/defaults';
import { toggleProduct, moveProduct, deleteProduct } from '../../actions';
import Confirm from '@/components/admin/Confirm';

export default async function Products({ searchParams }) {
  const db = await getDb();
  const rows = await db.select().from(schema.products).orderBy(asc(schema.products.sort), asc(schema.products.name));
  const used = new Set(rows.map((r) => r.slot));
  const free = Object.entries(SLOTS).filter(([k]) => !used.has(k));
  return (
    <>
      <div className="a-head">
        <div><h1>Products & map</h1><p>Everything on the map. Order sets the plane’s tour. Changes go live straight away.</p></div>
        <a className="a-btn" href="/admin/products/new">Add a product</a>
      </div>
      {searchParams?.saved && <div className="a-note ok" role="status">Saved. The live site is updated.</div>}
      {searchParams?.removed && <div className="a-note ok" role="status">Removed from the map.</div>}
      <section className="a-card">
        <div className="a-table-wrap"><table className="a-table">
          <thead><tr><th>Order</th><th>Product</th><th>Status</th><th>Place on map</th><th>On map</th><th>In tour</th><th><span className="sr">Actions</span></th></tr></thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id}>
                <td>
                  <div className="a-actions">
                    <form action={moveProduct}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="up" /><button className="a-icon" disabled={i === 0} aria-label={`Move ${p.name} up`}>↑</button></form>
                    <form action={moveProduct}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="down" /><button className="a-icon" disabled={i === rows.length - 1} aria-label={`Move ${p.name} down`}>↓</button></form>
                  </div>
                </td>
                <td><span className="a-dot" style={{ background: p.color }} /> <strong>{p.name}</strong><br /><span className="a-muted">{p.line}</span></td>
                <td><span className={`a-pill ${p.status}`}>{STATUS[p.status] || p.status}</span></td>
                <td>{SLOTS[p.slot]?.label || p.slot}{SLOTS[p.slot]?.generic && <><br /><span className="a-muted">{STYLES[p.style]}</span></>}</td>
                <td>
                  <form action={toggleProduct}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value="visible" />
                    <button className="a-toggle" aria-label={`${p.visible ? 'Hide' : 'Show'} ${p.name}`}><span className={`a-pill ${p.visible ? 'live' : 'off'}`}>{p.visible ? 'Shown' : 'Hidden'}</span></button></form>
                </td>
                <td>
                  {p.status === 'coming_soon' ? <span className="a-muted">—</span> : (
                    <form action={toggleProduct}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value="tour" />
                      <button className="a-toggle" aria-label={`${p.inTour ? 'Remove' : 'Add'} ${p.name} ${p.inTour ? 'from' : 'to'} the tour`}><span className={`a-pill ${p.inTour ? 'live' : 'off'}`}>{p.inTour ? 'Yes' : 'No'}</span></button></form>
                  )}
                </td>
                <td>
                  <div className="a-actions">
                    <a className="a-btn ghost small" href={`/admin/products/${p.id}`}>Edit</a>
                    <Confirm action={deleteProduct} id={p.id} label="Remove" confirmLabel={`Remove ${p.name}?`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
      <section className="a-card">
        <h2>Free places on the map</h2>
        {free.length === 0 ? <p className="a-muted">Every place is in use. Remove or move a product to free one.</p> : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>{free.map(([k, s]) => <li key={k}>{s.label}{s.isle && <span className="a-muted"> — the island and its bridge appear once a product is placed here</span>}</li>)}</ul>
        )}
      </section>
    </>
  );
}
