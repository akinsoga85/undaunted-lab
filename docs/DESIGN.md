# Design

## Positioning (from the research brief)

- **Line:** "Undaunted Lab builds AI-native tools that protect everyday people and open the doors systems keep shut."
- **Pillars:**
  - Safety: catch harm early.
  - Access: make the hard parts of life simple.
  - AI at the core, honestly: AI drafts, sorts and flags, and a person makes the call.
- **Audiences:** partners and investors, product users, and talent and press.
- **Direction chosen:** one screen and one explorable world, with almost no text. This was inspired by latecheckout.studio. The world is our own: the UK–Nigeria–Canada corridor.

## Brand

- **Logo:** a blue paper plane with speed lines inside a coral circle, drawn as thick black line art (`docs/brand/`). The plane is the site's motif, touring the products.
- **Illustration style:** flat fills with 2.5–3px ink outlines (`#17181C`), hard offset shadows on UI (`4px 4px 0 ink`), and pill shapes.

## Colour tokens

| Token | Day | Night | Use |
| --- | --- | --- | --- |
| `--sea` | `#BFE3F3` | `#1C2E55` | page and sea |
| `--land` | `#FFF3E4` | `#EEE1CE` | island tops |
| `--cliff` / `--cliff-2` | `#F47B5A` / `#D45E3E` | `#D8664A` / `#AA4A35` | island sides |
| `--lawn` | `#CFEBC6` | `#9DC59B` | parks |
| `--road` | `#5B6170` | `#3B3F4A` | roads, bridge decks |
| `--glass` / `--warm` | `#5BB8E6` / `#FFE07A` | `#FFD25E` / `#FFC94A` | windows (they glow at night) |
| `--coral` | `#F47B5A` | | accent, call to action, selection ring |
| `--blue` / `--blue-2` | `#5BB8E6` / `#2E86C1` | | plane, links |
| `--ink` | `#17181C` | | every outline and text on UI cards |

UI cards stay white with ink text in both themes. The tagline over the sea switches to `--on-sea` (`#17181C` by day, `#F4F1FF` at night).

**Product colours:**

| Product | Colour |
| --- | --- |
| Scamfendr | `#2E86C1` |
| Vervet | `#F6C343` |
| Ganusii | `#1E4D3A` |
| NotisCare | `#24304F` |
| Nestlo | `#1F6F6B` |
| Coming soon | `#FFE3D8` |

## Layout

The map fills the screen and the UI floats over it. How the UI is arranged depends on width:

| Width | Top | Bottom |
| --- | --- | --- |
| 1140px and up | logo and full nav | tagline bottom left, card centred, tour controls bottom right, hint pill above the card |
| 761–1139px | logo and full nav, tagline under the logo | card and tour controls joined in one panel, centred (max 460px); no hint pill |
| 760px and below | logo only, and a nav with Menu, theme and Say hello (Our story and Lab notes move into the Menu) | the same joined panel |

- Below 1140px the tagline sits over the map, so a soft, blurred patch of `--sea` behind it lets the map fade out under the words.
- The tagline's second line is the admin "hint" on devices with a mouse. On touch screens it is "Drag to explore. Tap a place to meet it." instead, because hover and click don't apply.
- Under 360px the card drops its colour swatch to save a line.

**Panels** (Our story, Lab notes, Say hello, Privacy) slide in from the right: 520px wide, or full width on phones. While one is open, the map dims behind a scrim (`rgba(23, 24, 28, .3)`), and the card, tour controls, hint and tagline fade out so nothing is left half-covered. The ✕ button, Esc or a click on the dimmed map closes the panel, and the tour holds its place until it closes.

## Type

- **Display:** Bricolage Grotesque 500/700/800, used for names, headings and the wordmark.
- **Body/UI:** DM Sans 400–700.
- Both are self-hosted in `app/fonts/` (SIL Open Font License) and loaded with `next/font/local`, so builds never depend on Google Fonts. They're exposed as `--display` and `--body`.

## Motion

| Element | Motion |
| --- | --- |
| Ocean | wave layers drifting at 9s and 21s, foam pulsing around islands, ripples and sparkles |
| Traffic | constant-speed loops on ring roads: London buses, cabs and bikes; Lagos danfos and okadas; Calgary pickup and cyclist |
| People | walkers whose legs swing |
| Water | surfers, sailboats, a kayak, a ferry, a cargo ship on the corridor, dolphins |
| Air | balloon, helicopter, birds, clouds |
| Paper plane | a 2.6s eased flight between stops, turning towards the next target; its shadow tracks on the water. The tour opens on the HQ card for one full stop. On small screens the map glides (1.4s) to bring an off-screen stop into view, unless the visitor has just dragged it |
| Bascule bridge | leaves lift on a 40s cycle while the boat passes under |
| Cards | a 0.45s pop when the card changes |

All animation stops under `prefers-reduced-motion`.

## Admin UI

The admin uses the same ink line-art, calmer:

- **Colours:** white cards on a pale sea background (`#EEF4F7`), a coral offset shadow on primary buttons, and blue for links and charts.
- **Layout:** a sidebar on desktop, which becomes a scrolling top bar on phones.
- **Charts:** one series each, with rounded bar ends and native tooltips.

## Screenshots

See `docs/screenshots/` for the site by day, at night and on a phone, the contact panel, the bascule bridge, and every admin page.

## Design history

`docs/design-history/canvas/` holds the earlier Claude Design canvas files:

- the research brief (`Main`)
- the wireframe
- the first-round review
- the Corridor concept, which became this site

The round-1 directions A, B and C were rejected as too text-heavy and taken off the canvas (`canvas.json`). Their files, `DirectionA.dc.html` to `DirectionC.dc.html`, are still in the folder for reference. The Review board recommends building on B with parts of C; that was superseded when the Corridor concept was chosen. These `.dc.html` files need the Claude Design canvas runtime to render; read them as source for reference.

**Page not found** (`app/not-found.jsx`) reuses the panel look on the plain sea colour: a white card with the 3px ink border and hard shadow, the logo, a blue kicker, a display heading and one dark "Back to the map" button. It follows the saved day/night choice like the map does.

**Lab notes articles** (`app/notes/[slug]`) use the same look as a page that scrolls: the logo pill and an "All notes" pill on the sea, then one white card, at most 760px wide, with a blue kicker (the topic), a display-font title, a byline with the reading time, and body text at 18px/1.7 with lines held to about 66 characters. Headings use the display font; quotes get a coral rule. A dashed rule separates the ending: a "Say hello" line, "Discuss on LinkedIn" once the post exists, and "Back to the map". `[[NOTE: …]]` placeholders show as dashed yellow highlights in previews.

