import { desc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { allowedEmails } from '@/lib/auth';
import { signOutEverywhere } from '../../actions';

export default async function Settings() {
  const db = await getDb();
  const log = await db.select().from(schema.activity).orderBy(desc(schema.activity.ts)).limit(30);
  const checks = [
    ['Database', process.env.DATABASE_URL ? 'Postgres (Neon) connected' : 'Local embedded database (development only)', !!process.env.DATABASE_URL],
    ['Email', process.env.RESEND_API_KEY ? 'Resend is set up: sign-in links and message alerts are emailed' : 'Not set up: add RESEND_API_KEY to send sign-in links and alerts', !!process.env.RESEND_API_KEY],
    ['Site address', process.env.SITE_URL || 'Not set: sign-in links use the address you visited from', !!process.env.SITE_URL]
  ];
  return (
    <>
      <div className="a-head"><div><h1>Settings</h1><p>Who can sign in, how the site is connected, and recent changes.</p></div></div>
      <div className="a-two">
        <section className="a-card">
          <h2>People who can sign in</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{allowedEmails().map((e) => <li key={e}>{e}</li>)}</ul>
          <p className="a-muted">To add or remove someone, edit <code>ADMIN_EMAILS</code> in Vercel → Settings → Environment Variables, then redeploy.</p>
          <form action={signOutEverywhere}><button className="a-btn ghost small">Sign out on every device</button></form>
        </section>
        <section className="a-card">
          <h2>Connections</h2>
          <div className="a-table-wrap"><table className="a-table" style={{ minWidth: 0 }}><tbody>
            {checks.map(([k, v, ok]) => <tr key={k}><td style={{ fontWeight: 600 }}>{k}</td><td><span className={`a-pill ${ok ? 'live' : 'in_lab'}`}>{ok ? 'OK' : 'Action needed'}</span> {v}</td></tr>)}
          </tbody></table></div>
        </section>
      </div>
      <section className="a-card">
        <h2>Recent activity</h2>
        {log.length === 0 ? <p className="a-muted">No changes yet.</p> : (
          <div className="a-table-wrap"><table className="a-table">
            <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
            <tbody>{log.map((l) => <tr key={l.id}><td className="a-muted">{new Date(l.ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{l.email}</td><td>{l.action}{l.detail ? `: ${l.detail}` : ''}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
