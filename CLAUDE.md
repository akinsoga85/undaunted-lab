# CLAUDE.md: Undaunted Lab website

This file gives Claude Code the context to work on and deploy this project.

## What this is

This is the new **undauntedlab.com**. It has two parts:

- **The site (`/`):** one screen showing an interactive isometric world. Three islands (London, Lagos, Calgary), a lighthouse HQ and Victoria Island are joined by five kinds of bridge. Each Undaunted Lab product is a landmark, and the paper plane from the logo flies between them.
- **The admin (`/admin`):** a password-less admin (email magic links) where Opeyemi manages products, places them on the map, edits site text, reads contact messages and views analytics.

**Stack:**

- Next.js 14.2 (App Router), plain JavaScript with no TypeScript.
- Postgres on Neon, accessed with Drizzle ORM. The `@neondatabase/serverless` HTTP driver is used in production, and PGlite (embedded Postgres) locally.
- Resend for email.
- Deployed on Vercel.

## Commands

```bash
npm install
npm run dev            # http://localhost:3000 (uses the embedded DB in ./.data, no setup)
npm run build && npm start
```

To sign in to the admin locally, set these in `.env.local`:

```
ADMIN_EMAILS=opeyemi@undauntedlab.com
AUTH_DEV_LINKS=1
```

Then request a link at `/admin/login`. The link is printed in the server output.

## Deploying

Follow **docs/DEPLOY.md** step by step. In short:

1. Create a Vercel project from this repo.
2. Add Neon Postgres under Vercel → Storage. This sets `DATABASE_URL`.
3. Set `ADMIN_EMAILS`, `RESEND_API_KEY`, `MAIL_FROM`, `SITE_URL` and `ANALYTICS_SALT`.
4. Deploy, then attach `undauntedlab.com`.

Tables are created and seeded automatically on the first request. No migration step is needed.

After deploying, run the checks in docs/DEPLOY.md under "Verify the deployment".

## Tests

Two Playwright scripts live in `tests/`; see `tests/README.md`.

- `tests/site.test.cjs` tests the map: hover, click, drag, menu, panels, theme, tour and mobile.
- `tests/admin.e2e.cjs` tests the full admin flow: magic-link sign-in, editing, adding a product to a new island, messages, analytics and sign-out.

Run them against a local production build, never against the production database. The admin test adds and removes a test product.

## Where things live

| Path | What |
| --- | --- |
| `lib/world.js` | The map engine: a CSS 3D isometric world, islands, bridges, traffic, boats, the plane tour, panning and panels. Client-only. |
| `lib/defaults.js` | **Shared source of truth** for map slots (`SLOTS`), building styles, statuses, default products and default site text. |
| `components/Site.jsx` | The public page shell (nav, card, tour controls, panels). It passes DB data into `world.init()` and sends analytics beacons. |
| `app/page.jsx` | A server component that loads products and content through `lib/site-data.js`, which is cached with the tag `site`. |
| `lib/db/` | The Drizzle schema plus the DDL bootstrap and seed (`getDb()`). |
| `lib/auth.js` | Magic links, sessions, the allow-list and the activity log. |
| `app/admin/` | Admin pages. `(panel)` is a route group whose layout enforces the session. `actions.js` holds every server action. |
| `app/api/contact`, `app/api/track` | Public endpoints for contact messages and cookieless analytics. |
| `middleware.js` | Redirects any `/admin` request without a session cookie to `/admin/login`. Each page still re-checks the session in the DB. |
| `docs/` | Deploy guide, architecture, design system, screenshots, brand files and design history. |
| `scripts/og-image.cjs` | Regenerates `public/og.png`, the link-preview image (a snapshot of the map). Rerun after the map or tagline changes. |

## Conventions and gotchas

- **Saving data:** every admin save calls `revalidateTag('site')` and `revalidatePath('/')`, so changes go live without a redeploy. Keep doing this in any new action.
- **The map engine is DOM-built:**
  - `world.js` builds everything with `document.createElement`. Coordinates are in a 1000×1000 "plan" space shown through `rotateX(60deg) rotateZ(-45deg)`.
  - Boxes have outlined faces for top, +y and −x (`full: true` adds the other two sides for moving vehicles).
  - Sprites are billboards that cancel the camera rotation.
  - Island names are not sprites. `placeName()` puts them in `.ul-labels`, a flat layer above the world, so traffic can't cover them. Use it for any text that must stay readable.
- **Avoiding z-fighting:** decals lying on a surface (roads, lawns, plots, rings) are lifted with `translateZ(1–3px)` and have `pointer-events: none`. Keep that, or the flicker and hover bugs come back.
- **Adding a map slot:** add it to `SLOTS` in `lib/defaults.js` with its plan `pos`, then call `slot(parent, id, x, y, w, d)` in `build()` inside `lib/world.js`.
- **Escaping text:** admin-entered text that goes into `innerHTML` must go through `esc()` in world.js.
- **Responsive layout:** see the Layout table in docs/DESIGN.md. Below 1140px, `.ul-dock` joins the card and tour controls into one panel and the tagline moves under the logo; at 1140px and up, `.ul-dock` is an invisible strip and its children keep their desktop corners. Check new floating UI at 320, 390, 768, 1024 and 1440px; `tests/site.test.cjs` fails if any of it overlaps.
- **Panels:** while one is open, `.ul-root.panel-open` hides the floating UI and the `behind` list in world.js makes it inert. Add any new floating UI to both, or it will show through the panel or stay reachable by Tab. Close panels with `dismiss()`, not `closePanels()`, so the hash is cleared.
- **Reduced motion:** with `prefers-reduced-motion`, the tour starts paused and all animation is turned off in CSS.
- **Deleting:** don't delete `.data/` while the dev server is running (PGlite holds it open).
- **Vercel and the database:** on Vercel, `DATABASE_URL` is required. The app refuses to fall back to PGlite there.
