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
- **`placeName()`:** the island names (CALGARY · CANADA and so on). These are not sprites: they sit in `.ul-labels`, a flat layer drawn over the 3D world with the same box as `.ul-world`, positioned with the projection above (island tops are at z = 28). A billboard leans back across the ring road, so buses and cyclists used to drive through the lettering; in the flat layer nothing can pass in front of them, and they still pan and scale with the map.
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
- **Tour:** the tour list is the products with `inTour` set, not marked Coming soon, ordered by `sort`. It opens on the HQ card and holds it for one stop. Clicking a tour dot restarts the timer.
- **Following the tour:** on small screens some products sit off-screen. `reveal(id)` measures the product's building against `clearArea()` (the stage minus the header, tagline and bottom panel) and glides the map only along an axis where the building is out of view. Tour steps call it unless the visitor dragged the map in the last 12 seconds. Dot clicks and keyboard focus on a building always call it.

**Performance and glitch rules (learned the hard way):**

- Never put two surfaces in the same plane. Decals are lifted with `translateZ` (roads at 1px, centre lines at 2px, rings at 3px).
- Decals have `pointer-events: none` so they can't swallow hovers.
- Never animate `background-position` on a large layer.
- Hover never moves the hovered element. It only highlights it.

**Panels.** `#story`, `#notes`, `#contact` and `#privacy` open a panel through the hash, so links and the back button work. While a panel is open, `.ul-root` has the class `panel-open`. That class shows the scrim and hides the floating UI, and everything behind the panel (the stage, header, tagline, hint and dock) is `inert`, so Tab stays inside the panel. The ✕ button, Esc and the scrim all close it through `dismiss()`, which also clears the hash (so the same link reopens it) and returns focus to the link that opened it when that was done with the keyboard. The tour does not advance while a panel is open.

**Theme.** Day and night colours are CSS custom properties in `app/globals.css`. Night follows `prefers-color-scheme`, and the toggle sets `data-theme` on `<html>` and saves the choice in `localStorage` (`ul-theme`). A small inline script in `app/layout.jsx` applies a saved choice before first paint, so there is no flash of the other theme; it skips `/admin`, which is light only. The browser's `theme-color` follows the theme.

**Link previews.** `public/og.png` (1200×630) is a snapshot of the map with the logo and tagline, used for Open Graph and X/Twitter cards. Regenerate it with `scripts/og-image.cjs` after the map or tagline changes, and keep it under 300 KB for WhatsApp.

## Back end

**Data (`lib/db/schema.js`):**

| Table | Purpose |
| --- | --- |
| `products` | id, slot (unique), name, line, place, status, color, url, cta, style, in_tour, visible, sort |
| `site_content` | one row (id 1) holding a JSON document: tagline, hint, hq, story, notes, contact, privacy, settings |
| `messages` | contact-form messages, with a `read` flag and a `sender` hash used only for rate limiting |
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

**Contact.** The form has a honeypot field `ul_hp` inside a `display:none` wrapper (autofill skips fields that can't be focused) with password-manager ignore flags. A filled honeypot never drops the message: in production a real person's autofill filled it (as an off-screen field), and the message was silently lost. Instead the message is saved with `spam = true`, shown with a **Possible spam** pill in the admin, and its alert subject starts with `[Possible spam]`. It checks name and email in the browser first; the API repeats the checks and returns errors per field (`{ errors: { name, email } }`), which the form shows under each field. A sender is `sha256(day + ip + ANALYTICS_SALT)[0:16]`, limited to 5 messages per 10 minutes (HTTP 429). Messages are stored first, then the alert email is sent and awaited, because Vercel can freeze the function once the response is out. Each saved message logs `[contact] message saved; email alert sent` (or `not sent`). Alerts are skipped once more than 20 messages have arrived in the past hour.

**Privacy notice.** The `#privacy` panel is linked under the contact form ("How we handle them") and at the foot of the menu. Its heading, sections and "last updated" date are site text (`privacy` in `lib/defaults.js`), editable under **Site text**; the public contact email is added at the end automatically. The default text describes what the code actually does (what the form stores, the daily sender hash, cookieless analytics, the theme in localStorage), so update it if that changes.

**Launch basics.** `app/robots.js` serves `/robots.txt` (keeps `/admin` and `/api/` out of search) and `app/sitemap.js` serves `/sitemap.xml`; both use `siteUrl()` from `lib/site-url.js`, falling back to `https://undauntedlab.com`. `siteUrl()` ignores a `SITE_URL` that isn't a plain http(s) address (for example one with a note pasted after it), and Settings → Connections flags it. The home page sets a canonical link to undauntedlab.com, so the `.vercel.app` copy doesn't compete with it in search. `app/not-found.jsx` is the styled page for any unknown address, including old links from the Framer site. `next.config.mjs` sends security headers with every response: `frame-ancestors 'none'` and `X-Frame-Options: DENY` (no framing, so no clickjacking of the admin), `base-uri`/`form-action 'self'`, `nosniff`, a referrer policy and a permissions policy. It is not a full script CSP, which would need nonces for Next's inline scripts.
