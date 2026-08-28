# Implementation prompt — Vertex search page (wired to Sanity) from design/vertex-search.png

Reference: `design/vertex-search.png` is source of truth per AGENTS.md §3 (reproduce layout, spacing, typography, color, states exactly); AGENTS.md §§3,5,7,8,11 (full results page, not widget/chat, two result kinds VIDEO + LESSON, chapter→transcript fallback, grounded, wildcard token, `pt::text(notes)`); `sanity-best-practices` + `next-sanity` + App Router docs.

## Goal

Replace the placeholder `app/search/page.tsx:1` hero (“Search your learning”) with the exact desktop reference (`design/vertex-search.png`) while keeping the existing server-side search wiring (`sanity/lib/search.ts:90` `performSearch`, `app/api/search/route.ts:1`, `sanity/lib/queries.ts:190` `SEARCH_COURSES_QUERY`/`SEARCH_VIDEOS_QUERY`) — so the page renders **real Sanity courses/lessons/videos** with the reference chrome, cards, badges, and deep-links to `?t=` on the lesson page.

## Skills / docs read

- `sanity-best-practices` — `defineType/defineField`, `defineQuery`, `pt::text`, private dataset `sanity/lib/client.ts:11` (`token: readToken`, `useCdn:false`), Studio standalone, no client token.
- `sanity-migration` — NDJSON import flow for `video` docs (reference, not needed here but confirms `video` docs exist post ingest).
- `node_modules/next/dist/docs` App Router — `app/search/page.tsx` Server Component consuming `searchParams: Promise<{q,sort}>`, client `SearchInput` that `router.push('/search?q=...')`, server-only `performSearch` never exposes token.
- Existing codebase: `app/search/page.tsx:15` (striped shell, header, footer bars, `SearchInput`/`SearchResults`), `components/search/search-input.tsx:1`, `components/search/search-results.tsx:1` (paginated VideoCard/LessonCard, but styling diverges), `components/ui/icon.tsx:1`, `components/ui/logo.tsx:1`, `app/globals.css:15` tokens, `sanity/lib/types.ts:134` `VideoDoc/SearchResult`, `components/lesson/video-player.tsx:37` provider `start` param.

## Code inspected

- `app/search/page.tsx:39` — outer `bg-[#fbf8f5] bg-[repeating-linear-gradient…]` + `max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]` shell is correct; header `h-24` with `Logo`, nav `Courses`/`My Learning`, `Show when="signed-out/in"` + `Icon bell` + `UserButton` matches reference.
- Current hero `px-6 lg:px-14` with `SearchInput` `h-20 rounded-2xl` placeholder “Ask anything…” does **not** match reference: reference pill `SEARCH RESULTS` + serif “Results for “data fetching”” with orange query + “Found 28 results across 8 courses” + compact input with magnifier left and `⌘ K` kbd right.
- Current results `SearchResults` paginated `V_PAGE_SIZE 6` with “Video moments / Lessons” headings + `CourseIcon` `span size-9`, `rounded-xl border-[#f3e8e1] bg-white`, `Watch from {s}s` — structure right but visual tokens (badge `VIDEO` peach `rounded-md`, `LESSON` lavender `rounded-md`, duration `bg-black/75` bottom-right, play overlay `bg-black/25` white circle, bullet list left pane `bg-[#fdf8f6]`/`bg-[#f8fafb]`, bottom “Can’t find…” beige banner `bg-[#fdf6f1]`) diverge from reference exact colors/spacing.
- `components/search/search-input.tsx:41` — `h-20 rounded-2xl border-[#f3eae5] bg-[#fdfcfb] shadow` + `⌘ K` `border-[#f1e8e0] bg-white` is close; needs sizing per reference (height `48px` not `80px`, `rounded-xl`, input `text-[0.9375rem]`, kbd `⌘ K` smaller, form submit vs icon-only).
- `sanity/lib/search.ts:90` — tokenizes `q` → `wildcardMatch` OR, scores title 30+ notes 10 + keyPoints 15 + exact phrase 100, two-stage video: chapters first (`+40` boost) else chunks (`+10`), caps 2 per lesson, merges lesson+video, `sort recent` no-op, cache `CACHE_TTL 60_000`. Shape `SearchResult { kind: video|lesson, lesson, course, moduleTitle, moduleIndex/lessonIndex, startSeconds?, chapterLabel?, clipLength?, description }` matches card needs.
- `sanity/lib/queries.ts:215` — `SEARCH_VIDEOS_QUERY` returns `chapters, chunkCount, sampleChunks[0..2]` (never whole transcript) — `performSearch` fetches videos via `client.fetch` so no transcript leak.
- `app/api/search/route.ts:6` validates `q` `min 2 max 100`, `sort relevance|recent`, returns `{query,count,courseCount,results}` with `Cache-Control private`.
- Design tokens: orange `#e54b21` / `#e66b50`, peach `VIDEO` bg `bg-[#fff0e8]` or `#fef2ec`, lavender `LESSON` `bg-[#eef0ff]` `#ede9fe`, card border `#f3e8e1`/`#f4ede8`, muted `#6b7280`/`#696973`, header border `#f2eae5`, shell `#fbf8f5`, striped peach `#f3e9e1`, input `#fdfcfb`.

