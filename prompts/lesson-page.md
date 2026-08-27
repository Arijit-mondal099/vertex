# Implementation prompt — Vertex lesson page (`/courses/[slug]/[lessonSlug]`)

Reference: `design/vertext-lesson.png` (source of truth per AGENTS.md §3). Wired to seeded Sanity content (AGENTS.md §8) with video playing on-page via provider embed (AGENTS.md §7, §9).

## Goal

Implement the lesson page as a read-only server route that matches the reference exactly on desktop and adapts responsively down to mobile (no mobile reference — stack sidebar, collapse columns). The page fetches a lesson by slug from Sanity, resolves its parent course + sibling modules/lessons, and renders: top nav, left curriculum sidebar, right content (breadcrumb, lesson header, meta, provider video embed with `?t=` seek support, Lesson Content / Notes tabs, Overview, "In this lesson you will" checklist, Pro Tip, Resources, prev/next navigation). Video plays on-site via YouTube/Vimeo/Bunny embed using the provider's start param.

## Skills / docs read

- `sanity-best-practices` — schema, GROQ tight projections, `next-sanity` server client, TypeGen, Portable Text (`@portabletext/react`).
- `node_modules/next/dist/docs/01-app/02-routing/*` — App Router file conventions, nested dynamic routes `[slug]/[lessonSlug]`, `params` as Promise in Next 16, `notFound()` handling, `generateStaticParams` for course+lesson combos.
- `node_modules/next/dist/docs/02-data-fetching/*` — Server Components fetch via server-only Sanity client; client components for tabs/accordion/video seek.
- Existing codebase: `sanity/schemaTypes/*`, `sanity/lib/{client,queries,data,types,image}`, `sanity/seed/{content.mjs,build-ndjson.mjs,videos.json}`, `components/ui/*`, `components/course-modules.tsx`, `app/courses/[slug]/page.tsx`, `app/page.tsx`, `app/globals.css`, `proxy.ts`/`middleware`.

## Code inspected

