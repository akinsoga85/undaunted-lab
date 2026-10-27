import crypto from 'node:crypto';
import { getDb, schema } from '@/lib/db';

// Privacy-friendly analytics: no cookies, no IP stored. A visitor is a hash of
// (day + IP + browser + salt), so the same person can be counted once per day but not followed.
const TYPES = new Set(['view', 'hover', 'click']);
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

export async function POST(req) {
  const ua = req.headers.get('user-agent') || '';
  if (BOT.test(ua)) return new Response(null, { status: 204 });
  let d;
  try { d = await req.json(); } catch { return new Response(null, { status: 400 }); }
  if (!TYPES.has(d.t)) return new Response(null, { status: 400 });
  const product = typeof d.p === 'string' && /^[a-z0-9-]{1,40}$/.test(d.p) ? d.p : null;
  let referrer = null;
  try { if (d.ref) { const host = new URL(String(d.ref)).hostname.replace(/^www\./, ''); if (host && host !== req.nextUrl.hostname.replace(/^www\./, '')) referrer = host.slice(0, 100); } } catch { /* ignore */ }
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const visitor = crypto.createHash('sha256').update(day + ip + ua + (process.env.ANALYTICS_SALT || 'undaunted')).digest('hex').slice(0, 16);
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
  try {
    const db = await getDb();
    await db.insert(schema.events).values({ type: d.t, product, path: String(d.path || '/').slice(0, 200), referrer, device, visitor });
  } catch (e) {
    console.error('[track]', e.message);
  }
  return new Response(null, { status: 204 });
}
