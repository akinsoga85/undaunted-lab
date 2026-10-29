import { desc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { countNotes } from '@/lib/markdown';

const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function Notes({ searchParams }) {
  const db = await getDb();
  const rows = await db.select().from(schema.posts).orderBy(desc(schema.posts.updatedAt));
  return (
    <>
      <div className="a-head">
        <div><h1>Lab notes</h1><p>Articles for undauntedlab.com/notes, each with a LinkedIn version. Drafts stay private until you publish them.</p></div>
        <a className="a-btn" href="/admin/notes/new">Write a note</a>
      </div>
      {searchParams?.removed && <div className="a-note ok" role="status">Note deleted.</div>}
      <section className="a-card">
        {rows.length === 0 ? <p className="a-muted">No notes yet. Write one, and it appears in the Lab notes panel once you publish it.</p> : (
          <div className="a-table-wrap"><table className="a-table">
            <thead><tr><th>Note</th><th>Status</th><th>To fill in</th><th>LinkedIn</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((p) => {
                const todo = countNotes(p.title) + countNotes(p.summary) + countNotes(p.body) + countNotes(p.linkedin);
                return (
                  <tr key={p.id}>
                    <td><strong>{p.title}</strong><br /><span className="a-muted">{p.tag ? `${p.tag} · ` : ''}/notes/{p.slug}</span></td>
                    <td>{p.published ? <><span className="a-pill live">Published</span><br /><span className="a-muted">{day(p.publishedAt)}</span></> : <><span className="a-pill draft">Draft</span><br /><span className="a-muted">Edited {day(p.updatedAt)}</span></>}</td>
                    <td>{todo ? <span className="a-pill in_lab">{todo === 1 ? '1 note' : `${todo} notes`}</span> : <span className="a-muted">—</span>}</td>
                    <td>{p.linkedinUrl ? <a href={p.linkedinUrl} target="_blank" rel="noopener">Posted ↗</a> : <span className="a-muted">Not yet</span>}</td>
                    <td>
                      <div className="a-actions">
                        <a className="a-btn ghost small" href={`/admin/notes/${p.id}`}>Edit</a>
                        <a className="a-btn ghost small" href={`/notes/${p.slug}`} target="_blank" rel="noopener">{p.published ? 'View' : 'Preview'} ↗</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
