# Architecture

```
Browser ── GET / ──────────────► app/page.jsx (server) ── getSiteData() ──► Postgres
   │                                  │  (unstable_cache, tag "site")
   │                                  ▼
   │                          components/Site.jsx (client) ── world.init({products, content})
   │
   ├─ POST /api/track    (view / hover / click beacons, cookieless)
   ├─ POST /api/contact  (stores message, emails admins via Resend)
   │
   └─ /admin/*  ── middleware (cookie present?) ──► (panel)/layout.jsx requireAdmin() ──► pages
                         server actions in app/admin/actions.js ── write DB ── revalidateTag('site')
```

## Front end: the map (`lib/world.js`)

**Projection.** The world is a 1000×1000 plan-space `div`, transformed with `rotateX(60deg) rotateZ(-45deg)` and `transform-style: preserve-3d`. A plan point `(x, y, z)` lands on screen at:

- X = 0.7071(x+y)
- Y = 0.3536(y−x) − 0.866z

**Primitives:**

- **`box()`:** outlined faces in the line-art style. The top face, the +y face and the −x face are the ones visible from the camera.
- **`sprite()`:** a billboard, with transform `rotateZ(45deg) rotateX(-60deg)`, which cancels the camera so the sprite faces the screen. It's used for trees, people, boats, signs and the plane.
- **`mover()`:** a constant-speed path animation using the Web Animations API. Sprites flip to face their direction of travel, and vehicles turn at corners.
- **`slot()`:** puts the product that owns a map slot there. Bespoke slots have hand-drawn buildings; generic slots use a building style chosen in the admin.

**Islands and bridges:**

| Place | Plan rectangle | Bridge |
| --- | --- | --- |
| Calgary | 40,130 – 370,460 | footbridge → HQ |
| HQ (lighthouse) | 430,380 – 580,530 | bascule → London, arch → Lagos |
| London | 700,80 – 1040,420 | suspension → Victoria Island |
| Lagos | 470,610 – 800,940 | Ganusii highway → Victoria Island |
| Victoria Island | 880,700 – 1070,900 | — |
| North isle (optional) | 420,110 – 570,260 | footbridge → Calgary |
| South isle (optional) | 150,560 – 310,720 | arch → Calgary |

**Motion:**

- **Ocean:** the waves are a screen-space layer animated with transforms only, so it stays cheap.
- **Bascule bridge:** its leaves lift on a 40-second cycle, timed so the coral sailboat passes under them while they're open.
- **Tour:** the tour list is the products with `inTour` set, not marked Coming soon, ordered by `sort`. Clicking a tour dot restarts the timer.

**Performance and glitch rules (learned the hard way):**

- Never put two surfaces in the same plane. Decals are lifted with `translateZ` (roads at 1px, centre lines at 2px, rings at 3px).
- Decals have `pointer-events: none` so they can't swallow hovers.
- Never animate `background-position` on a large layer.
- Hover never moves the hovered element. It only highlights it.

**Theme.** Day and night colours are CSS custom properties in `app/globals.css`. Night follows `prefers-color-scheme`, and the toggle sets `data-theme` on `<html>`.

## Back end

**Data (`lib/db/schema.js`):**

| Table | Purpose |
| --- | --- |
| `products` | id, slot (unique), name, line, place, status, color, url, cta, style, in_tour, visible, sort |
| `site_content` | one row (id 1) holding a JSON document: tagline, hint, hq, story, notes, contact, settings |
| `messages` | contact-form messages, with a `read` flag |
| `events` | analytics: type (view/hover/click), product, path, referrer host, device, visitor hash |
| `login_tokens` | sha256 of each one-time sign-in token, with an expiry |
| `sessions` | sha256 of each session id, with an expiry of 30 days |
| `activity` | audit log of admin changes |

**Bootstrap.** `getDb()` connects to Neon when `DATABASE_URL` is set and to PGlite otherwise. It runs the idempotent DDL and seeds defaults once per process.

**Caching.** `getSiteData()` is wrapped in `unstable_cache` with the tag `site`, and every admin write busts that cache. If the database is down, visitors see the built-in defaults, and that fallback is not cached.

**Auth (`lib/auth.js`):**

1. `requestLoginLink` sends a link only to allow-listed emails. It allows 5 links per 15 minutes and gives the same answer whether or not the email is allowed.
2. `/admin/verify` shows a button, so link scanners can't use up the token.
3. `signInWithToken` atomically marks the token used, then creates a session in the database and an httpOnly SameSite=Lax cookie (`ul_admin`, Secure in production).
4. `requireAdmin()` runs in the panel layout and in every server action.

**Analytics.** `visitor = sha256(day + ip + userAgent + ANALYTICS_SALT)[0:16]`. No cookies are set and raw IP addresses are not stored. Bots are filtered by user agent. Hover events are sent once per product per page view.

**Contact.** The form has a honeypot field `website`. Messages are stored first, and the alert email is fire-and-forget.
