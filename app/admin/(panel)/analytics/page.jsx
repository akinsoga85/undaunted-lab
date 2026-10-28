import { getAnalytics, productLabels } from '@/lib/analytics';
import { DailyBars, HBars } from '@/components/admin/Charts';

const RANGES = [7, 30, 90];

export default async function Analytics({ searchParams }) {
  const days = RANGES.includes(Number(searchParams?.range)) ? Number(searchParams.range) : 30;
  const [a, label] = await Promise.all([getAnalytics(days), productLabels()]);
  const devTotal = a.devices.reduce((s, d) => s + d.n, 0) || 1;
  return (
    <>
      <div className="a-head">
        <div><h1>Analytics</h1><p>Privacy-friendly: no cookies, no IP addresses stored. A visitor is counted once per day.</p></div>
        <nav className="a-actions" aria-label="Date range">
          {RANGES.map((r) => <a key={r} className={`a-btn small${r === days ? '' : ' ghost'}`} href={`?range=${r}`} aria-current={r === days ? 'page' : undefined}>{r} days</a>)}
        </nav>
      </div>
      <div className="a-grid">
        <div className="a-card a-kpi"><span>Page views</span><strong>{a.totals.views}</strong></div>
        <div className="a-card a-kpi"><span>Visitors</span><strong>{a.totals.visitors}</strong></div>
        <div className="a-card a-kpi"><span>Product hovers</span><strong>{a.totals.hovers}</strong><small>First hover per product per visit</small></div>
        <div className="a-card a-kpi"><span>Product clicks</span><strong>{a.totals.clicks}</strong><small>{a.totals.hovers ? `${Math.round((a.totals.clicks / a.totals.hovers) * 100)}% of hovers lead to a click` : 'Clicks through to a product'}</small></div>
      </div>
      <section className="a-card"><h2>Views per day</h2><DailyBars series={a.series} /></section>
      <div className="a-two" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))' }}>
        <section className="a-card">
          <h2>Products</h2>
          {a.products.length === 0 ? <p className="a-muted">No product activity in this period yet.</p> : (
            <div className="a-table-wrap"><table className="a-table" style={{ minWidth: 0 }}>
              <thead><tr><th>Product</th><th className="a-num">Hovers</th><th className="a-num">Clicks</th><th className="a-num">Click rate</th></tr></thead>
              <tbody>{a.products.map((p) => (
                <tr key={p.product}><td>{label(p.product)}</td><td className="a-num">{p.hovers}</td><td className="a-num">{p.clicks}</td><td className="a-num">{p.hovers ? `${Math.round((p.clicks / p.hovers) * 100)}%` : '—'}</td></tr>
              ))}</tbody>
            </table></div>
          )}
        </section>
        <section className="a-card">
          <h2>Clicks by product</h2>
          {a.products.length === 0 ? <p className="a-muted">Nothing to chart yet.</p> : <HBars rows={a.products.map((p) => ({ label: label(p.product), value: p.clicks }))} />}
        </section>
        <section className="a-card">
          <h2>Where visitors come from</h2>
          {a.referrers.length === 0 ? <p className="a-muted">No referring sites yet. Direct visits and typed URLs aren’t listed.</p> : <HBars rows={a.referrers.map((r) => ({ label: r.referrer, value: r.n }))} />}
        </section>
        <section className="a-card">
          <h2>Devices</h2>
          {a.devices.length === 0 ? <p className="a-muted">No visits yet.</p> : <HBars rows={a.devices.map((d) => ({ label: `${d.device === 'mobile' ? 'Phone or tablet' : 'Desktop'} (${Math.round((d.n / devTotal) * 100)}%)`, value: d.n }))} />}
        </section>
      </div>
    </>
  );
}