- `sanity/schemaTypes/lesson.ts` — title, slug, duration (seconds), videoUrl, thumbnail, freePreview, studentCount, notes (Portable Text), keyPoints (string[], max 6), proTip (max 280), resources[{type,title,description,url}]. No parent course field — derive via reverse reference.
- `sanity/schemaTypes/course.ts` — title, slug, popular, level, price, studentCount, summary/description, coverImage, instructor ref, category ref, learningOutcomes, modules[module{title,summary,lessons[->lesson]}] — order defines numbers.
- `sanity/schemaTypes/module.ts` — embedded object, lessons are references.
- `sanity/seed/content.mjs` — 10 courses, 4 modules ×3 lessons = 12 lessons per course, lesson ids `lesson.<courseSlug>-<lessonSlug>`, actual slug is `${courseSlug}-${lessonSlug}` (globally unique), video ids in `videos.json` mostly YouTube (`https://www.youtube.com/watch?v=<id>`), durations resolved from `videos.json`, one freePreview per course (first lesson), notes assembled as Portable Text (intro paragraph + h2 + bullet keyPoints + outro), resources = course docs link + optional extra, studentCount decays through curriculum.
- `sanity/lib/queries.ts` — `LESSON_BY_SLUG_QUERY` currently projects `_id,title,slug,duration,videoUrl,thumbnail,freePreview,studentCount,notes,content,keyPoints,proTip,resources,course: *[_type=="course"&&references(^._id)][0]{_id,title,slug}` — needs extension to pull full course modules/lessons for sidebar+prev/next, plus course level; `COURSE_BY_SLUG_QUERY` already projects modules lessons stubs. Need new query: `LESSON_WITH_COURSE_QUERY` that returns lesson + course with expanded modules/lessons in one fetch, or two fetches (lesson then course). Prefer single GROQ with coalesced references to avoid double round-trip. Also need `ALL_LESSON_SLUGS_QUERY` for generateStaticParams.
- `sanity/lib/client.ts` — server-only read client (`useCdn:false`, `perspective:'published'`, `token: readToken` from `SANITY_API_READ_TOKEN`). Private dataset confirmed live (unauthenticated returns [], authenticated returns 10 courses).
- `sanity/lib/data.ts` — `getLessonBySlug`, `getCourses`, `getCourseBySlug`; will add `getLessonWithCourse(courseSlug, lessonSlug)` + `getAllLessonParams()` helpers.
- `sanity/lib/types.ts` — hand-written types lagging; LessonDetail currently `{_id,title,slug,duration,videoUrl,content,course:{title,slug}}` — needs thumbnail, freePreview, studentCount, notes, keyPoints, proTip, resources, course modules + lessonCount. Will extend.
- `sanity/lib/image.ts` — `urlFor` builder for thumbnails.
- `sanity/env.ts` — `readToken` already from `SANITY_API_READ_TOKEN` server-only.
- `app/courses/[slug]/page.tsx` — establishes outer shell pattern: `flex-1 bg-[#fbf8f5] bg-[repeating-linear-gradient...]` + inner `mx-auto w-[94%] max-w-360 border-x ...`, header h-24 border-b, breadcrumb, hero, grid patterns, BAR_LEFT/RIGHT footer bars, `formatDuration`/`formatCount` helpers, icon mapping. Will reuse shell, header, helpers verbatim.
- `components/course-modules.tsx` — accordion client component pattern (`useState` expanded, showAll) — informs sidebar behavior.
- `components/ui/icon.tsx` — 24 icons present; missing for lesson page: `lightbulb` (Pro Tip), `external-link` maybe needed for resources, `play`/`play-circle` already present, `check-circle` present, `bookmark` present. Add `lightbulb`, `clipboard`, `link` if needed; reuse existing `check-circle` for checklist, `bookmark` for header, `bar-chart/clock/users/file-text` for meta, `chevron-*` for sidebar, `arrow-left/arrow-right` for prev/next.
- `app/globals.css` — tokens: primary orange, neutrals, font-display Playfair, font-sans Inter, type scale, radius, shadows.
- Live check needed: verify YouTube embeds allow `?start=` param and thumbnail building.

## Files to touch

