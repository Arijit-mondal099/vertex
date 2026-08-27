# Implementation prompt — Seed sample content in Sanity

## Goal

Seed the Sanity `production` dataset with a coherent, searchable catalog: a handful of categories and instructors plus at least 10 courses (each with ordered modules and lessons) covering programming, development, AI and related topics, so the catalog and cross-course search have real data. Keep relations consistent: a module's duration/lesson-count equals the sum of its lessons, and a course's totals equal the sum of its modules (derived via `duration` on lessons and `math::sum` in GROQ, never stored).

## Skills / docs read

- `sanity-best-practices` (`~/.claude/skills/sanity-best-practices/SKILL.md`) — schema patterns (`defineType`/`defineField`/`defineArrayMember`), GROQ (`defineQuery`), validation, image/Portable Text, standalone Studio, `useCdn:false` reads.
- `sanity-migration` (`~/.claude/skills/sanity-migration/SKILL.md`) — deterministic NDJSON seeding, `sanity dataset import --replace`, asset handling via `_sanityAsset`, validation before write, idempotent reruns.
- `content-modeling-best-practices` (`~/.claude/skills/content-modeling-best-practices/SKILL.md`) — references vs embedded objects (module = embedded object inside course, not a document), single source of truth.
- `AGENTS.md` §§7-9,11 — content shape, module/lesson numbering derived from order, video URL as embed URL, structured Portable Text, private dataset rule.
- `node_modules/next/dist/docs/` — not needed for this task (no routing changes).

## Code inspected

- `sanity/schemaTypes/index.ts:1-11` — registers `[course, courseModule, lesson, instructor, category]`; `courseModule` currently a document named `module`.
- `sanity/schemaTypes/course.ts:1-98` — current course: `title`, `slug`, `description`, `image`, `level`, `instructors[]`, `categories[]`, `modules[]->module`. Missing `summary`, `coverImage`, `price`, `popular`, `studentCount`, `learningOutcomes` per AGENTS §8; plural refs vs singular spec; `modules` refs vs embedded objects.
- `sanity/schemaTypes/lesson.ts:1-56` — current lesson: `title`, `slug`, `duration`, `content`, `videoUrl`. Missing `thumbnail`, `freePreview`, `studentCount`, `notes`, `keyPoints`, `proTip`, `resources` and richer Portable Text per AGENTS §8.
- `sanity/schemaTypes/instructor.ts:1-52` — current: `name`, `role`, `avatar`, `bio:text`. Spec wants `photo`, `expertise[]`, `bio: PortableText` plus `slug`; `role` is vestigial.
- `sanity/schemaTypes/category.ts:1-38` — matches spec (`title`, `slug`, `description`).
- `sanity/schemaTypes/module.ts:1-42` — defines `module` as a document with `title`, `description`, `lessons[]->lesson`. Spec says module is an **embedded object** inside course (`title`, `summary`, `lessons[]->lesson`), numbers derived from order.
- `sanity/seed/content.mjs:1-~1700` — hand-authored source of truth: 6 categories, 5 instructors (each teaches 2 courses), 10 courses × 4 modules × 3 lessons = 120 lessons with coherent summaries/points/proTips/resources and `search` phrases for video resolution. Already satisfies "at least 10 courses" and topical coverage.
- `sanity/seed/videos.json:1-842` — cache of resolved unique YouTube videos (one per lesson, verified via oEmbed, deduped by `usedIds`, duration 3–90 min). Committed so seeding is offline.
- `sanity/seed/build-ndjson.mjs:1-363` — expands `content.mjs + videos.json` into `seed.ndjson`: deterministic `_id`s (`category.<slug>`, `instructor.<slug>`, `lesson.<course>-<slug>`, `course.<slug>`), stable `_key`s via `keyOf`, `_sanityAsset` image uploads (covers `picsum.photos`, lesson thumbnails `i.ytimg.com`, portraits `randomuser.me`), decaying `studentCount`, `freePreview` only on first lesson per course, self-checks (duplicate ids, orphan lessons, field length limits, missing videos, unique video ids), refuses to write on failure.
- `sanity/seed/seed.ndjson:1` (141 lines) — 6 category + 5 instructor + 10 course + 120 lesson = 141 documents; no standalone module docs (modules embedded). Lesson slugs prefixed with course slug for `LESSON_BY_SLUG_QUERY` uniqueness; `duration` is real video seconds; course `studentCount` decay ensures no lesson exceeds its course.
- `sanity/seed/README.md:1-41` + `sanity/seed/resolve-videos.mjs:1-202` — import flow `seed:videos → seed:build → seed:import` (`sanity dataset import ... --replace`), idempotent.
- `sanity/lib/queries.ts:1-110` — `COURSES_LIST_QUERY`, `COURSE_BY_SLUG_QUERY`, `LESSON_BY_SLUG_QUERY`, etc. Use `instructors[]->`, `categories[]->`, `modules[]->lessons[]->` and `math::sum` for totals — written for the **old** document-module shape and plural refs.
- `sanity/lib/client.ts:1-16` — server-only read client (`useCdn:false`, `perspective:'published'`) — private dataset reads stay server-side.
- `sanity/lib/types.ts:1-82` — hand-written result shapes matching current queries.
- `sanity/env.ts:1-20`, `sanity.config.ts:1-28`, `sanity/structure.ts:1-15`, `sanity.cli.ts:1-10` — standalone Studio mounted at `/studio`, project `sokb60yi`, dataset `production`.
- `package.json:1-34`, `.env.local:1-12` — `sanity@5.31.2`, `next-sanity@13.3.3`, no `seed:*` scripts yet; `NEXT_PUBLIC_SANITY_PROJECT_ID`/`DATASET` present, no write token (import uses CLI auth).
- `prompts/home-page.md:1-109` — prompt format precedent.

