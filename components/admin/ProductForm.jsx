'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { saveProduct } from '@/app/admin/actions';
import { SLOTS, STYLES, STATUS } from '@/lib/defaults';
import Submit from './Submit';

export default function ProductForm({ product, usedSlots }) {
  const [state, action] = useFormState(saveProduct, null);
  const init = state?.values || product;
  const [v, setV] = useState(init);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const err = state?.errors || {};
  const slotOptions = Object.entries(SLOTS).filter(([k]) => k === product.slot || !usedSlots.includes(k));
  const generic = SLOTS[v.slot]?.generic;
  const soon = v.status === 'coming_soon';
  const field = (k, label, input, hint) => (
    <label className="a-field" htmlFor={`f-${k}`}><span>{label}</span>{input}{hint && <small>{hint}</small>}{err[k] && <span className="err" role="alert">{err[k]}</span>}</label>
  );
  return (
    <form action={action} className="a-two" style={{ alignItems: 'start' }}>
      <div className="a-card a-form">
        <input type="hidden" name="id" value={product.id || ''} />
        {field('name', 'Name', <input id="f-name" name="name" type="text" value={v.name} onChange={set('name')} aria-invalid={!!err.name} required maxLength={60} />)}
        {field('line', 'One-line description', <input id="f-line" name="line" type="text" value={v.line} onChange={set('line')} aria-invalid={!!err.line} maxLength={160} />, 'Shown on the card when someone hovers the building.')}
        <div className="a-row">
          {field('status', 'Status', <select id="f-status" name="status" value={v.status} onChange={set('status')} aria-invalid={!!err.status}>{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>, soon ? 'Shows as a fenced plot with a “?” sign.' : null)}
          {field('place', 'Where it serves', <input id="f-place" name="place" type="text" value={v.place} onChange={set('place')} maxLength={40} placeholder="UK, Lagos, Canada…" />)}
        </div>
        <div className="a-row">
          {field('url', 'Link', <input id="f-url" name="url" type="text" inputMode="url" value={v.url} onChange={set('url')} aria-invalid={!!err.url} placeholder="https://" />, soon ? 'Leave as #contact to send people to the Say hello form.' : null)}
          {field('cta', 'Button text', <input id="f-cta" name="cta" type="text" value={v.cta} onChange={set('cta')} maxLength={30} />)}
        </div>
        {field('color', 'Brand colour', <span className="a-color"><input type="color" aria-label="Pick a colour" value={/^#[0-9a-f]{6}$/i.test(v.color) ? v.color : '#2E86C1'} onChange={set('color')} /><input id="f-color" name="color" type="text" value={v.color} onChange={set('color')} aria-invalid={!!err.color} maxLength={7} /></span>)}
        {field('slot', 'Place on the map', <select id="f-slot" name="slot" value={v.slot} onChange={set('slot')} aria-invalid={!!err.slot}>{slotOptions.map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>, SLOTS[v.slot]?.isle ? 'A new island and a bridge to Calgary will appear for this product.' : (generic ? null : 'This place has its own hand-drawn building.'))}
        {generic && !soon && field('style', 'Building style', <select id="f-style" name="style" value={v.style} onChange={set('style')}>{Object.entries(STYLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
        {!generic && <input type="hidden" name="style" value={v.style || 'tower'} />}
        <div className="a-row">
          <label className="a-check"><input type="checkbox" name="visible" checked={!!v.visible} onChange={set('visible')} /> Show on the map</label>
          {!soon && <label className="a-check"><input type="checkbox" name="inTour" checked={!!v.inTour} onChange={set('inTour')} /> Include in the plane’s tour</label>}
        </div>
        {Object.keys(err).length > 0 && <div className="a-note err" role="alert">Fix the highlighted fields and save again.</div>}
        <div className="a-actions"><Submit pendingText="Saving…">{product.id ? 'Save changes' : 'Add to the map'}</Submit><a className="a-btn ghost" href="/admin/products">Cancel</a></div>
      </div>
      <aside className="a-card" style={{ position: 'sticky', top: 16 }}>
        <h2>Card preview</h2>
        <p className="a-muted">This is what visitors see when the plane reaches it.</p>
        <div className="a-preview">
          <span className="sw" style={{ background: v.color }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{v.name || 'Product name'}</strong> <span className="a-muted" style={{ fontSize: 12, fontWeight: 600 }}>{v.place}{STATUS[v.status] ? ` · ${STATUS[v.status]}` : ''}</span>
            <div style={{ fontSize: 14 }}>{v.line || 'One-line description'}</div>
          </div>
          <span className="a-btn small" aria-hidden="true">{v.cta || 'Visit ↗'}</span>
        </div>
      </aside>
    </form>
  );
}
