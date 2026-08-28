# Implementation prompt — Offline video ingestion pipeline (video documents with timestamped chunks & chapters)

Reference: AGENTS.md §§7,8,9,11,12,13 (video intelligence in dedicated video documents, one per unique video, chapters + chunked transcript, two-stage timestamp resolve, grounded search, offline tooling never in request path). Skills: `sanity-best-practices` (schema, GROQ), `sanity-migration` (import workflow), `node_modules/next/dist/docs`.

## Goal

Implement the offline video ingestion pipeline that builds Sanity `video` documents (AGENTS §8/9) — one per unique `videoUrl`, keyed by id derived from URL stripping illegal datastore chars — each holding `chapters: {startSeconds,label}[]` (table of contents) and `chunks: {startSeconds,text}[]` (transcript split into short timestamped pieces). Never store whole transcript in one field returned wholesale. Support YouTube (primary seeded provider), with Vimeo/Bunny plumbing ready, and wire playback seek via provider embed. Pipeline never runs in request path; output is `sanity/seed/videos.ndjson` importable via `sanity dataset import`.

## Skills / docs read

- `sanity-best-practices` (`~/.claude/skills/sanity-best-practices/SKILL.md` + refs) — schema with `defineType/defineField/defineArrayMember`, standalone Studio, `file` vs streaming video (YouTube embed URL, not Sanity file asset), `defineQuery`, tight projections, private dataset token.
- `sanity-migration` — deterministic IDs, `sanity dataset import --replace`, snapshot to disk before transform, validation before write, rerun convergence, asset handling.
- `node_modules/next/dist/docs` — App Router standalone Studio at `app/studio`, server-only client (`sanity/lib/client.ts:11` with `token: readToken`, `useCdn:false`), inline `next.config` not needed for pipeline.
- Current codebase code inspected (see below).

## Code inspected

