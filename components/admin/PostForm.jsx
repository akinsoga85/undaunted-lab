'use client';
import { useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { savePost } from '@/app/admin/actions';
import { countNotes, readMinutes } from '@/lib/markdown';
import Submit from './Submit';
import CopyButton from './CopyButton';

const LINKEDIN_MAX = 3000; // LinkedIn's limit for a post
const slugOf = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export default function PostForm({ post }) {
  const [state, action] = useFormState(savePost, null);
  const [v, setV] = useState(state?.values || post);
  const [slugEdited, setSlugEdited] = useState(!!post.id);
  const intent = useRef(null);
  const err = state?.errors || {};
  const set = (k) => (e) => {
    const val = e.target.value;
    if (k === 'slug') setSlugEdited(true);
    setV((o) => ({ ...o, [k]: val, ...(k === 'title' && !slugEdited ? { slug: slugOf(val) } : {}) }));
  };
  // Which button was pressed travels in a hidden field, set as the button is clicked.
  const press = (value) => () => { intent.current.value = value; };
  const notes = countNotes(v.title) + countNotes(v.summary) + countNotes(v.body);
  const liNotes = countNotes(v.linkedin);
  const field = (k, label, input, hint) => (
    <label className="a-field" htmlFor={`p-${k}`}><span>{label}</span>{input}{hint && <small>{hint}</small>}{err[k] && <span className="err" role="alert">{err[k]}</span>}</label>
  );
  return (
    <form action={action} className="a-form">
      <input type="hidden" name="id" value={post.id || ''} />
      <input type="hidden" name="intent" ref={intent} defaultValue="save" />
      {notes > 0 && <div className="a-note info">{notes === 1 ? '1 editor’s note' : `${notes} editor’s notes`} [[like this]] left in the article. They’re highlighted in the preview, and the note can’t be published until each is filled in or removed.</div>}
      <section className="a-card a-form">
        <h2>Article</h2>
        {field('title', 'Title', <input id="p-title" name="title" type="text" value={v.title} onChange={set('title')} aria-invalid={!!err.title} maxLength={140} required />)}
        <div className="a-row">
          {field('slug', 'Web address', <span className="a-prefix"><span aria-hidden="true">/notes/</span><input id="p-slug" name="slug" type="text" value={v.slug} onChange={set('slug')} aria-invalid={!!err.slug} maxLength={80} /></span>, v.published ? 'Changing this breaks links people have already shared.' : 'Lowercase words joined by hyphens.')}
          {field('tag', 'Topic', <input id="p-tag" name="tag" type="text" value={v.tag} onChange={set('tag')} maxLength={40} placeholder="Financial safety" />)}
          {field('author', 'Author', <input id="p-author" name="author" type="text" value={v.author} onChange={set('author')} maxLength={60} />)}
        </div>
        {field('summary', 'Summary', <textarea id="p-summary" name="summary" rows={2} value={v.summary} onChange={set('summary')} aria-invalid={!!err.summary} maxLength={300} />, 'One or two sentences. Shown in Lab notes and in link previews.')}
        {field('body', `Article · about ${readMinutes(v.body)} min read`, <textarea id="p-body" name="body" rows={26} value={v.body} onChange={set('body')} aria-invalid={!!err.body} maxLength={40000} />,
          'Leave a blank line between paragraphs. ## for a heading, - for a bullet, 1. for a numbered list, > for a quote, **bold**, *italic*, [link text](https://…).')}
      </section>
      <section className="a-card a-form">
        <h2>LinkedIn version</h2>
        <p className="a-muted">Post it from your own LinkedIn profile. Put the article’s link in the first comment rather than in the post: LinkedIn shows posts with links to fewer people.</p>
        {liNotes > 0 && <div className="a-note info">{liNotes === 1 ? '1 editor’s note' : `${liNotes} editor’s notes`} [[like this]] left in the LinkedIn text. Fill them in before you post it.</div>}
        {field('linkedin', 'Post text', <textarea id="p-linkedin" name="linkedin" rows={18} value={v.linkedin} onChange={set('linkedin')} maxLength={LINKEDIN_MAX} />, `${v.linkedin.length.toLocaleString('en-GB')} of ${LINKEDIN_MAX.toLocaleString('en-GB')} characters.`)}
        <div className="a-actions"><CopyButton text={v.linkedin} label="Copy LinkedIn text" /></div>
        {field('linkedinUrl', 'Link to the LinkedIn post', <input id="p-linkedinUrl" name="linkedinUrl" type="text" inputMode="url" value={v.linkedinUrl} onChange={set('linkedinUrl')} aria-invalid={!!err.linkedinUrl} placeholder="https://www.linkedin.com/posts/…" />, 'Paste it here once it’s posted. The article then shows a “Discuss on LinkedIn” button.')}
      </section>
      <div className="a-actions a-savebar">
        {post.published ? (
          <>
            <Submit pendingText="Saving…" onClick={press('save')}>Save changes</Submit>
            <Submit className="a-btn ghost" pendingText="Working…" onClick={press('unpublish')}>Unpublish</Submit>
          </>
        ) : (
          <>
            <Submit pendingText="Publishing…" onClick={press('publish')}>Publish</Submit>
            <Submit className="a-btn ghost" pendingText="Saving…" onClick={press('save')}>Save draft</Submit>
          </>
        )}
        {post.id && <a className="a-btn ghost" href={`/notes/${post.slug}`} target="_blank" rel="noopener">{post.published ? 'View' : 'Preview'} ↗</a>}
        {Object.keys(err).length > 0 && <span className="a-note err" role="alert">Some fields need attention. They’re marked above.</span>}
      </div>
    </form>
  );
}