## Files to touch

- `app/search/page.tsx` — **rewrite hero/results shell to reference**: add pill `SEARCH RESULTS` (`bg-[#fef2ec] text-[#e54b21] text-[0.625rem] tracking-widest font-semibold rounded-full px-3 py-1`), title `font-display text-[2rem] sm:text-[2.5rem] font-bold leading-tight` with query orange `text-[#e54b21]`, subtitle `Found {count} results across {courseCount} courses` gray, compact `SearchBar` (reuse/adapt `SearchInput`), below `div` with left `28 results` `text-sm font-medium` and right sort `select` `Most Relevant` (`rounded-xl border-[#ece8e5] bg-white px-4 h-9 text-sm` with `chevron-down`). Responsive: `px-6 lg:px-[3.5rem]` desktop, stack below `md`. Keep striped shell + header + footer bars + bottom banner.
- `components/search/search-input.tsx` — **resize to reference**: `h-12` not `h-20`, `rounded-xl` not `2xl`, `border border-[#ece8e6] bg-white`, magnifier `left-4 size-5 text-[#9ca3af]`, input `pl-11 pr-20 text-[0.9375rem] placeholder:text-[#9ca3af]`, right slot `absolute right-2` with `kbd ⌘ K` (`h-7 rounded-md border border-[#eee8e3] bg-[#fbf8f5] px-2 text-xs`) when empty else `Search` button hidden — reference shows only `⌘ K` when idle. Keep `⌘K` focus (`getElementById('vertex-search-input')`) + `useTransition router.push`.
- `components/search/search-results.tsx` — **restyle to pixel match**: 
  - Header row `28 results` / `Most Relevant` already moved to page; component now only renders card grid + bottom banner. Remove its own sort/pagination headings “Video moments / Lessons” (reference has interleaved mixed feed, not grouped sections). Reference feed is single vertical list interleaving VIDEO (with thumbnail + PLAY) and LESSON (with left bullet pane). Current implementation groups videos then lessons with pagination — change to **single ranked feed** in `performSearch` order, limited to first 28 (or paginate at end but not grouped). Each card `rounded-xl border border-[#f0e6e0] bg-white` `p-4` `flex gap-4` video vs `flex gap-4` lesson, but per reference: VIDEO: `w-64 h-36` thumbnail `rounded-lg bg-black`, `play` white circle `size-10` centered, duration bottom-right `bg-black/80 rounded-md px-1.5 py-1 text-[11px]`, right column `flex-1 py-1`: row1 `size-5 rounded-md` course icon + course name `text-xs text-[#6b7280]` + right badge `VIDEO bg-[#fff2eb] text-[#e54b21] text-[10px] tracking-wide font-semibold rounded-md px-2 py-1`, row2 title `font-semibold text-[15px] leading-5 text-black`, row3 desc `text-[13px] leading-5 text-[#6b7280] line-clamp-2`, row4 lesson label `file-text/folder icons gap-1.5 text-xs text-[#6b7280]` + CTA `Watch from 12:45` `text-xs font-semibold text-[#e54b21]` with `play-circle size-4` + `chevron-right size-3.5`. 
  - LESSON: `bg-white` same border, left vertical stack? Reference LESSON left has light `bg-[#fdfcfa]` thumbnail pane `w-64 h-36 rounded-lg border border-[#f5ece6]` with file icon + bullets `• Fetching strategies` `text-xs text-[#6b7280]` + check badge bottom-right `size-6 bg-[#f3ece7] rounded-full`. Right column same as video but badge `LESSON bg-[#eceeff] text-[#6d64d6]`, CTA `View lesson` + `external-link`. Keep `CourseIcon` helper but shrink to `size-6`/`size-5` with font `8px` to match reference.
  - Bottom banner: `rounded-xl bg-[#fef7f2] border border-[#fcefe6] p-4 flex items-center justify-between gap-4` with left `size-10 rounded-full bg-[#ffe9de] text-[#e54b21]` search icon + “Can’t find…” `font-semibold text-sm` + gray subtext, right button `Browse all courses` `bg-white border border-[#f2e2d9] text-[#e54b21] rounded-xl px-5 h-10 text-sm font-medium`.
  - Responsive: below `md` stack image top, text below, badge stays top-right; at `375` input full width, sort dropdown full width below count.
  - Wire exactly to `SearchResult` fields: `r.course.title/slug`, `moduleTitle`, `moduleIndex/lessonIndex` → `Lesson ${mi+1}.${li+1}`, thumbnail via `urlFor(r.lesson.thumbnail)`, `clipLength ?? lesson.duration` → duration `formatDuration`, `startSeconds` → `Watch from {mm:ss}` and href `/courses/${course.slug}/${lesson.slug}?t=${startSeconds}` (lesson card href without `?t=`). Grounded: never invent course/lesson/timestamp — use `performSearch` values only; video doc internal never shown standalone.
