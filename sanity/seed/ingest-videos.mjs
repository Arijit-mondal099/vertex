/**
 * Offline video pipeline — builds `video` documents (AGENTS.md §9).
 * One document per unique videoUrl, keyed by sanitized id derived from URL.
 * Never runs in request path. Output: sanity/seed/videos.ndjson for `sanity dataset import`.
 *
 * Providers: youtube (fully supported: captions + chapters via watch page scrape),
 *   vimeo / bunny (detector + embed seek already exist in VideoPlayer; caption fetch
 *   scaffolded — returns null so every video still gets an authored fallback; do NOT
 *   mark vimeo/bunny "supported" until real caption API wired — see §9).
 *
 *   node sanity/seed/ingest-videos.mjs [--dry-run] [--provider=youtube]
 *
 * Env (optional, server-only): YOUTUBE_COOKIES, VIMEO_ACCESS_TOKEN, BUNNY_API_KEY.
 * Fallback always produces valid docs so pipeline never breaks when captions are blocked.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { courses } from "./content.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const VIDEOS_PATH = join(HERE, "videos.json");
const OUT = join(HERE, "videos.ndjson");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const providerFilter = args.find((a) => a.startsWith("--provider="))?.split("=")[1] || null;

// ---------------------------------------------------------------- constants

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const THROTTLE_MS = 150;
const FETCH_TIMEOUT_MS = 4000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Circuit breaker: after 3 consecutive watch-page failures, skip network for rest (offline/fast fallback)
let consecutiveWatchFails = 0;
let skipNetwork = Boolean(process.env.SKIP_CAPTION_FETCH);
const watchHtmlCache = new Map();

async function fetchWatchHtml(videoId) {
  if (skipNetwork) return null;
  if (consecutiveWatchFails >= 3) {
    skipNetwork = true;
    console.log(`  circuit breaker: skipping further caption/chapter fetches after ${consecutiveWatchFails} fails`);
    return null;
  }
  if (watchHtmlCache.has(videoId)) return watchHtmlCache.get(videoId);
  try {
    const res = await timedFetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!res.ok) throw new Error(`watch ${res.status}`);
    const html = await res.text();
    watchHtmlCache.set(videoId, html);
    consecutiveWatchFails = 0;
    return html;
  } catch (e) {
    consecutiveWatchFails++;
    watchHtmlCache.set(videoId, null);
    return null;
  }
}

// ---------------------------------------------------------------- helpers

/** AGENTS §8/9: id derived from URL stripping illegal datastore chars */
export function sanitizeId(url) {
  const raw = url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw.slice(0, 128);
}

export function detectProvider(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtu.be") || host.includes("youtube.com")) return "youtube";
    if (host.includes("vimeo.com")) return "vimeo";
    if (
      host.includes("mediadelivery.net") ||
      host.includes("bunny.net") ||
      host.includes("iframe.mediadelivery")
    )
      return "bunny";
  } catch {}
  return "unknown";
}

function decodeEntities(str) {
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

function timedFetch(url, extraHeaders = {}) {
  const headers = { "user-agent": USER_AGENT, "accept-language": "en-US,en", ...extraHeaders };
  if (process.env.YOUTUBE_COOKIES) headers.cookie = process.env.YOUTUBE_COOKIES;
  return fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

// ---------------------------------------------------------------- YouTube caption + chapters fetch (scrape, no API key)

/** Parse timedtext srv3/timedtext XML → [{startSeconds,text}] */
function parseCaptionXml(xml) {
  const re = /<text[^>]*start="([^"]+)"[^>]*>(.*?)<\/text>/gis;
  const out = [];
  let m;
  while ((m = re.exec(xml))) {
    const start = Math.floor(Number(m[1]));
    if (!Number.isFinite(start) || start < 0) continue;
    const raw = m[2].replace(/<[^>]+>/g, " ");
    const text = decodeEntities(raw).replace(/\s+/g, " ").trim();
    if (!text) continue;
    out.push({ start, text });
  }
  return out;
}

