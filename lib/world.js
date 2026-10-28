// Undaunted Lab — The Corridor world engine.
// Plan coordinates: a 1000×1000 ground plane, viewed through rotateX(60deg) rotateZ(-45deg).
// Boxes are three or five outlined faces; sprites are billboards that face the camera.

const INK = '#17181C';
const REDUCE = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

import { SLOTS, STATUS, HQ_POS, DEFAULT_PRODUCTS, DEFAULT_CONTENT } from './defaults.js';

// Filled by configure() from the products and content the site is served with.
let PRODUCTS = {}, POS = {}, ALT = {}, TOUR = [], BY_SLOT = {};
function configure(products, content) {
  PRODUCTS = {}; POS = {}; ALT = {}; BY_SLOT = {};
  products.filter((p) => p.visible !== false && SLOTS[p.slot]).forEach((p) => {
    PRODUCTS[p.id] = p; BY_SLOT[p.slot] = p;
    POS[p.id] = SLOTS[p.slot].pos; ALT[p.id] = SLOTS[p.slot].alt;
  });
  PRODUCTS.hq = { id: 'hq', name: content.hq.name, line: content.hq.line, place: 'HQ', status: '', color: '#F47B5A', url: '#story', cta: content.hq.cta };
  POS.hq = HQ_POS.pos; ALT.hq = HQ_POS.alt;
  TOUR = Object.values(PRODUCTS).filter((p) => p.id !== 'hq' && p.inTour !== false && p.status !== 'coming_soon').sort((a, b) => (a.sort || 0) - (b.sort || 0)).map((p) => p.id);
}
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function shade(hex, f) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#D6E6F2';
  const n = parseInt(m[1], 16); const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
}
function lum(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 1; const n = parseInt(m[1], 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }

/* ---------- DOM helpers ---------- */
function h(tag, cls, css, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) e.style.cssText = css;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
function face(parent, css, bg, bw) { return h('div', 'f', css + ';background:' + bg + ';border-width:' + (bw == null ? 2.5 : bw) + 'px', parent); }
// box(parent, x, y, w, d, height, {top, front, side, back?, right?}, opts)
function box(parent, x, y, w, d, hh, c, o) {
  o = o || {};
  const bw = o.bw == null ? 2.5 : o.bw;
  const g = h('div', 'p3', 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + d + 'px', parent);
  const top = face(g, 'left:0;top:0;width:' + w + 'px;height:' + d + 'px;transform:translateZ(' + hh + 'px)', c.top, bw);
  const front = face(g, 'left:0;top:' + (d - hh) + 'px;width:' + w + 'px;height:' + hh + 'px;transform-origin:50% 100%;transform:rotateX(-90deg)', c.front, bw);
  const side = face(g, 'left:0;top:0;width:' + hh + 'px;height:' + d + 'px;transform-origin:0 50%;transform:rotateY(-90deg)', c.side, bw);
  let back = null, right = null;
  if (o.full) {
    back = face(g, 'left:0;top:0;width:' + w + 'px;height:' + hh + 'px;transform-origin:50% 0;transform:rotateX(90deg)', c.back || c.front, bw);
    right = face(g, 'left:' + (w - hh) + 'px;top:0;width:' + hh + 'px;height:' + d + 'px;transform-origin:100% 50%;transform:rotateY(90deg)', c.right || c.side, bw);
  }
  if (o.dashed) [top, front, side].forEach((f) => { f.style.borderStyle = 'dashed'; });
  return { g, top, front, side, back, right, roof: () => h('div', 'p3', 'left:0;top:0;width:' + w + 'px;height:' + d + 'px;transform:translateZ(' + hh + 'px)', g) };
}
function windows(faceEl, cols, rows, cls, pad) {
  faceEl.style.display = 'grid';
  faceEl.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0,1fr))';
  faceEl.style.gridTemplateRows = 'repeat(' + rows + ', minmax(0,1fr))';
  faceEl.style.gap = '6px';
  faceEl.style.padding = pad || '8px 8px 14px';
  for (let i = 0; i < cols * rows; i++) h('div', 'win' + (cls ? ' ' + cls : ''), '', faceEl);
}
// billboard sprite anchored at its bottom-centre
function sprite(parent, x, y, w, hh, svg, cls) {
  return h('div', 'bb' + (cls ? ' ' + cls : ''), 'left:' + (x - w / 2) + 'px;top:' + (y - hh) + 'px;width:' + w + 'px;height:' + hh + 'px', parent, svg);
}
// Place names live in a flat layer above the 3D world rather than inside it, so traffic and people can never
// pass in front of them. (x, y) is the plan point the label stands on; z is the height of the island top.
// The layer has the world's box, so the projection is measured from the world's centre (500, 500).
function placeName(world, x, y, text, z) {
  const layer = world.parentNode.querySelector('.ul-labels') || h('div', 'ul-labels', '', world.parentNode);
  const sx = 500 + Math.SQRT1_2 * (x + y - 1000), sy = 500 + (Math.SQRT1_2 / 2) * (y - x) - (Math.sqrt(3) / 2) * (z == null ? 28 : z);
  h('span', 'tag', 'left:' + sx.toFixed(1) + 'px;top:' + sy.toFixed(1) + 'px', layer, esc(text));
}
function island(world, x, y, w, d, t) {
  const g = h('div', 'p3', 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + d + 'px', world);
  h('div', 'foam', 'left:-12px;top:-12px;width:' + (w + 24) + 'px;height:' + (d + 24) + 'px', g);
  h('div', 'foam b', 'left:-26px;top:-26px;width:' + (w + 52) + 'px;height:' + (d + 52) + 'px;border-radius:36px', g);
  face(g, 'left:0;top:' + (d - t) + 'px;width:' + w + 'px;height:' + t + 'px;transform-origin:50% 100%;transform:rotateX(-90deg)', 'var(--cliff)', 3);
  face(g, 'left:0;top:0;width:' + t + 'px;height:' + d + 'px;transform-origin:0 50%;transform:rotateY(-90deg)', 'var(--cliff-2)', 3);
  return h('div', 'f p3', 'left:0;top:0;width:' + w + 'px;height:' + d + 'px;transform:translateZ(' + t + 'px);background:var(--land);border-width:3px;transition:background .8s', g);
}
function ringRoad(top, w, d) {
  h('div', 'road', 'left:6px;top:6px;width:' + (w - 18) + 'px;height:' + (d - 18) + 'px', top);
  h('div', 'road-line', 'left:13px;top:13px;width:' + (w - 32) + 'px;height:' + (d - 32) + 'px', top);
}
function lane(w, d, o) { const W = w - 6, D = d - 6; return [[o, o, 3], [W - o, o, 3], [W - o, D - o, 3], [o, D - o, 3]]; }
function rev(pts) { return pts.slice().reverse(); }
function pingpong(pts) { return pts.concat(pts.slice(1, -1).reverse()); }

/* ---------- movement ---------- */
// Moves an element along a closed path at constant speed (px/s). Sprites flip to face their direction;
// rotating movers (vehicles, boats) turn at each corner.
function mover(parent, pts, speed, build, o) {
  o = o || {};
  const m = h('div', 'p3', 'left:0;top:0;width:0;height:0', parent);
  const flipEl = build(m);
  const P = pts.concat([pts[0]]);
  const L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], (P[i][2] || 0) - (P[i - 1][2] || 0)));
  const T = L[L.length - 1] || 1;
  const dur = (T / speed) * 1000;
  const tf = (p, a) => 'translate3d(' + p[0] + 'px,' + p[1] + 'px,' + (p[2] || 0) + 'px)' + (o.rotate ? ' rotateZ(' + a + 'deg)' : '');
  const kf = [], fk = [];
  let prevA = null;
  for (let s = 0; s < P.length - 1; s++) {
    const a0 = P[s], a1 = P[s + 1], o0 = L[s] / T, o1 = L[s + 1] / T;
    let ang = 0;
    if (o.rotate) {
      ang = (Math.atan2(a1[1] - a0[1], a1[0] - a0[0]) * 180) / Math.PI;
      if (prevA != null) { while (ang - prevA > 180) ang -= 360; while (ang - prevA < -180) ang += 360; }
      prevA = ang;
      kf.push({ offset: o0, transform: tf(a0, ang) });
      kf.push({ offset: Math.max(o0, o1 - Math.min(0.004, (o1 - o0) / 3)), transform: tf(a1, ang) });
    } else {
      kf.push({ offset: o0, transform: tf(a0) });
    }
    const sx = a1[0] - a0[0] + (a1[1] - a0[1]);
    fk.push({ offset: o0, transform: 'scaleX(' + (sx < -0.5 ? -1 : 1) + ')', easing: 'steps(1, end)' });
  }
  kf.push({ offset: 1, transform: tf(P[P.length - 1], prevA || 0) });
  fk.push({ offset: 1, transform: fk[fk.length - 1].transform });
  const delay = -(o.phase == null ? Math.random() : o.phase) * dur;
  if (REDUCE) { m.style.transform = kf[Math.floor(Math.random() * kf.length)].transform; return m; }
  m.animate(kf, { duration: dur, iterations: Infinity, delay });
  if (flipEl && !o.rotate) flipEl.animate(fk, { duration: dur, iterations: Infinity, delay });
  return m;
}
function walker(parent, pts, speed, svg, w, hh, o) {
  return mover(parent, pts, speed, (m) => {
    const b = h('div', 'bb', 'left:' + -w / 2 + 'px;top:' + -hh + 'px;width:' + w + 'px;height:' + hh + 'px', m);
    return h('div', 'flip', '', b, svg);
  }, o);
}
function vehicle(parent, pts, speed, len, wid, ht, c, deco, o) {
  return mover(parent, pts, speed, (m) => {
    const b = box(m, -len / 2, -wid / 2, len, wid, ht, c, { bw: 2, full: true });
    if (deco) deco(b);
    return null;
  }, Object.assign({ rotate: true }, o || {}));
}

