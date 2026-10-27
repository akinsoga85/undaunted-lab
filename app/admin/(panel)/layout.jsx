import { eq, count } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { getDb, schema } from '@/lib/db';
import { logout } from '../actions';
import Nav from '@/components/admin/Nav';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  const me = await requireAdmin();
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.messages).where(eq(schema.messages.read, false));
  return (
    <div className="a-shell">
      <aside className="a-side">
        <a className="a-brand" href="/admin"><img src="/logo.png" alt="" />Lab admin</a>
        <Nav unread={Number(n)} />
        <div className="a-foot">
          <a href="/" target="_blank" rel="noopener">View live site ↗</a>
          <span>{me.email}</span>
          <form action={logout}><button className="a-btn ghost small" type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="a-main" id="main">{children}</main>
    </div>
  );
}