- `sanity/schemaTypes/video.ts:1` — `video` document: `url` (url, required), `videoId` (string, required), `chapters[]` (`{startSeconds:number integer>=0, label:string}`), `chunks[]` (`{startSeconds,text}`), preview `url/videoId`. Matches §§8/9 shape.
- `sanity/schemaTypes/index.ts:12` — registers `[course,courseModule,lesson,instructor,category,video,searchConfig]`.
- `sanity/structure.ts:11-12` — exposes Video / Search Config in Studio list.
- `sanity/seed/content.mjs:121-122` — 10 courses × 4 modules × 3 lessons = 120 lessons; each lesson has `search` phrase, `summary`, `points` (≤6), `proTip`; lessons do not store parent course (reverse `references()` used in queries).
- `sanity/seed/videos.json:1` — committed cache: 120 entries `"{courseSlug}-{lessonSlug}" -> {id,title,channel,duration,query}` (YouTube `id` + `duration`). Built by `sanity/seed/resolve-videos.mjs:16` scraping `ytInitialData` + `oEmbed` verification, throttled, deduped, no API key needed.
- `sanity/seed/resolve-videos.mjs:1` — polite scraper (1200ms throttle), `MIN 3m / MAX 90m`, drops `#shorts`, `parseDuration`, `extractCandidates` walks blob, verifies via `youtube/oembed`, writes `videos.json` incrementally.
- `sanity/seed/build-ndjson.mjs:1` — expands `content.mjs + videos.json` → `seed.ndjson` with deterministic `_id`s (`course.<slug>`, `lesson.<slug>`), `_key`s via `keyOf` (SHA1 digest for long keys), re-implements Studio validations, `lesson.videoUrl = https://www.youtube.com/watch?v=${id}`, `posterUrl` `i.ytimg.com/vi/${id}/hqdefault.jpg`, `duration` from resolved video, validates counts.
- `sanity/seed/ingest-videos.mjs:1` — current stub pipeline (75 lines): reads `videos.json` + `content.mjs`, `sanitizeId(url)` (`replace ^https?://, [^a-zA-Z0-9_-]->'-', -+ collapse, trim, slice 128`), loops `courses→modules→lessons`, dedupes by `_id = video.${sanitizeId(url)}`, builds `chapters` from `lesson.points.slice(0,4)` (`_key=${sid}-ch-${i}`, `startSeconds=i*60`, `label=point`) else title, `chunks` from `summary + points` (`_key=${sid}-chunk-${i}`, `startSeconds=(i+1)*45`), writes `videos.ndjson`. Gap: stub text, no real caption fetch, no provider branching, no chapter-source fetch.
- `sanity/seed/videos.ndjson:1` (capped) — ~120 docs `{"_id":"video.www-youtube-com-watch-v-...","_type":"video","url","videoId","chapters","chunks"}` with `_key/_type` on nested objects; chunks ≤4 per video, chapters 2-3, `startSeconds` ints.
- `sanity/seed/README.md:1` — `seed:videos → seed:build → seed:import` flow, deterministic ids, no write token needed (CLI auth), `_sanityAsset` image uploads.
- `sanity/lib/client.ts:11` / `sanity/env.ts:15` — server-only `readToken` (`SANITY_API_READ_TOKEN`), `useCdn:false`, `perspective:published`, private dataset `sokb60yi/production`.
- `sanity/lib/queries.ts:191-226` — `SEARCH_COURSES_QUERY` (`pt::text(notes)` → `notesText`), `SEARCH_VIDEOS_QUERY` (`_id,url,videoId,chapters, count(chunks), sampleChunks[0..2]` — never whole array to model), `SEARCH_LESSONS_FLAT_QUERY`.
- `sanity/lib/search.ts:90` — `performSearch(q)` tokenizes `q` → wildcard OR, scores `title > keyPoints > notes`, checks `videoByUrl` for chapter hits first then `chunks` fallback (two-stage per §7, `chapters[].label match` boost +40), caps video results 2 per lesson, merges lesson+video, module-level cache (TTL 60s).
- `sanity/lib/types.ts:134` — `VideoDoc { _id,url,videoId,chapters?:VideoChapter[],chunks?:VideoChunk[] }`, `VideoChapter {startSeconds,label}`, `VideoChunk {startSeconds,text}`.
- `components/lesson/video-player.tsx:1` — provider embed seek: YouTube `&start=` / `?start=` via `extractYouTubeId` (youtu.be, youtube.com `v`/`embed`), Vimeo `#t=${s}s` via `extractVimeoId`, Bunny `?start=` via `mediadelivery.net/bunny.net`, fallback. `app/courses/[slug]/[lessonSlug]/page.tsx:114` maps `?t|start|startSeconds` → `startSeconds` to player.
- `sanity/seed/videos.ndjson` already imported? Need to verify after pipeline change via `npx sanity documents …` not needed.
- `.env.example:8` / `package.json:11` — `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, no write token, scripts `seed:build` / `seed:import`.

## Files to touch

- `sanity/seed/ingest-videos.mjs` — **rewrite/expand** into full offline pipeline per §§9/12: provider registry (youtube|vimeo|bunny), `sanitizeId(url)` (strip scheme, `/`, `[^a-zA-Z0-9_-]` → `-`, collapse, trim `-`, slice 128, prefix `video.`), `detectProvider(url)` (youtube: `youtube.com|youtu.be`, vimeo: `vimeo.com`, bunny: `mediadelivery.net|bunny.net|iframe.mediadelivery`), `fetchYouTubeCaptions(videoId)` → `chunks[]` (try watch page `captionTracks` JSON → timedtext `srv3/ttml` → parse `<text start dur>` → chunk into ~40-60 word pieces with `startSeconds` integer, fallback to `null`), `fetchYouTubeChapters(videoId)` → `chapters[]` (try watch page chapters JSON `playerMicroformat/macroMarkers` or description `0:00 - label` parse, else `null`), `fetchVimeoCaptions/Chapters`, `fetchBunnyCaptions/Chapters` (stub that returns `null` with clear log “not yet ingested — using authored fallback”, keeping provider gate per §9), `buildAuthoredFallback(lesson, videoDuration)` → `chapters` from `points` (≤4) with `startSeconds` spaced by `Math.floor(duration/points.length)` bounded 45-120s else `i*60`, `chunks` from `summary + points` + outro sentence (≤6 chunks, each `startSeconds` spaced 45s, integer), validation (`label.length>0`, `startSeconds<duration`, sorted ascending), dedupe by sanitized `_id`, write `videos.ndjson` NDJSON with `{"_id","_type":"video","url","videoId","chapters":[{"_key,_type:"chapter",startSeconds,label}],"chunks":[{"_key,_type:"chunk",startSeconds,text}]}`. Throttle network fetches (300ms), timeout 8s, never throw on caption miss — always produce fallback so pipeline never breaks. Log per video `ok: provider=captions/chapters source` summary. Add `--force` / `--provider=youtube` flags, `--dry-run` prints counts. No request-path code, no token needed, no browser call.
- `sanity/seed/ingest-videos.README.md` or inline header — add provider support matrix and “Do not treat provider as supported until both ingestion and playback exist” note (§9) plus throttle/timeout rationale.
- `sanity/seed/videos.ndjson` — **regenerated output** (git-ignored? currently committed; keep committed for review) — will be overwritten by pipeline run, verified to hold 120 docs after run.
- `sanity/lib/queries.ts` — **no change** unless pipeline adds new video fields (it does not); keep `SEARCH_VIDEOS_QUERY` sampling `chunks[0..2]` to avoid whole-transcript to model per §12.
- `package.json` — ensure `seed:ingest` script exists (add `"seed:ingest": "node sanity/seed/ingest-videos.mjs"` if missing) alongside existing `seed:build`/`seed:import`.
- `.env.example` — add optional `YOUTUBE_COOKIES` / `BUNNY_API_KEY` / `VIMEO_ACCESS_TOKEN` as server-only env for caption fetch (document but not required; fallback works without).
- `sanity/seed/videos.json` — **read-only**, pipeline reads it, never writes it (resolver owns it).
- `sanity/seed/build-ndjson.mjs` — **not changed** (owns lessons/courses); pipeline only builds `video` docs.
- `components/lesson/video-player.tsx` / `sanity/schemaTypes/video.ts` — **no schema change** (shape already correct).

## Requirements (AGENTS §§7,8,9,12)

1. **Data model §8** — `video` doc one per unique `videoUrl` (`_id = video.<sanitizedId>` where sanitized = `url.replace(/^https?:\/\//,'').replace(/[^a-zA-Z0-9_-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/,'').slice(0,128)`), `url`, `videoId`, `chapters[]`, `chunks[]` (short timestamped pieces, never whole transcript in one field that query would return wholesale). Lessons link via `videoUrl` string match; video docs are internal lookup, never shown as standalone results.
2. **Two-stage timestamps §7** — search already matches `chapters` first then `chunks` fallback (`sanity/lib/search.ts:178`); pipeline must keep that meaningful by storing clean `chapters[].label` vs noisier `chunks[].text`.
3. **Offline pipeline §9** — runs only via `node sanity/seed/ingest-videos.mjs` (never in Next.js request path), writes NDJSON for `sanity dataset import … --replace`. Handles YouTube, Vimeo, Bunny as embeds shown on lesson page; to support a provider need captions→chunks + chapters source + playback seek. Do not mark Vimeo/Bunny as fully supported until both ingestion (caption fetch) and playback (embed `start`) exist — current playback already supports them, so ingestion marks them `fallback-authored` until real APIs wired.
4. **No whole transcript to model §12** — `SEARCH_VIDEOS_QUERY` returns only `count(chunks)` + `sampleChunks[0..2]`; ingestion keeps `chunks` short (≤120 chars? actually ≤280 like proTip, but split ~40-60 words, 3-6 per video), never a single field with full transcript.
5. **Deterministic & idempotent** — sanitized `_id` + stable `_key`s (`${sid}-ch-${i}`, `${sid}-chunk-${i}`), dedupe by `_id`, `sanity dataset import --replace` convergence, re-run without `--force` reuses authored fallback when captions miss (no duplicate docs).
6. **Graceful degradation** — caption/chapter fetch failures do not abort pipeline; log `warn` and fall back to authored `points/summary` derived docs so every lesson still gets a video doc and search stays grounded (every video result maps to real lesson via `videoUrl`).
7. **Boundaries §5** — pipeline is Node `mjs` under `sanity/seed/`, not imported by `app/`; no `NEXT_PUBLIC_` token, no client call, no `fetch` in route handler beyond search fallback.
8. **Coherence** — fallback `chapters` from lesson `points` preserves curriculum coherence (module lessons genuinely cover module topic) so search ranking stays useful.

## Decisions / assumptions

- YouTube is the only provider with seeded URLs (120 `youtube.com/watch?v=`); Vimeo/Bunny ingestion is scaffolded (detector + fetch stub + log) but not required for 120-video dataset — avoids needing Vimeo/Bunny credentials to pass checks. Marking them “fallback-authored” satisfies “do not treat as supported until both ingestion and playback exist” without blocking.
- Real YouTube caption fetch attempted: scrape watch page `ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks` → pick `languageCode=en` or first `kind!=asr` → fetch `baseUrl` (timedtext `fmt=srv3` XML) → parse `start`+`text` → merge into ~50-word chunks with integer `startSeconds` (floor). If watch page blocked / no `captionTracks` / fetch 429 → fallback to authored. This matches polite scraper pattern in `resolve-videos.mjs` (UA `Chrome/120`, throttle 300ms, 8s timeout) and never requires YouTube Data API key.
- YouTube chapters fetch attempted: parse `playerMicroformatRenderer` / `macroMarkersListRenderer` chapters if present, else scrape description `^\d+:\d+ - .+` pattern. If neither, fallback to `points`.
- Chunk sizing: 3-6 chunks/video, each `text` ≤ 300 chars, `startSeconds` integer 0..duration, sorted, spaced ≥30s apart to keep `SEARCH_VIDEOS_QUERY` sample meaningful and avoid overflow of LLM context.
- `_key` stability: `${sanitizedId}-ch-${i}` / `-${chunk}-${i}` (already in stub); keeps re-import diff noise low (cf. `keyOf` digest in `build-ndjson.mjs`).
- Throttle 300ms between caption fetches (lighter than 1200ms resolve but still polite); 8s `AbortSignal.timeout`.
- No new npm deps (keep `zod`/`next-sanity` already present); use only `node:fs`, `node:path`, `node:url`, global `fetch`, regex XML parse — stays offline-tooling minimal.

## Security considerations

- No tokens in pipeline by default; optional `YOUTUBE_COOKIES`/`BUNNY_API_KEY`/`VIMEO_ACCESS_TOKEN` kept server-only, never exposed to browser, never written to NDJSON, only read via `process.env`.
- Sanitized `_id` prevents datastore injection (strips illegal chars, caps 128).
- Fetch URL allowlist: only YouTube `youtube.com/timedtext` / watch page for caption fetch; no arbitrary user URL fetch.
- NDJSON validated before write: every doc has `_id` starting `video.`, `url` https, `videoId` alphanumeric `[-_]` 6-16, `chapters`/`chunks` arrays with integer `startSeconds>=0`, `label/text` non-empty ≤300 chars, sorted.
- Pipeline writes only `videos.ndjson` locally; import requires `npx sanity dataset import` with CLI auth, not an embedded write token.

## Acceptance criteria

- `node sanity/seed/ingest-videos.mjs` exits 0, logs `Wrote 120 video docs to sanity/seed/videos.ndjson` (or 120 minus any missing `videos.json` entries, but with current `videos.json` exactly 120), each line is valid JSON with `_type:video`, `_id:video.<sanitized>`, `url: https://www.youtube.com/watch?v=<id>`, `videoId`, `chapters` 2-4 entries, `chunks` 3-6 entries, `_key`/`_type` on nested objects, `startSeconds` integers sorted.
- `head -1 sanity/seed/videos.ndjson | python -m json.tool` shows `chapters[0].label` is a real curriculum point (e.g. “Map folders and page files to URL segments” for `9602Yzvd7ik`), `chunks[0].text` is lesson `summary` sentence, not whole transcript dump.
- `sanity/lib/search.ts` still resolves video moments via two-stage `chapters → chunks` without change (no schema migration needed).
- `pnpm exec tsc --noEmit` and `pnpm lint` pass.
- `pnpm build` passes (or skipped with reason if env missing, but pipeline change does not break).
- Provider detector test: `node -e "import('./sanity/seed/ingest-videos.mjs')"` or direct unit `detectProvider('https://vimeo.com/123')==='vimeo'` and `sanitizeId('https://www.youtube.com/watch?v=abc')==='www-youtube-com-watch-v-abc'` hold.
- No client bundle imports pipeline (grep `ingest-videos` in `app/` returns 0).

## Checks

1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm build` (if routes/config changed; here low risk but run)
4. `node sanity/seed/ingest-videos.mjs` → check `wc -l sanity/seed/videos.ndjson` = 120, `node -e "console.log(JSON.parse(require('fs').readFileSync('sanity/seed/videos.ndjson','utf8').split('\n')[0]).chapters.length)"` etc.
5. `npx sanity dataset import sanity/seed/videos.ndjson production --replace` (dry-run or real if token/CLI auth present; else verify NDJSON shape only)
6. `pnpm dev` spot-check `/api/search?q=caching` still returns video moments with `startSeconds` from chapters.

## Manual test steps

1. `node sanity/seed/ingest-videos.mjs` # expect `Fetching captions ... fallback/authored` logs, final `Wrote 120 video docs to …/videos.ndjson`, no uncaught exception.
2. `wc -l sanity/seed/videos.ndjson` # expect 120
3. `Get-Content sanity/seed/videos.ndjson -First 1 | ConvertFrom-Json | Format-List _id,url,videoId` # _id starts `video.www-youtube-com-watch-v-`, url matches, videoId 11-char
4. `node --input-type=module <<'EOF'
   import {readFileSync} from 'node:fs';
   const lines=readFileSync('sanity/seed/videos.ndjson','utf8').trim().split('\n').map(JSON.parse);
   const bad=lines.filter(d=>!d.chapters?.length||!d.chunks?.length||d.chunks.some(c=>c.text.length>500));
   console.log(`docs:${lines.length} bad:${bad.length} sampleChapters:${lines[0].chapters.map(c=>c.label).join(' | ').slice(0,120)}`);
   EOF`
   # expect `bad:0`
5. `pnpm exec tsc --noEmit` # no errors
6. `pnpm lint` # no errors
7. `npx sanity dataset import sanity/seed/videos.ndjson production --replace` # if CLI logged in; else skip with note “CLI auth not present — NDJSON validated locally”
8. `pnpm dev` → `curl http://localhost:3000/api/search?q=next.js | python -m json.tool | head -n 40` # results contain `kind:video` with `startSeconds` ints, `course` titles real
9. Open `/search?q=caching` in browser → video card links contain `?t=<seconds>` and iframe `src` has `&start=<seconds>` on click through to lesson page (YouTube seek works); lesson card shows `keyPoints` bullets.
10. Search empty `q=zzzz_nope` → empty state points to `/courses`.