- `sanity/lib/queries.ts` — add `LESSON_WITH_COURSE_QUERY` (or extend `LESSON_BY_SLUG_QUERY`) to return lesson + parent course with `modules[]{_key,title,summary,lessons[]->{_id,title,slug,duration,thumbnail,freePreview}}`, course level, popular, studentCount, totalSeconds via `math::sum`. Also add `ALL_LESSON_PARAMS_QUERY` for `generateStaticParams`. Keep projections tight; do NOT return whole transcript chunks (no video doc yet — AGENTS.md §8/12).
- `sanity/lib/types.ts` — extend `LessonDetail` with new fields: `thumbnail`, `freePreview`, `studentCount`, `notes`/`content` (PortableTextBlock[]), `keyPoints`, `proTip`, `resources`, `course` with `level`, `modules` etc; add `LessonWithCourse` composite type, `Resource` type. Extend `ModuleWithLessons` durations already covered.
- `sanity/lib/data.ts` — add `getLessonWithCourse(lessonSlug): Promise<LessonWithCourse | null>` (or `(courseSlug, lessonSlug)` if validating course param) and helper for `generateStaticParams` fetching all lesson slugs + parents; import new queries.
- `components/ui/icon.tsx` — add missing icons needed by design: `lightbulb` (Pro Tip), `arrow-left` (prev), ensure `chevron-up/down`, `bookmark`, `check-circle`, `clock`, `bar-chart`, `users`, `file-text` already present; add fill/outline as needed. Additive only.
- `app/courses/[slug]/[lessonSlug]/page.tsx` — NEW server page (default). Handles `params: Promise<{slug:string, lessonSlug:string}>`, fetches via `getLessonWithCourse`, calls `notFound()` if null or slug mismatch, derives module/lesson numbers from course.modules order, prev/next, renders full layout (see Requirements). Includes `generateStaticParams` (all course/lesson pairs) and `generateMetadata` (`title: "${lesson.title} — ${course.title} — Vertex"`).
- `components/lesson/lesson-sidebar.tsx` — NEW client component for curriculum sidebar (expandable modules, active lesson highlight, "Now playing", checkmarks — presentational 35% static or derived). Could be inline in page but since page is server, sidebar client island for accordion.
- `components/lesson/video-player.tsx` — NEW client component for provider embed (YouTube/Vimeo/Bunny). Props: `videoUrl`, `startSeconds?` (from `?t=` searchParam), `poster?`. Detects provider from URL, builds embed `src` with start param (`youtube: https://www.youtube.com/embed/<id>?start=<s>&rel=0`, `vimeo: https://player.vimeo.com/video/<id>#t=<s>s`, `bunny: iframe src with ?start=`). Uses native iframe provider player — no custom player (AGENTS.md §7). Reads `t`/`start`/`startSeconds` from Next `searchParams`. Responsive `aspect-video rounded-xl overflow-hidden bg-black shadow-sm`.
- `components/lesson/lesson-tabs.tsx` — NEW client component for `Lesson Content` / `Notes` tab switch (presentational; Notes tab is static per AGENTS.md §7, shows Portable Text notes or empty state, `Lesson Content` shows Overview + keyPoints + proTip + resources).
- `app/courses/[slug]/page.tsx` — minor edit: change lesson links from `href="#"` to actual `href={`/courses/${course.slug}/${lesson.slug}`}` once route exists, so navigation works (or keep helper inside CourseModules). If we do that, `CourseModules` needs to accept `courseSlug` prop.
- `components/course-modules.tsx` — if used on course page, add `courseSlug` prop for proper linking (backward compatible).
- `.env.example` — ensure lists `SANITY_API_READ_TOKEN` etc already (no secret values).
- `next.config.ts` — no image remotePatterns needed if using `<img>` + `urlFor`; if using `next/image` for thumbnails, add `cdn.sanity.io`, `picsum.photos`, `i.ytimg.com`, `randomuser.me`. Keep simple — likely `<img>` as existing pages do.
- No changes to `AGENTS.md`, schema (lesson/course), `sanity/env.ts`, `sanity/lib/client.ts` (already has token), or auth middleware.

## Requirements (from reference + AGENTS.md)