- `sanity/lib/search.ts` — **no logic change** unless sort UX needs `recent` stable secondary sort (keep no-op, grounded). Optionally add `MAX_RESULTS 28` cap to match reference count display, but keep returned `count` truthful. No token exposure.
- `app/page.tsx` + `components/search/home-search-input.tsx` — ensure hero search navigates to `/search?q=` (already does — verify not broken).
- `components/ui/icon.tsx:95` — add `chevron-down` already exists, ensure used for sort; add missing icons if card needs `external-link` (exists).
- Tailwind: reuse `app/globals.css:15` tokens + reference hexes inline (no new deps).

## Requirements (AGENTS §§5,7,11)

1. Full results page, not widget/chat: returns **all** relevant ranked best-first with count `Found 28 results across 8 courses` and sort `Most Relevant` default; uncapped visually but paginate if >28; empty state points to `/courses` via bottom banner + dedicated empty view.
2. Two kinds per §11 with fields exactly: video (`course name+icon`, `Lesson 5.1 in Data Fetching & Caching`, thumbnail, clip length, short description, `matched second` → `Watch from 12:45` links `/courses/{slug}/{lessonSlug}?t={s}`) and lesson (`course, module/lesson label, lesson keyPoints, short description` → `View lesson`). Video always tied to lesson via `videoUrl`.
3. Two-stage timestamps: `chapters[].label` first, `chunks[].text` fallback (already in `performSearch`); UI must show chapter label as description for video cards when hit.
4. Grounded: every card `_id` resolves to real Sanity `lesson`/`course`; no invented price/duration/timestamp.
5. Token wildcard OR, `pt::text(notes)` projection, `text::semanticSimilarity` fallback already handled; no client token, server-only fetch.
6. Playback on site via `components/lesson/video-player.tsx:37` provider embed (YouTube `&start=`, Vimeo `#t=`, Bunny `?start=`) — search deep-link already does `?t=`; do not send learner out to provider.
7. Responsive 1440→768→375: stack columns, header nav collapses, input full width, cards image-top on mobile.

## Decisions / assumptions

