import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { deletePost } from '@/app/admin/actions';
import PostForm from '@/components/admin/PostForm';
import Confirm from '@/components/admin/Confirm';

const SAVED = {
  published: (slug) => `Published. It’s live at undauntedlab.com/notes/${slug} and in the Lab notes panel.`,
  unpublished: () => 'Unpublished. It’s a draft again, and only admins can see it.',
  updated: () => 'Saved.',
  drafted: () => 'Draft saved. Use Preview to see it on the site; only admins can.'
};

export default async function EditNote({ params, searchParams }) {
  const db = await getDb();
  const [p] = await db.select().from(schema.posts).where(eq(schema.posts.id, Number(params.id) || 0));
  if (!p) notFound();
  const { createdAt, updatedAt, publishedAt, ...post } = p;
  const saved = SAVED[searchParams?.saved];
  return (
    <>
      <div className="a-head"><div><h1>{p.title}</h1><p>{p.published ? 'Published' : 'Draft'} · last changed {new Date(updatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. <a href="/admin/notes">All notes</a></p></div></div>
      {saved && <div className="a-note ok" role="status">{saved(p.slug)}</div>}
      <PostForm key={updatedAt.toString()} post={post} />
      <section className="a-card">
        <h2>Delete this note</h2>
        <p className="a-muted">{p.published ? 'It comes off the site straight away, and links to it stop working.' : 'The draft is gone for good.'}</p>
        <div className="a-actions"><Confirm action={deletePost} id={p.id} label="Delete" confirmLabel="Delete this note?" /></div>
      </section>
    </>
  );
}
