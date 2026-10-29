// End-to-end test of the public site + admin against a running production build.
// It signs in with a magic link read from the server log, edits content, adds and removes a test product.
const { chromium, devices } = require('playwright');
const fs = require('fs');
// Usage: see tests/README.md
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const LOG = process.env.SERVER_LOG || '.server.log';
const ADMIN = process.env.TEST_ADMIN_EMAIL || 'opeyemi@undauntedlab.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const R = []; const ok = (n, c, i = '') => R.push([c ? 'PASS' : 'FAIL', n, String(i).slice(0, 160)]);
async function hit(p, id) { return p.evaluate((id) => { const a = document.querySelector(`.bld[data-id="${id}"]`); if (!a) return null; for (const e of a.querySelectorAll('.f,.bb')) { const r = e.getBoundingClientRect(); if (r.width < 4) continue; for (const [fx, fy] of [[.5, .5], [.3, .6], [.7, .4], [.5, .3], [.5, .8]]) { const x = r.x + r.width * fx, y = r.y + r.height * fy; const h = document.elementFromPoint(x, y); if (h && h.closest('.bld') === a) return [x, y]; } } return null; }, id); }
const allLinks = () => fs.readFileSync(LOG, 'utf8').match(/https?:\/\/[^\s]+\/admin\/verify\?token=[\w-]+/g) || [];
const linkFromLog = () => { const m = allLinks(); return m.length ? m[m.length - 1] : null; };
const STAMP = 'e2e-' + Date.now();
(async () => {
  fs.mkdirSync('tests/output', { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text()); });

  // ---- public site, from the database
  await p.goto(BASE); await p.waitForTimeout(1500);
  ok('site: world built from database', (await p.locator('.bld').count()) >= 8, await p.locator('.bld').count());
  await p.click('[data-play]');
  const pt = await hit(p, 'nestlo'); await p.mouse.move(pt[0], pt[1]); await p.waitForTimeout(500);
  ok('site: hover shows Nestlo card', (await p.textContent('[data-card] strong')) === 'Nestlo');
  const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null), p.mouse.click(pt[0], pt[1])]);
  ok('site: click opens nestlo.ca', pop && pop.url().includes('nestlo'), pop && pop.url()); if (pop) await pop.close();
  await p.evaluate(() => { location.hash = 'contact'; }); await p.waitForTimeout(600);
  await p.fill('#c-name', 'Ada Test'); await p.fill('#c-email', 'ada@example.com'); await p.fill('#c-msg', 'Hello from the end-to-end test ' + STAMP + '.');
  await p.click('[data-contact] button[type=submit]'); await p.waitForTimeout(800);
  ok('site: contact form saves message', /on its way/.test(await p.textContent('[data-sent-msg]')), await p.textContent('[data-sent-msg]'));
  ok('site: no browser errors', errs.length === 0, errs.join(' | '));

  // ---- auth
  const a = await ctx.newPage();
  await a.goto(BASE + '/admin'); ok('admin: signed-out visitor is sent to sign-in', a.url().includes('/admin/login'), a.url());
  const linksBefore = allLinks().length;
  await a.fill('#email', 'stranger@example.com'); await a.click('button[type=submit]'); await a.waitForTimeout(800);
  ok('admin: unknown email gets the same answer and no link', (await a.isVisible('text=If that email is allowed')) && allLinks().length === linksBefore, allLinks().length - linksBefore + ' new links');
  await a.goto(BASE + '/admin/verify?token=not-a-real-token'); await a.click('button[type=submit]'); await a.waitForURL(/login/);
  ok('admin: bad token is refused', await a.isVisible('text=expired or was already used'));
  const n0 = allLinks().length;
  await a.fill('#email', ADMIN.toUpperCase()); await a.click('button[type=submit]'); await a.waitForTimeout(1200);
  const link = allLinks().length > n0 ? linkFromLog() : null;
  ok('admin: sign-in link generated for allowed email', !!link, link || 'no new link (rate limit? start the server with AUTH_LINKS_PER_15MIN=50 for repeated runs)');
  if (!link) { for (const r of R) console.log(r.join('  ')); process.exit(1); }
  await a.goto(link); await a.click('button[type=submit]'); await a.waitForURL(BASE + '/admin');
  ok('admin: magic link signs in', await a.isVisible('h1:has-text("Dashboard")'));
  const cookie = (await ctx.cookies()).find((c) => c.name === 'ul_admin');
  ok('admin: session cookie is httpOnly', cookie && cookie.httpOnly, JSON.stringify({ httpOnly: cookie?.httpOnly, sameSite: cookie?.sameSite }));
  const reuse = await b.newContext(); const rp = await reuse.newPage(); await rp.goto(link); await rp.click('button[type=submit]'); await rp.waitForURL(/login/);
  ok('admin: a used link cannot be used again', rp.url().includes('error=expired')); await reuse.close();
  const unreadBefore = Number(await a.textContent('.a-badge').catch(() => '0'));
  ok('dashboard: shows the new message as unread', unreadBefore >= 1, unreadBefore);
  ok('dashboard: views recorded', Number(await a.locator('.a-kpi strong').first().textContent()) >= 1, await a.locator('.a-kpi strong').first().textContent());
  await a.screenshot({ path: 'tests/output/admin-dashboard.png', fullPage: true });

  // ---- edit a product
  await a.goto(BASE + '/admin/products/scamfendr'); const origLine = await a.inputValue('#f-line'); await a.fill('#f-line', 'Check any UK business before you pay.');
  await a.click('button:has-text("Save changes")'); await a.waitForURL(/products\?saved/);
  ok('products: edit saves', await a.isVisible('text=Saved. The live site is updated.'));
  // validation
  await a.goto(BASE + '/admin/products/scamfendr'); await a.fill('#f-url', 'not a link'); await a.click('button:has-text("Save changes")'); await a.waitForTimeout(800);
  ok('products: bad link is caught with a clear message', await a.isVisible('text=Use a full link starting with https://'));
  // clear a leftover test product from an interrupted earlier run
  await a.goto(BASE + '/admin/products');
  const left = a.locator('tr', { hasText: 'Testlane' });
  if (await left.count()) { await left.locator('button:has-text("Remove")').click(); await left.locator('button:has-text("Yes, remove")').click(); await a.waitForURL(/removed/); }
  // add a product on a new island
  await a.goto(BASE + '/admin/products/new');
  await a.fill('#f-name', 'Testlane'); await a.fill('#f-line', 'A test product on the north isle.'); await a.fill('#f-place', 'UK');
  await a.fill('#f-url', 'https://example.com'); await a.fill('#f-color', '#7C5CC4');
  await a.selectOption('#f-slot', 'north-isle'); await a.selectOption('#f-style', 'campus');
  ok('products: card preview updates live', (await a.textContent('.a-preview strong')) === 'Testlane');
  await a.screenshot({ path: 'tests/output/admin-product-form.png', fullPage: true });
  await a.click('button:has-text("Add to the map")'); await a.waitForURL(/products\?saved/);
  ok('products: new product added', await a.isVisible('td:has-text("Testlane")'));
  await a.screenshot({ path: 'tests/output/admin-products.png', fullPage: true });
  // site text
  await a.goto(BASE + '/admin/content'); const origTagline = await a.inputValue('[id="c-tagline"]'); await a.fill('[id="c-tagline"]', 'Safety tools for everyday people, built with AI and care.');
  await a.click('button:has-text("Save site text")'); await a.waitForTimeout(1200);
  ok('content: saves', await a.isVisible('text=Saved. The live site is updated.'));
  await a.fill('[id="c-contact.email"]', 'nope'); await a.click('button:has-text("Save site text")'); await a.waitForTimeout(1000);
  ok('content: invalid email is caught', (await a.isVisible('text=Use a valid email address.')) || (await a.locator('[id="c-contact.email"]:invalid').count()) === 1);

  // ---- changes visible on the live site
  const s2 = await ctx.newPage(); await s2.goto(BASE); await s2.waitForTimeout(1500);
  ok('live: new tagline shown', (await s2.textContent('.ul-tagline p')).includes('and care'));
  ok('live: new product and its island appear', (await s2.locator('.bld[data-id="testlane"]').count()) === 1);
  await s2.click('[data-play]');
  const tp = await hit(s2, 'testlane'); if (tp) { await s2.mouse.move(tp[0], tp[1]); await s2.waitForTimeout(500); }
  ok('live: new product card on hover', (await s2.textContent('[data-card] strong')) === 'Testlane');
  const sp = await hit(s2, 'scamfendr'); await s2.mouse.move(sp[0], sp[1]); await s2.waitForTimeout(500);
  ok('live: edited line shown', (await s2.textContent('[data-card] .ln')).includes('any UK business'));
  ok('live: tour has 6 stops', (await s2.locator('[data-dots] button').count()) === 6, await s2.locator('[data-dots] button').count());
  await s2.screenshot({ path: 'tests/output/site-with-new-isle.png' });

  // ---- messages, analytics, settings
  await a.goto(BASE + '/admin/messages');
  const mine = a.locator('details.a-msg', { hasText: STAMP });
  ok('messages: inbox shows the message', (await mine.count()) === 1);
  const replies = await mine.locator('a.a-btn').evaluateAll((as) => as.map((x) => x.getAttribute('href')));
  // a filled bot trap (a bot, or someone's autofill) flags the message instead of dropping it
  const hp = await a.request.post(BASE + '/api/contact', { data: { name: 'Autofill Test', email: 'af@example.com', message: STAMP + '-hp', ul_hp: 'filled' }, headers: { 'x-forwarded-for': '10.0.0.77' } });
  await a.reload(); const flagged = a.locator('details.a-msg', { hasText: STAMP + '-hp' });
  ok('messages: a filled bot trap is kept and flagged as possible spam', hp.ok() && (await flagged.count()) === 1 && (await flagged.locator('.a-pill', { hasText: 'Possible spam' }).count()) === 1);
  if (await flagged.count()) { await flagged.locator('button:has-text("Delete")').click(); await flagged.locator('button:has-text("Yes, delete")').click(); await a.waitForTimeout(800); await a.reload(); }
  ok('messages: reply links (mail app and Gmail) go to the sender', replies.some((h) => h.startsWith('mailto:ada@example.com?subject=')) && replies.some((h) => h.startsWith('https://mail.google.com/') && h.includes('ada%40example.com')), replies.join(' '));
  await mine.locator('button:has-text("Mark as read")').click(); await a.waitForTimeout(800); await a.reload();
  const unreadAfter = Number((await a.locator('.a-badge').count()) ? await a.textContent('.a-badge') : 0);
  ok('messages: mark as read lowers the unread count', unreadAfter === unreadBefore - 1, `${unreadBefore} -> ${unreadAfter}`);
  const m2 = a.locator('details.a-msg', { hasText: STAMP }); if (!(await m2.evaluate((d) => d.open))) await m2.locator('summary').click(); await m2.locator('button:has-text("Delete")').click(); await m2.locator('button:has-text("Yes, delete")').click(); await a.waitForTimeout(800); await a.reload();
  ok('messages: delete removes the test message', (await a.locator('details.a-msg', { hasText: STAMP }).count()) === 0);
  await a.screenshot({ path: 'tests/output/admin-messages.png', fullPage: true });
  await a.goto(BASE + '/admin/analytics?range=7');
  const kp = await a.locator('.a-kpi strong').allTextContents();
  ok('analytics: views, hovers and clicks recorded', Number(kp[0]) >= 2 && Number(kp[2]) >= 1 && Number(kp[3]) >= 1, kp.join(','));
  await a.screenshot({ path: 'tests/output/admin-analytics.png', fullPage: true });
  await a.goto(BASE + '/admin/settings');
  ok('settings: activity log lists the changes', await a.isVisible('text=added product: Testlane'));
  // remove the test product (two-step)
  await a.goto(BASE + '/admin/products');
  const row = a.locator('tr', { hasText: 'Testlane' }); await row.locator('button:has-text("Remove")').click(); await row.locator('button:has-text("Yes, remove")').click();
  await a.waitForURL(/removed/); ok('products: two-step remove works', !(await a.isVisible('td:has-text("Testlane")')));
  // put the edited text back the way it was
  await a.goto(BASE + '/admin/products/scamfendr'); await a.fill('#f-line', origLine); await a.click('button:has-text("Save changes")'); await a.waitForURL(/products\?saved/);
  await a.goto(BASE + '/admin/content'); await a.fill('[id="c-tagline"]', origTagline); await a.click('button:has-text("Save site text")'); await a.waitForTimeout(1200);
  ok('cleanup: original text restored', await a.isVisible('text=Saved. The live site is updated.'));
  // lab notes: starter drafts stay private and can't be published with [[notes]] left; a clean note goes live, then comes down
  {const anon = await (await b.newContext()).newPage();
   ok('notes: starter drafts are not public', (await anon.goto(BASE + '/notes/spot-a-scam-before-you-pay')).status() === 404);
   await a.goto(BASE + '/admin/notes'); await a.locator('tr', { hasText: 'Spot a scam' }).getByRole('link', { name: 'Edit' }).click(); await a.waitForSelector('#p-body');
   await a.getByRole('button', { name: 'Publish' }).click(); await a.waitForTimeout(1500);
   ok('notes: publishing with [[notes]] left is refused', await a.isVisible('text=Fill in or remove the [[…]] notes before publishing.'));
   const pv = await a.context().newPage(); const r = await pv.goto(BASE + '/notes/spot-a-scam-before-you-pay');
   ok('notes: admins can preview a draft', r.status() === 200 && await pv.isVisible('.ul-note-draft') && (await pv.locator('mark.todo').count()) > 0); await pv.close();
   const slug = 'e2e-note-' + Date.now();
   await a.goto(BASE + '/admin/notes/new'); await a.fill('#p-title', 'E2E note'); await a.fill('#p-slug', slug); await a.fill('#p-summary', 'Summary.');
   await a.fill('#p-body', 'Hello **world**.\n\n## Heading\n\n- one\n- two'); await a.fill('#p-linkedin', 'LinkedIn text');
   await a.getByRole('button', { name: 'Save draft' }).click(); await a.waitForURL(/saved=drafted/);
   ok('notes: a new draft is private', (await anon.goto(BASE + '/notes/' + slug)).status() === 404);
   await a.getByRole('button', { name: 'Publish' }).click(); await a.waitForURL(/saved=published/);
   const pub = await anon.goto(BASE + '/notes/' + slug);
   ok('notes: published note is public, formatted and canonical', pub.status() === 200 && (await anon.locator('.prose h2').count()) === 1 && (await anon.locator('.prose li').count()) === 2 && /\/notes\//.test(await anon.getAttribute('link[rel=canonical]', 'href')));
   await anon.goto(BASE + '/#notes'); await anon.waitForTimeout(900);
   ok('notes: Lab notes panel and sitemap list it', (await anon.locator(`[data-panel="notes"] a[href="/notes/${slug}"]`).count()) === 1 && (await (await anon.request.get(BASE + '/sitemap.xml')).text()).includes('/notes/' + slug));
   await a.getByRole('button', { name: 'Unpublish' }).click(); await a.waitForURL(/saved=unpublished/);
   ok('notes: unpublishing takes it down', (await anon.goto(BASE + '/notes/' + slug)).status() === 404);
   await a.getByRole('button', { name: 'Delete' }).click(); await a.getByRole('button', { name: 'Yes, delete' }).click(); await a.waitForURL(/removed=1/);
   ok('notes: delete removes it', (await a.locator('td', { hasText: '/notes/' + slug }).count()) === 0);
   await anon.context().close();}
  // phone width: no admin page may scroll sideways
  await a.setViewportSize({ width: 390, height: 844 }); const wide = [];
  for (const path of ['/admin', '/admin/messages', '/admin/products', '/admin/notes', '/admin/notes/new', '/admin/content', '/admin/analytics', '/admin/settings']) { await a.goto(BASE + path); if (await a.evaluate(() => document.documentElement.scrollWidth > innerWidth)) wide.push(path); }
  ok('mobile: admin pages have no sideways scroll', wide.length === 0, wide.join(' '));
  await a.setViewportSize({ width: 1440, height: 900 });
  // sign out
  await a.click('button:has-text("Sign out")'); await a.waitForURL(/login/);
  await a.goto(BASE + '/admin/products'); ok('admin: signed out cannot reach admin', a.url().includes('/admin/login'));
  // mobile admin
  const m = await b.newContext({ ...devices['iPhone 13'] }); const mp = await m.newPage(); await mp.goto(BASE + '/admin/login');
  ok('mobile: sign-in page has no sideways scroll', await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mp.screenshot({ path: 'tests/output/admin-login-mobile.png' });
  await b.close();
  for (const r of R) console.log(r.join('  '));
  console.log(`\n${R.filter((r) => r[0] === 'PASS').length}/${R.length} passed`);
})();
