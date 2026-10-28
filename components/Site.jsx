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

  const { story, notes, contact, privacy, settings } = content;
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
          <button type="button" data-menu-btn="" aria-expanded="false" aria-controls="ul-menu"><span className="wide">Products</span><span className="narrow">Menu</span> <span aria-hidden="true">▾</span></button>
          <a className="wide" href="#story">Our story</a>
          <a className="wide" href="#notes">Lab notes</a>
          <button type="button" className="iconbtn" data-theme-btn="" aria-label="Switch to night" style={{ width: 44, padding: 0, justifyContent: 'center' }} />
          <a className="cta" href="#contact">Say hello</a>
          <div className="menu" id="ul-menu" data-menu="" hidden>
            <div className="menu-list" data-menu-list="" />
            {/* On phones the nav has no room for these, so they live in the menu instead. */}
            <div className="menu-pages narrow">
              <a href="#story">Our story</a>
              <a href="#notes">Lab notes</a>
            </div>
            <a className="menu-foot" href="#privacy">Privacy</a>
          </div>
        </nav>
      </header>

      <div className="ui pillbox ul-hint" data-hint="">Drag to explore · <span className="on-hover">hover</span><span className="on-touch">tap</span> a place</div>

      <div className="ui ul-tagline">
        <p>{content.tagline}</p>
        <span className="on-hover">{content.hint}</span>
        <span className="on-touch">Drag to explore. Tap a place to meet it.</span>
      </div>

      {/* The card and tour controls sit apart on wide screens and join into one panel on narrower ones. */}
      <div className="ui ul-dock">
        <div className="ul-card">
          <div className="card" data-card="" aria-live="polite">
            <span className="sw" aria-hidden="true" />
            <div className="tx">
              <div className="nm"><strong>{content.hq.name}</strong><span className="meta">HQ</span></div>
              <span className="ln">{content.hq.line}</span>
            </div>
            <a className="btn" href="#story">{content.hq.cta}</a>
          </div>
        </div>

        <div className="pillbox ul-tour">
          <div className="dots" role="group" aria-label="Fly the plane to a product" data-dots="" />
          <button type="button" className="play" data-play="">Pause tour</button>
        </div>
      </div>

      {/* Dims the map while a panel is open; clicking it closes the panel. */}
      <div className="ul-scrim" data-scrim="" aria-hidden="true" />

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
            <div className="field">
              <label htmlFor="c-name">Your name</label>
              <input id="c-name" name="name" autoComplete="name" maxLength={200} required aria-describedby="c-name-err" />
              <span className="err" id="c-name-err" data-err="name" hidden />
            </div>
            <div className="field">
              <label htmlFor="c-email">Email</label>
              <input id="c-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={200} required aria-describedby="c-email-err" />
              <span className="err" id="c-email-err" data-err="email" hidden />
            </div>
            {/* Bot trap: people never see it. display:none (not off-screen) because autofill skips fields that can't be
                focused; the ignore flags cover password managers. A filled trap only flags the message, it never drops it. */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <input type="text" name="ul_hp" tabIndex={-1} autoComplete="off" data-1p-ignore="" data-lpignore="true" data-bwignore="" data-form-type="other" />
            </div>
            <fieldset className="chips" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>I&apos;m interested in</legend>
              {contact.topics.map((t, i) => (
                <label key={t}><input type="radio" name="topic" value={t} defaultChecked={i === 0} /><span>{t}</span></label>
              ))}
            </fieldset>
            <div className="field">
              <label htmlFor="c-msg">Message <span className="opt">(optional)</span></label>
              <textarea id="c-msg" name="message" rows={4} maxLength={5000} />
            </div>
            <button className="btn" type="submit" style={{ justifySelf: 'start' }}>Send message</button>
            <p className="form-note">We only use your details to reply. <a href="#privacy">How we handle them</a></p>
            <div className="fail" data-fail="" role="alert" hidden>
              <span data-fail-msg="" />
              <span className="mail"><span>{contact.email}</span><button type="button" className="btn" data-copy={contact.email} style={{ minHeight: 36 }}>Copy</button></span>
            </div>
          </form>
          <div className="sent" data-sent="" role="status" tabIndex={-1} hidden>
            <span data-sent-msg="" />
            <button type="button" className="linkbtn" data-again="">Send another message</button>
          </div>
        </div>
      </aside>

      <aside className="ul-panel" data-panel="privacy" aria-hidden="true" aria-labelledby="p-privacy">
        <div className="in">
          <button type="button" className="close" data-close="" aria-label="Close">✕</button>
          <span className="kicker">Privacy</span>
          <h2 id="p-privacy" tabIndex={-1}>{privacy.title}</h2>
          <div className="privacy">
            {privacy.sections.map((s, i) => <section key={i}>{s.title && <h3>{s.title}</h3>}<p>{s.body}</p></section>)}
          </div>
          <p className="form-note">
            Questions or requests: <a href={`mailto:${contact.email}`}>{contact.email}</a>
            {privacy.updated && <><br />Last updated {privacy.updated}</>}
          </p>
          <a className="linkbtn" href="#contact">Back to Say hello</a>
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