1. **Routing & data**:
   - Route `app/courses/[slug]/[lessonSlug]/page.tsx` is a Server Component. Params are `slug` (course) and `lessonSlug` (lesson's slug.current which is actually `${courseSlug}-${bareSlug}`). Lookup via `client.fetch` with parametrized `$lessonSlug` (and optionally validate course via reverse reference). Return `notFound()` if lesson null or course mismatch. Export `generateStaticParams` enumerating all `{slug, lessonSlug}` pairs from `*[_type=="course"]{slug, modules[].lessons[]->slug}` (or dedicated query) for build.
   - Metadata: `generateMetadata` → `${lesson.title} — ${course.title} — Vertex`; description from lesson keyPoints or course summary.
   - All fetches server-side; no client token, no browser MCP/LLM; `searchParams` for `t` is read server-side and passed to VideoPlayer.

2. **Outer shell** — reuse course/home pattern:
   - Wrapper `flex-1 bg-[#fbf8f5] bg-[repeating-linear-gradient(45deg,transparent 0px,transparent 8.2px,#f3e9e1_8.2px,#f3e9e1_9.2px)]` + inner `mx-auto w-[94%] max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]`.
   - Header identical to home/course: h-24, border-b `#f2eae5`, px-6 lg:px-14, Logo left, Courses + My Learning links center, bell + UserButton/avatar right (Clerk Show signed-in/out as in existing pages). Browsing public (no middleware gate) per AGENTS.md §7.
   - No decorative footer bars on lesson page per design (page ends at prev/next bar); keep outer bg stripes full height.

3. **Two-column layout**:
   - Desktop: `grid grid-cols-1 lg:grid-cols-[280px_1fr]` or `[300px_1fr]` inside inner shell with `border-y` hairline between header and content, `divide-x divide-[#f3e8e1]` vertical divider as in reference (subtle). Left sidebar fixed width 280px, right content flex-1 with `px-8 lg:px-8 py-6` . Mobile: stack — sidebar collapses into horizontal scroll or disclosure (adapt sensibly; keep curriculum accessible, no overflow). Sidebar has `overflow-y-auto` on desktop if needed.

4. **Left sidebar — curriculum (presentational progress per AGENTS.md §7)**:
   - Top: `Back to course` link `← Back to course` text `[#e54b21]` size 0.8125rem, `href={`/courses/${course.slug}`}`.
   - Course header card: black tile with initial "N" (reuse CourseTile logic or square `bg-neutral-900 rounded-lg size-9` with letter), course title `Next.js for Production` → actual `course.title`, subtext `35% complete` + thin progress track `h-1 bg-[#f3e8e1] rounded-full` fill `w-[35%] bg-[#e66b50]` (static 35% per AGENTS.md — no real progress calc yet). Border-b `border-[#f3e8e1]`.
   - Module list header: `Module 5 of 12` → derived `Module ${activeModuleIndex+1} of ${course.modules.length}` with chevron-down toggle. Modules are accordion: collapsed shows title + duration + chevron, expanded shows lessons.
   - Lesson rows: numbered circles for modules (`1..n` — orange filled `bg-[#c85a32] text-white` for active module vs `border border-[#f0e6df] bg-white` for inactive), check-circle `text-[#e66b50]` for completed (presentational: first N lessons checked). Active lesson row has `bg-[#fdf6f1]` with `Now playing` subtext orange + play-circle fill. Duration per lesson formatted via `formatDuration(duration)` → `1h 28m` etc (use same helper). Free preview badge hidden here.
   - Interaction: sidebar is a Client Component with `useState` expanded module (default = active module). Module header button toggles; chevron rotates. Accessible `aria-expanded`.

5. **Right main — breadcrumb + header**:
   - Breadcrumb `All Courses > {course.title} > {activeModule.title} > {lesson.title}` with chevron-right icons `text-neutral-300`, text `text-small` current `text-neutral-900` rest `text-[#6b7280]` hover orange. Each segment links to `/courses` or `/courses/[slug]` or `#` for module.
   - Badge `LESSON 5.1` → derived `${activeModuleIndex+1}.${activeLessonIndex+1}` with `inline-flex rounded-md bg-[#fef1ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e54b21]`.
   - Title row: `h1 font-display text-[1.75rem] lg:text-[2rem] font-bold leading-tight text-black` — `lesson.title`, right-aligned bookmark button `size-8 rounded-md border border-[#f0e6df] bg-white flex items-center justify-center text-[#9a8a84] hover:bg-[#fdfcfa]`.
   - Description `p mt-3 max-w-[640px] text-[0.9375rem] leading-6 text-[#6b7280]` — first block of `lesson.notes` or lesson.summary + outro (from Portable Text plain text fall back to course summary if empty).
   - Meta row `mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-[#696973]` — duration `clock` `1h 28m`, level `bar-chart` `Intermediate` (from `course.level` capitalized), students `users` `3,426 students` (from `lesson.studentCount ?? course.studentCount`, formatted `formatCount`). Use same `formatDuration`.

6. **Video player** (AGENTS.md §7, §9):
   - Container `mt-6 aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm` with iframe inside `size-full`.
   - Provider detection from `videoUrl`: YouTube (`youtube.com/watch?v=` or `youtu.be/`) → extract `id`, build `https://www.youtube.com/embed/${id}?start=${startSeconds}&rel=0&modestbranding=1` (or `&autoplay=1` not needed). Vimeo (`vimeo.com/`) → `https://player.vimeo.com/video/${id}#t=${startSeconds}s`. Bunny (`mediadelivery.net` or `iframe.mediadelivery.net`) → keep url + `?start=${startSeconds}` as documented. Unknown provider → fallback `<video>` or plain iframe src with `videoUrl`.
   - Start seconds: read `searchParams.t` or `searchParams.start` or `searchParams.startSeconds` (string → `parseInt`). Clamp `>=0`. Passed to VideoPlayer client component which builds final src. Selecting a search result links to `?t=<seconds>` per AGENTS.md §7; lesson page respects it.
   - Keep playback on site — never link out to provider; embed only. Aspect maintains 16:9.
   - Thumbnail placeholder before load optional; use `lesson.thumbnail` via `urlFor`.

7. **Tabs + content** (presentational Notes per AGENTS.md §7):
   - Tab bar `mt-6 flex gap-6 border-b border-[#f3e8e1]` with two buttons: `Lesson Content` (default active, `text-[#c85a32] border-b-2 border-[#c85a32] font-medium`) and `Notes` (`text-[#6b7280]`). Client state `useState<'content'|'notes'>`. Active underlines exactly as reference (h-px bar at -1px).
   - Lesson Content panel:
     - `Overview` h3 `font-display text-[1rem] font-semibold text-black`, paragraph `mt-2 text-[0.9375rem] leading-6 text-[#4b4f57]` — Portable Text intro paragraph or `lesson.notes[0]` plain text.
     - Divider `border-t border-[#f3e8e1] mt-6 pt-6`.
     - `In this lesson you will:` label `text-[0.875rem] font-medium text-black`, checklist `mt-3 space-y-2.5` each row `flex gap-2.5 text-[0.875rem] leading-5 text-[#4b4f57]` with orange check-circle `size-[18px] text-[#e66b50] shrink-0` + text from `lesson.keyPoints` (max 6).
     - Pro Tip box `mt-6 rounded-lg border border-[#f9e8e0] bg-[#fdf6f1] px-4 py-4 flex gap-3` — icon `lightbulb size-6 text-[#e66b50]`, label `Pro Tip` `text-[0.875rem] font-semibold text-black`, description `mt-1 text-[0.8125rem] leading-5 text-[#6b7280]` — `lesson.proTip` if present else generic tip. Hide box if no proTip? Design shows it — keep conditional: show only when `lesson.proTip` exists (per schema optional); many seeded lessons have one.
     - Divider `border-t border-[#f3e8e1] mt-6 pt-6`.
     - Resources h3 `Resources`, grid `mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3` — each card `rounded-lg border border-[#f3e8e1] bg-[#fdfcfa] p-4` with icon `file-text size-7 rounded-md bg-[#fef1ea] flex items-center justify-center text-[#e66b50]` or type-specific, title `text-[0.8125rem] font-semibold text-black`, description `text-[0.75rem] leading-4 text-[#6b7280] mt-1`, external-link chevron. Uses `lesson.resources` (always at least docs link).
   - Notes panel: placeholder `Notes for this lesson` + Portable Text `lesson.notes` rendered via `PortableText` (or plain paragraphs) inside `prose` styling — kept simple, since Notes tab is presentational only. If notes empty show "No notes yet."

8. **Prev/Next bar**:
   - Full-width bar at bottom of main column: `flex items-center justify-between gap-4 border-t border-[#f3e8e1] bg-[#fdfcfa] px-6 py-4` (or `bg-[#fbf8f5]` per design, but reference shows very light). Left: `Previous Lesson` outline button `rounded-lg border border-[#e8ddd6] bg-white px-5 py-2.5 text-[0.875rem] font-medium text-[#1a1a1a] inline-flex items-center gap-2` with arrow-left, plus context `Server Components • 1h 42m` small text. Right: `Next Lesson` primary `bg-[#e66b50] text-white rounded-lg px-6 py-2.5 inline-flex items-center gap-2 hover:bg-[#d95a3f]` with arrow-right, plus context. Compute prev/next by flattening `course.modules.flatMap(m=>m.lessons)` and finding current index; if at bounds, button disabled (`opacity-40 pointer-events-none`). Links are `href={`/courses/${course.slug}/${prev.slug}`}` etc.

9. **Styling fidelity**:
   - Colors exact from course/home: stripes `#f3e9e1/#fbf8f5`, borders `#f3e8e1/#f4ede8`, text `#1a1a1a/#4b4f57/#6b7280/#696973`, primary `#e66b50/#c85a32/#e54b21`, surfaces `#fdfcfa/#fefcfb/#fdf6f1`. No new palette.
   - Typography: titles Playfair (font-display), all else Inter, sizes as listed. Spacing matches screenshot (breadcrumbs pt-6, badge mt-2, title mt-2, meta mt-4, video mt-6, tabs mt-6, content mt-6).
   - Radius: video 12px, cards 8-12px, buttons 10px (prev/next), sidebar lesson active bg 0. Responsive 1440→768→375 stacks without overflow, sidebar collapses to top drawer or horizontal.

## Decisions / assumptions

- Lesson route is nested under course: `app/courses/[slug]/[lessonSlug]/page.tsx` (keeping course context in URL, bookmark-friendly, and avoids top-level lesson slug collision confusion). Alternative `/lessons/[slug]` would lose course context for breadcrumb/sidebar derivation — rejected. Existing lesson slugs are already `${courseSlug}-${bareSlug}`, so URL is ` /courses/nextjs-app-router-in-depth/nextjs-app-router-in-depth-file-system-routing` (verbose but correct and idempotent with seed). A cleaner alias `/courses/[slug]/lessons/[lessonSlug]` was considered but extra segment adds nesting with no benefit; choose single param after course.
- Sidebar progress 35% / checkmarks are presentational static (no Clerk progress fetch yet). Future progress integration will replace static marks with real per-user state keyed by Clerk id via server route (AGENTS.md §7).
- Notes tab is presentational only — shows Portable Text notes, no editor/backend (AGENTS.md §7). My Learning / notifications bell also presentational.
- Video providers: YouTube covers 100% of seeded `videos.json` (verified all ids are YouTube). Vimeo/Bunny support is structural (provider switch) but ingestion for those not needed yet; embed cases handled per AGENTS.md §9.
- Search `?t=` param: AGENTS.md §7 says result links to lesson page with start seconds query param and embed starts at that second using provider's own start parameter — implemented as `?t=` (also accepts `start`/`startSeconds`). No auto-play forced beyond provider default.
- If lesson not found by slug, or parent course slug mismatches URL slug param, 404 (prevents `/courses/other-course/wrong-lesson` confusion).
- Images use `<img>` with `urlFor` (as existing pages) to avoid `next/image` config churn; keep `loading="lazy"` for sidebar thumbs if added.

## Security considerations

- Sanity read token (`SANITY_API_READ_TOKEN`) stays server-only (no `NEXT_PUBLIC_`), used only in `sanity/lib/client.ts` imported by Server Components/data helpers. Never leaked to client bundle (validate via `grep -r SANITY_API` only hits server files; `server-only` import optional).
- Slug params passed as GROQ variables `$slug`/`$lessonSlug` (parameterized), not interpolated — prevents GROQ injection.
- `videoUrl` is from authored Sanity content, but embed src is sanitized: extract id via regex, rebuild embed URL from allow-listed providers only; unknown URLs not embedded raw — validated with URL constructor and allow-list (`youtube.com`, `youtu.be`, `vimeo.com`, `mediadelivery.net`, `bunny.net`).
- No user writes on this page; progress/bookmark writes go via future server route with write token (AGENTS.md §5). This page is read-only.
- Env keys list in `.env.example` canonical; real tokens in `.env.local`/host env, never committed.

## Acceptance criteria

- Visiting `/courses/nextjs-app-router-in-depth/nextjs-app-router-in-depth-file-system-routing` (and any other seeded lesson) renders page matching `design/vertext-lesson.png` in layout/spacing/typography/color on desktop (1440): header, sidebar with course header + 4 modules (3 lessons each) + active highlight + "Now playing", breadcrumb with correct module/lesson numbers (e.g. Lesson 1.1 for first lesson), LESSON X.Y badge, title+bookmark, description, meta row (duration/level/students) correctly formatted, video iframe playing on-page (YouTube embed with N placeholder replaced by real video), Lesson Content/Notes tabs switching, Overview paragraph, 3 keyPoints checklist with orange checks, Pro Tip when present, 1-2 Resource cards, prev/next bar with correct neighbors (first lesson has disabled Previous, last has disabled Next).
- Sidebar accordion expands/collapses modules; active module expanded by default; clicking another module toggles.
- Video seeks when URL has `?t=60` — iframe src contains `start=60` (YouTube) and playback begins at that second on-site.
- Unknown lesson slug → 404. Mismatched course/lessons (`/courses/other-course/<lesson-from-different-course>`) → 404 or redirect to canonical (choose 404 for strictness).
- Data is live from Sanity (not hardcoded): title, notes, keyPoints, proTip, resources, duration, videoUrl, thumbnail, studentCount, level, modules/lessons all from GROQ. Changing seeded content and revalidating shows new data.
- Responsive 768/375: sidebar stacks above content (or collapses into disclosure), video maintains 16:9, grid resources 3→1, no horizontal scroll.
- `tsc --noEmit`, `eslint`, `next build` pass; no client bundle contains `SANITY_API_READ_TOKEN`; no `text::semanticSimilarity` usage.

## Checks

1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm build` (new nested dynamic route)
4. Manual: `pnpm dev` → open `/courses/nextjs-app-router-in-depth/nextjs-app-router-in-depth-caching-and-revalidation` etc → compare to `design/vertext-lesson.png` at 1440/768/375; test `?t=90` seek; toggle sidebar accordion and Lesson Content/Notes tabs; verify prev/next navigation; check 404 at `/courses/nextjs-app-router-in-depth/does-not-exist` and mismatched course/lesson combo.

## Manual test steps

1. `pnpm dev` → open `http://localhost:3000/courses/nextjs-app-router-in-depth/nextjs-app-router-in-depth-file-system-routing` → assert shell, sidebar (4 modules, 12 lessons total, Module 1 expanded, lesson 1.1 active), breadcrumb `All Courses > Next.js App Router in Depth > Routing and Layouts > File-system routing...`, badge `LESSON 1.1`, title, meta `5m / Intermediate / X students`, video iframe loads YouTube `9602Yzvd7ik` (view source confirms `youtube.com/embed/9602Yzvd7ik`), tabs default to Lesson Content showing Overview + 3 keyPoints + Resources (2 cards: Next.js docs + maybe extra), Pro Tip absent for this lesson (check).
2. Try `?t=60` → reload `.../nextjs-app-router-in-depth-file-system-routing?t=60` → iframe src now `.../embed/9602Yzvd7ik?start=60...` (inspect element).
3. Click `Notes` tab → notes panel shows Portable Text notes (intro + What this lesson covers bullets + outro).
4. Click another module header (e.g. Module 2) → expands to show its 3 lessons.
5. Click `Next Lesson` → navigates to `nextjs-app-router-in-depth-layouts-and-templates` (Lesson 1.2), breadcrumb updates to `LESSON 1.2`, video changes to `k48WMdl2eUc`, Previous now enabled.
6. Try other course: `http://localhost:3000/courses/typescript-for-application-developers/typescript-for-application-developers-structural-typing` → adapts to that course's 4 modules, correct level, durations.
7. Unknown slug `.../does-not-exist` → 404 page. Cross-course mismatch `.../nextjs-app-router-in-depth/typescript-for-application-developers-structural-typing` → 404.
8. Resize to 768 and 375 → sidebar stacks above main, no overflow, video maintains aspect, resources grid collapses.
9. `pnpm build && pnpm start` → repeat navigation, verify no token in page source (`grep` page HTML for `skZWon` yields nothing), iframe still works.

