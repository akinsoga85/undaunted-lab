import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, schema } from './db';

const rowsOf = (r) => (Array.isArray(r) ? r : r.rows || []);

// Names products in analytics. Events outlive products, so one removed since shows its id, marked as removed.
export async function productLabels() {
  const db = await getDb();
  const names = Object.fromEntries((await db.select({ id: schema.products.id, name: schema.products.name }).from(schema.products)).map((p) => [p.id, p.name]));
  names.hq = 'Lighthouse (HQ)';
  return (id) => names[id] || `${id} (removed)`;
}

export async function getAnalytics(days = 30) {
  const db = await getDb();
  const d = Math.max(1, Math.min(365, Number(days) || 30));
  const since = new Date(Date.now() - d * 864e5);
  const [tot, daily, prod, refs, dev] = await Promise.all([
    db.execute(sql`select
        count(*) filter (where type = 'view') as views,
        count(distinct visitor) filter (where type = 'view') as visitors,
        count(*) filter (where type = 'hover') as hovers,
        count(*) filter (where type = 'click') as clicks
      from events where ts >= ${since}`),
    db.execute(sql`select to_char(date_trunc('day', ts), 'YYYY-MM-DD') as day,
        count(*) filter (where type = 'view') as views,
        count(distinct visitor) filter (where type = 'view') as visitors
      from events where ts >= ${since} group by 1 order by 1`),
    db.execute(sql`select product,
        count(*) filter (where type = 'hover') as hovers,
        count(*) filter (where type = 'click') as clicks
      from events where ts >= ${since} and product is not null group by product order by 3 desc, 2 desc`),
    db.execute(sql`select referrer, count(*) as n from events where ts >= ${since} and type = 'view' and referrer is not null group by referrer order by n desc limit 8`),
    db.execute(sql`select device, count(*) as n from events where ts >= ${since} and type = 'view' group by device`)
  ]);
  const t = rowsOf(tot)[0] || {};
  const byDay = Object.fromEntries(rowsOf(daily).map((r) => [r.day, { views: Number(r.views), visitors: Number(r.visitors) }]));
  const series = [];
  for (let i = d - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    series.push({ day, views: byDay[day]?.views || 0, visitors: byDay[day]?.visitors || 0 });
  }
  return {
    days: d,
    totals: { views: Number(t.views || 0), visitors: Number(t.visitors || 0), hovers: Number(t.hovers || 0), clicks: Number(t.clicks || 0) },
    series,
    products: rowsOf(prod).map((r) => ({ product: r.product, hovers: Number(r.hovers), clicks: Number(r.clicks) })),
    referrers: rowsOf(refs).map((r) => ({ referrer: r.referrer, n: Number(r.n) })),
    devices: rowsOf(dev).map((r) => ({ device: r.device, n: Number(r.n) }))
  };
}