## Decisions / assumptions

- **Keep `content.mjs` as source of truth** — do not hand-edit `seed.ndjson`; rebuild it. The content is already coherent top-to-bottom (module lessons cover module topic, course modules cover course) which search quality depends on (AGENTS §7).
- **Align schemas to AGENTS §8 and to the existing seed** rather than dumbing the seed down to the simplified schemas. That means:
  - `course`: `summary` (text ≤200), `coverImage` (image + alt), `level` (`Beginner|Intermediate|Advanced`), `price` (number), `popular` (boolean), `studentCount` (number), `learningOutcomes` (array ≤6 of `{icon,title,description}`), single `instructor` ref + single `category` ref (keep legacy `instructors`/`categories` plural as deprecated alias or migrate queries — choose one and update queries accordingly), `modules` as array of **embedded** `module` objects (not refs). Module object: `title`, `summary` (≤240), `lessons[]` refs to lesson.
  - `module`: change from document `module` to object type `module` (or keep document for Studio list but mark deprecated; preferred: object `courseModule` as already named). Remove standalone module documents; update `sanity/structure.ts` to stop listing `module`.
  - `lesson`: add `thumbnail` (image), `freePreview` (boolean), `studentCount` (number), `notes` (Portable Text `block[]`), `keyPoints` (string[] ≤6), `proTip` (text ≤280), `resources` (array ≤? of `{type,title,description,url}`), keep `title`, `slug`, `duration` (seconds, integer ≥0), `videoUrl` (YouTube embed URL). Keep legacy `content` field as alias/deprecated or map `notes` → `content` during migration.
  - `instructor`: rename `avatar`→`photo` (keep alias), `role`→`expertise` array + optional `role` deprecated, `bio` → Portable Text `block[]`, add `slug`, keep `name`.
  - `category`: already correct.
