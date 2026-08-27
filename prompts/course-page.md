# Implementation prompt — Vertex course page (`/courses/[slug]`)

Reference: `design/vertex-course.png` (source of truth per AGENTS.md §3). Wired to seeded Sanity content (AGENTS.md §8).

## Goal

Implement the course detail page as a read-only server route at `app/courses/[slug]/page.tsx` matching the reference exactly on desktop and adapting responsively down to mobile. The page fetches a single course by slug from Sanity and renders hero, What you'll learn, Course Content accordion, and sticky progress bar.

## Skills / docs read

- `sanity-best-practices` — workspace schema, GROQ, TypeGen, `next-sanity` integration (not yet loaded, but patterns known).
- `node_modules/next/dist/docs/01-app/02-routing/01-pages-and-layouts.md` + `03-dynamic-routes` — App Router file conventions, `params` as Promise in Next 15+, `notFound()` handling.
- `node_modules/next/dist/docs/02-data-fetching/01-server-components.md` — server components fetch via server-only Sanity client.
- Existing codebase: `app/page.tsx`, `app/design-system/page.tsx`, `sanity/lib/*`, `components/ui/*`, `app/globals.css` — tokens, primitives, layout shell.

## Code inspected

- `sanity/schemaTypes/course.ts` — course has title, slug, summary/description, coverImage/image, level, price, popular, studentCount, learningOutcomes[{icon,title,description}], instructor ref, category ref, modules[module{title, summary, lessons[->lesson]}]. Module/lesson numbers derived from order.
- `sanity/schemaTypes/lesson.ts` — lesson has title, slug, duration (seconds), thumbnail, videoUrl, freePreview, studentCount, notes, keyPoints, proTip, resources.
- `sanity/schemaTypes/module.ts` — embedded object, not document.
- `sanity/lib/queries.ts` — `COURSE_BY_SLUG_QUERY` already projects all needed fields: title, slug, description/summary, level, price, popular, studentCount, learningOutcomes, coverImage, modules[] {lessons[]->{_id,title,slug,duration,thumbnail,freePreview}}, lessonCount, totalMinutes (actually seconds via math::sum duration). Needs alias totalSeconds added.
- `sanity/lib/client.ts` — server client with useCdn false, published. Dataset is private (checked live: unauthenticated fetch returns [] but authenticated via token returns 10 courses). Must add private read token support.
- `sanity/lib/types.ts` — hand-written types lag behind query (missing popular, level, learningOutcomes, coverImage, totalSeconds etc). Will extend.
- `sanity/lib/image.ts` — builder via `@sanity/image-url`, used for coverImage.
- `sanity/seed/content.mjs` — 10 courses, 4 modules ×3 lessons, deterministic ids, lesson slugs prefixed with course slug, popular flag, studentCount etc.
- `sanity/seed/videos.json` — resolved YouTube durations used as lesson.duration.
- `components/ui/icon.tsx` — 22 icons, 2px stroke outline, filled variants. Missing outcome icons (layers, workflow, gauge, rocket, etc) + bookmark, users needed for course meta.
- `components/ui/logo.tsx`, `nav.tsx`, `badge.tsx`, `progress-bar.tsx` — available primitives.
- `app/page.tsx` — establishes outer shell: `bg-[#fbf8f5] bg-[repeating-linear-gradient(45deg,...)]`, inner `max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]`, header h-24 border-b, hero/card styles, decorative footer bars.
- `app/globals.css` — tokens: primary 50-600, neutral 50-900, font-display Playfair, font-sans Inter, type scale, radius, shadows.
- Live Sanity check: projectId sokb60yi, dataset production, API version 2026-08-26, 10 courses present (verified via authenticated fetch with token from `sanity debug --secrets`). Example course `nextjs-app-router-in-depth`: 4 modules, 12 lessons, totalSeconds 7169 (~119m), popular true, level intermediate, studentCount 18240.

## Files to touch

