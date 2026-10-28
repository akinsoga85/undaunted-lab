import { desc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { setMessageRead, deleteMessage } from '../../actions';
import Confirm from '@/components/admin/Confirm';
import CopyButton from '@/components/admin/CopyButton';

const replySubject = (m) => 'Re: ' + (m.topic || 'your message to Undaunted Lab');

export default async function Messages() {
  const db = await getDb();
  const rows = await db.select().from(schema.messages).orderBy(desc(schema.messages.createdAt)).limit(200);
  const unread = rows.filter((m) => !m.read).length;
  return (
    <>
      <div className="a-head"><div><h1>Messages</h1><p>{rows.length ? `${rows.length} message${rows.length === 1 ? '' : 's'}, ${unread} unread.` : 'Messages from the Say hello form land here.'}</p></div></div>
      {rows.length === 0 && <div className="a-card"><p className="a-muted">Nothing yet. When someone sends a message from the site, it appears here and, if email is set up, in your inbox too.</p></div>}
      <div className="a-form" style={{ gap: 12 }}>
        {rows.map((m) => (
          <details key={m.id} className={`a-msg${m.read ? '' : ' unread'}`} open={!m.read}>
            <summary>
              <strong>{m.name}</strong>
              <span className="a-muted">{m.email}</span>
              {m.topic && <span className="a-pill pilot">{m.topic}</span>}
              {!m.read && <span className="a-pill coming_soon">New</span>}
              <span className="a-muted" style={{ marginLeft: 'auto', fontSize: 13 }}>{new Date(m.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </summary>
            <div className="body">
              <div className="text">{m.message || <span className="a-muted">No message, just contact details.</span>}</div>
              <div className="a-actions">
                {/* mailto does nothing without a mail app, so webmail and copy are offered too. */}
                <a className="a-btn small" href={`mailto:${encodeURIComponent(m.email).replace(/%40/g, '@')}?subject=${encodeURIComponent(replySubject(m))}`}>Reply by email</a>
                <a className="a-btn ghost small" href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent(replySubject(m))}`} target="_blank" rel="noopener">Reply in Gmail ↗</a>
                <CopyButton text={m.email} label="Copy email" />
                <form action={setMessageRead}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="read" value={m.read ? '0' : '1'} /><button className="a-btn ghost small">{m.read ? 'Mark as unread' : 'Mark as read'}</button></form>
                <Confirm action={deleteMessage} id={m.id} label="Delete" confirmLabel="Delete this message?" />
              </div>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
