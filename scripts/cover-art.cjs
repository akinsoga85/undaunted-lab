// Regenerates public/covers/*.jpg, the map scenes behind the Lab notes cover images (lib/covers.js lists them).
// It photographs the real map with the floating UI hidden, so rerun it after the map changes. Needs Playwright
// (see tests/README.md) and a running build:
//   npm run build && npm start &
//   BASE_URL=http://localhost:3000 node scripts/cover-art.cjs
// Each scene is 2000×1250 (larger than any cover, so covers can shift it without blurring). Crops are in CSS pixels of a 1920×1200 view, where the whole map fits; close-ups
// use a higher device scale so they stay sharp.
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = 'public/covers';
const W = 2000, H = 1250;
// [name, centre x, centre y, crop width] — the crop keeps the 16:10 shape. If you move a crop, update the
// scene's focus point in lib/covers.js so the title card doesn't cover its landmark.
const SCENES = [
  ['map', 960, 640, 1600],
  ['hq', 860, 650, 720],
  ['london', 960, 470, 800],
  ['lagos', 1250, 770, 900],
  ['calgary', 470, 700, 760]
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  for (const [name, cx, cy, cw] of SCENES) {
    const scale = W / cw, ch = cw * H / W;
    const p = await (await b.newContext({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: scale, colorScheme: 'light' })).newPage();
    await p.goto(BASE);
    await p.waitForTimeout(2500); // during the intro the plane hovers over the HQ lighthouse
    await p.addStyleTag({ content: '.ui, .ul-hint, .ul-dock, .ul-tagline { display: none !important; }' });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 86, clip: { x: cx - cw / 2, y: cy - ch / 2, width: cw, height: ch } });
    console.log(`${OUT}/${name}.jpg: ${Math.round(fs.statSync(`${OUT}/${name}.jpg`).size / 1024)} KB`);
    await p.context().close();
  }
  await b.close();
})();
