import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, isNull, lt, count } from 'drizzle-orm';
import { getDb, schema } from './db';
import { sendMail } from './mail';

export const SESSION_COOKIE = 'ul_admin';
const LINK_MINUTES = 15;
const SESSION_DAYS = 30;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const token = () => crypto.randomBytes(32).toString('base64url');

export function allowedEmails() {
  return (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

// Always answers the same way, so the form never reveals which emails are allowed.
export async function requestLoginLink(rawEmail, origin) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !allowedEmails().includes(email)) return;
  const db = await getDb();
  const since = new Date(Date.now() - LINK_MINUTES * 60e3);
  const [{ n }] = await db.select({ n: count() }).from(schema.loginTokens).where(and(eq(schema.loginTokens.email, email), gt(schema.loginTokens.createdAt, since)));
  if (Number(n) >= (Number(process.env.AUTH_LINKS_PER_15MIN) || 5)) return; // rate limit: 5 links per 15 minutes by default
  const t = token();
  await db.insert(schema.loginTokens).values({ tokenHash: sha(t), email, expiresAt: new Date(Date.now() + LINK_MINUTES * 60e3) });
  const base = (process.env.SITE_URL || origin || '').replace(/\/$/, '');
  const link = `${base}/admin/verify?token=${t}`;
  const sent = await sendMail({
    to: email,
    subject: 'Your Undaunted Lab sign-in link',
    text: `Sign in to the Undaunted Lab admin:\n\n${link}\n\nThis link works once and expires in ${LINK_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`,
    html: `<p>Sign in to the Undaunted Lab admin:</p><p><a href="${link}" style="display:inline-block;background:#17181C;color:#fff;padding:12px 18px;border-radius:99px;text-decoration:none;font-weight:600">Sign in</a></p><p style="color:#55565C">This link works once and expires in ${LINK_MINUTES} minutes. If you didn't ask for it, you can ignore this email.</p>`
  });
  if (!sent && (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEV_LINKS === '1')) {
    console.log(`\n[auth] No email provider configured. Sign-in link for ${email}:\n${link}\n`);
  }
}

export async function signInWithToken(t) {
  if (!t || typeof t !== 'string' || t.length > 200) return false;
  const db = await getDb();
  const now = new Date();
  const [row] = await db.update(schema.loginTokens).set({ usedAt: now })
    .where(and(eq(schema.loginTokens.tokenHash, sha(t)), isNull(schema.loginTokens.usedAt), gt(schema.loginTokens.expiresAt, now)))
    .returning();
  if (!row || !allowedEmails().includes(row.email)) return false;
  const sid = token();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(schema.sessions).values({ idHash: sha(sid), email: row.email, expiresAt });
  cookies().set(SESSION_COOKIE, sid, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt });
  await db.delete(schema.loginTokens).where(lt(schema.loginTokens.expiresAt, now));
  await logActivity(row.email, 'signed in');
  return true;
}

export async function getAdmin() {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  const db = await getDb();
  const [s] = await db.select().from(schema.sessions).where(and(eq(schema.sessions.idHash, sha(sid)), gt(schema.sessions.expiresAt, new Date())));
  if (!s || !allowedEmails().includes(s.email)) return null;
  return { email: s.email };
}

export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) redirect('/admin/login');
  return a;
}

export async function signOut() {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (sid) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.idHash, sha(sid)));
  }
  cookies().delete(SESSION_COOKIE);
}

export async function logActivity(email, action, detail = '') {
  try {
    const db = await getDb();
    await db.insert(schema.activity).values({ email, action, detail: String(detail).slice(0, 500) });
  } catch (e) { console.error('[activity]', e.message); }
}