- **Module/lesson counts and durations are derived**, not stored: `count(modules)` / `count(modules[].lessons)` and `math::sum(modules[].lessons[]->duration)` (or `modules[]->lessons[]->` vs embedded `modules[].lessons[]->` depending on shape). Verify after seed: GROQ `*[_type=="course"]{..., "lessonCount": count(modules[].lessons[]), "totalMinutes": math::sum(modules[].lessons[]->duration)}` sums match lesson durations.
- **Idempotence**: deterministic `_id`s (`course.<slug>` etc.) + `sanity dataset import --replace` so reruns converge; `createOrReplace` semantics via import.
- **Assets**: keep `_sanityAsset: image@URL` so CLI downloads and creates real Sanity assets; no hotlinking at runtime.
- **Videos**: reuse committed `videos.json`; do not re-scrape unless `--force` is requested. `resolve-videos.mjs` already guarantees uniqueness and valid durations.
- **Private dataset**: keep read token server-only (via `sanity/lib/client.ts`); seeding uses CLI auth (`npx sanity login` already authenticated per `context.txt`), no token committed.
- **Compatibility**: update `sanity/lib/queries.ts` and `sanity/lib/types.ts` to match new embedded-module shape and singular `instructor`/`category` while keeping backward-compatible projections where cheap (e.g., coalesce `instructor` vs `instructors[0]`). If breaking, document it.
- **Tooling**: add `seed:build` and `seed:import` scripts to `package.json` (or `sanity/seed` docs) if missing; do not add a write token to `.env.local` unless required — prefer CLI auth.
- **No video documents in this pass** — video `chapters`/`chunks` ingestion is a separate pipeline (AGENTS §9) and out of scope for catalog seeding; focus on course/module/lesson/category/instructor.

## Files you expect to touch

- `sanity/schemaTypes/course.ts` — add `summary`, `coverImage`, `price`, `popular`, `studentCount`, `learningOutcomes`, singular `instructor`/`category`, embedded `modules` object array; adjust preview.
- `sanity/schemaTypes/lesson.ts` — add `thumbnail`, `freePreview`, `studentCount`, `notes`, `keyPoints`, `proTip`, `resources`; keep `duration`/`videoUrl` validation.
- `sanity/schemaTypes/instructor.ts` — add `slug`, `photo`, `expertise`, Portable Text `bio`; deprecate/alias `avatar`/`role`.
- `sanity/schemaTypes/module.ts` — convert to object type `module` (embedded) with `title`, `summary`, `lessons[]`; remove document registration or keep deprecated.
- `sanity/schemaTypes/index.ts` — re-export updated types; ensure `courseModule` is object not document.
- `sanity/structure.ts` — remove `module` list item (since not a document).
- `sanity/lib/queries.ts` — update projections for singular refs and embedded modules (`modules[].lessons[]->`); keep `totalMinutes` via `math::sum`.
- `sanity/lib/types.ts` — update `CourseCard`, `CourseDetail`, `InstructorSummary` etc. to new shapes.
- `sanity/seed/build-ndjson.mjs` — no change needed unless schema field names diverge; verify its output still passes its self-checks against new schemas.
- `sanity/seed/seed.ndjson` — regenerated (do not hand-edit).
- `package.json` — add `seed:build` / `seed:import` scripts (`node sanity/seed/build-ndjson.mjs` and `sanity dataset import sanity/seed/seed.ndjson production --replace`).
- `prompts/seed-sample-content.md` — this file.
- No changes to `app/*`, `components/*`, `proxy.ts`, or auth/analytics.

## Requirements

1. **Counts**: ≥10 courses, a handful of categories (≈6) and instructors (≈5) spanning programming/development/AI; each course has ≥3 modules, each module ≥2 lessons — total ≥60 lessons (actual: 10×4×3=120) so catalog pagination and cross-course search have data.
2. **Coherence**: each module's lessons genuinely cover the module title/summary, each course's modules cover the course — no filler.
3. **Relations consistent**: every `lesson` is referenced by exactly one module of one course; no orphans; course `lessonCount`/`totalMinutes` derived from lesson `duration` equals sum of parts (verify via GROQ).
4. **Duration rule**: lesson `duration` = real YouTube video seconds (from `videos.json`); no stored aggregates on course/module.
5. **Ids deterministic** and import idempotent (`--replace`).
6. **Field validation**: enforce length limits already in `build-ndjson.mjs` (summary ≤200, module summary ≤240, outcome title ≤60/desc ≤160, proTip ≤280, etc.) and Sanity validation rules; `build-ndjson.mjs` must exit 0.
7. **Images as Sanity assets** via `_sanityAsset`, not hotlinks.
8. **Private dataset** stays private; no token exposed to browser; seeding via CLI auth.
9. **Type safety**: `defineQuery` projections match schemas; `sanity/lib/types.ts` updated or left to TypeGen later.
10. **Search-ready**: lesson `notes`/`keyPoints` and course `summary` are plain searchable text (Portable Text `notes` projected to plain text for search later).

