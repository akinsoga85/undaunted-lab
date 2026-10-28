# undauntedlab.com: site + admin

**Start here:** `CLAUDE.md` (project brief for Claude Code) · `docs/DEPLOY.md` (step-by-step deploy) · `docs/ARCHITECTURE.md` · `docs/DESIGN.md` · `docs/screenshots/` · `tests/README.md`

- **The site** (`/`) is the one-screen interactive world. Each product is a landmark, and the paper plane tours them.
- **The admin** (`/admin`) is where you manage it. You can:
  - add, edit, reorder, hide and remove products
  - place new products on open plots or new islands
  - edit all the site text
  - read contact messages
  - see privacy-friendly analytics

Changes go live as soon as you save. There's no redeploy.

## Stack

- Next.js 14 (App Router), deployed on Vercel.
- Postgres on Neon, accessed through Drizzle ORM. Tables are created and seeded automatically on first run.
- Sign-in uses email magic links sent with Resend. Only addresses in `ADMIN_EMAILS` can sign in.
- Analytics are first-party: no cookies, no IP addresses stored.

## Run it locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_EMAILS, and AUTH_DEV_LINKS=1
npm run dev                   # http://localhost:3000 and http://localhost:3000/admin
```

- **Database:** without `DATABASE_URL`, an embedded Postgres (PGlite) is used and stored in `./.data`.
- **Sign-in:** without `RESEND_API_KEY`, the sign-in link is printed in your terminal.

## Deploy on Vercel

1. Push this folder to a GitHub repo, then go to **Vercel → New Project → Import**.
2. Open **Storage → Create → Neon (Postgres)** and connect it to the project. This sets `DATABASE_URL`.
3. Set up email: create a [Resend](https://resend.com) account, verify `undauntedlab.com` in it, and create an API key.
4. In **Settings → Environment Variables**, add:
   - `ADMIN_EMAILS`: for example `opeyemi@undauntedlab.com`
   - `RESEND_API_KEY`
   - `MAIL_FROM`: for example `Undaunted Lab <hello@undauntedlab.com>`
   - `SITE_URL`: `https://undauntedlab.com`
   - `ANALYTICS_SALT`: any long random string
5. Deploy, then add `undauntedlab.com` under **Settings → Domains**.
6. Go to `/admin`, enter your email and click the link you receive.

## The admin

| Page | What you can do |
| --- | --- |
| Dashboard | Views this week, visitors, product clicks, unread messages, a 30-day chart and the latest messages |
| Products & map | Reorder the tour, show or hide products, take them in or out of the tour, edit them, remove them (two-step), see which places are free |
| Add / edit product | Set name, line, status (Live, Pilot, In the lab, Coming soon), link, button text, colour and place on the map. Open plots and islands also take a building style (tower, house, shop or campus). The card preview updates as you type |
| Site text | The tagline, the lighthouse card, Our story (paragraphs, principles, founder note), Lab notes posts, the Say hello topics and email, the LinkedIn link and the tour speed |
| Messages | Read, reply by email, mark as read or unread, delete |
| Analytics | Views and visitors over 7, 30 or 90 days, hovers, clicks and click rate per product, referring sites, phone vs desktop |
| Settings | Who can sign in, connection status, sign out everywhere, recent activity |

### Places on the map

- **Five places have hand-drawn buildings:** the London tower, the London building site, the Lagos care home, the Calgary house and the Lagos ⇄ Victoria Island highway.
- **Two are open plots,** one in Calgary and one in London.
- **Two are new islands, north and south of Calgary.** Each appears with its own bridge the moment you place a product there.

A product marked **Coming soon** shows as a fenced plot with a “?” sign, and its button links to the contact form.

## Security notes

- **Sign-in links:** each works once and expires in 15 minutes. They're stored only as hashes, and each email can request at most 5 links every 15 minutes.
- **Link scanners:** opening a sign-in link shows a "Continue" button rather than signing in straight away, so email scanners that open links can't use it up.
- **Sessions:** these are httpOnly cookies backed by the database and last 30 days. You can sign out every device from Settings.
- **Who has access:** every admin page and action checks the session on the server. Removing someone from `ADMIN_EMAILS` locks them out immediately.
- **Privacy notice:** a Privacy panel, linked under the contact form and in the menu, explains what the site collects. Edit it under **Site text**.
- **Security headers:** no site can show this one (or the admin) inside a frame, plus nosniff, referrer and permissions policies. See `next.config.mjs`.
- **Contact form:** it has a honeypot field and length limits. One sender (a daily hash of their IP, never the IP itself) can send 5 messages every 10 minutes. Past 20 messages an hour, new messages are still saved but the email alerts pause.
- **Analytics:** a visitor is a daily hash of (IP + browser + salt). Raw IP addresses are never stored.

## Files

- `lib/world.js` builds the world. `lib/defaults.js` holds the places on the map, the statuses, and the default products and text.
- `lib/db/` holds the schema and the connection, which uses Neon in production and PGlite locally.
- `lib/auth.js`, `lib/analytics.js` and `lib/site-data.js` hold the server logic.
- `app/admin/` holds the admin pages and `actions.js`, the server actions behind every save.
- `app/api/contact` and `app/api/track` are the public endpoints.
- `app/fonts/` holds the self-hosted fonts (Bricolage Grotesque and DM Sans, under the SIL Open Font License).
- `tests/` holds the Playwright browser tests (see `tests/README.md`).
- `scripts/og-image.cjs` regenerates `public/og.png`, the picture shown when the site is shared. Run it after the map or tagline changes.
- `docs/` holds the deploy guide, architecture, design system, brand files, screenshots and design history.
