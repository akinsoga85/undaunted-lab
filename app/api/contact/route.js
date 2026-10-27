import { revalidatePath } from 'next/cache';
import { getDb, schema } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { allowedEmails } from '@/lib/auth';

// Saves the message to the admin inbox and, if email is configured, notifies the admins.
export async function POST(req) {
  let data;
  try { data = await req.json(); } catch { return Response.json({ ok: false, error: 'Invalid request' }, { status: 400 }); }
  if (data.website) return Response.json({ ok: true }); // honeypot: bots fill hidden fields
  const name = String(data.name || '').trim().slice(0, 200);
  const email = String(data.email || '').trim().slice(0, 200);
  const topic = String(data.topic || '').trim().slice(0, 100);
  const message = String(data.message || '').trim().slice(0, 5000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: 'Please add your name and a valid email.' }, { status: 400 });
  }
  try {
    const db = await getDb();
    await db.insert(schema.messages).values({ name, email, topic, message });
  } catch (e) {
    console.error('[contact]', e.message);
    return Response.json({ ok: false, error: 'Could not save your message.' }, { status: 500 });
  }
  const to = process.env.CONTACT_TO ? [process.env.CONTACT_TO] : allowedEmails();
  if (to.length) {
    sendMail({ to, replyTo: email, subject: `[undauntedlab.com] ${topic || 'New message'} from ${name}`, text: `${message}\n\n— ${name} <${email}>\nTopic: ${topic}` }).catch(() => {});
  }
  revalidatePath('/admin');
  return Response.json({ ok: true });
}