- `sanity/env.ts` — export private `readToken` from `SANITY_API_READ_TOKEN` (server-only, no NEXT_PUBLIC_).
- `sanity/lib/client.ts` — add `token: readToken` when present; add `server-only` hint, keep useCdn false.
- `sanity/lib/queries.ts` — ensure COURSE_BY_SLUG_QUERY aliases `totalSeconds` correctly (currently totalMinutes but holds seconds); keep tight projection.
- `sanity/lib/types.ts` — extend `LessonStub` with duration/thumbnail/freePreview, `ModuleWithLessons` with `_key, summary, lessonCount`, `CourseDetail` with popular, level, description, coverImage, learningOutcomes, studentCount, lessonCount, totalSeconds.
- `components/ui/icon.tsx` — add icons: `layers`, `layers-3`, `database`, `gauge`, `cloud`, `rocket`, `workflow`, `sparkles`, `shield`, `puzzle`, `code`, `bookmark`, `users`, `book-mark` etc needed for outcome rendering and meta row. Add to STROKE (outline) set; no filled needed except bookmark maybe.
- `app/courses/[slug]/page.tsx` — new server page (default). Also `app/courses/[slug]/not-found.tsx` optional.
- `.env.local` — add `SANITY_API_READ_TOKEN` (from `sanity debug --secrets`) so local fetches work against private dataset. Keep `.env.example` updated.
- `next.config.ts` — add `images.remotePatterns` for Sanity CDN (`cdn.sanity.io`) and `picsum.photos`/`i.ytimg.com`/`randomuser.me` if using next/image; or keep `<img>` without optimization to avoid config.
- No changes to AGENTS.md, prompts, or schema.

## Requirements (from reference + AGENTS.md)

1. **Routing & data**:
   - Route `app/courses/[slug]/page.tsx` is a Server Component. `params.slug` looks up via `getCourseBySlug(slug)` (server client). Return `notFound()` if null. Export `generateStaticParams` from `getCourses()` slugs for build (optional but helps).
   - Metadata: `generateMetadata` sets title `${course.title} — Vertex`.
   - All data is server-fetched; no client token, no browser MCP/LLM call.

2. **Outer shell** (reuse home pattern):
   - Page wrapper `<div class="flex-1 bg-[#fbf8f5] bg-[repeating-linear-gradient(45deg,transparent 0px,transparent 8.2px,#f3e9e1_8.2px,#f3e9e1_9.2px)]">` + inner `mx-auto w-[94%] max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]` to match home.
   - Header: same as home — Logo, Courses, My Learning links, bell button + UserButton/avatar on right, h-24, border-b `#f2eae5`, px 6 lg:px-14. Navbar links reuse `Logo` component. Presentational (no auth gate).
   - Breadcrumb below header: `All Courses` (link to `/`) > `{course.title}` as current page, using `Breadcrumbs` or custom with chevron-right #cbd5e1. Text small neutral-500, current neutral-900. Padding px-6 lg:px-14 pt-6.
   - Decorative footer bars at very bottom (same as home: BAR_LEFT/RIGHT gradients, aria-hidden).