/** Chunk low-level timed segments into ~45-60 word short pieces with integer startSeconds */
function chunkTranscript(segments, maxWords = 55, maxChars = 280) {
  if (!segments.length) return [];
  const chunks = [];
  let buf = [];
  let wordCount = 0;
  let chunkStart = segments[0].start;

  const flush = () => {
    if (!buf.length) return;
    const text = buf.join(" ").replace(/\s+/g, " ").trim();
    if (text) chunks.push({ startSeconds: Math.floor(chunkStart), text: text.slice(0, maxChars) });
    buf = [];
    wordCount = 0;
  };

  for (const seg of segments) {
    const words = seg.text.split(/\s+/).filter(Boolean);
    // If adding this segment would overflow and we already have content, flush first
    if (wordCount + words.length > maxWords && buf.length > 0) {
      flush();
      chunkStart = seg.start;
    }
    // If buffer empty and single segment still too long, split it
    if (words.length > maxWords) {
      for (let i = 0; i < words.length; i += maxWords) {
        const slice = words.slice(i, i + maxWords).join(" ");
        const s = i === 0 ? seg.start : seg.start + 1;
        chunks.push({ startSeconds: Math.floor(s), text: slice.slice(0, maxChars) });
      }
      continue;
    }
    buf.push(seg.text);
    wordCount += words.length;
    if (wordCount >= 30 && seg.text.endsWith(".") ) {
      // natural sentence boundary mid-chunk — keep but don't force flush
    }
  }
  flush();
  // Cap 3..8 chunks, keep short
  if (chunks.length > 8) {
    // merge tail
    while (chunks.length > 8) {
      const last = chunks.pop();
      chunks[chunks.length - 1].text = `${chunks[chunks.length - 1].text} ${last.text}`.slice(0, maxChars);
    }
  }
  return chunks;
}

/** Try to extract captionTracks JSON from watch page */
function extractCaptionTracks(html) {
  // ytInitialPlayerResponse pattern
  const m1 = html.match(/"captionTracks"\s*:\s*(\[.*?\])/s);
  if (m1) {
    try {
      return JSON.parse(m1[1]);
    } catch {}
  }
  const m2 = html.match(/"playerCaptionsTracklistRenderer"\s*:\s*\{[^}]*"captionTracks"\s*:\s*(\[.*?\])/s);
  if (m2) {
    try {
      return JSON.parse(m2[1]);
    } catch {}
  }
  return null;
}

/** Try to extract YouTube chapters (macroMarkersListRenderer) */
function extractYouTubeChapters(html) {
  // Look for chapter titles with timeRangeStartMillis
  // Pattern: "macroMarkerListRenderer": { ... "macroMarkers": [ {"title": {"simpleText":"..."},"timeRangeStartMillis":"0"}, ... ] }
  const chapters = [];
  const re = /"title"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"\s*\}[^}]*"timeRangeStartMillis"\s*:\s*"?(\d+)"?/g;
  let lastTitle = null;
  // Walk around macroMarkers section only
  const markerSection = html.match(/"macroMarkersListRenderer"[\s\S]{0,8000}/);
  const scope = markerSection ? markerSection[0] : html;
  let mm;
  let count = 0;
  while ((mm = re.exec(scope)) && count < 20) {
    const label = decodeEntities(mm[1]).trim();
    const ms = Number(mm[2]);
    if (!Number.isFinite(ms) || !label) continue;
    // chapters are within first ~8 entries and spaced; ignore duplicates
    const secs = Math.floor(ms / 1000);
    if (chapters.some((c) => c.label === label && c.startSeconds === secs)) continue;
    chapters.push({ startSeconds: secs, label });
    count++;
  }
  // If found at least 2 plausible chapters, return sorted
  if (chapters.length >= 2) {
    return chapters.sort((a, b) => a.startSeconds - b.startSeconds).slice(0, 8);
  }
  // Fallback: parse description timestamps "0:00 - label" inside description
  const descMatch = html.match(/"description"\s*:\s*\{[^}]*"simpleText"\s*:\s*"([\s\S]*?)"\s*\}/);
  if (descMatch) {
    const desc = decodeEntities(descMatch[1]).replace(/\\n/g, "\n");
    const lines = desc.split("\n");
    for (const line of lines) {
      const tm = line.match(/^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*[-–]\s*(.+)\s*$/);
      if (!tm) continue;
      let secs = 0;
      if (tm[3] !== undefined) secs = Number(tm[1]) * 3600 + Number(tm[2]) * 60 + Number(tm[3]);
      else secs = Number(tm[1]) * 60 + Number(tm[2]);
      const label = tm[4].trim();
      if (label) chapters.push({ startSeconds: secs, label });
    }
    if (chapters.length >= 2) return chapters.sort((a, b) => a.startSeconds - b.startSeconds).slice(0, 8);
  }
  return null;
}