## Security considerations

- Keep `SANITY_API_READ_TOKEN` / write token server-only; never prefix with `NEXT_PUBLIC_`. Seeding uses CLI login, not an env token; do not commit `_sanityAsset` URLs as runtime hotlinks (they become assets on import).
- Validate `videoUrl` as `https` URI; reject non-http schemes.
- Import runs with `--replace` only after confirming target is `production` on project `sokb60yi` and that deterministic ids prevent accidental duplication; document the destructive nature in the prompt/README.
- No browser writes: progress or content mutations remain server-routed (out of scope here).

## Acceptance criteria

- [ ] Schemas validate in Studio (no red badges): `npx sanity schema validate` or Studio builds.
- [ ] `node sanity/seed/build-ndjson.mjs` writes `sanity/seed/seed.ndjson` with 0 problems and logs `categories:6 instructors:5 courses:10 lessons:120`.
- [ ] `npx sanity dataset import sanity/seed/seed.ndjson production --replace` succeeds (≤200s) and reports 141 documents imported (plus image assets).
- [ ] Post-import GROQ: `count(*[_type=="category"])==6`, `count(*[_type=="instructor"])==5`, `count(*[_type=="course"])==10`, `count(*[_type=="lesson"])==120`; no orphan lessons (`*[_type=="lesson" && !defined(*[_type=="course" && ^._id in modules[].lessons[]._ref])]==0` adapted to embedded shape).
- [ ] Per-course: `count(modules)==4`, each `count(modules[].lessons)==3`, `math::sum(modules[].lessons[]->duration)` equals sum of lesson durations (checked for 2 sample courses).
- [ ] Studio at `/studio` lists Courses/Lessons/Instructors/Categories with correct previews (cover images, thumbnails rendered).
- [ ] `sanity/lib/queries.ts` queries return `moduleCount`/`lessonCount`/`totalMinutes` that are internally consistent.
- [ ] `pnpm exec tsc --noEmit` and `pnpm lint` pass (or document pre-existing failures).

## Checks to run

1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `npx sanity schema validate` (or `npx sanity deploy` dry-run) from repo root with `NEXT_PUBLIC_SANITY_PROJECT_ID`/`DATASET` set
4. `node sanity/seed/build-ndjson.mjs` — must exit 0 and print counts
5. `npx sanity dataset import sanity/seed/seed.ndjson production --replace` — verify 141 docs
6. Post-import counts via `npx sanity documents query 'count(*[_type=="course"])'` (or Vision) for each type
7. `pnpm build` if schemas/queries changed (verifies `defineQuery` + Next build)

## Manual test steps

1. `pnpm dev` → open `http://localhost:3000/studio` → confirm Structure shows Courses (10), Lessons (120), Instructors (5), Categories (6); open a course e.g. `Next.js App Router in Depth` → 4 modules, each 3 lessons, cover image renders, instructor/category links resolve.
2. In Studio Vision, run: `*[_type=="course" && slug.current=="nextjs-app-router-in-depth"][0]{title, "modules": count(modules), "lessons": count(modules[].lessons[]), "mins": math::sum(modules[].lessons[]->duration)}` → expect 4/12 and mins = sum of 12 lesson durations.
3. In Vision, run orphan check: `*[_type=="lesson" && count(*[_type=="course" && ^._id in modules[].lessons[]._ref])==0]{_id}` → expect 0 results.
4. Open a lesson e.g. `nextjs-app-router-in-depth-file-system-routing` → videoUrl is `https://www.youtube.com/watch?v=9602Yzvd7ik`, thumbnail asset exists, `freePreview==true` for first lesson per course, `keyPoints` ≤3 visible, `notes` renders as Portable Text.
5. Catalog read check: run `COURSES_LIST_QUERY` via `sanity/lib/client.ts` (e.g., `pnpm exec node -e "import('./sanity/lib/data.ts')..."` or Vision) → each card has `moduleCount`, `lessonCount`, `totalMinutes` >0 and consistent.
6. Restart dev server after any `.env` or schema change and confirm no console errors.