- Keep existing search scoring; only presentation changes — no new GROQ, no LLM path change.
- Feed order is `performSearch` ranking (video `+40` outranks lesson) — reference interleaves videos and lessons, not grouped; so render single array in rank order, not grouped sections with pagination per kind.
- Course icon derivation `CourseIcon` helper stays (N black, TS blue, Docker blue) sized `size-5` to match reference `12px` badge, not `size-9`.
- Thumbnail source `urlFor` with `width(480).height(270).fit('crop')` for retina; fallback solid `bg-neutral-900` with mark if missing.
- Duration formatting `formatDuration(totalSeconds)` → `12:45` for card badge (mm:ss) vs `15:18`; use `r.startSeconds ?? 0` for “Watch from”.
- Sort `Most Relevant` → `sort=relevance` (default), `Recent` → `sort=recent` (no-op server, keeps relevance per §12). Select controlled via `useSearchParams` + `router.push`.
- Input component keeps `⌘ K` focus and `router.push('/search?q=')` on submit/Enter; empty query stays on page with hint, `q.length<2` shows empty state, not error.
- No `@sanity/context` plugin install (lags Sanity major per §12).

## Security considerations

- `SANITY_API_READ_TOKEN` stays server-only (`sanity/lib/client.ts:11` + `sanity/lib/search.ts:1` `server-only`); no `NEXT_PUBLIC_` token, browser never calls MCP/LLM, never writes.
- `q` validated `z.string().min(2).max(100)` in `performSearch` + `app/api/search/route.ts:6`; GROQ params `$slug` parameterized, no interpolation; strip control chars via `trim().slice(0,100)`.
- `thumbnail` URL built via `urlFor` (allowlisted Sanity CDN), not user input; `videoUrl` → `?t=` allowlists YouTube/Vimeo/Bunny via `VideoPlayer` before embed, link uses slug + `startSeconds` int only.

## Acceptance criteria

- `GET /search?q=data%20fetching` renders: shell striped + header + pill `SEARCH RESULTS` + title `Results for “data fetching”` (query orange serif) + subtitle `Found {n} results across {m} courses` (n,m from `performSearch`) + input value `data fetching` + `⌘ K` + left `28 results` + right `Most Relevant` select + vertical feed of VIDEO cards (thumbnail with play overlay + duration, course icon/badge VIDEO peach, title, desc, `Lesson X.Y in Y` with file/folder icons, `Watch from mm:ss >`) and LESSON cards (left bullet pane with `• Fetching…` + right `LESSON` lavender badge + keyPoints bullets + `View lesson ↗ >`) interleaved in rank order, plus bottom beige banner with `Browse all courses →` linking `/courses`. Matches `design/vertex-search.png` at 1440 (pixel spacing, colors, type) and responsively stacks at 375.
- Cards link correctly: VIDEO `href="/courses/{courseSlug}/{lessonSlug}?t={startSeconds}"` seeks via `components/lesson/video-player.tsx:37` iframe `start=`; LESSON `href="/courses/{courseSlug}/{lessonSlug}"`.
- Empty `q=zzzz_nopeXyz` shows no-results view + bottom banner pointing to `/courses`.
- No token in view source/network (`sk…` not present); `pt::text(notes)` used in GROQ; chapter matches outrank transcript (video `Watch from` seconds from `chapters[].label` hit).
- `pnpm exec tsc --noEmit` `pnpm lint` `pnpm build` pass.

## Checks

1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm build`
4. Manual: `pnpm dev` → `/search?q=data%20fetching` compare to reference at 1440/768/375; click VIDEO → lesson page video `?t=` seeks; click LESSON → lesson page; test `sort=recent`, empty query, `⌘K` focus, `/api/search?q=data%20fetching` JSON `count/courseCount/results[]` grounded.

## Manual test steps

1. `pnpm dev` → open `/search?q=data%20fetching` → see pill, title with orange query, count header, input filled, sort default `Most Relevant`, feed has `28 results` count left and VIDEO/LESSON badge colors (peach/lavender) with correct icons/thumbnails/durations.
2. Click first VIDEO `Watch from 12:45 >` → lands `/courses/nextjs-app-router-in-depth/fetching-in-server-components?t=45` (or similar) and iframe src contains `&start=45` playing at second.
3. Click a LESSON `View lesson ↗` → opens lesson top, shows `keyPoints` bullets matching `lesson.keyPoints`.
4. Change sort to `Recent` → URL adds `&sort=recent`, order unchanged (grounded fallback).
5. `⌘K` focuses input; type `streaming` Enter → navigates to `/search?q=streaming`.
6. `q=zzzz_nope` → empty view with bottom banner `Browse all courses →` → click → `/courses`.
7. Inspect Network → `/api/search?q=...` server fetch only; View Source has no `SANITY_API_READ_TOKEN`.