/* ---------- drawings (line art, matching the logo) ---------- */
const SK = ['#8D5A3B', '#C68B59', '#5C3A24', '#E8B98F', '#A86F48'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const svgOpen = (w, hh, vb, sw) => '<svg width="' + w + '" height="' + hh + '" viewBox="' + vb + '" stroke="' + INK + '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" fill="none">';
const D = {
  tree: (c) => svgOpen(34, 48, '0 0 34 48', 2.5) + '<rect x="14" y="28" width="6" height="18" fill="#B9774E"/><circle cx="17" cy="17" r="14" fill="' + (c || '#6CC08B') + '"/></svg>',
  pine: () => svgOpen(30, 50, '0 0 30 50', 2.5) + '<rect x="13" y="38" width="5" height="10" fill="#B9774E"/><path d="M15 2 L27 22 L20 22 L28 38 L2 38 L10 22 L3 22 Z" fill="#3E9C6B"/></svg>',
  palm: () => svgOpen(36, 56, '0 0 36 56', 2.5) + '<path d="M18 54 C17 40 19 28 18 16"/><path d="M18 16 C10 8 4 12 2 18 C8 14 13 15 18 16 Z" fill="#58B07C"/><path d="M18 16 C26 8 32 12 34 18 C28 14 23 15 18 16 Z" fill="#58B07C"/><path d="M18 16 C14 6 18 2 24 2 C20 6 19 10 18 16 Z" fill="#6CC08B"/></svg>',
  person: (shirt) => svgOpen(18, 34, '0 0 18 34') + '<line class="legA" x1="9" y1="22" x2="7" y2="32"/><line class="legB" x1="9" y1="22" x2="11" y2="32"/><rect x="4" y="11" width="10" height="12" rx="4" fill="' + shirt + '"/><circle cx="9" cy="6" r="4.5" fill="' + pick(SK) + '"/></svg>',
  cyclist: (shirt, bike) => svgOpen(34, 32, '0 0 34 32') + '<circle cx="8" cy="25" r="6"/><circle cx="26" cy="25" r="6"/><path d="M8 25 L14 16 L22 25 Z M14 16 L24 15 L26 25" stroke="' + (bike || INK) + '"/><path d="M16 18 l-3 5 M16 18 l3 -4" class="pedal"/><path d="M12 16 L16 16 L22 7 L18 6 Z" fill="' + shirt + '"/><path d="M21 9 L25 15"/><circle cx="20" cy="4" r="3.5" fill="' + pick(SK) + '"/></svg>',
  okada: () => svgOpen(38, 34, '0 0 38 34') + '<circle cx="8" cy="27" r="6" fill="#fff"/><circle cx="30" cy="27" r="6" fill="#fff"/><path d="M8 27 L14 20 L28 20 L30 27"/><rect x="11" y="17" width="16" height="6" rx="3" fill="#E5484D"/><path d="M27 18 L31 10"/><path d="M15 17 L19 6 L23 7 L22 17 Z" fill="#F6C343"/><circle cx="21" cy="4" r="3.5" fill="' + pick(SK) + '"/><path d="M9 17 L12 9 L16 10 L15 17 Z" fill="#7C5CC4"/><circle cx="13" cy="7" r="3.2" fill="' + pick(SK) + '"/></svg>',
  surfer: (board, shirt) => svgOpen(48, 42, '0 0 48 42') + '<path d="M0 38 C10 31 20 23 33 25 C26 29 28 35 38 38 Z" fill="#FFFFFF"/><ellipse cx="24" cy="31" rx="17" ry="3.5" fill="' + board + '" transform="rotate(-8 24 31)"/><path d="M18 30 L21 22 L26 22 L29 29"/><path d="M19 22 L23 12 L28 13 L26 22 Z" fill="' + shirt + '"/><path d="M22 15 L14 13 M26 15 L35 12"/><circle cx="26" cy="8" r="3.8" fill="' + pick(SK) + '"/></svg>',
  sail: (c) => svgOpen(42, 50, '0 0 42 50') + '<path d="M3 38 L39 38 L33 47 L9 47 Z" fill="#FFFFFF"/><line x1="21" y1="3" x2="21" y2="38"/><path d="M22 5 L22 35 L38 33 Z" fill="' + c + '"/><path d="M20 12 L20 35 L7 33 Z" fill="#FFFFFF"/><path d="M21 3 L28 5 L21 7" fill="#F47B5A"/></svg>',
  kayak: () => svgOpen(44, 24, '0 0 44 24') + '<path d="M2 18 Q22 24 42 18 Q22 13 2 18 Z" fill="#F47B5A"/><path d="M18 17 L20 8 L25 9 L24 17 Z" fill="#5BB8E6"/><circle cx="22" cy="5" r="3.2" fill="' + pick(SK) + '"/><line class="paddle" x1="8" y1="15" x2="34" y2="5"/></svg>',
  buoy: () => svgOpen(16, 26, '0 0 16 26') + '<path d="M3 24 L5 8 L11 8 L13 24 Z" fill="#E5484D"/><path d="M4 16 L12 16" stroke="#FFFFFF" stroke-width="3"/><path d="M4 16 L12 16" stroke-width="0"/><circle cx="8" cy="5" r="3" class="lamp"/></svg>',
  dolphin: () => svgOpen(40, 26, '0 0 40 26') + '<path d="M3 16 C8 6 24 3 34 10 L38 8 L36 14 C26 20 12 22 3 16 Z" fill="#7FA6C9"/><path d="M18 6 L21 1 L24 6"/><circle cx="31" cy="11" r="1" fill="' + INK + '"/></svg>',
  bird: () => '<svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"><path class="flap" d="M1 7 Q6 1 11 7 Q16 1 21 7"/></svg>',
  balloon: () => svgOpen(44, 66, '0 0 44 66', 2.5) + '<path d="M22 2 C36 2 42 12 42 22 C42 34 30 42 26 48 L18 48 C14 42 2 34 2 22 C2 12 8 2 22 2 Z" fill="#F47B5A"/><path d="M22 2 C28 12 28 36 24 48 M22 2 C16 12 16 36 20 48" fill="none"/><path d="M14 6 C10 16 12 34 18 48 M30 6 C34 16 32 34 26 48" stroke="#FFFFFF" stroke-width="3"/><path d="M18 48 L17 56 M26 48 L27 56"/><rect x="15" y="56" width="14" height="9" rx="2" fill="#B9774E"/></svg>',
  heli: () => svgOpen(48, 30, '0 0 48 30') + '<line class="rotor" x1="4" y1="3" x2="44" y2="3" stroke-width="3"/><line x1="24" y1="3" x2="24" y2="9"/><path d="M14 10 C26 8 32 12 32 18 C32 22 26 23 18 23 C12 23 10 18 14 10 Z" fill="#5BB8E6"/><path d="M31 15 L46 13 L46 17 L31 19"/><path d="M14 27 L32 27 M18 23 L17 27 M28 23 L29 27"/></svg>',
  umbrella: (c) => svgOpen(36, 40, '0 0 36 40') + '<path d="M2 16 C4 4 32 4 34 16 Z" fill="' + c + '"/><path d="M12 16 C12 9 15 6 18 5 M24 16 C24 9 21 6 18 5" stroke="#FFFFFF" stroke-width="3"/><line x1="18" y1="16" x2="18" y2="38"/><rect x="8" y="28" width="20" height="5" rx="2" fill="#FFE07A"/></svg>',
  lamp: () => svgOpen(12, 40, '0 0 12 40') + '<line x1="6" y1="10" x2="6" y2="39"/><circle cx="6" cy="7" r="4.5" class="lamp"/></svg>',
  sign: () => svgOpen(34, 50, '0 0 34 50', 2.5) + '<rect x="15" y="22" width="4" height="26" fill="#B9774E"/><rect x="2" y="2" width="30" height="24" rx="5" fill="#F6C343"/><text x="17" y="21" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-size="19" font-weight="800" fill="' + INK + '" stroke="none">?</text></svg>',
  mountains: () => svgOpen(160, 118, '0 0 160 118', 2.5) + '<polygon points="4,116 60,18 116,116" fill="#A9BED1"/><polygon points="60,18 46,42 56,38 63,47 72,39 78,44" fill="#FFFFFF"/><polygon points="62,116 110,36 156,116" fill="#C3D3E2"/><polygon points="110,36 98,55 107,51 114,59 122,52 127,57" fill="#FFFFFF"/></svg>',
  shield: () => '<svg class="float" width="48" height="56" viewBox="0 0 48 56" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"><path d="M24 3 L44 10 V26 C44 39 35 48 24 53 C13 48 4 39 4 26 V10 Z" fill="#5BB8E6"/><path d="M15 27 L21 33 L33 20" fill="none"/></svg>',
  heart: () => '<svg class="float" width="44" height="44" viewBox="0 0 44 44" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round"><g class="beat"><path d="M22 39 C10 30 3 23 3 14 C3 8 8 4 13 4 C17 4 20 6 22 10 C24 6 27 4 31 4 C36 4 41 8 41 14 C41 23 34 30 22 39 Z" fill="#F47B5A"/><path d="M9 20 H16 L19 14 L24 26 L27 20 H35" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/></g></svg>',
  crane: () => svgOpen(96, 150, '0 0 96 150', 2.5) + '<rect x="20" y="20" width="10" height="128" fill="#F6C343"/><path d="M20 40 L30 30 M20 60 L30 50 M20 80 L30 70 M20 100 L30 90 M20 120 L30 110"/><rect x="4" y="12" width="90" height="10" fill="#F6C343"/><rect x="2" y="22" width="16" height="12" fill="' + INK + '"/><line x1="25" y1="2" x2="25" y2="12"/><line x1="25" y1="2" x2="90" y2="12"/><g class="hook"><line x1="78" y1="22" x2="78" y2="50"/><path d="M74 50 h8 v6 a4 4 0 0 1 -8 0 Z" fill="#F47B5A"/></g></svg>',
  lighthouse: () => '<svg width="56" height="122" viewBox="0 0 56 122" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round" style="overflow:visible"><polygon class="beam" points="24,22 -30,12 -30,32" fill="#FFE07A" stroke="none"/><polygon class="beam" points="32,22 86,12 86,32" fill="#FFE07A" stroke="none" style="animation-delay:-1.5s"/><polygon points="14,118 18,34 38,34 42,118" fill="#FFFFFF"/><polygon points="16,92 40,92 41,108 15,108" fill="#F47B5A"/><polygon points="17,58 39,58 40,74 16,74" fill="#F47B5A"/><rect x="16" y="14" width="24" height="20" rx="3" class="lamp"/><path d="M12 14 L28 3 L44 14 Z" fill="#F47B5A"/><rect x="10" y="32" width="36" height="5" rx="2" fill="' + INK + '"/></svg>',
  cloud: (w) => '<svg width="' + w + '" height="' + w * 0.49 + '" viewBox="0 0 90 44" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"><path d="M14 40 C4 40 2 28 12 26 C10 14 26 10 32 18 C36 6 56 4 60 18 C70 12 84 18 80 30 C90 32 88 40 80 40 Z" fill="#FFFFFF"/></svg>',
  plane: () => '<svg width="88" height="64" viewBox="-10 -4 92 64" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><line x1="-6" y1="40" x2="14" y2="31"/><line x1="-2" y1="52" x2="22" y2="40"/><line x1="16" y1="50" x2="26" y2="44"/><polygon points="4,20 78,6 30,34" fill="#5BB8E6"/><polygon points="30,34 78,6 34,50" fill="#2E86C1"/><polygon points="40,38 78,6 56,48" fill="#5BB8E6"/></svg>'
};
const SHIRTS = ['#F47B5A', '#5BB8E6', '#F6C343', '#7C5CC4', '#58B07C', '#E5484D', '#FFFFFF', '#2E86C1'];

/* ---------- product landmark wrapper ---------- */
function landmark(parent, id, x, y, w, d, label) {
  label = label || (PRODUCTS[id].name + ' — ' + PRODUCTS[id].line);
  const a = h('a', 'p3 bld', 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + d + 'px', parent);
  const url = PRODUCTS[id].url;
  a.href = url;
  if (url.indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; }
  a.draggable = false;
  a.dataset.id = id;
  a.setAttribute('aria-label', label);
  const r = Math.max(w, d) + 30;
  h('div', 'ring', 'left:' + (w / 2 - r / 2) + 'px;top:' + (d / 2 - r / 2) + 'px;width:' + r + 'px;height:' + r + 'px', a);
  return a;
}

// Puts whichever product owns a slot there. Bespoke slots keep their hand-drawn building;
// open plots and new isles draw a building in the product's chosen style and colour.
function slot(parent, slotId, x, y, w, d, bespoke) {
  const p = BY_SLOT[slotId];
  if (!p) { const g = h('div', 'p3', 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + d + 'px', parent); h('div', 'plot', '', g); return null; }
  const a = landmark(parent, p.id, x, y, w, d);
  if (p.status === 'coming_soon') { h('div', 'plot', '', a); sprite(a, w / 2, d / 2 + 1, 34, 50, D.sign()); }
  else if (bespoke && !SLOTS[slotId].generic) bespoke(a);
  else generic(a, p, w, d);
  return a;
}
function generic(a, p, w, d) {
  const c = p.color || '#2E86C1', side = shade(c, -0.18);
  const initial = esc((p.name || '?').trim().charAt(0).toUpperCase());
  const badge = (parent, x, y) => sprite(parent, x, y, 40, 40, '<svg class="float" width="40" height="40" viewBox="0 0 40 40" stroke="' + INK + '" stroke-width="2.6"><circle cx="20" cy="20" r="16" fill="' + esc(c) + '"/><text x="20" y="26.5" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="18" fill="' + (lum(c) > 0.6 ? INK : '#FFFFFF') + '" stroke="none">' + initial + '</text></svg>');
  const style = p.style || 'tower';
  if (style === 'house') {
    const b = box(a, w * 0.1, d * 0.12, w * 0.8, d * 0.76, 46, { top: c, front: '#F7EFE2', side: '#E6D6BC' });
    b.front.style.cssText += ';display:flex;align-items:flex-end;justify-content:space-around;padding:0 6px';
    h('div', '', 'width:14px;height:22px;background:' + esc(c) + ';border:2.5px solid ' + INK + ';border-bottom:0;border-radius:7px 7px 0 0', b.front);
    h('div', 'win', 'width:15px;height:13px;margin-bottom:14px', b.front);
    const r = b.roof(); badge(r, w * 0.4, d * 0.44);
    box(r, w * 0.58, 6, 10, 10, 14, { top: '#B9774E', front: '#C98A62', side: '#A0653F' }, { bw: 2 });
  } else if (style === 'shop') {
    const b = box(a, w * 0.06, d * 0.18, w * 0.88, d * 0.7, 34, { top: '#FFFFFF', front: '#FFFFFF', side: '#ECEEF1' });
    b.front.style.background = 'repeating-linear-gradient(90deg, ' + c + ' 0 10px, #FFFFFF 10px 20px) 0 0 / 100% 34% no-repeat, #FFFFFF';
    b.front.style.cssText += ';display:flex;align-items:flex-end;justify-content:center;gap:6px;padding-bottom:4px';
    h('div', 'win g', 'width:40%;height:12px', b.front); h('div', '', 'width:12px;height:16px;background:' + INK, b.front);
    badge(b.roof(), w * 0.44, d * 0.42);
  } else if (style === 'campus') {
    const t = box(a, w * 0.08, d * 0.08, w * 0.42, d * 0.6, 74, { top: c, front: '#FFFFFF', side: side });
    windows(t.front, 2, 4, 'g', '8px 7px 12px');
    const l = box(a, w * 0.5, d * 0.36, w * 0.44, d * 0.5, 34, { top: shade(c, 0.45), front: '#FFFFFF', side: '#E8ECF1' });
    windows(l.front, 3, 1, '', '7px 6px 12px');
    badge(t.roof(), w * 0.21, d * 0.32);
  } else {
    const b = box(a, w * 0.15, d * 0.1, w * 0.7, d * 0.8, 100, { top: c, front: '#FFFFFF', side: shade(c, 0.7) });
    windows(b.front, 3, 5, 'g', '9px 9px 20px');
    badge(b.roof(), w * 0.35, d * 0.42);
  }
}

/* ---------- bridges ---------- */
// 1. Rope footbridge (Calgary ⇄ HQ): plank deck on stilts with rope rails.
function footbridge(world, x, y, len, wid) {
  const g = h('div', 'p3', 'left:' + x + 'px;top:' + y + 'px;width:' + len + 'px;height:' + wid + 'px', world);
  [len * 0.33, len * 0.66].forEach((px) => {
    box(g, px - 3, 1, 6, 5, 22, { top: '#8A552F', front: '#A0653F', side: '#7A4A28' }, { bw: 2 });
    box(g, px - 3, wid - 6, 6, 5, 22, { top: '#8A552F', front: '#A0653F', side: '#7A4A28' }, { bw: 2 });
  });
  const lift = h('div', 'p3', 'left:0;top:0;width:' + len + 'px;height:' + wid + 'px;transform:translateZ(22px)', g);
  const deck = box(lift, 0, 0, len, wid, 6, { top: '#C98A62', front: '#A0653F', side: '#8A552F' }, { bw: 2 });
  deck.top.style.backgroundImage = 'repeating-linear-gradient(90deg, transparent 0 7px, rgba(23,24,28,.45) 7px 9px)';
  const top = deck.roof();
  let posts = '';
  for (let i = 0; i <= len; i += 17) posts += '<line x1="' + Math.min(i, len - 1) + '" y1="2" x2="' + Math.min(i, len - 1) + '" y2="16"/>';
  const rope = '<svg width="' + len + '" height="16" viewBox="0 0 ' + len + ' 16" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round">' + posts + '<path d="M0 3 Q' + len / 4 + ' 10 ' + len / 2 + ' 3 Q' + (3 * len) / 4 + ' 10 ' + len + ' 3" stroke="#B9774E" stroke-width="2.5"/></svg>';
  h('div', 'rail', 'left:0;top:' + (wid - 16) + 'px;width:' + len + 'px;height:16px;transform-origin:50% 100%;transform:rotateX(-90deg)', top, rope);
  h('div', 'rail', 'left:0;top:-16px;width:' + len + 'px;height:16px;transform-origin:50% 100%;transform:rotateX(-90deg)', top, rope);
}
// 2. Bascule bridge (HQ ⇄ London): stone towers, a high walkway and two leaves that lift for boats.
function bascule(world, x, y, len) {
  const wid = 24, pier = (len - 32) / 2;
  const stone = { top: '#E9E1D3', front: '#D6CCBB', side: '#C3B8A5' };
  const g = h('div', 'p3', 'left:' + x + 'px;top:' + y + 'px;width:' + len + 'px;height:' + wid + 'px', world);
  const pierL = box(g, 0, 0, pier, wid, 28, { top: 'var(--road)', front: stone.front, side: stone.side });
  const pierR = box(g, pier + 32, 0, pier, wid, 28, { top: 'var(--road)', front: stone.front, side: stone.side });
  [pierL, pierR].forEach((p) => { p.top.style.backgroundImage = 'linear-gradient(transparent 46%, rgba(255,255,255,.75) 46% 54%, transparent 54%)'; });
  const towers = [box(g, pier - 16, 0, 16, wid, 76, stone), box(g, pier + 32, 0, 16, wid, 76, stone)];
  towers.forEach((t) => {
    t.front.style.cssText += ';display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:6px;padding-top:8px';
    h('div', 'win', 'width:6px;height:10px', t.front); h('div', 'win', 'width:6px;height:10px', t.front);
    const cap = box(t.roof(), 2, 3, 12, 18, 10, { top: '#2E86C1', front: '#5BB8E6', side: '#2E86C1' }, { bw: 2 });
    sprite(cap.roof(), 6, 9, 10, 14, '<svg width="10" height="14" viewBox="0 0 10 14" stroke="' + INK + '" stroke-width="2"><line x1="2" y1="1" x2="2" y2="13"/><path d="M2 2 L9 4 L2 6" fill="#F47B5A"/></svg>');
  });
  const walk = h('div', 'p3', 'left:' + pier + 'px;top:8px;width:32px;height:8px;transform:translateZ(60px)', g);
  box(walk, 0, 0, 32, 8, 6, stone, { bw: 2 });
  const hinge = h('div', 'p3', 'left:' + pier + 'px;top:0;width:32px;height:' + wid + 'px;transform:translateZ(24px)', g);
  const lw = h('div', 'p3 leafL', 'left:0;top:0;width:16px;height:' + wid + 'px', hinge);
  const rw = h('div', 'p3 leafR', 'left:16px;top:0;width:16px;height:' + wid + 'px', hinge);
  [lw, rw].forEach((w) => { const l = box(w, 0, 0, 16, wid, 4, { top: 'var(--road)', front: stone.front, side: stone.side }, { bw: 2, full: true }); l.top.style.backgroundImage = 'linear-gradient(transparent 46%, rgba(255,255,255,.75) 46% 54%, transparent 54%)'; });
}
// 3. Stone arch bridge (HQ ⇄ Lagos), running north–south.
function archBridge(world, x, y, wid, len) {
  const b = box(world, x, y, wid, len, 28, { top: 'var(--road)', front: '#E9E1D3', side: '#D6CCBB' });
  b.top.style.backgroundImage = 'linear-gradient(90deg, transparent 46%, rgba(255,255,255,.75) 46% 54%, transparent 54%)';
  b.side.style.backgroundImage = 'radial-gradient(circle at 0 50%, var(--sea) 0 11px, ' + INK + ' 11px 13.5px, transparent 14px)';
  b.side.style.backgroundSize = '28px 30px';
  b.side.style.backgroundRepeat = 'repeat-y';
  b.side.style.backgroundPosition = '0 4px';
}
// 4. Ganusii highway (Lagos ⇄ Victoria Island): an elevated deck on pillars. This one is a product link.
function highway(world, x, y, len, wid) {
  const hp = BY_SLOT['lagos-highway'];
  const gb = hp ? landmark(world, hp.id, x, y, len, wid) : h('div', 'p3', 'left:' + x + 'px;top:' + y + 'px;width:' + len + 'px;height:' + wid + 'px', world);
  for (let i = 18; i < len - 8; i += 24) box(gb, i, wid / 2 - 4, 8, 8, 22, { top: '#C7B296', front: '#E8DCCB', side: '#D9C6AE' }, { bw: 2 });
  const lift = h('div', 'p3', 'left:0;top:0;width:' + len + 'px;height:' + wid + 'px;transform:translateZ(22px)', gb);
  const deck = box(lift, 0, 0, len, wid, 8, { top: 'var(--road)', front: '#1E4D3A', side: '#163A2B' });
  deck.top.style.backgroundImage = 'linear-gradient(transparent 46%, rgba(255,255,255,.8) 46% 54%, transparent 54%)';
  const road = deck.roof();
  [['car', 2, '#F6C343', '#D9A72A', 0], ['car2', 13, '#1E4D3A', '#163A2B', 0], ['car', 2, '#FFFFFF', '#D8DCE3', -2.5], ['car2', 13, '#E5484D', '#B8333A', -3]].forEach((c) => {
    const w = h('div', 'p3 ' + c[0], 'top:' + c[1] + 'px;width:16px;height:9px;animation-delay:' + c[4] + 's', road);
    box(w, 0, 0, 16, 9, 10, { top: c[2], front: c[2], side: c[3] }, { bw: 2, full: true });
  });
  return gb;
}
// 5. Suspension bridge (London ⇄ Victoria Island): the UK ⇄ Nigeria corridor, running north–south.
function suspension(world, x, y, wid, len) {
  const g = h('div', 'p3', 'left:' + x + 'px;top:' + y + 'px;width:' + wid + 'px;height:' + len + 'px', world);
  const red = { top: '#F47B5A', front: '#F47B5A', side: '#D45E3E' };
  const lift = h('div', 'p3', 'left:0;top:0;width:' + wid + 'px;height:' + len + 'px;transform:translateZ(20px)', g);
  const deck = box(lift, 0, 0, wid, len, 8, { top: 'var(--road)', front: '#D45E3E', side: '#D45E3E' });
  deck.top.style.backgroundImage = 'linear-gradient(90deg, transparent 46%, rgba(255,255,255,.8) 46% 54%, transparent 54%)';
  const towersY = [Math.round(len * 0.25), Math.round(len * 0.75)];
  towersY.forEach((ty) => {
    box(g, 0, ty - 4, 6, 8, 104, red, { bw: 2 });
    box(g, wid - 6, ty - 4, 6, 8, 104, red, { bw: 2 });
    [96, 48].forEach((z) => { const cb = h('div', 'p3', 'left:0;top:' + (ty - 4) + 'px;width:' + wid + 'px;height:8px;transform:translateZ(' + z + 'px)', g); box(cb, 0, 0, wid, 8, 6, red, { bw: 2 }); });
  });
  // cable height (above water) along the span
  const top = 102, deckTop = 28;
  const hAt = (s) => {
    const a = towersY[0], b = towersY[1];
    if (s <= a) return deckTop + 6 + (top - deckTop - 6) * Math.pow(s / a, 1.6);
    if (s >= b) return deckTop + 6 + (top - deckTop - 6) * Math.pow((len - s) / (len - b), 1.6);
    const t = (s - a) / (b - a);
    return top - (top - deckTop - 10) * Math.sin(Math.PI * t);
  };
  const H = 110;
  const draw = (mirror) => {
    let pts = '', hang = '';
    for (let s = 0; s <= len; s += 6) { const v = hAt(s); pts += (mirror ? H - v : v).toFixed(1) + ',' + s + ' '; }
    for (let s = 12; s < len; s += 12) { if (Math.abs(s - towersY[0]) < 6 || Math.abs(s - towersY[1]) < 6) continue; const v = hAt(s); hang += '<line x1="' + (mirror ? H - deckTop : deckTop) + '" y1="' + s + '" x2="' + (mirror ? H - v : v).toFixed(1) + '" y2="' + s + '"/>'; }
    return '<svg width="' + H + '" height="' + len + '" viewBox="0 0 ' + H + ' ' + len + '" fill="none" stroke="' + INK + '" stroke-linecap="round"><g stroke-width="1.4">' + hang + '</g><polyline points="' + pts + '" stroke-width="3"/></svg>';
  };
  h('div', 'rail', 'left:0;top:0;width:' + H + 'px;height:' + len + 'px;transform-origin:0 50%;transform:rotateY(-90deg)', g, draw(false));
  h('div', 'rail', 'left:' + (wid - H) + 'px;top:0;width:' + H + 'px;height:' + len + 'px;transform-origin:100% 50%;transform:rotateY(90deg)', g, draw(true));
}

/* ---------- build the world ---------- */
function build(world) {
  // sea details (flat on the water)
  [[300, 80], [620, 250], [290, 510], [380, 780], [760, 600], [860, 650], [1120, 820], [1100, 250], [200, 980], [650, 1040]].forEach((p, i) =>
    h('div', 'ripple', 'left:' + p[0] + 'px;top:' + p[1] + 'px;animation-delay:' + (-i * 0.9) + 's', world));
  [[480, 320], [720, 520], [90, 620], [1150, 700], [560, 1040], [980, 640], [600, 200], [1060, 1000]].forEach((p, i) =>
    h('div', 'spark', 'left:' + p[0] + 'px;top:' + p[1] + 'px;animation-delay:' + (-i * 0.7) + 's', world));

  /* CALGARY · 330 × 330 */
  const cg = island(world, 40, 130, 330, 330, 28);
  ringRoad(cg, 330, 330);
  h('div', 'lawn', 'left:36px;top:36px;width:100px;height:74px', cg);
  h('div', 'lawn', 'left:140px;top:236px;width:90px;height:58px', cg);
  sprite(cg, 250, 84, 190, 140, D.mountains());
  [[62, 64, 'p'], [100, 50, 'p'], [140, 74, 'p'], [282, 168, 'p'], [60, 150, 't'], [290, 222, 't']].forEach((p) => sprite(cg, p[0], p[1], p[2] === 'p' ? 30 : 34, p[2] === 'p' ? 50 : 48, p[2] === 'p' ? D.pine() : D.tree()));
  sprite(cg, 135, 232, 12, 40, D.lamp());
  sprite(cg, 245, 140, 12, 40, D.lamp());
  // cottages
  const cot = (x, y, c) => { const b = box(cg, x, y, 36, 30, 26, { top: c, front: '#FFFFFF', side: '#EDE6DC' }); b.front.style.cssText += ';display:flex;align-items:flex-end;justify-content:center;gap:5px;padding-bottom:4px'; h('div', 'win', 'width:9px;height:9px', b.front); h('div', 'win', 'width:9px;height:9px', b.front); };
  cot(248, 248, '#E5484D');
  cot(250, 200, '#5BB8E6');
  // Nestlo house
  slot(cg, 'calgary-house', 150, 150, 80, 70, (ns) => {
  const nb = box(ns, 0, 0, 80, 70, 52, { top: '#1F6F6B', front: '#F7EFE2', side: '#E6D6BC' });
  nb.front.style.cssText += ';display:flex;align-items:flex-end;justify-content:space-around;padding:0 8px';
  h('div', '', 'width:16px;height:26px;background:#E3A33B;border:2.5px solid ' + INK + ';border-bottom:0;border-radius:8px 8px 0 0', nb.front);
  h('div', 'win', 'width:18px;height:15px;margin-bottom:16px', nb.front);
  h('div', 'win', 'width:18px;height:15px;margin-bottom:16px', nb.front);
  const chim = box(nb.roof(), 54, 12, 12, 12, 16, { top: '#B9774E', front: '#C98A62', side: '#A0653F' }, { bw: 2 });
  const ch = chim.roof();
  sprite(ch, 6, 0, 22, 34, '<div class="smoke" style="width:15px;height:15px;border-radius:50%;background:#fff;border:2.5px solid ' + INK + '"></div>');
  sprite(ch, 6, 0, 22, 34, '<div class="smoke d" style="width:12px;height:12px;border-radius:50%;background:#fff;border:2.5px solid ' + INK + '"></div>');
  });
  slot(cg, 'calgary-plot', 40, 215, 80, 70);
  vehicle(cg, lane(330, 330, 10), 34, 22, 11, 11, { top: '#E5484D', front: '#E5484D', side: '#B8333A' }, null, { phase: 0.1 });
  vehicle(cg, rev(lane(330, 330, 18)), 30, 18, 10, 10, { top: '#5BB8E6', front: '#5BB8E6', side: '#2E86C1' }, null, { phase: 0.55 });
  vehicle(cg, lane(330, 330, 10), 28, 24, 12, 13, { top: '#F6C343', front: '#F6C343', side: '#D9A72A' }, null, { phase: 0.6 });
  walker(cg, lane(330, 330, 18), 20, D.cyclist('#58B07C'), 34, 32, { phase: 0.3 });
  walker(cg, pingpong([[60, 128, 3], [130, 128, 3], [134, 214, 3]]), 9, D.person(pick(SHIRTS)), 18, 34);
  walker(cg, pingpong([[244, 112, 3], [292, 120, 3], [296, 196, 3]]), 7, D.person(pick(SHIRTS)), 18, 34);
  walker(cg, pingpong([[150, 300, 3], [240, 300, 3]]), 8, D.person(pick(SHIRTS)), 18, 34);
  placeName(world, 40 + 165, 130 + 322, 'CALGARY · CANADA');

  /* HQ · 150 × 150 */
  const hq = island(world, 430, 380, 150, 150, 28);
  h('div', 'road', 'left:0;top:22px;width:144px;height:26px;border-width:0;background:var(--road);border-radius:0', hq);
  h('div', 'road', 'left:64px;top:40px;width:30px;height:104px;border-width:0;background:var(--road);border-radius:0', hq);
  const lh = landmark(hq, 'hq', 6, 66, 56, 56, PRODUCTS.hq.name + ' — our story');
  const lhs = sprite(lh, 28, 30, 56, 122, D.lighthouse());
  lhs.style.pointerEvents = 'auto';
  sprite(hq, 124, 124, 34, 48, D.tree('#58B07C'));
  sprite(hq, 120, 70, 12, 40, D.lamp());
  walker(hq, pingpong([[110, 64, 3], [132, 100, 3]]), 6, D.person('#F47B5A'), 18, 34);

  /* LONDON · 340 × 340 */
  const ld = island(world, 700, 80, 340, 340, 28);
  ringRoad(ld, 340, 340);
  h('div', 'lawn', 'left:190px;top:36px;width:116px;height:120px', ld);
  [[232, 72], [284, 100], [214, 134], [292, 150]].forEach((p, i) => sprite(ld, p[0], p[1], 34, 48, D.tree(i % 2 ? '#58B07C' : '#6CC08B')));
  sprite(ld, 180, 66, 12, 40, D.lamp());
  sprite(ld, 300, 300, 12, 40, D.lamp());
  const terr = box(ld, 36, 34, 124, 28, 32, { top: '#6B7280', front: '#E59A73', side: '#C9805C' });
  windows(terr.front, 6, 1, '', '6px 6px 12px');
  box(ld, 178, 140, 12, 12, 28, { top: '#E5484D', front: '#E5484D', side: '#C23338' }, { bw: 2 });
  slot(ld, 'london-tower', 80, 90, 80, 80, (sf) => {
  const sb = box(sf, 0, 0, 80, 80, 120, { top: '#2E86C1', front: '#FFFFFF', side: '#D6E6F2' });
  windows(sb.front, 3, 5, 'g', '10px 10px 22px');
  sprite(sb.roof(), 40, 46, 48, 56, D.shield());
  });
  slot(ld, 'london-works', 200, 190, 80, 80, (vv) => {
  const vb = box(vv, 0, 0, 80, 80, 48, { top: '#FFE7A8', front: '#FFE7A8', side: '#F0CC76' });
  windows(vb.front, 3, 1, '', '9px 10px 20px');
  box(vb.roof(), 0, 0, 80, 80, 42, { top: 'transparent', front: 'transparent', side: 'transparent' }, { dashed: true });
  sprite(vv, 12, 24, 96, 150, D.crane());
  });
  slot(ld, 'london-plot', 50, 230, 80, 70);
  const busDeco = (b) => { [b.front, b.back].forEach((f) => { windows(f, 4, 2, 'g', '3px 3px 4px'); f.style.gap = '2px'; }); };
  vehicle(ld, lane(340, 340, 10), 32, 36, 13, 22, { top: '#E5484D', front: '#E5484D', side: '#C23338' }, busDeco, { phase: 0.05 });
  vehicle(ld, lane(340, 340, 10), 40, 18, 10, 10, { top: '#2B2D33', front: '#2B2D33', side: '#17181C' }, null, { phase: 0.5 });
  vehicle(ld, rev(lane(340, 340, 18)), 38, 18, 10, 10, { top: '#2B2D33', front: '#2B2D33', side: '#17181C' }, null, { phase: 0.3 });
  vehicle(ld, rev(lane(340, 340, 18)), 30, 36, 13, 22, { top: '#E5484D', front: '#E5484D', side: '#C23338' }, busDeco, { phase: 0.8 });
  walker(ld, rev(lane(340, 340, 18)), 18, D.cyclist('#E5484D', '#5BB8E6'), 34, 32, { phase: 0.65 });
  walker(ld, lane(340, 340, 18), 16, D.cyclist('#F6C343'), 34, 32, { phase: 0.15 });
  walker(ld, pingpong([[180, 186, 3], [180, 292, 3], [300, 296, 3]]), 9, D.person(pick(SHIRTS)), 18, 34);
  walker(ld, pingpong([[40, 196, 3], [170, 186, 3]]), 8, D.person(pick(SHIRTS)), 18, 34);
  walker(ld, pingpong([[200, 172, 3], [300, 172, 3]]), 10, D.person(pick(SHIRTS)), 18, 34);
  walker(ld, pingpong([[40, 76, 3], [160, 76, 3]]), 7, D.person(pick(SHIRTS)), 18, 34);
  placeName(world, 700 + 170, 80 + 332, 'LONDON · UK');

  /* LAGOS · 330 × 330 */
  const lg = island(world, 470, 610, 330, 330, 28);
  ringRoad(lg, 330, 330);
  h('div', 'lawn', 'left:200px;top:110px;width:96px;height:60px', lg);
  [[292, 120], [288, 250], [200, 292], [40, 210]].forEach((p) => sprite(lg, p[0], p[1], 36, 56, D.palm()));
  sprite(lg, 140, 206, 36, 40, D.umbrella('#F47B5A'));
  sprite(lg, 176, 228, 36, 40, D.umbrella('#5BB8E6'));
  sprite(lg, 118, 240, 36, 40, D.umbrella('#F6C343'));
  box(lg, 230, 196, 44, 30, 22, { top: '#1E4D3A', front: '#F6C343', side: '#D9A72A' });
  sprite(lg, 216, 186, 12, 40, D.lamp());
  const apt = box(lg, 206, 40, 70, 46, 60, { top: '#F47B5A', front: '#FFE3D8', side: '#F2C6B4' });
  windows(apt.front, 4, 3, '', '7px 7px 12px');
  const hs = box(lg, 40, 262, 40, 34, 28, { top: '#5BB8E6', front: '#FFFFFF', side: '#E2E8EE' });
  hs.front.style.cssText += ';display:flex;align-items:flex-end;justify-content:center;gap:5px;padding-bottom:5px';
  h('div', 'win', 'width:9px;height:9px', hs.front); h('div', 'win', 'width:9px;height:9px', hs.front);
  slot(lg, 'lagos-care', 50, 60, 130, 80, (nc) => {
  const nb2 = box(nc, 0, 0, 130, 80, 50, { top: '#24304F', front: '#FFFFFF', side: '#E3E7EF' });
  windows(nb2.front, 6, 1, '', '9px 10px 20px');
  sprite(nb2.roof(), 65, 46, 44, 44, D.heart());
  });
  walker(lg, pingpong([[60, 160, 3], [176, 160, 3]]), 5, D.person('#5BB8E6'), 18, 34, { phase: 0 });
  walker(lg, pingpong([[66, 162, 3], [182, 162, 3]]), 5, D.person('#FFFFFF'), 18, 34, { phase: 0.02 });
  const danfo = (b) => { [b.front, b.back].forEach((f) => { f.style.backgroundImage = 'linear-gradient(transparent 55%, #17181C 55%, #17181C 68%, transparent 68%)'; }); };
  vehicle(lg, lane(330, 330, 10), 30, 26, 13, 15, { top: '#F6C343', front: '#F6C343', side: '#D9A72A' }, danfo, { phase: 0.2 });
  vehicle(lg, rev(lane(330, 330, 18)), 28, 26, 13, 15, { top: '#F6C343', front: '#F6C343', side: '#D9A72A' }, danfo, { phase: 0.65 });
  vehicle(lg, lane(330, 330, 10), 36, 18, 10, 10, { top: '#FFFFFF', front: '#FFFFFF', side: '#D8DCE3' }, null, { phase: 0.7 });
  vehicle(lg, rev(lane(330, 330, 18)), 32, 26, 13, 15, { top: '#F6C343', front: '#F6C343', side: '#D9A72A' }, danfo, { phase: 0.15 });
  walker(lg, lane(330, 330, 18), 26, D.okada(), 38, 34, { phase: 0.4 });
  walker(lg, rev(lane(330, 330, 10)), 24, D.okada(), 38, 34, { phase: 0.9 });
  walker(lg, pingpong([[96, 186, 3], [206, 280, 3]]), 8, D.person(pick(SHIRTS)), 18, 34);
  walker(lg, pingpong([[230, 240, 3], [290, 296, 3]]), 9, D.person(pick(SHIRTS)), 18, 34);
  walker(lg, pingpong([[190, 104, 3], [290, 104, 3]]), 7, D.person(pick(SHIRTS)), 18, 34);
  placeName(world, 470 + 165, 610 + 322, 'LAGOS · NIGERIA');

  /* VICTORIA ISLAND · 190 × 200 */
  const vi = island(world, 880, 700, 190, 200, 28);
  h('div', 'road', 'left:58px;top:0;width:28px;height:104px;border-width:0;background:var(--road);border-radius:0', vi);
  h('div', 'road', 'left:0;top:78px;width:86px;height:28px;border-width:0;background:var(--road);border-radius:0', vi);
  const t1 = box(vi, 110, 24, 56, 56, 120, { top: '#5BB8E6', front: '#E6F2FB', side: '#C3DAEA' });
  windows(t1.front, 3, 7, 'g', '7px 7px 10px'); t1.front.style.gap = '4px';
  const t2 = box(vi, 120, 120, 44, 44, 76, { top: '#F47B5A', front: '#FFFFFF', side: '#E8E3DD' });
  windows(t2.front, 2, 5, '', '6px 6px 9px'); t2.front.style.gap = '4px';
  sprite(vi, 30, 40, 36, 56, D.palm());
  sprite(vi, 24, 150, 36, 56, D.palm());
  walker(vi, pingpong([[16, 124, 3], [52, 150, 3]]), 8, D.person(pick(SHIRTS)), 18, 34);
  placeName(world, 880 + 95, 700 + 192, 'VICTORIA ISLAND');

  /* BRIDGES — five kinds */
  footbridge(world, 366, 405, 68, 20); // Calgary ⇄ HQ
  bascule(world, 576, 388, 128); // HQ ⇄ London
  archBridge(world, 495, 526, 30, 88); // HQ ⇄ Lagos
  highway(world, 796, 780, 88, 24); // Lagos ⇄ Victoria Island (Ganusii)
  suspension(world, 940, 416, 24, 288); // London ⇄ Victoria Island
  // new islands appear when the admin places a product on them
  if (BY_SLOT['north-isle']) {
    const ni = island(world, 420, 110, 150, 150, 28);
    h('div', 'lawn', 'left:16px;top:96px;width:60px;height:40px', ni);
    sprite(ni, 126, 34, 34, 48, D.tree()); sprite(ni, 124, 120, 30, 50, D.pine());
    slot(ni, 'north-isle', 30, 30, 90, 80);
    walker(ni, pingpong([[14, 128, 3], [100, 132, 3]]), 7, D.person(pick(SHIRTS)), 18, 34);
    footbridge(world, 366, 190, 58, 20);
  }
  if (BY_SLOT['south-isle']) {
    const si = island(world, 150, 560, 160, 160, 28);
    h('div', 'lawn', 'left:100px;top:110px;width:50px;height:40px', si);
    sprite(si, 22, 130, 36, 56, D.palm()); sprite(si, 140, 40, 34, 48, D.tree('#58B07C'));
    slot(si, 'south-isle', 35, 35, 90, 80);
    walker(si, pingpong([[60, 8, 3], [60, 140, 3]]), 7, D.person(pick(SHIRTS)), 18, 34);
    archBridge(world, 210, 456, 30, 108);
  }
  // bridge traffic
  walker(world, pingpong([[330, 415, 30], [478, 414, 30]]), 10, D.person('#7C5CC4'), 18, 34, { phase: 0.2 });
  walker(world, pingpong([[340, 413, 30], [470, 413, 30]]), 16, D.cyclist('#F47B5A'), 34, 32, { phase: 0.7 });
  vehicle(world, pingpong([[510, 440, 31], [510, 632, 31]]), 26, 20, 10, 10, { top: '#58B07C', front: '#58B07C', side: '#3E9C6B' }, null, { phase: 0.1 });
  vehicle(world, pingpong([[510, 632, 31], [510, 440, 31]]), 22, 26, 13, 15, { top: '#F6C343', front: '#F6C343', side: '#D9A72A' }, danfo, { phase: 0.6 });
  vehicle(world, pingpong([[952, 398, 31], [952, 790, 31]]), 34, 20, 10, 10, { top: '#FFFFFF', front: '#FFFFFF', side: '#D8DCE3' }, null, { phase: 0.15 });
  vehicle(world, pingpong([[952, 790, 31], [952, 398, 31]]), 30, 30, 12, 14, { top: '#2E86C1', front: '#2E86C1', side: '#24679A' }, null, { phase: 0.55 });

  /* ON THE WATER */
  walker(world, pingpong([[490, 975], [780, 975]]), 22, D.surfer('#F6C343', '#E5484D'), 48, 42, { phase: 0 });
  walker(world, pingpong([[445, 650], [445, 920]]), 18, D.surfer('#5BB8E6', '#58B07C'), 48, 42, { phase: 0.5 });
  walker(world, pingpong([[1072, 110], [1072, 380]]), 20, D.surfer('#F47B5A', '#2E86C1'), 48, 42, { phase: 0.3 });
  // the boat that passes under the bascule (timed to the bridge lifting)
  walker(world, pingpong([[640, 110], [640, 590]]), 24, '<div class="bob-s">' + D.sail('#F47B5A') + '</div>', 42, 50, { phase: 0 });
  walker(world, [[380, 24], [660, 18], [660, 64], [380, 66]], 12, '<div class="bob-s">' + D.sail('#5BB8E6') + '</div>', 42, 50, { phase: 0.6 });
  walker(world, [[60, 800], [420, 790], [420, 960], [60, 960]], 14, '<div class="bob-s">' + D.sail('#F6C343') + '</div>', 42, 50, { phase: 0.2 });
  walker(world, [[1110, 120], [1170, 400], [1150, 640], [1100, 360]], 10, '<div class="bob-s">' + D.sail('#58B07C') + '</div>', 42, 50, { phase: 0.4 });
  walker(world, pingpong([[10, 170], [10, 440]]), 10, '<div class="bob-s">' + D.kayak() + '</div>', 44, 24);
  vehicle(world, pingpong([[640, 480], [900, 540]]), 18, 40, 16, 8, { top: '#FFFFFF', front: '#FFFFFF', side: '#D8DCE3' }, (b) => {
    [b.front, b.back].forEach((f) => { f.style.backgroundImage = 'linear-gradient(transparent 50%, #F47B5A 50%)'; });
    box(b.roof(), 8, 3, 20, 10, 8, { top: '#5BB8E6', front: '#FFFFFF', side: '#E2E8EE' }, { bw: 2, full: true });
  });
  // cargo ship on the UK ⇄ Nigeria corridor, passing under the suspension bridge
  vehicle(world, pingpong([[1180, 570], [700, 570]]), 9, 84, 22, 10, { top: '#2E86C1', front: '#2E86C1', side: '#24679A' }, (b) => {
    const r = b.roof();
    [['#F47B5A', 6], ['#F6C343', 24], ['#58B07C', 42], ['#FFFFFF', 60]].forEach((c) => box(r, c[1], 4, 16, 14, 8, { top: c[0], front: c[0], side: c[0] }, { bw: 2, full: true }));
  });
  [[640, 560], [300, 960], [1020, 1000]].forEach((p) => sprite(world, p[0], p[1], 16, 26, '<div class="bob">' + D.buoy() + '</div>'));
  sprite(world, 380, 640, 90, 70, '<div style="position:absolute;left:0;bottom:0" class="jump">' + D.dolphin() + '</div>');
  sprite(world, 780, 480, 90, 70, '<div style="position:absolute;left:0;bottom:0;animation-delay:-3.5s" class="jump">' + D.dolphin() + '</div>');

  /* IN THE AIR */
  walker(world, [[150, 240, 240], [280, 330, 270], [200, 420, 250], [100, 320, 260]], 6, '<div class="float">' + D.balloon() + '</div>', 44, 66, { phase: 0.1 });
  walker(world, [[930, 740, 200], [1090, 760, 210], [1070, 900, 190], [920, 900, 200]], 30, D.heli(), 48, 30);
  for (let i = 0; i < 5; i++) {
    const o = [[0, 0], [16, -10], [16, 10], [32, -18], [32, 18]][i];
    walker(world, [[-200 + o[0], 400 + o[1], 320], [1300 + o[0], 300 + o[1], 320], [1000 + o[0], 1300 + o[1], 320], [-100 + o[0], 1000 + o[1], 320]], 40, D.bird(), 22, 12, { phase: 0.05 });
  }
  [[60, 60, 90], [380, 760, 70], [800, 40, 80]].forEach((c, i) => {
    const cl = h('div', 'p3', 'left:0;top:0;width:0;height:0', world);
    h('div', 'bbc', 'left:' + -c[2] / 2 + 'px;top:' + -c[2] / 4 + 'px;width:' + c[2] + 'px;height:' + c[2] / 2 + 'px', cl, D.cloud(c[2]));
    const from = 'translate3d(' + (c[0] - 260) + 'px,' + (c[1] - 260) + 'px,290px)';
    const to = 'translate3d(' + (c[0] + 420) + 'px,' + (c[1] + 420) + 'px,290px)';
    if (REDUCE) cl.style.transform = from; else cl.animate([{ transform: from }, { transform: to }], { duration: 70000 + i * 15000, iterations: Infinity, delay: -i * 22000 });
  });

  /* THE PAPER PLANE */
  const shadow = h('div', 'p3 plane', 'left:0;top:0;width:0;height:0', world, '<div style="position:absolute;left:-24px;top:-24px;width:48px;height:48px;border-radius:50%;background:rgba(23,24,28,.16)"></div>');
  const plane = h('div', 'p3 plane', 'left:0;top:0;width:0;height:0', world);
  const pb = h('div', 'bbc', 'left:-44px;top:-32px;width:88px;height:64px', plane);
  const bobEl = h('div', 'bob', '', pb);
  const aim = h('div', 'aim', '', bobEl, D.plane());
  return { plane, shadow, aim };
}

/* ---------- interaction ---------- */
export function init(opts) {
  opts = opts || {};
  const root = document.querySelector('[data-ul-root]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  const world = root.querySelector('.ul-world');
  const pan = root.querySelector('.ul-pan');
  const stage = root.querySelector('.ul-stage');
  const content = opts.content || DEFAULT_CONTENT;
  configure(opts.products || DEFAULT_PRODUCTS, content);
  const P = build(world);
  const seen = {};
  const track = (type, id) => { if (!opts.onEvent) return; if (type === 'hover') { if (seen[id]) return; seen[id] = 1; } try { opts.onEvent(type, id); } catch (e) { /* analytics must never break the page */ } };

  /* plane tour */
  const st = { target: 'hq', angle: -25, stop: -1, hover: null, paused: REDUCE };
  const card = root.querySelector('[data-card]');
  const cardSw = card.querySelector('.sw'), cardName = card.querySelector('strong'), cardMeta = card.querySelector('.meta'), cardLine = card.querySelector('.ln'), cardBtn = card.querySelector('.btn');
  const blds = Array.from(world.querySelectorAll('.bld'));
  const dotsWrap = root.querySelector('[data-dots]');
  const dots = TOUR.map((id, i) => {
    const b = h('button', '', '', dotsWrap, '<i></i>');
    b.type = 'button';
    b.setAttribute('aria-label', 'Fly to ' + PRODUCTS[id].name);
    b.addEventListener('click', () => { st.stop = i; aim(id); reveal(id); restartTour(); });
    return b;
  });
  const playBtn = root.querySelector('[data-play]');
  function place() {
    const p = POS[st.target];
    P.plane.style.transform = 'translate3d(' + p[0] + 'px,' + p[1] + 'px,' + (ALT[st.target] || 200) + 'px)';
    P.shadow.style.transform = 'translate3d(' + p[0] + 'px,' + p[1] + 'px,30px)';
    P.aim.style.transform = 'rotate(' + st.angle + 'deg)';
  }
  function showCard(id) {
    const d = PRODUCTS[id];
    cardSw.style.background = d.color;
    cardName.textContent = d.name;
    cardMeta.textContent = d.place + (STATUS[d.status] ? ' · ' + STATUS[d.status] : '');
    cardLine.textContent = d.line;
    cardBtn.textContent = d.cta;
    cardBtn.href = d.url;
    cardBtn.dataset.id = id;
    if (d.url.indexOf('http') === 0) { cardBtn.target = '_blank'; cardBtn.rel = 'noopener'; } else { cardBtn.removeAttribute('target'); }
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    blds.forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    dots.forEach((b, i) => b.setAttribute('aria-pressed', TOUR[i] === id ? 'true' : 'false'));
  }
  function aim(id) {
    const a = POS[st.target], b = POS[id];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      let ang = (Math.atan2(0.3536 * (dy - dx), 0.7071 * (dx + dy)) * 180) / Math.PI;
      ang = st.angle + ((((ang - st.angle) % 360) + 540) % 360) - 180;
      st.angle = Math.round(ang);
    }
    st.target = id;
    place();
    showCard(id);
  }
  function next() {
    if (st.hover || st.paused || document.hidden || !TOUR.length || root.classList.contains('panel-open')) return;
    st.stop = (st.stop + 1) % TOUR.length;
    aim(TOUR[st.stop]);
    if (Date.now() - userPanAt > 12000) reveal(TOUR[st.stop]); // don't pull the map away from someone exploring it
  }
  place();
  showCard('hq');
  // The tour opens on the HQ card (who we are, and a way into Our story) and holds it for a full stop before
  // the first product. Paused, as under reduced motion, it stays on HQ until someone picks a stop.
  const tourMs = Math.max(2, Number(content.settings && content.settings.tourSeconds) || 4.4) * 1000;
  let tourTimer = setInterval(next, tourMs);
  const restartTour = () => { clearInterval(tourTimer); tourTimer = setInterval(next, tourMs); };
  cardBtn.addEventListener('click', () => { if (cardBtn.dataset.id) track('click', cardBtn.dataset.id); });
  function setPaused(v) { st.paused = v; playBtn.textContent = v ? 'Play tour' : 'Pause tour'; }
  setPaused(st.paused);
  playBtn.addEventListener('click', () => setPaused(!st.paused));

  let touchSelected = null;
  blds.forEach((b) => {
    const id = b.dataset.id;
    let t = null;
    const enter = () => { clearTimeout(t); if (st.hover !== id) { st.hover = id; aim(id); track('hover', id); } };
    const leave = () => { clearTimeout(t); t = setTimeout(() => { if (st.hover === id) st.hover = null; }, 180); };
    b.addEventListener('mouseenter', enter);
    b.addEventListener('focus', enter);
    b.addEventListener('focus', () => { try { if (b.matches(':focus-visible')) reveal(id); } catch (e) { /* old browsers */ } });
    b.addEventListener('mouseleave', leave);
    b.addEventListener('blur', leave);
    b.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'mouse' && touchSelected !== id) { touchSelected = id; b.dataset.hold = '1'; enter(); setTimeout(leave, 2500); }
    });
    b.addEventListener('click', (e) => {
      if (dragged) { e.preventDefault(); return; }
      if (b.dataset.hold) { delete b.dataset.hold; e.preventDefault(); return; }
      track('click', id);
    });
  });

  /* products menu */
  const menuBtn = root.querySelector('[data-menu-btn]');
  const menu = root.querySelector('[data-menu]');
  const menuList = menu.querySelector('[data-menu-list]') || menu;
  TOUR.forEach((id) => {
    const d = PRODUCTS[id];
    const a = h('a', '', '', menuList,'<span style="display:flex;align-items:center;gap:10px"><span class="dot" style="background:' + esc(d.color) + '"></span><strong>' + esc(d.name) + '</strong></span><small>' + esc(d.place) + '</small>');
    a.href = d.url; if (d.url.indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; }
    a.addEventListener('click', () => track('click', id));
    a.addEventListener('mouseenter', () => aim(id));
    a.addEventListener('focus', () => aim(id));
  });
  const soon = Object.values(PRODUCTS).filter((p) => p.status === 'coming_soon').length;
  if (soon) h('div', 'soon', '', menuList, '+' + soon + ' more on the way');
  const setMenu = (v) => { menu.hidden = !v; menuBtn.setAttribute('aria-expanded', v ? 'true' : 'false'); };
  setMenu(false);
  menuBtn.addEventListener('click', (e) => { e.stopPropagation(); setMenu(menu.hidden); });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setMenu(false); dismiss(); } });

  /* day / night */
  const themeBtn = root.querySelector('[data-theme-btn]');
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; };
  const syncTheme = () => {
    themeBtn.setAttribute('aria-label', isDark() ? 'Switch to day' : 'Switch to night'); themeBtn.innerHTML = isDark() ? SUN : MOON;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', isDark() ? '#1C2E55' : '#BFE3F3'));
  };
  themeBtn.addEventListener('click', () => {
    const t = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('ul-theme', t); } catch (e) { /* private mode: the choice lasts for this visit */ }
    syncTheme();
  });
  syncTheme();

  /* pan & fit */
  let scale = 1, px = 0, py = 0, dragged = false;
  function fit() {
    const w = root.clientWidth, hh = root.clientHeight;
    const H0 = BY_SLOT['south-isle'] ? 780 : 700;
    scale = Math.max(w < 600 ? 0.6 : 0.45, Math.min(1.15, Math.min(w / 1320, (hh - 130) / H0)));
    clamp(); apply();
  }
  function clamp() {
    const lx = Math.max(0, (1320 * scale - root.clientWidth) / 2 + 60), ly = Math.max(0, ((BY_SLOT['south-isle'] ? 780 : 700) * scale - root.clientHeight) / 2 + 160);
    px = Math.max(-lx, Math.min(lx, px)); py = Math.max(-ly, Math.min(ly, py));
  }
  function apply() { pan.style.transform = 'translate(' + px + 'px,' + py + 'px) scale(' + scale + ')'; }
  window.addEventListener('resize', fit);
  fit();

  /* On small screens some products sit off-screen, so the map glides to bring a tour stop into view. */
  let panT = null, userPanAt = 0;
  // The part of the stage that floating UI doesn't cover, in stage pixels.
  function clearArea() {
    const rb = root.getBoundingClientRect(), H = root.clientHeight;
    let top = 0, bottom = H;
    root.querySelectorAll('.ul-top > *, .ul-tagline, .ul-hint, .ul-card, .ul-tour').forEach((el) => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (!r.height || cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
      const t = r.top - rb.top, b = r.bottom - rb.top;
      if (t + b < H) top = Math.max(top, b); else bottom = Math.min(bottom, t);
    });
    return { left: 12, right: root.clientWidth - 12, top: top + 12, bottom: bottom - 12 };
  }
  // Moves the map only along an axis where the building is out of view, centring it on that axis.
  // Measured against where the map is heading (px, py), so it also works mid-glide.
  function reveal(id) {
    const b = blds.find((x) => x.dataset.id === id);
    if (!b) return;
    const o = pan.getBoundingClientRect(), cx = root.clientWidth / 2 + px, cy = root.clientHeight / 2 + py;
    let l = Infinity, t = Infinity, r = -Infinity, btm = -Infinity;
    b.querySelectorAll('.f, .bb').forEach((e) => {
      const q = e.getBoundingClientRect();
      if (!q.width) return;
      l = Math.min(l, q.left - o.left + cx); r = Math.max(r, q.right - o.left + cx);
      t = Math.min(t, q.top - o.top + cy); btm = Math.max(btm, q.bottom - o.top + cy);
    });
    if (l === Infinity) return;
    const a = clearArea();
    const dx = l < a.left || r > a.right ? (a.left + a.right - l - r) / 2 : 0;
    const dy = t < a.top || btm > a.bottom ? (a.top + a.bottom - t - btm) / 2 : 0;
    if (!dx && !dy) return;
    px += dx; py += dy; clamp();
    if (!REDUCE) {
      pan.style.transition = 'transform 1.4s cubic-bezier(.45, 0, .2, 1)';
      clearTimeout(panT); panT = setTimeout(() => { pan.style.transition = ''; }, 1450);
    }
    apply();
  }

  let start = null;
  stage.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY, px, py, id: e.pointerId }; dragged = false; pan.style.transition = ''; });
  window.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!dragged && Math.hypot(dx, dy) > 6) { dragged = true; stage.classList.add('dragging'); hideHint(); }
    if (dragged) { userPanAt = Date.now(); px = start.px + dx; py = start.py + dy; clamp(); apply(); }
  });
  window.addEventListener('pointerup', () => { start = null; stage.classList.remove('dragging'); setTimeout(() => { dragged = false; }, 0); });
  const hint = root.querySelector('[data-hint]');
  function hideHint() { if (hint) hint.style.opacity = '0'; }
  setTimeout(hideHint, 6000);

  /* panels (#story, #notes, #contact). While one is open, .panel-open on the root dims the map and hides the
     floating UI, and everything behind the panel is inert, so Tab stays in the panel. */
  const panels = Array.from(root.querySelectorAll('[data-panel]'));
  const behind = [stage, root.querySelector('.ul-top'), root.querySelector('.ul-tagline'), hint, root.querySelector('.ul-dock')].filter(Boolean);
  let opener = null; // what had keyboard focus when the panel opened; it gets focus back on close
  function closePanels() {
    panels.forEach((p) => { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); p.inert = true; });
    root.classList.remove('panel-open');
    behind.forEach((el) => { el.inert = false; });
  }
  function route() {
    const id = (location.hash || '').slice(1);
    const p = panels.find((x) => x.dataset.panel === id);
    if (p && !root.classList.contains('panel-open')) {
      const a = document.activeElement;
      try { opener = a && a !== document.body && a.matches(':focus-visible') ? a : null; } catch (e) { opener = null; }
    }
    closePanels();
    if (p) {
      p.classList.add('open'); p.setAttribute('aria-hidden', 'false'); p.inert = false;
      root.classList.add('panel-open'); setMenu(false);
      behind.forEach((el) => { el.inert = true; });
      setTimeout(() => { const f = p.querySelector('h2'); if (f) f.focus({ preventScroll: true }); }, 350);
    }
  }
  // Closing also clears the hash, so the same link can open the panel again.
  function dismiss() {
    if (!root.classList.contains('panel-open')) return;
    closePanels();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    if (opener && opener.isConnected) {
      opener.focus({ preventScroll: true });
      if (document.activeElement !== opener && menu.contains(opener)) menuBtn.focus({ preventScroll: true }); // the menu has closed
    }
    opener = null;
  }
  root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', dismiss));
  const scrim = root.querySelector('[data-scrim]');
  if (scrim) scrim.addEventListener('click', dismiss);
  window.addEventListener('hashchange', route);
  route();

  /* contact form */
  const form = root.querySelector('[data-contact]');
  if (form) {
    const sent = root.querySelector('[data-sent]'), fail = root.querySelector('[data-fail]');
    const submit = form.querySelector('[type=submit]'), submitLabel = submit.textContent;
    const FIELDS = ['name', 'email'];
    const input = (k) => form.querySelector('[name="' + k + '"]');
    // Shows (or clears) each field's message under it; focuses the first field with a problem.
    const showErrors = (errors) => {
      FIELDS.forEach((k) => {
        const out = form.querySelector('[data-err="' + k + '"]');
        out.textContent = errors[k] || ''; out.hidden = !errors[k];
        if (errors[k]) input(k).setAttribute('aria-invalid', 'true'); else input(k).removeAttribute('aria-invalid');
      });
      const first = FIELDS.find((k) => errors[k]);
      if (first) input(first).focus();
      return !!first;
    };
    FIELDS.forEach((k) => input(k).addEventListener('input', () => {
      form.querySelector('[data-err="' + k + '"]').hidden = true;
      input(k).removeAttribute('aria-invalid');
    }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submit.disabled) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const name = String(data.name || '').trim(), email = String(data.email || '').trim();
      // Same rules as /api/contact, checked here first so mistakes never cost a round trip.
      if (showErrors({
        name: name ? '' : 'Please add your name.',
        email: !email ? 'Please add your email so we can reply.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'That email doesn’t look right. Check it for typos.'
      })) return;
      fail.hidden = true;
      submit.disabled = true; submit.textContent = 'Sending…';
      let status = 0, res = {};
      if (opts.contactEndpoint) {
        try {
          const r = await fetch(opts.contactEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          status = r.status; res = await r.json().catch(() => ({}));
        } catch (err) { status = 0; }
      }
      submit.disabled = false; submit.textContent = submitLabel;
      if (status === 200 && res.ok) {
        form.hidden = true; sent.hidden = false;
        sent.querySelector('[data-sent-msg]').textContent = 'Thanks, ' + name + '. Your message is on its way, and we’ll reply to ' + email + '.';
        sent.focus({ preventScroll: true }); // a plain focus() can scroll .ul-root itself, shifting the whole page
        return;
      }
      if (status === 400 && res.errors && showErrors(res.errors)) return;
      fail.hidden = false;
      fail.querySelector('[data-fail-msg]').textContent = status === 429
        ? 'You’ve sent a few messages in a short time. Please wait a few minutes, or email us directly.'
        : 'We couldn’t send that just now. Please try again, or email us directly.';
    });
    root.querySelector('[data-again]').addEventListener('click', () => {
      form.reset(); sent.hidden = true; form.hidden = false; input('name').focus();
    });
    const copy = root.querySelector('[data-copy]');
    if (copy) copy.addEventListener('click', async () => {
      const t = copy.dataset.copy;
      try { await navigator.clipboard.writeText(t); copy.textContent = 'Copied'; } catch (err) { const r = document.createRange(); r.selectNodeContents(copy.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected'; }
      setTimeout(() => { copy.textContent = 'Copy'; }, 1800);
    });
  }
}
const SUN = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#17181C" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="#F6C343"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';
const MOON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#17181C" stroke-width="2.4" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="#5BB8E6"/></svg>';
