# Vertex — AI-Powered Learning Platform

> Search your learning in plain English. Vertex finds the exact lesson — and the exact second — across all your courses.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black)](https://nextjs.org/)
[![Sanity](https://img.shields.io/badge/Sanity-5.31-red)](https://www.sanity.io/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

Production-style learning platform where authors create courses in Sanity and learners discover content through grounded, timestamp-aware search. Each result links directly to the moment in a lesson video where the topic is taught — playback stays on-site via the provider embed.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Content Model](#content-model)
- [Video Ingestion](#video-ingestion)
- [Search](#search)
- [Authentication](#authentication)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Security & Boundaries](#security--boundaries)
- [Checks](#checks)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Catalog** — public course listing with level, duration, module count (`app/page.tsx`, `app/courses/page.tsx`)
- **Course detail** — marketing fields, instructor, what-you'll-learn, module → lesson ordering (derived, not stored)
- **Lesson page** — video embed (YouTube / Vimeo / Bunny), Portable Text notes, key points, pro tip, resources; deep-link with `?t=<seconds>`
- **Intelligent search** — full results page, ranked, with count + sort (`/search`); two result types:
  - *Video moments* — matched at a specific second (chapters first, transcript fallback)
  - *Lesson results* — matched on title / notes
- **Design system** — `/design-system` reference implementation (colors, typography, spacing, radius, shadows, icons, buttons, inputs, badges, cards, nav)
- **Studio** — Sanity Studio mounted at `/studio` (Vision enabled)
- **Auth** — Clerk (publishable key client, secret key server, `proxy.ts` middleware)
- **Offline video pipeline** — transcript → chunked `video` docs + chapters (see [Video Ingestion](#video-ingestion))

Presentational-only surfaces (no backend): My Learning, notifications bell, Notes tab, free-preview badge.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack), React 19, TypeScript 5 |
| CMS | Sanity 5.31 + `next-sanity` 13.3, `@sanity/image-url`, `@portabletext/react` |
| Auth | `@clerk/nextjs` 7.8 |
| Styling | Tailwind CSS 4, `@tailwindcss/postcss`, `tailwindcss/typography` |
| Fonts | `next/font` — Inter (UI) + Playfair Display (display) |
| Search | Sanity Context MCP (server HTTP) + OpenAI via Vercel AI SDK, Zod validation, `react-markdown` for reply render |
| Analytics (planned) | PostHog — public key in browser, private key server-only |
| Validation | Zod |
| Package manager | pnpm 11.5 |

> Do **not** use `@sanity/context` Studio plugin if it lags the Studio major, `text::semanticSimilarity()` without embeddings, an embedded-Studio-as-separate-app assumption, public dataset, client-side token, or a separate backend framework.

---

## Architecture

```
app/                  # Next.js App Router (web workspace)
  layout.tsx          # Root layout — fonts, <ClerkProvider>, metadata.icons
  page.tsx            # Home — hero + search input + top 3 courses
  courses/            # Catalog + course + lesson routes
  search/             # Full results page (server: performSearch, client: SearchResults)
  design-system/      # Design reference (exact reproduction, responsive)
  studio/[[...tool]]  # Sanity Studio (basePath /studio)
  api/search/         # Server route → Context MCP → LLM → streamed cards (no chatbox)
  icon.svg|png        # File-based favicons (see Design System)
  favicon.ico         # 16+32 ICO (PNG-embedded) generated from Logo gradient
  apple-icon.png      # 180 Apple touch

sanity/
  schemaTypes/        # course, module (embedded), lesson, instructor, category, video, searchConfig
  lib/                # server-only client, GROQ queries, data fetchers, search helper
  seed/               # Offline ingestion: ingest-videos.mjs → videos.ndjson
components/ui/        # Reusable UI (Logo, Icon, Button, Input, Badge, Card, Nav, etc.)
lib/utils.ts          # cn() helper
proxy.ts              # clerkMiddleware (Next.js 16 proxy convention)
sanity.config.ts      # Studio config (structure + vision, basePath /studio)
```

**Request boundaries (enforced):**

- Pages are read-only; they render stored data via server-only Sanity client.
- Browser never holds a Sanity token, never calls MCP/LLM, never writes content/progress.
- Writes (e.g., progress keyed by Clerk `userId`) go through server routes with a server-only write token.
- `NEXT_PUBLIC_*` is client-safe; everything else stays server-only.

---

## Prerequisites

- Node.js 20+ (22 LTS recommended)
- pnpm 11.5 (`npm i -g pnpm` or `corepack enable`)
- Sanity project (projectId + private dataset)
- Clerk application (publishable + secret keys)
- (Optional, for search) Sanity Context MCP URL + OpenAI API key
- (Optional, for video ingest) Provider credentials per ingestion path

---

## Getting Started

```bash
# 1. Clone & install
git clone <repo-url> vertex
cd vertex
pnpm install

# 2. Env
cp .env.example .env.local
# Fill values per table below — never commit .env.local

# 3. Dev server (Next + Studio at /studio)
pnpm dev
# → http://localhost:3000
# → http://localhost:3000/studio

# 4. (Optional) Seed content
pnpm seed:build          # build seed.ndjson from seed source
pnpm seed:import         # sanity dataset import sanity/seed/seed.ndjson production --replace
pnpm seed:ingest         # ingest transcripts/chapters → video docs
pnpm seed:import:videos  # import videos.ndjson
```

Sanity CLI (if needed):

```bash
pnpm dlx sanity@latest login
pnpm dlx sanity@latest deploy          # deploys Studio application (required for Context MCP)
pnpm dlx sanity@latest schema deploy   # schema only (NOT enough for MCP)
pnpm dlx sanity@latest dataset import sanity/seed/seed.ndjson production --replace
```

---

## Environment Variables

Canonical list is `.env.example`. Keep it committed; keep `.env.local` gitignored.

| Variable | Scope | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | client | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | server | Yes | Clerk secret key (never expose) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | client | Yes | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | client | Yes | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | client | Yes | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | client | Yes | `/` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | client | Yes | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | client | Yes | e.g., `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | client | Yes | `2026-08-26` |
| `SANITY_API_READ_TOKEN` | server | Yes | Private dataset read token (also accepts `SANITY_READ_TOKEN`). `server-only` |
| `SANITY_CONTEXT_MCP_URL` | server | No | Context MCP endpoint for search |
| `OPENAI_API_KEY` | server | No | LLM for search (AI SDK OpenAI provider) |
| `YOUTUBE_COOKIES` | server | No | Offline ingest only — cookie header for age-restricted captions |
| `VIMEO_ACCESS_TOKEN` | server | No | Offline ingest only |
| `BUNNY_API_KEY` | server | No | Offline ingest only |

> Client bundle must never contain `SANITY_API_READ_TOKEN`, `CLERK_SECRET_KEY`, or `OPENAI_API_KEY`. Use `server-only` in data clients (`sanity/lib/client.ts`).

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Dev server (Turbopack) |
| `build` | `next build` | Production build (Turbopack) |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | Lint (eslint-config-next + TS) |
| `seed:ingest` | `node sanity/seed/ingest-videos.mjs` | Build `video` docs from captions/chapters |
| `seed:build` | `node sanity/seed/build-ndjson.mjs` | Build `seed.ndjson` |
| `seed:import` | `sanity dataset import ...` | Import course/lesson content |
| `seed:import:videos` | `sanity dataset import ...` | Import video docs |

---

## Project Structure

```
.
├── app/
│   ├── api/search/          # Server search route (MCP + LLM)
│   ├── courses/             # /courses, /courses/[slug], /courses/[slug]/[lessonSlug]
│   ├── design-system/       # Reference implementation — do not restyle
│   ├── search/              # /search?q=&sort=&page=
│   ├── studio/              # Mounted Sanity Studio
│   ├── favicon.ico          # Vertex V ICO (gradient #F5876A→#E85A34)
│   ├── icon.svg / icon.png  # SVG + PNG favicons (file-based metadata)
│   ├── apple-icon.png       # 180px Apple touch icon
│   ├── globals.css          # Design tokens (@theme)
│   └── layout.tsx           # Fonts + metadata.icons
├── components/
│   ├── ui/                  # Logo, Icon, Button, Input, Badge, ProgressBar, Card, Nav, Pagination
│   └── search/              # HomeSearchInput, SearchInput, SearchResults
├── sanity/
│   ├── schemaTypes/         # course, module, lesson, instructor, category, video, searchConfig
│   ├── lib/                 # client (server-only), queries, data fetchers, image, search
│   ├── seed/                # ingest + ndjson builders
│   ├── env.ts               # projectId/dataset/readToken assertions
│   └── structure.ts         # Studio structure
├── lib/utils.ts
├── proxy.ts                 # Clerk middleware (matcher excludes static assets)
├── sanity.config.ts
├── next.config.ts
└── .env.example
```

---

## Content Model

Defined in `sanity/schemaTypes/` (`schemaTypes/index.ts`):

- **course** — `title`, `slug`, `summary`, `coverImage`, `level`, `price`, `popular`, `studentCount`, `learningOutcomes[{icon,title,description}]`, `instructor→instructor`, `category→category`, `modules[ module{title, summary, lessons[→lesson]} ]`. Module/lesson numbers (e.g., *Module 5*, *Lesson 5.1*) are derived from order.
- **module** (`courseModule`) — embedded object in course, not a document.
- **lesson** — `title`, `slug`, `videoUrl`, `poster`, `duration`, `freePreview`, `studentCount`, `notes` (Portable Text), `keyPoints[]`, `proTip`, `resources[{type,title,description,url}]`. Parent course via reverse reference.
- **instructor** — `name`, `slug`, `photo`, `expertise`, `bio` (own page).
- **category** — `title`, `slug`, `description`.
- **video** — offline-built, one per `videoUrl` (id derived from URL, datastore-safe). `chapters: {startSeconds,label}[]` + `chunks: {startSeconds,text}[]` (never whole transcript in one field).
- **searchConfig** — Context document: content scope filter + query instructions (see [Search](#search)).

> Content is structured (Portable Text + typed fields) — never markdown. Markdown only appears in the search agent's reply (`react-markdown` render).

---

## Video Ingestion

Offline tooling only — never in the request path.

```bash
pnpm seed:ingest   # sanity/seed/ingest-videos.mjs — per provider:
                   # 1. captions → chunks {startSeconds,text}
                   # 2. chapter markers → chapters {startSeconds,label}
                   # key id from videoUrl (strip datastore-illegal chars)
pnpm seed:import:videos
```

- Supported embeds (lesson `videoUrl`): **YouTube**, **Vimeo**, **Bunny** — each needs ingestion (captions→chunks + chapters) **and** playback/seek handling.
- Playback stays on-site via provider embed; search result links to `lessonPage?t=<seconds>` and the embed uses the provider's native start param.
- Keep whole transcripts out of any request-path query — fetch only filtered matches (few per video) to avoid context-window overflow.

---

## Search

Full results page (`/search`), not a widget or chatbox.

- UI: ranked cards, `Found N results across M courses`, sort control (default *Most Relevant*), paginated (`PAGE_SIZE=5` in `app/search/page.tsx`), empty state → catalog CTA.
- Two card types (per design):
  - **Video result** — course (name+icon), `Lesson X.Y in <Module>`, thumbnail, clip length, short description, `startSeconds`; CTA *Watch from mm:ss*.
  - **Lesson result** — course + label, key points, short description; CTA opens lesson.
- Query path (grounded, no invention):
  1. Chapters (`video.chapters`) first, then transcript (`video.chunks`) fallback.
  2. Lessons matched on `title` + `notes` plain-text projection.
  3. Merge + rank by specificity (exact title concept > broad keyword).
- GROQ text-match is token-based: wildcard keywords + `OR` multiple terms, never whole-phrase match; cannot match `PortableText` directly — match its plain-text projection.
- Config: `searchConfig` (scope filter + instructions as deltas) + inline system prompt — put critical ranking/rules in **both** (system prompt is followed more reliably). Context is cached on first request; restart dev server after prompt edits.

---

## Authentication

- **Clerk** via `proxy.ts` (`clerkMiddleware`). Keep browsing public; gate only marked routes in middleware, not client code.
- `CLERK_SECRET_KEY` server-only; only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` reaches the browser.
- Per-user state (progress: completed lessons + resume position) keyed by Clerk `userId`, written only through server routes with a write token, kept apart from read-only content.

---

## Design System

Reference at `/design-system` (source: `design/vertext-designsystem.png`). Reproduce exactly; adapt responsively (stack/collapse) while keeping desktop exact.

| Token | Value |
|---|---|
| Primary | `50 #FFF7ED` · `100 #FFEEE5` · `200 #FED7AA` · `300 #FDBA74` · `400 #FB923C` · `500 #F97316` · `600 #EA580C` |
| Neutral | `50 #FAFAFC` · `100 #F1F5F9` · `200 #E2E8F0` · `300 #CBD5E1` · `400 #94A3B8` · `500 #64748B` · `600 #475569` · `700 #334155` · `800 #1E293B` · `900 #0F172A` |
| Typography | Playfair Display (display) — `48/56 Bold` · `36/44 Bold`; Inter (UI) — `28/36 SB` · `22/30 SB` · `18/24 M` · `16/24` · `14/20` · `12/16` |
| Spacing | 4px base — `4, 8, 12, 16, 24, 32, 40, 48, 64` |
| Radius | `xs 4` · `sm 8` · `md 12` · `lg 16` · `xl 24` · `full` |
| Shadows | `sm 0 1px 2px` · `md 0 4px 12px -2` · `lg 0 12px 24px -4` · `xl 0 20px 40px -8` (all `rgba(15,23,42,…)`) |
| Icons | 24×24 grid, 2px stroke, rounded caps; outline + filled variants |
| Favicon | Vertex V (`#F5876A→#E85A34` linearGradient `id="vertex-mark-gradient"`, path `M2.5 3.5h6.4L12 10.6l3.1-7.1h6.4L12 21.5Z` on `24×24`) rendered as `32×32` SVG (`icon.svg`, `translate(4 4)`) + PNG + ICO + 180px Apple |

Components: `Logo`, `Icon`, `Button` (`primary|secondary|tertiary|text`, `md|lg`), `Input`/`Select` (`44px`, `12px` radius), `Badge` (`video|lesson|popular`), `Status` (`in-progress|completed|now-playing|locked`), `ProgressBar`, `CourseCard`/`VideoLessonCard`/`LessonCard`/`ResourceCard`, `Navbar`/`Breadcrumbs`/`Pagination`.

Reuse `components/ui/*` + Tailwind patterns before adding new primitives.

---

## Deployment

**Web (Vercel):**

1. Set env vars in Vercel (mirror `.env.example`; `*_TOKEN`/`*_SECRET` as sensitive).
2. `pnpm build` must pass (`next build` — Turbopack).
3. Domain + `NEXT_PUBLIC_*` are baked at build; server keys remain server-only.

**Studio / Sanity:**

```bash
pnpm dlx sanity@latest deploy          # Studio application deploy — required before Context MCP serves the dataset
pnpm dlx sanity@latest schema deploy   # schema only
pnpm dlx sanity@latest dataset import sanity/seed/seed.ndjson production --replace
```

> The Context MCP only serves a dataset that has a deployed **Studio application** — schema-only deploy is not enough.

---

## Security & Boundaries

- Private Sanity dataset — `SANITY_API_READ_TOKEN` server-only, `server-only` import in data layer.
- Clerk secret server-only; PostHog project key is public by design, private PostHog API key server-only.
- Any write token (progress) server-only, used only inside server routes.
- System prompt is a template literal — escape inner backticks or build fails.
- Never expose `OPENAI_API_KEY` or `SANITY_CONTEXT_MCP_URL` to client.

---

## Checks

```bash
pnpm lint          # eslint (Next + TS)
pnpm exec tsc --noEmit   # typecheck
pnpm build         # production build (required when routes/config/server code change)
pnpm dev           # manual verification: /, /courses, /courses/[slug], /courses/[slug]/[lessonSlug], /search?q=, /design-system, /studio
```

For Studio/search/ingestion work, verify against the **live MCP endpoint** and a real private dataset.

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `Missing environment variable: NEXT_PUBLIC_SANITY_DATASET` | `.env.local` not loaded — `cp .env.example .env.local` + set `NEXT_PUBLIC_SANITY_PROJECT_ID/DATASET` |
| Context MCP returns no data | Studio application not deployed — `sanity deploy` (not just `schema deploy`) |
| `text::semanticSimilarity()` → embeddings not enabled | Fallback to keyword wildcards; enabling embeddings is a plan/billing decision |
| Instruction edits have no effect | Context cached on first search request — restart dev server |
| Build fails on system prompt | Unescaped backtick in template literal |
| `chunks` overflow / LLM truncation | Fetch only filtered matches, few per video — never whole `chunks` array |
| `@sanity/context` plugin peer error | Plugin lags Studio major — do not install; edit Context doc via import / MCP |
| `/favicon.ico` shows old Next.js icon | Clear browser cache / hard reload; verify `app/favicon.ico` (1379 bytes), `app/icon.svg`, `app/icon.png` exist and `layout.tsx` `metadata.icons` is set |

---

## License

MIT — see `LICENSE` (add one if missing). Replace with your chosen license before public release.

---

Built per `AGENTS.md` — keep it small, keep boundaries clean, match the design exactly, and instrument what matters (catalog/lesson views, search, video play/watch-depth, lesson completed via PostHog).
