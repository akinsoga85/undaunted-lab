'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { saveContent } from '@/app/admin/actions';
import Submit from './Submit';

function ListEditor({ name, rows: initial, fields, addLabel, max = 8 }) {
  const [rows, setRows] = useState(initial);
  const blank = Object.fromEntries(fields.map((f) => [f.key, '']));
  const update = (i, k, val) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  return (
    <div className="a-form" style={{ gap: 10 }}>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="a-list-item">
          {fields.map((f) => (
            <label key={f.key} className="a-field" htmlFor={`${name}-${i}-${f.key}`}><span>{f.label}</span>
              {f.long
                ? <textarea id={`${name}-${i}-${f.key}`} rows={2} value={r[f.key] || ''} onChange={(e) => update(i, f.key, e.target.value)} />
                : <input id={`${name}-${i}-${f.key}`} type="text" value={r[f.key] || ''} onChange={(e) => update(i, f.key, e.target.value)} placeholder={f.placeholder} />}
            </label>
          ))}
          <button type="button" className="a-btn ghost small" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`}>Remove</button>
        </div>
      ))}
      {rows.length < max && <button type="button" className="a-btn ghost small" style={{ justifySelf: 'start' }} onClick={() => setRows([...rows, blank])}>{addLabel}</button>}
    </div>
  );
}

export default function ContentForm({ content }) {
  const [state, action] = useFormState(saveContent, null);
  const err = state?.errors || {};
  const c = content;
  const F = ({ k, label, def, hint, area, rows = 3, type = 'text' }) => (
    <label className="a-field" htmlFor={`c-${k}`}><span>{label}</span>
      {area ? <textarea id={`c-${k}`} name={k} rows={rows} defaultValue={def} aria-invalid={!!err[k]} /> : <input id={`c-${k}`} name={k} type={type} defaultValue={def} aria-invalid={!!err[k]} step={type === 'number' ? '0.1' : undefined} />}
      {hint && <small>{hint}</small>}{err[k] && <span className="err" role="alert">{err[k]}</span>}
    </label>
  );
  return (
    <form action={action} className="a-form">
      {state?.ok && <div className="a-note ok" role="status">Saved. The live site is updated.</div>}
      {Object.keys(err).length > 0 && <div className="a-note err" role="alert">Some fields need attention. They’re marked below.</div>}
      <section className="a-card">
        <h2>On the map</h2>
        <div className="a-row">{F({ k: "tagline", label: "Tagline (bottom left)", def: c.tagline })}{F({ k: "hint", label: "Hint under the tagline", def: c.hint })}</div>
        <div className="a-row">{F({ k: "hq.name", label: "Lighthouse card · name", def: c.hq.name })}{F({ k: "hq.line", label: "Lighthouse card · line", def: c.hq.line })}{F({ k: "hq.cta", label: "Lighthouse card · button", def: c.hq.cta })}</div>
        <div className="a-row">{F({ k: "settings.tourSeconds", label: "Seconds per tour stop", def: c.settings.tourSeconds, type: "number", hint: "Between 2 and 15." })}{F({ k: "settings.linkedin", label: "Your LinkedIn profile", def: c.settings.linkedin, hint: "Linked from Our story." })}</div>
      </section>
      <section className="a-card">
        <h2>Our story</h2>
        {F({ k: "story.title", label: "Heading", def: c.story.title })}
        {F({ k: "story.paragraphs", label: "Paragraphs", def: c.story.paragraphs.join('\n\n'), area: true, rows: 6, hint: "Leave a blank line between paragraphs." })}
        <div className="a-field"><span>Principles</span>
          <ListEditor name="story.rules" rows={c.story.rules} addLabel="Add a principle" fields={[{ key: 'title', label: 'Title' }, { key: 'body', label: 'Description', long: true }]} />
        </div>
        {F({ k: "story.founder", label: "Founder note", def: c.story.founder, area: true, rows: 3 })}
      </section>
      <section className="a-card">
        <h2>Lab notes</h2>
        <div className="a-row">{F({ k: "notes.title", label: "Heading", def: c.notes.title })}{F({ k: "notes.intro", label: "Intro", def: c.notes.intro })}</div>
        <div className="a-field"><span>Posts</span>
          <ListEditor name="notes.items" rows={c.notes.items} addLabel="Add a post" fields={[{ key: 'tag', label: 'Topic', placeholder: 'AI productivity' }, { key: 'title', label: 'Title' }, { key: 'url', label: 'Link', placeholder: 'https://www.linkedin.com/posts/…' }]} />
          {err['notes.items'] && <span className="err" role="alert">{err['notes.items']}</span>}
        </div>
      </section>
      <section className="a-card">
        <h2>Say hello</h2>
        <div className="a-row">{F({ k: "contact.title", label: "Heading", def: c.contact.title })}{F({ k: "contact.email", label: "Public email address", def: c.contact.email, type: "email" })}</div>
        {F({ k: "contact.topics", label: "Topics people can pick", def: c.contact.topics.join('\n'), area: true, rows: 4, hint: "One per line." })}
      </section>
      <div className="a-actions"><Submit pendingText="Saving…">Save site text</Submit><a className="a-btn ghost" href="/" target="_blank" rel="noopener">View live site ↗</a></div>
    </form>
  );
}