async function fetchYouTubeCaptionsFromHtml(html) {
  if (!html) return null;
  const tracks = extractCaptionTracks(html);
  if (!tracks || !tracks.length) return null;
  let track = tracks.find((t) => t.languageCode === "en" && t.kind !== "asr");
  if (!track) track = tracks.find((t) => t.languageCode === "en");
  if (!track) track = tracks[0];
  if (!track?.baseUrl) return null;
  const baseUrl = track.baseUrl;
  const urls = [
    baseUrl.includes("?") ? `${baseUrl}&fmt=srv3` : `${baseUrl}?fmt=srv3`,
    baseUrl,
  ];
  for (const u of urls) {
    try {
      const r = await timedFetch(u);
      if (!r.ok) continue;
      const text = await r.text();
      if (text.trim().startsWith("{")) {
        try {
          const j = JSON.parse(text);
          const segs = (j.events || [])
            .filter((e) => e.segs)
            .map((e) => ({
              start: Math.floor((e.tStartMs || 0) / 1000),
              text: e.segs.map((s) => s.utf8 || "").join("").trim(),
            }))
            .filter((s) => s.text);
          if (segs.length) return chunkTranscript(segs);
        } catch {}
        continue;
      }
      const segs = parseCaptionXml(text).map((s) => ({ start: s.start, text: s.text }));
      if (segs.length) return chunkTranscript(segs);
    } catch {}
  }
  return null;
}

function fetchYouTubeChaptersFromHtml(html) {
  if (!html) return null;
  const ch = extractYouTubeChapters(html);
  if (ch && ch.length >= 2) return ch;
  return null;
}

// Vimeo / Bunny — scaffolded: detector exists, fetch returns null so authored fallback used.
// To mark them fully supported, implement caption API calls (Vimeo texttracks, Bunny Stream captions)
// and return chunkTranscript(...). Until then log "fallback-authored".
async function fetchVimeoCaptions() {
  return null;
}
async function fetchVimeoChapters() {
  return null;
}
async function fetchBunnyCaptions() {
  return null;
}
async function fetchBunnyChapters() {
  return null;
}

// ---------------------------------------------------------------- Authored fallback (curriculum-coherent)

function buildAuthoredFallback(lesson, videoDuration) {
  const points = (lesson.points || []).slice(0, 4);
  const duration = Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : points.length * 60 + 120;

  // Chapters: space by duration/points length, bounded 45..120, integer, sorted
  let chapters;
  if (points.length > 0) {
    const gap = Math.max(45, Math.min(120, Math.floor(duration / Math.max(points.length, 1))));
    chapters = points.map((label, i) => ({ startSeconds: i * gap, label: String(label).trim().slice(0, 120) }));
  } else {
    chapters = [{ startSeconds: 0, label: String(lesson.title).trim().slice(0, 120) }];
  }
  // Ensure sorted and within duration
  chapters = chapters
    .map((c, i) => ({ ...c, startSeconds: Math.min(c.startSeconds, Math.max(0, duration - 30 - (chapters.length - 1 - i) * 10)) }))
    .sort((a, b) => a.startSeconds - b.startSeconds);

  // Chunks: summary + points, short pieces, spaced 45s but capped to duration
  const rawChunks = [];
  if (lesson.summary) rawChunks.push({ text: String(lesson.summary).trim(), offset: 0 });
  for (const p of lesson.points || []) rawChunks.push({ text: String(p).trim(), offset: null });
  // Ensure 3..6 chunks: if only 1 point, keep at least summary + point
  const gapChunk = 45;
  const chunks = rawChunks.slice(0, 6).map((r, i) => ({
    startSeconds: Math.min(i * gapChunk, Math.max(0, duration - 20)),
    text: r.text.slice(0, 280),
  }));
  // Deduplicate startSeconds jitter if duration tiny
  for (let i = 1; i < chunks.length; i++) {
    if (chunks[i].startSeconds <= chunks[i - 1].startSeconds) {
      chunks[i].startSeconds = Math.min(chunks[i - 1].startSeconds + 15, duration - 5);
    }
  }
  return { chapters, chunks };
}