3. **Hero** (two-column desktop, stacked mobile):
   - Grid `grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-12` inside px-6 lg:px-14 py-8.
   - Left: cover image square `aspect-square rounded-2xl overflow-hidden bg-neutral-900 shadow-sm`. Use `urlFor(course.coverImage).width(680).height(680).url()` via `next/image` or `<img>`. Fallback solid with initial letter if missing. Alt from image.alt or title.
   - Right column:
     - POPULAR badge conditional `course.popular` — `inline-flex rounded-md bg-[#fef1ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e54b21]` (badge tone popular).
     - Title `h1 font-display text-[2rem] lg:text-[2.5rem] font-bold leading-tight text-black` — `{course.title}`.
     - Summary `<p class="mt-4 max-w-[560px] text-[1rem] leading-7 text-[#4b4f57]">` — `{course.description}`.
     - Meta row `mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-[#696973]` with 4 items: Intermediate (bar-chart), `18h 24m` (clock), `12 modules` (file-text), `2.1k students` (users). Compute duration via `formatDuration(totalSeconds)` → `Xh Ym` (if <60m → `45m`), modules = course.modules.length, lessons count available but meta shows modules per design, students formatted `formatCount(studentCount)`.
     - Actions `mt-7 flex flex-wrap gap-3`: Primary `Continue Learning` → link to first lesson ` /courses/[slug]/[firstLessonSlug]` or `?` — style `h-11 rounded-[10px] bg-[#e66b50] px-6 text-white font-medium inline-flex items-center gap-2 hover:bg-[#d95a3f] shadow`, with arrow-right icon. Secondary `Bookmark` — white bg, border border-[#e8ddd6], rounded-[10px], h-11 px-5, bookmark icon + text `text-sm font-medium text-[#1a1a1a]`.
   - Desktop matches screenshot spacing; mobile stacks image on top, content below.

4. **What you'll learn**:
   - Section inside px-6 lg:px-14 mt-8.
   - Card shell `rounded-xl border border-[#f3e8e1] bg-[#fdfcfa] px-7 py-7 shadow-sm` (or bg-[#fefcfb]).
   - Title `h2 font-display text-[1.25rem] font-semibold text-black` — "What you'll learn".
   - Grid `mt-5 grid grid-cols-1 md:grid-cols-2 gap-5`.
   - Each outcome card `rounded-lg border border-[#f3e8e1] bg-[#fefcfb] px-6 py-6 flex gap-4` — left icon `size-8 text-[#e66b50]` stroke 1.75, right content: title `font-semibold text-[0.9375rem] text-black`, desc `mt-1.5 text-[0.8125rem] leading-5 text-[#6b7280]`. Map `outcome.icon` to IconName via `iconMap` (layers→layers, workflow→workflow, gauge→gauge, rocket→rocket, sparkles→star, shield→shield etc) fallback to `book-open`. Must add missing icons to icon.tsx.

5. **Course Content**:
   - Section `px-6 lg:px-14 mt-8`.
   - Header row `flex items-center justify-between`: left `h2 font-display text-[1.25rem] font-semibold text-black`, right `text-small text-[#6b7280]` → `{modules.length} modules • {formatDuration(totalSeconds)}`. Separator bullet `•`.
   - List container `mt-4 rounded-xl border border-[#f3e8e1] bg-white overflow-hidden shadow-sm divide-y divide-[#f3e8e1]`.
   - Each module row `flex items-center gap-4 px-5 py-4 hover:bg-[#fdfcfa] transition-colors`. Left: number circle `size-8 rounded-full border border-[#f0e6df] bg-white flex items-center justify-center text-small font-medium text-[#1a1a1a]` — index+1. Center: title `text-[0.9375rem] font-medium text-black leading-5`, summary `text-[0.8125rem] text-[#6b7280] leading-4.5 line-clamp-1` (hide on mobile if needed). Right: duration `text-small text-[#6b7280] whitespace-nowrap` — sum of module lessons durations formatted `45m`/`1h 12m`, plus chevron-down icon `size-4 text-[#9ca3af]`.
   - Row is expandable (client component for accordion). Use a client `CourseModules` component with `useState` for expanded index and for showAll. Clicking row toggles expansion showing lesson list below: `ul` with lessons, each lesson row `flex items-center justify-between px-5 py-3 bg-[#fbf8f5] border-t border-[#f3e8e1]` showing lesson title, duration `formatDuration(lesson.duration)`, and `freePreview` badge if needed, chevron or play icon. Keep interaction accessible (button, aria-expanded).
   - Initial visible modules: first 6 as in screenshot; if modules.length >6, show "Show all {n} modules" button centered overlapping bottom edge: `relative -mb-4 flex justify-center` with button `rounded-lg border border-[#e8ddd6] bg-white px-5 py-2 text-small font-medium shadow-sm hover:bg-neutral-50` with chevron-down.

6. **Progress bar** (presentational, per AGENTS.md §7 — no backend, reads static 35%):
   - Section `mx-6 lg:mx-14 mt-10 rounded-xl border border-[#f3e8e1] bg-white px-6 py-4 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between`.
   - Left: label `text-small text-[#6b7280]` "Your Progress", value `text-small font-semibold text-black` "35% complete". Progress track `flex-1 mx-4 h-2 rounded-full bg-[#f3e8e1] overflow-hidden` fill `w-[35%] bg-[#e66b50] h-full rounded-full`.
   - Right: `Continue Learning` primary button same as hero.

7. **Styling fidelity**:
   - Reuse exact colors from home: stripes `#f3e9e1`, borders `#f3e8e1`/`#f4ede8`, text blacks/grays as above, primary `#e66b50` / `#e54b21`.
   - Typography: hero title Playfair (font-display), all else Inter (font-sans). Match screenshot font sizes/weights.
   - Radius: hero image 16px, cards 12-16px, buttons 10px per home.
   - Responsive down to 375px: hero stacks, What you'll learn 2→1 column at md, Course Content number+title remain, summary truncated on small.

## Decisions / assumptions

- Where reference conflicts with seed (e.g., "Next.js for Production" vs "Next.js App Router in Depth", 12 modules vs 4, 18h24m vs ~2h), seed wins — layout stays, data is live. Title/metadata reflect actual course; screenshot is illustrative.
- Course page is public (browsing public per AGENTS.md §7), no Clerk middleware gate. Reuses header from home (SignedIn/Out not required for this page).
- “Continue Learning” links to first lesson using the first module's first lesson slug (`/courses/${slug}/lessons/${lessonSlug}` or `/lesson/${lessonSlug}` depending on lesson route existence). If lesson route not yet built, link to `#` with same visual (keeps design).
- Bookmark, notifications bell, progress 35% are presentational only (no writes) per AGENTS.md.
- Images use `urlFor` builder; if next/image is used, add remotePatterns; otherwise plain `<img>` avoids optimization config.
- Icon additions are additive only; existing icon behavior unchanged.

## Security considerations

- Sanity read token (`SANITY_API_READ_TOKEN`) is server-only (no NEXT_PUBLIC_ prefix), used only in `sanity/lib/client.ts` which is imported by Server Components / server routes. Never exposed to client bundle (verified via `server-only` import or by not importing client in client components).
- Course page and data fetcher are server-only; browser holds no token, never calls Sanity directly.
- No user input rendered beyond slug param; slug is passed as GROQ param `$slug` (parameterized, not interpolated), preventing injection.
- Env example lists required keys without values; real token stays in `.env.local` / Vercel env, not committed.

## Acceptance criteria

- Visiting `/courses/nextjs-app-router-in-depth` (and any other seeded slug) renders the page matching `design/vertex-course.png` in layout, spacing, typography, color: breadcrumb, hero with cover, POPULAR badge when course.popular, meta row with correctly formatted duration/count/level/students, What you'll learn grid with 4 outcomes from Sanity, Course Content list with module count/duration and accordion behavior, progress bar, decorative footer.
- Data is live from Sanity: title, summary, cover image, level, studentCount, popular, learningOutcomes, modules+lessons, total duration derived via GROQ sum.
- 404 for unknown slug.
- Desktop (1440) matches reference; responsive 768/375 stacks correctly without overflow.
- `tsc --noEmit`, `eslint`, `next build` pass; no client bundle contains SANITY_API_READ_TOKEN.
- Existing `/` and `/design-system` unchanged.

## Checks

1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm build` (new dynamic route)
4. Manual: `pnpm dev` → open `/courses/nextjs-app-router-in-depth` → compare to `design/vertex-course.png` at 1440/768/375; toggle Course Content accordion and Show all modules; verify 404 at `/courses/does-not-exist`.

## Manual test steps

1. `pnpm dev` → open `http://localhost:3000/courses/nextjs-app-router-in-depth` → assert hero, badge, meta, What you'll learn cards, Course Content 4 modules with durations, progress bar all match screenshot (with live titles/durations).
2. Try other slugs: `/courses/building-ai-apps-with-llms`, `/courses/react-performance-engineering` — page adapts to that course's data.
3. Unknown slug `/courses/__nope` → 404 page.
4. Resize to 768 and 375 → hero stacked, grids collapse, no horizontal scroll.
5. `pnpm build && pnpm start` → navigate same URLs, check no token in page source / network client requests.
