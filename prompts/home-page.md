# Implementation prompt — Vertex home page (`/`)

Reference: `design/vertex-home.png` (source of truth for all visuals, per AGENTS.md §3).

## Goal

Replace the create-next-app placeholder at `app/page.tsx` with the Vertex home page:
navbar, hero (badge, display heading, subtitle, CTA, search bar), "All Courses"
section with three course cards, weekly-note strip, and the decorative orange bar
footer. Desktop matches the reference; the page adapts responsively down to mobile
(no mobile reference exists).

## Skills / docs read

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` —
  page file conventions for this Next version (default-exported page component;
  matches the existing `app/design-system/page.tsx` pattern).
- No domain skills (no Sanity / Clerk / search work in this task).

## Code inspected

- `app/globals.css` — tokens: primary/neutral ramps, type scale (`text-display-*`,
  `text-body*`, `text-small`), radius, shadows, `font-display` (Playfair) / `font-sans` (Inter).
- `components/ui/logo.tsx`, `nav.tsx`, `icon.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`,
  `card.tsx` — existing primitives and their specs.
- `app/design-system/page.tsx` — established usage patterns.
- `app/layout.tsx` — fonts loaded, `body` is `min-h-full flex flex-col` (page can use `flex-1`).

## Files touched

- `app/page.tsx` — rewritten (home page).
- `components/ui/icon.tsx` — additive: add `arrow-right` and `star` to the icon set
  (both appear in the reference, neither exists).
- No other files. No changes to globals.css (one-off colors stay as arbitrary values
  in the page), no new dependencies.

## Requirements (from the reference)

1. **Page background**: subtle 45° diagonal-stripe texture on the page; the app is a
   centered column (`max-w-5xl`) with its own solid backgrounds — white navbar, cream
   hero (`#FAF6F0`), white courses section. Full-bleed white band with orange gradient
   bars at the very bottom of the page.
2. **Navbar** (h-24 desktop / h-20 mobile): `Logo` + `Navbar` links (Courses,
   My Learning) reused as-is, centered in a taller header; right side: bell icon button
   (presentational per AGENTS.md §7) + circular avatar; hairline bottom border.
3. **Hero**: `Badge` "Intelligent Learning" (tone `video`, slightly larger padding);
   Playfair heading "Search your learning in plain English." (~64px desktop, two
   balanced lines); gray 20px subtitle; primary CTA "Explore Courses →" (~56px tall,
   rounded-[10px], hover `primary-600`); large search bar (~80px tall, rounded-2xl,
   white, hairline border + soft shadow) with search icon, placeholder
   "Ask anything about your learning...", and a "⌘ K" key chip.
4. **All Courses**: serif `text-display-2` title left, "View all courses →" primary
   text link right; 3 cards in a grid (1 col → 2 at sm → 3 at lg). Card: 64px brand
   tile (Next.js black "N" tile / Docker whale mark / TypeScript blue "TS" tile),
   serif ~22px title, 14px gray description, hairline divider pinned to the card
   bottom (mt-auto so dividers align across unequal description lengths), meta row
   with `bar-chart`/`clock`/`file-text` icons at 12px. Course content hardcoded to the
   reference (Next.js for Production · Docker Essentials · TypeScript Deep Dive) —
   presentational only; Sanity-backed catalog comes later.
5. **Weekly strip**: hairline — star icon (primary) — "New courses and lessons added
   every week." — hairline.
6. **Decorative bars**: ~16 equal-width bars anchored to the page bottom, orange
   gradient fading upward, irregular heights, `aria-hidden`, `pointer-events-none`.

## Decisions / assumptions

- Where the reference differs from the design-system sheet, the image wins: card
  titles are serif, the hero uses display sizes larger than `text-display-1`, and the
  course card is icon-on-top (the sheet's `CourseCard` is icon-left) — so the card is
  page-local, and the sheet's `Button`/`Input` (fixed h-11) are not forced onto the
  larger hero controls.
- Avatar has no photo asset in the repo → neutral placeholder circle with the `user`
  icon; swap for a real image when auth lands.
- Nav links use `href="#"` (catalog / My Learning routes don't exist yet), matching
  the design-system page.
- Orange = `primary-500` (#F97316) tokens throughout (the screenshot reads slightly
  deeper, but the token ramp is canonical).
- Docker whale uses the simple-icons path (CC0), downloaded at implementation time;
  Next.js / TypeScript tiles are styled letter tiles, matching the reference.
- Static server-rendered page, no client components; page-level `metadata` added.

## Security considerations

None — no data access, no env vars or secrets, no server routes, no client
interactivity beyond a native input. Nothing user-supplied is rendered.

## Acceptance criteria

- Desktop (≥1280px) visually matches `design/vertex-home.png` in layout, spacing,
  typography, and color.
- Cards 3→2→1 across breakpoints; nav links hidden on the smallest screens; hero type
  scales down; no horizontal overflow at any width.
- `tsc --noEmit`, `eslint`, and `next build` pass; `/design-system` unaffected
  (icon additions are additive).

## Checks

1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm build` (new route content)
4. Dev server + screenshots at 1440 / 768 / 375 widths, compared against the
   reference; server killed and screenshots deleted afterwards.

## Manual test steps

1. `pnpm dev` → open `http://localhost:3000/` → compare with `design/vertex-home.png`.
2. Narrow the viewport: cards restack 3→2→1, hero scales, nothing overflows.
3. Hover the CTA and "View all courses" link → hover shades apply.
4. Open `/design-system` → unchanged.