// ---------------------------------------------------------------- Validation

function validateVideoDoc(doc) {
  const problems = [];
  if (!doc._id?.startsWith("video.")) problems.push(`_id must start with video.: ${doc._id}`);
  if (!doc.url?.startsWith("https://")) problems.push(`url must be https: ${doc.url}`);
  if (!doc.videoId || !/^[a-zA-Z0-9_-]{5,32}$/.test(doc.videoId)) problems.push(`bad videoId: ${doc.videoId}`);
  if (!Array.isArray(doc.chapters) || doc.chapters.length === 0) problems.push("chapters empty");
  if (!Array.isArray(doc.chunks) || doc.chunks.length === 0) problems.push("chunks empty");
  if (doc.chunks?.length > 12) problems.push("too many chunks (>12)");
  for (const ch of doc.chapters || []) {
    if (typeof ch.startSeconds !== "number" || !Number.isInteger(ch.startSeconds) || ch.startSeconds < 0)
      problems.push(`bad chapter startSeconds ${ch.startSeconds}`);
    if (!ch.label || typeof ch.label !== "string" || ch.label.trim().length === 0) problems.push("empty chapter label");
    if (ch.label?.length > 300) problems.push("chapter label >300");
  }
  for (const ck of doc.chunks || []) {
    if (typeof ck.startSeconds !== "number" || !Number.isInteger(ck.startSeconds) || ck.startSeconds < 0)
      problems.push(`bad chunk startSeconds ${ck.startSeconds}`);
    if (!ck.text || typeof ck.text !== "string" || ck.text.trim().length === 0) problems.push("empty chunk text");
    if (ck.text?.length > 600) problems.push("chunk text >600");
  }
  // sorted
  const chapSorted = [...(doc.chapters || [])].sort((a, b) => a.startSeconds - b.startSeconds);
  for (let i = 0; i < (doc.chapters || []).length; i++) {
    if (doc.chapters[i].startSeconds !== chapSorted[i].startSeconds || doc.chapters[i].label !== chapSorted[i].label) {
      problems.push("chapters not sorted");
      break;
    }
  }
  return problems;
}

// ---------------------------------------------------------------- Main (only when run directly, not when imported for tests)

const isDirectRun = Boolean(process.argv[1] && String(process.argv[1]).replace(/\\/g, "/").endsWith("ingest-videos.mjs"));

