import { desc, eq, count } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { getAnalytics } from '@/lib/analytics';
import { DailyBars } from '@/components/admin/Charts';

export default async function Dashboard() {
  const db = await getDb();
  const [a, recent, [{ n: unread }], [{ n: productsLive }]] = await Promise.all([
    getAnalytics(30),
    db.select().from(schema.messages).orderBy(desc(schema.messages.createdAt)).limit(4),
    db.select({ n: count() }).from(schema.messages).where(eq(schema.messages.read, false)),
    db.select({ n: count() }).from(schema.products).where(eq(schema.products.visible, true))
  ]);
  const last7 = a.series.slice(-7).reduce((s, d) => s + d.views, 0);
  const prev7 = a.series.slice(-14, -7).reduce((s, d) => s + d.views, 0);
  const change = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : null;
  const names = Object.fromEntries((await db.select({ id: schema.products.id, name: schema.products.name }).from(schema.products)).map((p) => [p.id, p.name]));
  const top = a.products[0];
  return (
    <>
      <div className="a-head">
        <div><h1>Dashboard</h1><p>How the site is doing over the last 30 days.</p></div>
        <a className="a-btn" href="/admin/products/new">Add a product</a>
      </div>
      <div className="a-grid">
        <div className="a-card a-kpi"><span>Views, last 7 days</span><strong>{last7}</strong><small>{change == null ? 'No earlier week to compare yet' : `${change >= 0 ? '+' : ''}${change}% on the week before`}</small></div>
        <div className="a-card a-kpi"><span>Visitors, 30 days</span><strong>{a.totals.visitors}</strong><small>Counted once per day, no cookies</small></div>
        <div className="a-card a-kpi"><span>Product clicks, 30 days</span><strong>{a.totals.clicks}</strong><small>{top ? `Most clicked: ${names[top.product] || top.product}` : 'No clicks yet'}</small></div>
        <div className="a-card a-kpi"><span>Unread messages</span><strong>{Number(unread)}</strong><small>{Number(productsLive)} products on the map</small></div>
      </div>
      <section className="a-card">
        <div className="a-head"><h2>Views per day</h2><a href="/admin/analytics">Full analytics →</a></div>
        <DailyBars series={a.series} />
      </section>
      <section className="a-card">
        <div className="a-head"><h2>Latest messages</h2><a href="/admin/messages">Open inbox →</a></div>
        {recent.length === 0 ? <p className="a-muted">No messages yet. They’ll appear here when someone uses the Say hello form.</p> : (
          <div className="a-table-wrap"><table className="a-table">
            <thead><tr><th>From</th><th>Topic</th><th>Message</th><th>Received</th></tr></thead>
            <tbody>{recent.map((m) => (
              <tr key={m.id}><td><strong>{m.name}</strong>{!m.read && <> <span className="a-pill coming_soon">New</span></>}<br /><span className="a-muted">{m.email}</span></td><td>{m.topic}</td><td style={{ maxWidth: 360 }}>{m.message.slice(0, 120)}{m.message.length > 120 ? '…' : ''}</td><td className="a-muted">{new Date(m.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
