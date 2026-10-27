'use client';
import { useEffect } from 'react';

function send(t, p) {
  try {
    const body = JSON.stringify({ t, p, path: location.pathname, ref: document.referrer });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
  } catch { /* never block the page */ }
}

export default function Site({ products, content }) {
  useEffect(() => {
    import('@/lib/world').then((m) => m.init({ products, content, contactEndpoint: '/api/contact', onEvent: send }));
    send('view');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { story, notes, contact, settings } = content;
  return (
    <div className="ul-root" data-ul-root="">
      <div className="ul-stars" aria-hidden="true" />
      <div className="ul-waves" aria-hidden="true"><div className="w b" /><div className="w" /></div>
      <div className="ul-stage" role="region" aria-label="Map of Undaunted Lab products. Drag to explore.">
        <div className="ul-pan"><div className="ul-world" /></div>
      </div>

      <header className="ui ul-top">
        <a className="pillbox brand" href="#" aria-label="Undaunted Lab home">
          <img src="/logo.png" alt="" width={46} height={46} />
          <span>undaunted lab</span>
        </a>
        <nav className="pillbox nav" aria-label="Main">
          <button type="button" data-menu-btn="" aria-expanded="false" aria-controls="ul-menu">Products <span aria-hidden="true">▾</span></button>
          <a className="wide" href="#story">Our story</a>
          <a className="wide" href="#notes">Lab notes</a>
          <button type="button" className="iconbtn" data-theme-btn="" aria-label="Switch to night" style={{ width: 44, padding: 0, justifyContent: 'center' }} />
          <a className="cta" href="#contact">Say hello</a>
          <div className="menu" id="ul-menu" data-menu="" hidden />
        </nav>
      </header>

      <div className="ui pillbox ul-hint" data-hint="">Drag to explore · hover a place</div>

      <div className="ui ul-tagline">
        <p>{content.tagline}</p>
        <span>{content.hint}</span>
      </div>

      <div className="ui ul-card">
        <div className="card" data-card="" aria-live="polite">
          <span className="sw" aria-hidden="true" />
          <div className="tx">
            <div className="nm"><strong>{content.hq.name}</strong><span className="meta">HQ</span></div>
            <span className="ln">{content.hq.line}</span>
          </div>
          <a className="btn" href="#story">{content.hq.cta}</a>
        </div>
      </div>

      <div className="ui pillbox ul-tour">
        <div className="dots" role="group" aria-label="Fly the plane to a product" data-dots="" />
        <button type="button" className="play" data-play="">Pause tour</button>
      </div>

      <aside className="ul-panel" data-panel="story" aria-hidden="true" aria-labelledby="p-story">
        <div className="in">
          <button type="button" className="close" data-close="" aria-label="Close">✕</button>
          <span className="kicker">Our story</span>
          <h2 id="p-story" tabIndex={-1}>{story.title}</h2>
          {story.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          {story.rules.length > 0 && (
            <div className="rules">
              {story.rules.map((r, i) => <div key={i}><strong>{r.title}</strong><span>{r.body}</span></div>)}
            </div>
          )}
          {story.founder && (
            <div className="founder">
              <span className="av" aria-hidden="true">O</span>
              <div>{story.founder} {settings.linkedin && <a href={settings.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>}</div>
            </div>
          )}
        </div>
      </aside>

      <aside className="ul-panel" data-panel="notes" aria-hidden="true" aria-labelledby="p-notes">
        <div className="in">
          <button type="button" className="close" data-close="" aria-label="Close">✕</button>
          <span className="kicker">Lab notes</span>
          <h2 id="p-notes" tabIndex={-1}>{notes.title}</h2>
          <p>{notes.intro}</p>
          <div className="notes">
            {notes.items.map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener"><small>{String(n.tag || '').toUpperCase()}</small><strong>{n.title}</strong><span>Read ↗</span></a>
            ))}
          </div>
        </div>
      </aside>

      <aside className="ul-panel" data-panel="contact" aria-hidden="true" aria-labelledby="p-contact">
        <div className="in">
          <button type="button" className="close" data-close="" aria-label="Close">✕</button>
          <span className="kicker">Say hello</span>
          <h2 id="p-contact" tabIndex={-1}>{contact.title}</h2>
          <form className="form" data-contact="" noValidate>
            <label htmlFor="c-name">Your name<input id="c-name" name="name" autoComplete="name" required /></label>
            <label htmlFor="c-email">Email<input id="c-email" name="email" type="email" autoComplete="email" required /></label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
            <fieldset className="chips" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>I&apos;m interested in</legend>
              {contact.topics.map((t, i) => (
                <label key={t}><input type="radio" name="topic" value={t} defaultChecked={i === 0} /><span>{t}</span></label>
              ))}
            </fieldset>
            <label htmlFor="c-msg">Message<textarea id="c-msg" name="message" rows={4} /></label>
            <button className="btn" type="submit" style={{ justifySelf: 'start' }}>Send message</button>
          </form>
          <div className="sent" data-sent="" hidden>
            <span data-sent-msg="" />
            <span className="mail"><span>{contact.email}</span><button type="button" className="btn" data-copy={contact.email} style={{ minHeight: 36 }}>Copy</button></span>
          </div>
        </div>
      </aside>

      <noscript>
        <div className="ui card" style={{ left: 16, right: 16, top: 100, flexDirection: 'column', alignItems: 'flex-start' }}>
          <strong>Our products</strong>
          {products.filter((p) => p.status !== 'coming_soon').map((p) => <a key={p.id} href={p.url}>{p.name}</a>)}
        </div>
      </noscript>
    </div>
  );
}