async function main() {
const rawVideos = JSON.parse(readFileSync(VIDEOS_PATH, "utf8"));

const docs = [];
const seenIds = new Set();
let fetchedCaptions = 0;
let fetchedChapters = 0;
let fallbackCount = 0;

let idx = 0;
for (const course of courses) {
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const key = `${course.slug}-${lesson.slug}`;
      const v = rawVideos[key];
      if (!v) {
        console.warn(`skip ${key}: no entry in videos.json`);
        continue;
      }
      const url = `https://www.youtube.com/watch?v=${v.id}`;
      const provider = detectProvider(url);
      if (providerFilter && provider !== providerFilter) continue;

      const sanitized = sanitizeId(url);
      const id = `video.${sanitized}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      if (docs.find((d) => d._id === id)) continue;

      // Decide chapters/chunks: try provider fetch, else authored fallback
      let chapters = null;
      let chunks = null;
      let captionSource = "authored-fallback";
      let chapterSource = "authored-fallback";

      // Provider fetch: YouTube watch page once, derive both chapters + captions
      if (provider === "youtube") {
        if (idx > 0) await sleep(THROTTLE_MS);
        const html = await fetchWatchHtml(v.id);
        const ytChapters = fetchYouTubeChaptersFromHtml(html);
        const ytChunks = html ? await fetchYouTubeCaptionsFromHtml(html).catch(() => null) : null;
        if (ytChapters && ytChapters.length >= 2) {
          chapters = ytChapters;
          chapterSource = "youtube-scrape";
          fetchedChapters++;
        }
        if (ytChunks && ytChunks.length >= 2) {
          chunks = ytChunks;
          captionSource = "youtube-scrape";
          fetchedCaptions++;
        }
      } else if (provider === "vimeo") {
        const [vc, vch] = await Promise.all([fetchVimeoCaptions(v.id), fetchVimeoChapters(v.id)]);
        if (vc) {
          chunks = vc;
          captionSource = "vimeo-api";
        }
        if (vch) {
          chapters = vch;
          chapterSource = "vimeo-api";
        }
      } else if (provider === "bunny") {
        const [bc, bch] = await Promise.all([fetchBunnyCaptions(v.id), fetchBunnyChapters(v.id)]);
        if (bc) {
          chunks = bc;
          captionSource = "bunny-api";
        }
        if (bch) {
          chapters = bch;
          chapterSource = "bunny-api";
        }
      }

      const authored = buildAuthoredFallback(lesson, v.duration);
      if (!chapters) {
        chapters = authored.chapters;
        if (chapterSource === "authored-fallback") fallbackCount++;
      }
      if (!chunks) {
        chunks = authored.chunks;
      }

      // Clamp chapters/chunks startSeconds to duration
      const dur = Number(v.duration) || 600;
      chapters = chapters
        .map((c) => ({ ...c, startSeconds: Math.min(Math.max(0, Math.floor(c.startSeconds)), Math.max(0, dur - 5)) }))
        .sort((a, b) => a.startSeconds - b.startSeconds)
        .slice(0, 8);
      chunks = chunks
        .map((c) => ({ ...c, startSeconds: Math.min(Math.max(0, Math.floor(c.startSeconds)), Math.max(0, dur - 5)) }))
        .sort((a, b) => a.startSeconds - b.startSeconds)
        .slice(0, 10);

      const doc = {
        _id: id,
        _type: "video",
        url,
        videoId: v.id,
        chapters: chapters.map((c, i) => ({
          _key: `${sanitized}-ch-${i}`,
          _type: "chapter",
          startSeconds: c.startSeconds,
          label: c.label,
        })),
        chunks: chunks.map((c, i) => ({
          _key: `${sanitized}-chunk-${i}`,
          _type: "chunk",
          startSeconds: c.startSeconds,
          text: c.text,
        })),
      };

      const problems = validateVideoDoc(doc);
      if (problems.length) {
        console.warn(`validate ${id} failed: ${problems.join("; ")} — skipping`);
        continue;
      }

      docs.push(doc);
      idx++;
      const chMark = chapterSource === "authored-fallback" ? "fallback" : chapterSource;
      const capMark = captionSource === "authored-fallback" ? "fallback" : captionSource;
      if (idx % 20 === 0 || idx <= 3) {
        console.log(`[${idx}] ${key} ${v.id} provider=${provider} chapters=${chMark} captions=${capMark}`);
      }
    }
  }
}

if (DRY_RUN) {
  console.log(`DRY RUN: would write ${docs.length} video docs to ${OUT}`);
  console.log(`  youtube captions scraped: ${fetchedCaptions}, chapters scraped: ${fetchedChapters}, authored fallbacks: ${fallbackCount}`);
  const sample = docs[0];
  if (sample) console.log(JSON.stringify(sample, null, 2).slice(0, 1200));
} else {
  // Final validation: no duplicate ids, every doc has chapters/chunks, _keys stable
  const ids = docs.map((d) => d._id);
  if (new Set(ids).size !== ids.length) {
    console.error("duplicate _id detected — aborting");
    process.exit(1);
  }
  writeFileSync(OUT, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
  console.log(`Wrote ${docs.length} video docs to ${OUT}`);
  console.log(`  youtube captions scraped: ${fetchedCaptions}, chapters scraped: ${fetchedChapters}, authored fallbacks: ${fallbackCount}`);
  console.log(`  providers: only youtube has real scrape; vimeo/bunny use authored fallback (not fully supported per §9 until caption API wired)`);
}
}

if (isDirectRun) {
  await main();
}
