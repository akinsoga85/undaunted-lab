# Tests

These are browser tests run with Playwright. They aren't installed with the app, so install them once on your machine:

```bash
npm i --no-save playwright@1.56.0 && npx playwright install chromium
```

Run them against a **local production build**. The admin test writes to the database: it adds and removes a test product and restores any text it edits.

```bash
rm -rf .data                                   # optional: start from a fresh local DB
npm run build
ADMIN_EMAILS=opeyemi@undauntedlab.com AUTH_DEV_LINKS=1 AUTH_LINKS_PER_15MIN=50 npm start > .server.log 2>&1 &
sleep 5
BASE_URL=http://localhost:3000 node tests/site.test.cjs
BASE_URL=http://localhost:3000 SERVER_LOG=.server.log node tests/admin.e2e.cjs
```

Both print `PASS`/`FAIL` lines. Screenshots go to `tests/output/`.

| Script | Covers |
| --- | --- |
| `site.test.cjs` | island names sit above the 3D world and nothing passes over them, hover on all 8 landmarks with no jitter, click opens a product, drag pans without opening links, Products menu and Esc, the three panels, contact form (inline errors, sending state, one request per send, success state, per-field API errors, rate limit), night mode, tour and dots, no console errors, mobile tap-to-preview and tap-to-open, no sideways scroll, mobile Menu with Our story and Lab notes above the tour bar, nav fits at 320, 360 and 390px, mobile tagline and joined card panel, desktop corners unchanged, no overlapping UI from 320×568 to 1440×900, open panels hide the floating UI and make the rest inert, scrim/Esc/✕ close them, Esc then reopen works, keyboard focus returns, the tour holds still under a panel, on a phone every tour stop is brought into view (by dots, by the running tour, and by keyboard focus) but not right after a drag, the day/night choice survives a reload |
| `admin.e2e.cjs` | redirect to sign-in, unknown email gets no link, bad and reused tokens are refused, magic-link sign-in, httpOnly cookie, dashboard counts, product edit and validation, adding a product to the north isle (it appears on the live map and in the tour), site text save and validation, inbox read state, analytics counts, activity log, two-step remove, text restored, sign-out lockout, mobile sign-in layout |

**Notes:**

- `AUTH_LINKS_PER_15MIN=50` relaxes the sign-in rate limit (5 links per 15 minutes) so the test can run repeatedly. Never set it in production.

- In headless Chromium the tracking endpoint ignores the default "HeadlessChrome" user agent as a bot. The admin test sets a normal user agent so its events count.
- The "contact form responds" check in `site.test.cjs` passes in both cases: without a database the form shows a fallback email message, and with one it shows "on its way". The rate-limit check needs the database and is reported as INFO without one.
- The site test sends up to 7 messages named "Rate limit test" (the limit is 5 per sender per 10 minutes; `CONTACT_PER_10MIN` changes it). They are safe to delete from the local inbox.
