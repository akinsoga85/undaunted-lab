import 'server-only';

// Sends email with Resend (https://resend.com). Returns false when no key is configured.
export async function sendMail({ to, subject, text, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Undaunted Lab <hello@undauntedlab.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
      reply_to: replyTo
    })
  });
  if (!r.ok) console.error('[mail] Resend error', r.status, await r.text().catch(() => ''));
  return r.ok;
}
