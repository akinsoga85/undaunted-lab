import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import { getPost } from '@/lib/posts';
import { getAdmin } from '@/lib/auth';
import { SCENES, COVER_SIZES, sceneOf } from '@/lib/covers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A Lab note's cover image: its map scene with the title on a card in the site's style.
//   /notes/<slug>/cover                  1200×630, the link preview (og:image)
//   /notes/<slug>/cover?size=portrait    1080×1350, for a LinkedIn post
//   add &download=1 to save it as a file
// Drafts render only for signed-in admins. The fonts are static TTF copies of the site's fonts (assets/fonts),
// because next/og can't read woff2 or variable fonts; next.config.mjs bundles them and the art with this route.
// next/og draws a PNG; it's re-encoded as JPEG, which is a third of the size, so WhatsApp (which skips preview
// images over about 300 KB) still shows it.
const INK = '#17181C', SEA = '#BFE3F3', BLUE = '#2E86C1', MUTED = '#55565C';
const file = (...p) => readFile(join(process.cwd(), ...p));
const dataUri = async (type, ...p) => `data:${type};base64,${(await file(...p)).toString('base64')}`;
let fontsP;
const fonts = () => (fontsP ||= Promise.all([
  file('assets', 'fonts', 'bricolage-grotesque-800.ttf').then((data) => ({ name: 'Display', data, weight: 800, style: 'normal' })),
  file('assets', 'fonts', 'dm-sans-400.ttf').then((data) => ({ name: 'Body', data, weight: 400, style: 'normal' })),
  file('assets', 'fonts', 'dm-sans-700.ttf').then((data) => ({ name: 'Body', data, weight: 700, style: 'normal' }))
]).catch((e) => { fontsP = null; throw e; }));

// Title size steps down as titles get longer, so every title fits its card.
const fit = (title, steps) => steps.find(([max]) => title.length <= max)?.[1] ?? steps[steps.length - 1][1];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// The art is drawn larger than the frame and shifted so the scene's landmark lands at (tx, ty).
function art(src, focus, frameW, frameH, artW, tx, ty) {
  const artH = artW * 1250 / 2000;
  const left = clamp(tx - focus[0] * artW, frameW - artW, 0), top = clamp(ty - focus[1] * artH, frameH - artH, 0);
  return <img src={src} width={artW} height={artH} style={{ position: 'absolute', left, top, width: artW, height: artH }} />;
}

function Byline({ logo, author, size }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: size * 1.1 }}>
      <img src={logo} width={size * 2.1} height={size * 2.1} style={{ borderRadius: size * 1.05, marginRight: size * 0.6 }} />
      <div style={{ display: 'flex', fontFamily: 'Display', fontSize: size * 1.1, color: INK, marginRight: size * 0.6 }}>undaunted lab</div>
      <div style={{ display: 'flex', fontSize: size, color: MUTED }}>{author ? `${author} · undauntedlab.com` : 'undauntedlab.com'}</div>
    </div>
  );
}

function Card({ post, logo, title, kicker, byline, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', background: '#FFFFFF', border: `4px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`, ...style }}>
      {post.tag && <div style={{ display: 'flex', fontSize: kicker, fontWeight: 700, letterSpacing: kicker * 0.14, color: BLUE }}>{post.tag.toUpperCase()}</div>}
      <div style={{ display: 'flex', fontFamily: 'Display', fontSize: title, lineHeight: 1.02, letterSpacing: -title * 0.025, color: INK, marginTop: kicker * 0.7 }}>{post.title}</div>
      <Byline logo={logo} author={post.author} size={byline} />
    </div>
  );
}

export async function GET(req, { params }) {
  const post = await getPost((await params).slug);
  const url = new URL(req.url);
  // Admins can also try another scene (?scene=) before saving it; everyone else gets the saved one.
  const asked = url.searchParams.get('scene');
  const admin = (!post?.published || (asked && SCENES[asked])) ? !!(await getAdmin()) : false;
  if (!post || (!post.published && !admin)) return new Response('Not found', { status: 404 });
  const size = COVER_SIZES[url.searchParams.get('size')] ? url.searchParams.get('size') : 'wide';
  const { width, height } = COVER_SIZES[size];
  const scene = admin && SCENES[asked] ? asked : sceneOf(post.cover);
  const [bg, logo, fontList] = await Promise.all([dataUri('image/jpeg', 'public', 'covers', `${scene}.jpg`), dataUri('image/png', 'public', 'logo.png'), fonts()]);
  const focus = SCENES[scene].focus;

  const image = size === 'portrait' ? (
    <div style={{ display: 'flex', width, height, position: 'relative', background: SEA, fontFamily: 'Body' }}>
      <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, width, height: 860, overflow: 'hidden' }}>{art(bg, focus, width, 860, 1376, width / 2, 430)}</div>
      <Card post={post} logo={logo} kicker={26} byline={24} title={fit(post.title, [[28, 92], [48, 80], [70, 68], [999, 58]])}
        style={{ left: 56, right: 56, bottom: 72, borderRadius: 36, padding: '44px 48px 46px' }} />
    </div>
  ) : (
    <div style={{ display: 'flex', width, height, position: 'relative', background: SEA, fontFamily: 'Body' }}>
      {art(bg, focus, width, height, 1600, 870, 300)}
      <Card post={post} logo={logo} kicker={17} byline={17} title={fit(post.title, [[28, 58], [48, 50], [70, 43], [999, 37]])}
        style={{ left: 44, bottom: 44, width: 580, borderRadius: 28, padding: '28px 32px 30px' }} />
    </div>
  );

  const png = PNG.sync.read(Buffer.from(await new ImageResponse(image, { width, height, fonts: fontList }).arrayBuffer()));
  const body = jpeg.encode({ data: png.data, width, height }, 88).data;
  const headers = { 'Content-Type': 'image/jpeg', 'Cache-Control': post.published && !admin ? 'public, max-age=3600, s-maxage=86400' : 'private, no-store' };
  if (url.searchParams.get('download')) headers['Content-Disposition'] = `attachment; filename="${post.slug}-${size === 'portrait' ? 'linkedin' : 'link-preview'}.jpg"`;
  return new Response(body, { headers });
}
