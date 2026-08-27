# Implementation prompt — Vertex intelligent search

Reference: `design/vertex-search.png` (source of truth per AGENTS.md §3), AGENTS.md §§7,8,9,10,11,12 (search is Context MCP + LLM → result cards, video docs, chapters→transcript fallback, full results page with counts/sort, grounded, token wildcard, Portable Text projection).

## Goal

Connect the Sanity Context MCP, a server-side `/api/search` route, and a full `/search` results page that returns ranked Video moments + Lesson results over courses/lessons, using keyword GROQ (with LLM path gated behind env), grounded in real data, with deep-links to `?t=` video timestamps.

## Skills / docs read

- `sanity-best-practices` — schema, GROQ, TypeGen, next-sanity client.
- Existing `node_modules/next/dist/docs/01-app` — App Router routing, server/client boundaries, searchParams, route handlers.
- Current codebase: `sanity/schemaTypes/{course,lesson,module,category,instructor}`, `sanity/lib/{client,queries,data,types,image,env}`, `sanity/seed/content.mjs+videos.json+build-ndjson.mjs`, `app/{page.tsx,courses/*,courses/[slug]/*,globals.css,layout.tsx}`, `components/{ui/icon,lesson/video-player}`, `proxy.ts`.

## Code inspected

- `sanity/lib/client.ts:11` — server client with `token: readToken`, `useCdn:false`, private dataset.
- `sanity/lib/queries.ts:1` — `defineQuery` tight projections, `pt::text` not yet used, `COURSES_LIST_QUERY`, `COURSE_BY_SLUG_QUERY`, `LESSON_WITH_COURSE_QUERY`.
- `sanity/lib/data.ts:1` — `getCourses`, `getCourseBySlug`, `getLessonWithCourse` server helpers.
- `sanity/env.ts:15` — `readToken` server-only.
- `sanity/seed/videos.json` — 120 YouTube ids/durations, key `${courseSlug}-${lessonSlug}`.
- `sanity/schemaTypes/*` — course embedded modules, lesson with `videoUrl`, `notes` Portable Text, `keyPoints`, etc. No `video` doc yet.
- `app/page.tsx:246` + `app/courses/page.tsx:73` — search bar UI presentational (no navigation).
- `components/lesson/video-player.tsx:37` — provider embed with `startSeconds` → YouTube `&start=`, Vimeo `#t=`, Bunny `?start=` (used by search deep-links).
- `app/courses/[slug]/[lessonSlug]/page.tsx:114` — `?t|start|startSeconds` → `startSeconds` passed to VideoPlayer.

## Files to touch

