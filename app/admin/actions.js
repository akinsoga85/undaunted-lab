'use server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { eq, asc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { requireAdmin, requestLoginLink, signInWithToken, signOut, logActivity } from '@/lib/auth';
import { SLOTS, STYLES, STATUS } from '@/lib/defaults';
import { mergeContent } from '@/lib/site-data';

const str = (fd, k, max = 300) => String(fd.get(k) ?? '').trim().slice(0, max);
const isUrl = (u) => /^https?:\/\/[^\s]+$/i.test(u);
const isLink = (u) => isUrl(u) || /^#(story|notes|contact)$/.test(u);
const bust = () => { revalidateTag('site'); revalidatePath('/'); };

/* ---------- sign in ---------- */
export async function requestLogin(formData) {
  const h = headers();
  const origin = `${h.get('x-forwarded-proto') || 'http'}://${h.get('x-forwarded-host') || h.get('host')}`;
  await requestLoginLink(formData.get('email'), origin);
  redirect('/admin/login?sent=1');
}
export async function verifyLogin(formData) {
  const ok = await signInWithToken(String(formData.get('token') || ''));
  redirect(ok ? '/admin' : '/admin/login?error=expired');
}
export async function logout() {
  await signOut();
  redirect('/admin/login');
}
export async function signOutEverywhere() {
  const me = await requireAdmin();
  const db = await getDb();
  await db.delete(schema.sessions);
  await logActivity(me.email, 'signed out all sessions');
  await signOut();
  redirect('/admin/login');
}

/* ---------- products ---------- */
function slugify(name) {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'product';
}

