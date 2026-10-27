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

## Type

- **Display:** Bricolage Grotesque 500/700/800, used for names, headings and the wordmark.
- **Body/UI:** DM Sans 400–700.
- Both are loaded with `next/font/google` and exposed as `--display` and `--body`.

## Motion

| Element | Motion |
| --- | --- |
| Ocean | wave layers drifting at 9s and 21s, foam pulsing around islands, ripples and sparkles |
| Traffic | constant-speed loops on ring roads: London buses, cabs and bikes; Lagos danfos and okadas; Calgary pickup and cyclist |
| People | walkers whose legs swing |
| Water | surfers, sailboats, a kayak, a ferry, a cargo ship on the corridor, dolphins |
| Air | balloon, helicopter, birds, clouds |
| Paper plane | a 2.6s eased flight between stops, turning towards the next target; its shadow tracks on the water |
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

The round-1 directions A, B and C were rejected as too text-heavy and were removed. These `.dc.html` files need the Claude Design canvas runtime to render; read them as source for reference.