- `sanity/schemaTypes/video.ts` — NEW document `video` per AGENTS.md §8/9: `url`, `videoId`, `chapters: {startSeconds,label}[]`, `chunks: {startSeconds,text}[]` (short timestamped pieces, whole transcript never returned). Id derived from video URL stripping illegal chars.
- `sanity/schemaTypes/searchConfig.ts` — NEW singleton `searchConfig` (agent context document) per §10: `contentScopeFilter` (string GROQ filter limiting to `course, lesson, category, instructor`), `instructions` (text, short deltas), holds critical query/ranking rules.
- `sanity/schemaTypes/index.ts` — register `video`, `searchConfig`.
- `sanity/structure.ts` — add Video / Search Config to Studio list.
- `sanity/lib/queries.ts` — add `SEARCH_LESSONS_QUERY` and `SEARCH_VIDEOS_QUERY` / combined, with `pt::text(notes)` projection and `match` wildcard OR `chapters[].label match` / `chunks[].text match`; also add `LESSON_COURSE_LOOKUP_QUERY` helpers + exports for types. Keep `defineQuery`.
- `sanity/lib/types.ts` — add `VideoDoc`, `SearchConfig`, `SearchResult`, `VideoResult`, `LessonResult` types.
- `sanity/lib/search.ts` — NEW server-only helper `performSearch(q, options)` that (a) tries Context MCP + LLM if `SANITY_CONTEXT_MCP_URL` + `OPENAI_API_KEY` present (system prompt + schema injection, Zod validated structured output, streaming), else falls back to keyword GROQ scoring: tokenize `q` → wildcard `*tok*` OR, `pt::text(notes) match`, `title match`, `keyPoints match` for lesson results; `chapters` first then `chunks` for video moments, rank title exact > chapter label > transcript, merge and score, ground never invent, fetch parent course/module/label via reverse reference + modules order, produce `found X results across Y courses`. Cache initial context per §12 (module-level cache). Zod validation for input/output.
- `app/api/search/route.ts` — NEW Route Handler GET `/api/search?q=&sort=relevance|recent&limit=`; validates via Zod, calls `performSearch`, returns JSON `{query, count, courseCount, results: (VideoResult|LessonResult)[]}`; server-only token, never exposes readToken; handles `text::semanticSimilarity` fallback to wildcard per §12.
- `app/search/page.tsx` — NEW full results page (Server Component reading `searchParams.q`); renders Vertex shell (striped bg, max-w-360 border-x, header same as home/course), top search bar (client SearchInput that pushes `router.push('/search?q=...')` + `⌘K` chip), result count header `found 28 results across 8 courses` + sort control (client Select default most relevant), two result kinds per §11: Video card (course icon, module/lesson label `Lesson 5.1 in Data Fetching and Caching`, thumbnail, clip length, description, matched second → link `/courses/{slug}/{lessonSlug}?t={startSeconds}` watches from second) and Lesson card (same label + keyPoints + description → link `/courses/{slug}/{lessonSlug}`). Empty state points to `/courses`. Responsive 1440→375 stacks.
- `components/search/search-input.tsx` — NEW client input that syncs `q` to URL, debounced? Immediate on submit/enter, focuses with `⌘K`.
- `components/search/search-results.tsx` — NEW client/server presentational for result cards, sort, count (reuse `CourseTile` logic for icon).
- `sanity/seed/ingest-videos.mjs` — NEW offline tooling (§9) that builds `sanity/seed/videos.ndjson` → video documents from `videos.json` + `content.mjs` (chapters from lesson keyPoints + transcript chunks stub), writes NDJSON for `sanity dataset import`. Never runs in request path. Also `.env.example` update.
- `.env.example` — add `SANITY_API_READ_TOKEN`, `SANITY_CONTEXT_MCP_URL` (optional), `OPENAI_API_KEY` (optional, server-only), `SANITY_API_WRITE_TOKEN` note if present.
- `package.json` — add `zod` (already transitive but explicit) + `server-only` hint, no new runtime client deps (keep `react-markdown` only for search reply if LLM path used — defer).
- `app/page.tsx` + `app/courses/page.tsx` — wire presentational search bars to `/search` (form GET or router push) so hero search actually navigates.

## Requirements (AGENTS §§7,11)

1. **Data model**: `video` doc one per unique `videoUrl` (`_id = video.<sanitizedId>`), `url`, `chapters[]`, `chunks[]` (never whole transcript field). Lessons link via `videoUrl` string match. Considered internal lookup, not shown as standalone results.
2. **Timestamps two-stage**: match `chapters[].label` first; only if no chapter hit, match `chunks[].text`. Video result always tied to lesson that uses that video.
3. **Search page**: full results page, not widget/chatbox; returns all relevant ranked best-first, with count `found 28 results across 8 courses` and sort control default most relevant; uncapped (not 5). Two kinds with fields per §11 exactly; actions link to lesson page with `?t=` start param, embed seeks via provider param. Never invent course/lesson/price/duration/timestamp; fetch only filtered matches, few per video (§12).
4. **GROQ / LLM**: token-based wildcard OR (`*word*`), never phrase `match "a b"`; `pt::text(notes)` for Portable Text; `text::semanticSimilarity()` fallback to wildcard when embeddings off. System prompt + Context doc both hold critical ranking rules (title exact > broad) per §12; cache initial context; restart needed for prompt changes. Inline prompt escapes backticks.
5. **Boundaries**: browser holds no token, never calls MCP/LLM, never writes; all search via `/api/search` server route with server token; dataset private; Clerk/PostHog keys kept server/client split already.