export async function saveProduct(_prev, fd) {
  const me = await requireAdmin();
  const id = str(fd, 'id', 40);
  const p = {
    name: str(fd, 'name', 60),
    line: str(fd, 'line', 160),
    place: str(fd, 'place', 40),
    status: str(fd, 'status', 20),
    color: str(fd, 'color', 7),
    url: str(fd, 'url', 300),
    cta: str(fd, 'cta', 30) || 'Visit ↗',
    slot: str(fd, 'slot', 40),
    style: str(fd, 'style', 20),
    inTour: fd.get('inTour') === 'on',
    visible: fd.get('visible') === 'on'
  };
  const errors = {};
  if (!p.name) errors.name = 'Give the product a name.';
  if (!p.line) errors.line = 'Add a one-line description.';
  if (!STATUS[p.status]) errors.status = 'Choose a status.';
  if (!/^#[0-9a-f]{6}$/i.test(p.color)) errors.color = 'Use a 6-digit hex colour, like #2E86C1.';
  if (!SLOTS[p.slot]) errors.slot = 'Choose where it sits on the map.';
  if (!STYLES[p.style]) p.style = 'tower';
  if (p.status === 'coming_soon' && !p.url) p.url = '#contact';
  if (!isLink(p.url)) errors.url = 'Use a full link starting with https://, or #contact.';
  if (Object.keys(errors).length) return { errors, values: { ...p, id } };

  const db = await getDb();
  const all = await db.select().from(schema.products);
  const taken = all.find((x) => x.slot === p.slot && x.id !== id);
  if (taken) return { errors: { slot: `${taken.name} already sits there. Move or remove it first.` }, values: { ...p, id } };

  if (id && all.some((x) => x.id === id)) {
    await db.update(schema.products).set({ ...p, updatedAt: new Date() }).where(eq(schema.products.id, id));
    await logActivity(me.email, 'updated product', p.name);
  } else {
    let newId = slugify(p.name), n = 2;
    while (all.some((x) => x.id === newId)) newId = slugify(p.name) + '-' + n++;
    const sort = all.reduce((m, x) => Math.max(m, x.sort), 0) + 1;
    await db.insert(schema.products).values({ ...p, id: newId, sort });
    await logActivity(me.email, 'added product', p.name);
  }
  bust();
  redirect('/admin/products?saved=1');
}

export async function deleteProduct(fd) {
  const me = await requireAdmin();
  const id = str(fd, 'id', 40);
  const db = await getDb();
  const [row] = await db.delete(schema.products).where(eq(schema.products.id, id)).returning();
  if (row) await logActivity(me.email, 'removed product', row.name);
  bust();
  redirect('/admin/products?removed=1');
}

export async function toggleProduct(fd) {
  const me = await requireAdmin();
  const id = str(fd, 'id', 40);
  const field = str(fd, 'field', 10) === 'tour' ? 'inTour' : 'visible';
  const db = await getDb();
  const [row] = await db.select().from(schema.products).where(eq(schema.products.id, id));
  if (row) {
    await db.update(schema.products).set({ [field]: !row[field], updatedAt: new Date() }).where(eq(schema.products.id, id));
    await logActivity(me.email, `${!row[field] ? 'turned on' : 'turned off'} ${field === 'inTour' ? 'tour' : 'visibility'}`, row.name);
  }
  bust();
  revalidatePath('/admin/products');
}

export async function moveProduct(fd) {
  await requireAdmin();
  const id = str(fd, 'id', 40);
  const dir = str(fd, 'dir', 4) === 'up' ? -1 : 1;
  const db = await getDb();
  const rows = await db.select().from(schema.products).orderBy(asc(schema.products.sort), asc(schema.products.name));
  const i = rows.findIndex((r) => r.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  for (let k = 0; k < rows.length; k++) {
    if (rows[k].sort !== k + 1) await db.update(schema.products).set({ sort: k + 1 }).where(eq(schema.products.id, rows[k].id));
  }
  bust();
  revalidatePath('/admin/products');
}

/* ---------- site content ---------- */
function parseJsonList(raw, keys) {
  try {
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 12).map((r) => Object.fromEntries(keys.map((k) => [k, String(r?.[k] ?? '').trim().slice(0, 300)]))).filter((r) => Object.values(r).some(Boolean));
  } catch { return []; }
}

export async function saveContent(_prev, fd) {
  const me = await requireAdmin();
  const data = {
    tagline: str(fd, 'tagline', 120),
    hint: str(fd, 'hint', 120),
    hq: { name: str(fd, 'hq.name', 60), line: str(fd, 'hq.line', 160), cta: str(fd, 'hq.cta', 30) },
    story: {
      title: str(fd, 'story.title', 120),
      paragraphs: str(fd, 'story.paragraphs', 4000).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).slice(0, 8),
      rules: parseJsonList(fd.get('story.rules'), ['title', 'body']),
      founder: str(fd, 'story.founder', 600)
    },
    notes: { title: str(fd, 'notes.title', 120), intro: str(fd, 'notes.intro', 300), items: parseJsonList(fd.get('notes.items'), ['tag', 'title', 'url']) },
    contact: {
      title: str(fd, 'contact.title', 120),
      email: str(fd, 'contact.email', 120),
      topics: str(fd, 'contact.topics', 600).split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 8)
    },
    settings: { tourSeconds: Number(str(fd, 'settings.tourSeconds', 6)), linkedin: str(fd, 'settings.linkedin', 300) }
  };
  const errors = {};
  if (!data.tagline) errors.tagline = 'The tagline can’t be empty.';
  if (!data.story.title) errors['story.title'] = 'Add a title for Our story.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) errors['contact.email'] = 'Use a valid email address.';
  if (!data.contact.topics.length) errors['contact.topics'] = 'Add at least one topic.';
  if (!(data.settings.tourSeconds >= 2 && data.settings.tourSeconds <= 15)) errors['settings.tourSeconds'] = 'Pick a number between 2 and 15.';
  if (data.settings.linkedin && !isUrl(data.settings.linkedin)) errors['settings.linkedin'] = 'Use a full link starting with https://.';
  const badNote = data.notes.items.find((n) => n.url && !isUrl(n.url));
  if (badNote) errors['notes.items'] = `“${badNote.title || badNote.url}” needs a full link starting with https://.`;
  if (Object.keys(errors).length) return { errors };

  const db = await getDb();
  const merged = mergeContent(data);
  await db.insert(schema.siteContent).values({ id: 1, data: merged }).onConflictDoUpdate({ target: schema.siteContent.id, set: { data: merged, updatedAt: new Date() } });
  await logActivity(me.email, 'updated site content');
  bust();
  revalidatePath('/admin/content');
  return { ok: true, at: Date.now() };
}

/* ---------- messages ---------- */
export async function setMessageRead(fd) {
  await requireAdmin();
  const db = await getDb();
  await db.update(schema.messages).set({ read: fd.get('read') === '1' }).where(eq(schema.messages.id, Number(fd.get('id'))));
  revalidatePath('/admin', 'layout');
}
export async function deleteMessage(fd) {
  const me = await requireAdmin();
  const db = await getDb();
  await db.delete(schema.messages).where(eq(schema.messages.id, Number(fd.get('id'))));
  await logActivity(me.email, 'deleted a message');
  revalidatePath('/admin', 'layout');
}
