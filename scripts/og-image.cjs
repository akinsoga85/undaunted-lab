// Regenerates public/og.png, the image shown when undauntedlab.com is shared (WhatsApp, LinkedIn, X, Slack).
// It photographs the real map at 1200×630 with only the logo and tagline over it, so run it after the map
// or the tagline changes. Needs Playwright (see tests/README.md) and a running build:
//   npm run build && npm start &
//   BASE_URL=http://localhost:3000 node scripts/og-image.cjs
// Keep the file under 300 KB: WhatsApp can skip larger preview images.
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = 'public/og.png';

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, colorScheme: 'light' })).newPage();
  await p.goto(BASE);
  await p.waitForTimeout(2500); // during the intro the plane hovers over the HQ lighthouse
  await p.addStyleTag({ content: '.ul-top .nav, .ul-hint, .ul-dock, .ul-tagline span { display: none !important; } .ul-tagline p { font-size: 30px; } .ul-tagline { max-width: 380px; }' });
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT });
  await b.close();
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`${OUT}: ${kb} KB${kb > 300 ? ' (over 300 KB: WhatsApp may not show it; try a palette PNG)' : ''}`);
})();