## Decisions / assumptions

- Video doc id sanitzer: `videoUrl` → replace `[^a-zA-Z0-9_-]` with `-`, strip `https://` prefix, truncate 128.
- Generated chapters/chunks in seed are stub-derived from lesson `keyPoints`/`summary` (real transcript fetch out of scope for this step; shape still correct and search stays grounded because every video result maps to a real lesson that exists in that course).
- LLM integration is gated: if `OPENAI_API_KEY` + `SANITY_CONTEXT_MCP_URL` set, route tries MCP `tools/call` with schema+system prompt and Zod-parsed streaming; otherwise fully keyword fallback so search works without keys (matches §12 semantic off case).
- No `@sanity/context` Studio plugin install (may lag Sanity major) — `searchConfig` edited via Vision/import, fulfills §12/10 via import.
- Search input `⌘K` focuses bar; Enter or submit navigates; home bar not debounced to avoid request-path work.
- Sort `most relevant` uses computed score; optional `recent` sorts by `_createdAt` (if present) fallback to relevance.

## Security considerations

- `SANITY_API_READ_TOKEN` (+ optional `SANITY_API_WRITE_TOKEN` for future progress) server-only, only in `sanity/lib/client.ts` / `sanity/lib/search.ts` server imports (`server-only`). Never `NEXT_PUBLIC_`. Client never imports `client`.
- GROQ params `$q`, `$tokens` parameterized, not interpolated.
- `q` validated `z.string().min(2).max(100)` via Zod; truncate, strip control chars, limit tokens 8.
- Video embed id extraction allow-lists YouTube/Vimeo/Bunny only before building `?t=` link.

## Acceptance criteria

- `/search?q=react` renders shell + search bar + count + sort (most relevant default) + all ranked Video+Lesson cards (course name/icon, `Lesson X.Y in <Module>`, thumbnail, clip length/description/seconds or keyPoints) linking to `/courses/{courseSlug}/{lessonSlug}?t={s}` (video) or `.../{lessonSlug}` (lesson); clicking plays on lesson page at that second via existing VideoPlayer.
- `/search?q=__nopeXyz` shows empty state pointing to `/courses`.
- Search is token wildcard OR and uses `pt::text(notes)` projection; chapter matches outrank transcript; title exact outranks broad.
- Grounding: every result `_id` resolves to a real Sanity lesson/course already seeded; no invented counts/timestamps (spot-check ids).
- No client request contains `SANITY_API_READ_TOKEN` (view source / network).
- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` pass; private dataset still returns results when authenticated.

## Checks

1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm build`
4. Manual hit `/api/search?q=next.js` → JSON with `count`, `courseCount`, `results[]` Video+Lesson; then dev server `/search?q=next.js` compare to `design/vertex-search.png` at 1440/768/375; test `?t=` deep-link seek; test empty query.

## Manual test steps

1. `pnpm dev` → open `/search?q=caching` → see count header, sort Most relevant, Video cards with `Lesson 3.2 in Data Fetching…` + thumbnail + `Watch from 42s` → click → lesson page video `?t=42` seeks (iframe src has `start=42`).
2. Same page → Lesson cards show `In this lesson you will` bullets from `keyPoints` + link opens lesson top.
3. Toggle sort to Recent → order changes (if implemented) otherwise stays.
4. `q=zzzz_nope` → empty state with link to All Courses.
5. Home `Ask anything` bar → type `streaming` Enter → navigates to `/search?q=streaming`.
6. Inspect Network → `/api/search?q=...` is server fetch only; page source has no `skZWon` token.
