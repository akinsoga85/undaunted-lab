import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/posts';
import { getAdmin } from '@/lib/auth';
import { renderMarkdown, readMinutes } from '@/lib/markdown';
import TrackView from '@/components/TrackView';
import { sceneOf } from '@/lib/covers';

export const dynamic = 'force-dynamic';

// Published notes are public; a draft is shown only to a signed-in admin, as a preview.
const load = cache(async (slug) => {
  const post = await getPost(slug);
  if (!post) return null;
  if (post.published) return { post, draft: false };
  return (await getAdmin()) ? { post, draft: true } : null;
});

export async function generateMetadata({ params }) {
  const r = await load(params.slug);
  if (!r) return { title: 'Page not found · Undaunted Lab' };
  const { post, draft } = r;
  // ?v= changes whenever the note is saved, so LinkedIn and others fetch the new cover instead of a cached one.
  const image = { url: `/notes/${post.slug}/cover?v=${new Date(post.updatedAt).getTime()}`, width: 1200, height: 630, alt: post.title };
  return {
    title: `${post.title} · Undaunted Lab`,
    description: post.summary,
    alternates: { canonical: `/notes/${post.slug}` },
    robots: draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article', siteName: 'Undaunted Lab', title: post.title, description: post.summary, url: `/notes/${post.slug}`,
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      authors: post.author ? [post.author] : undefined, images: [image]
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.summary, images: [image.url] }
  };
}

export default async function Note({ params }) {
  const r = await load(params.slug);
  if (!r) notFound();
  const { post, draft } = r;
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return (
    <main className="ul-note">
      <header className="ul-note-top">
        <a className="pillbox brand" href="/" aria-label="Undaunted Lab home"><img src="/logo.png" alt="" width={46} height={46} /><span>undaunted lab</span></a>
        <a className="pillbox ul-note-back" href="/#notes">All notes</a>
      </header>
      <article className="in">
        <img className="ul-note-art" src={`/covers/${sceneOf(post.cover)}.jpg`} alt="" width={2000} height={1250} />
        {draft && <p className="ul-note-draft">Draft preview: only signed-in admins can see this. <a href={`/admin/notes/${post.id}`}>Edit or publish it</a></p>}
        {post.tag && <span className="kicker">{post.tag}</span>}
        <h1>{post.title}</h1>
        <p className="ul-note-meta">{[post.author, date, `${readMinutes(post.body)} min read`].filter(Boolean).join(' · ')}</p>
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        <footer className="ul-note-end">
          <p>Got a thought on this, or want to build together? <a href="/#contact">Say hello</a>.</p>
          <div className="ul-note-actions">
            {post.linkedinUrl && <a className="btn" href={post.linkedinUrl} target="_blank" rel="noopener">Discuss on LinkedIn ↗</a>}
            <a className="btn ghost" href="/">Back to the map</a>
          </div>
        </footer>
      </article>
      {!draft && <TrackView />}
    </main>
  );
}
