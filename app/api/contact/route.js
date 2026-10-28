import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { and, count, eq, gt } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { allowedEmails } from '@/lib/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PER_SENDER = Number(process.env.CONTACT_PER_10MIN) || 5; // messages one sender can send in 10 minutes
const ALERTS_PER_HOUR = 20; // past this, messages are still saved but the email alerts stop

// Saves the message to the admin inbox and, if email is configured, notifies the admins.
export async function POST(req) {
  let data;
  try { data = await req.json(); } catch { return Response.json({ ok: false, error: 'Invalid request' }, { status: 400 }); }
  if (data.ul_hp) { // honeypot: bots fill hidden fields
    console.warn('[contact] the hidden bot field was filled in, so the message was dropped');
    return Response.json({ ok: true });
  }
  const name = String(data.name || '').trim().slice(0, 200);
  const email = String(data.email || '').trim().slice(0, 200);
  const topic = String(data.topic || '').trim().slice(0, 100);
  const message = String(data.message || '').trim().slice(0, 5000);
  const errors = {};
  if (!name) errors.name = 'Please add your name.';
  if (!email) errors.email = 'Please add your email so we can reply.';
  else if (!EMAIL.test(email)) errors.email = 'That email doesn’t look right. Check it for typos.';
  if (Object.keys(errors).length) return Response.json({ ok: false, errors }, { status: 400 });

  // Like analytics, the sender is a daily hash of the IP, so it can be rate limited but not followed.
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const sender = crypto.createHash('sha256').update(day + ip + (process.env.ANALYTICS_SALT || 'undaunted')).digest('hex').slice(0, 16);
  let quiet = false;
  try {
    const db = await getDb();
    const [[mine], [lastHour]] = await Promise.all([
      db.select({ n: count() }).from(schema.messages).where(and(eq(schema.messages.sender, sender), gt(schema.messages.createdAt, new Date(Date.now() - 10 * 60e3)))),
      db.select({ n: count() }).from(schema.messages).where(gt(schema.messages.createdAt, new Date(Date.now() - 60 * 60e3)))
    ]);
    if (Number(mine.n) >= PER_SENDER) {
      return Response.json({ ok: false, error: 'Too many messages. Please wait a few minutes.' }, { status: 429, headers: { 'Retry-After': '600' } });
    }
    quiet = Number(lastHour.n) >= ALERTS_PER_HOUR;
    await db.insert(schema.messages).values({ name, email, topic, message, sender });
  } catch (e) {
    console.error('[contact]', e.message);
    return Response.json({ ok: false, error: 'Could not save your message.' }, { status: 500 });
  }
  // Awaited: on Vercel the function can be frozen as soon as the response is sent, which would drop the alert.
  const to = process.env.CONTACT_TO ? [process.env.CONTACT_TO] : allowedEmails();
  if (to.length && !quiet) {
    const alerted = await sendMail({ to, replyTo: email, subject: `[undauntedlab.com] ${topic || 'New message'} from ${name}`, text: `${message}\n\n— ${name} <${email}>\nTopic: ${topic}` }).catch(() => false);
    console.log(`[contact] message saved; email alert ${alerted ? 'sent' : 'not sent'}`);
  } else if (quiet) {
    console.warn('[contact] over ' + ALERTS_PER_HOUR + ' messages this hour; saved without an email alert');
  }
  revalidatePath('/admin');
  return Response.json({ ok: true });
}
