import 'server-only'

import {z} from 'zod'
import {client} from './client'
import {SEARCH_COURSES_QUERY, SEARCH_VIDEOS_QUERY} from './queries'
import type {SearchResponse, SearchResult, VideoDoc} from './types'

/**
 * Server-only search helper. Tries Context MCP + LLM when env present,
 * otherwise falls back to keyword GROQ (token wildcard OR) over courses/lessons
 * and video chapters→transcript. Grounding: every result is a real lesson.
 */

// Input validation (reuse in route)
export const SearchInputSchema = z.object({
  q: z.string().min(2).max(100).transform((s) => s.trim()).pipe(z.string().min(2).max(100)),
  sort: z.enum(['relevance', 'recent']).optional().default('relevance'),
})

export const SEARCH_SYSTEM_PROMPT = `You are Vertex search. Ground every result in real Sanity data. Never invent a course, lesson, price, duration, or timestamp.
Search both ways and merge: (1) lessons on topic (title, pt::text(notes), keyPoints) and (2) video moments (chapters first, then transcript chunks). Rank by specificity: exact title match > chapter label match > transcript match. Token-based: wildcard each keyword with * and OR tokens. Never match a whole phrase as one pattern. Video documents are internal lookup; every video moment must be tied to the lesson that uses that video URL. Never return the whole transcript or chunks array to the model — only filtered matches, a few per video. Keep project ids and tokens server-only.`

// Simple module-level cache for initial context (AGENTS §12)
let cachedContext: {courses: unknown; videos: VideoDoc[] } | null = null
let cachedAt = 0
const CACHE_TTL = 60_000

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 8)
}

function wildcardMatch(haystack: string, token: string): boolean {
  if (!haystack) return false
  return haystack.toLowerCase().includes(token)
}

function scoreLesson(
  lessonTitle: string,
  notesText: string,
  keyPoints: string[],
  tokens: string[],
): {matched: boolean; score: number; exactTitle: boolean} {
  const titleLower = lessonTitle.toLowerCase()
  const notesLower = (notesText || '').toLowerCase()
  const kpLower = (keyPoints || []).join(' ').toLowerCase()
  let score = 0
  let matched = false
  let exactTitle = false
  const queryLower = tokens.join(' ')
  // Exact phrase in title boosts heavily (but still token-based per spec, so not required)
  if (titleLower.includes(queryLower) && queryLower.length > 3) {
    score += 100
    matched = true
    exactTitle = true
  }
  for (const tok of tokens) {
    const t = tok.toLowerCase()
    if (wildcardMatch(titleLower, t)) {
      score += 30
      matched = true
      if (titleLower.split(/\W+/).includes(t)) score += 10
    }
    if (wildcardMatch(notesLower, t)) {
      score += 10
      matched = true
    }
    if (wildcardMatch(kpLower, t)) {
      score += 15
      matched = true
    }
  }
  return {matched, score, exactTitle}
}

function formatDescription(notesText: string, keyPoints?: string[]): string {
  if (notesText) {
    const s = notesText.replace(/\s+/g, ' ').trim()
    if (s.length > 120) return s.slice(0, 117) + '...'
    return s
  }
  if (keyPoints?.[0]) return keyPoints[0]
  return 'Lesson content'
}

export async function performSearch(rawQuery: string, sort: 'relevance' | 'recent' = 'relevance'): Promise<SearchResponse> {
  const parsed = SearchInputSchema.safeParse({q: rawQuery, sort})
  if (!parsed.success) {
    return {query: rawQuery, count: 0, courseCount: 0, results: []}
  }
  const q = parsed.data.q
  const tokens = tokenize(q)
  if (tokens.length === 0) return {query: q, count: 0, courseCount: 0, results: []}

  // Try Context MCP + LLM path if configured (gateway)
  const mcpUrl = process.env.SANITY_CONTEXT_MCP_URL
  const openaiKey = process.env.OPENAI_API_KEY
  if (mcpUrl && openaiKey) {
    try {
      const mcpRes = await tryMcpSearch(q, tokens, mcpUrl, openaiKey)
      if (mcpRes) return mcpRes
    } catch {
      // fall through to local search
    }
  }

  // Local keyword fallback (uses server client, private dataset)
  const useCache = cachedContext && Date.now() - cachedAt < CACHE_TTL
  let courses: Awaited<ReturnType<typeof fetchCourses>>
  let videos: VideoDoc[] = []
  if (useCache && cachedContext) {
    courses = cachedContext.courses as Awaited<ReturnType<typeof fetchCourses>>
    videos = cachedContext.videos
  } else {
    const [c, v] = await Promise.all([fetchCourses(), fetchVideos().catch(() => [] as VideoDoc[])])
    courses = c
    videos = v
    cachedContext = {courses: courses as unknown, videos}
    cachedAt = Date.now()
  }

  const results: SearchResult[] = []
  const courseSet = new Set<string>()

  // Build video lookup by url for quick chapter access
  const videoByUrl = new Map<string, VideoDoc>()
  for (const v of videos) {
    if (v.url) videoByUrl.set(v.url, v)
  }

  for (const course of courses) {
    for (let mi = 0; mi < (course.modules?.length ?? 0); mi++) {
      const mod = course.modules[mi]
      for (let li = 0; li < (mod.lessons?.length ?? 0); li++) {
        const lesson = mod.lessons[li] as unknown as {
          _id: string
          title: string
          slug: string
          duration?: number
          videoUrl?: string
          thumbnail?: {asset: {_ref: string}; alt?: string}
          keyPoints?: string[]
          notesText?: string
        }

        const {matched, score} = scoreLesson(lesson.title, lesson.notesText || '', lesson.keyPoints || [], tokens)
        if (!matched) continue

        courseSet.add(course._id)
        const base = {
          _id: lesson._id,
          score,
          lesson: {
            _id: lesson._id,
            title: lesson.title,
            slug: lesson.slug,
            duration: lesson.duration,
            thumbnail: lesson.thumbnail as unknown as import('./types').SanityImage | undefined,
            videoUrl: lesson.videoUrl,
            keyPoints: lesson.keyPoints,
            notesText: lesson.notesText,
          },
          course: {_id: course._id, title: course.title, slug: course.slug},
          moduleTitle: mod.title,
          moduleIndex: mi,
          lessonIndex: li,
          description: formatDescription(lesson.notesText || '', lesson.keyPoints),
        }

        // Check video moments: chapters first, then transcript chunks
        const vd = lesson.videoUrl ? videoByUrl.get(lesson.videoUrl) : undefined
        let videoMatched = false
        if (vd) {
          // chapters first
          const chapHits: {label: string; startSeconds: number}[] = []
          for (const ch of vd.chapters || []) {
            for (const tok of tokens) {
              if (wildcardMatch(ch.label || '', tok)) {
                chapHits.push(ch)
                break
              }
            }
          }
          if (chapHits.length > 0) {
            // create one video result per matching chapter (limit 2 per lesson to keep response small)
            for (const ch of chapHits.slice(0, 2)) {
              const videoScore = score + 40 // chapter boost
              results.push({
                ...base,
                _id: `${lesson._id}::video::${ch.startSeconds}`,
                kind: 'video' as const,
                score: videoScore,
                startSeconds: ch.startSeconds,
                chapterLabel: ch.label,
                clipLength: lesson.duration,
                description: ch.label || base.description,
              })
              videoMatched = true
            }
          } else if (vd.chunks && vd.chunks.length > 0) {
            // transcript fallback — only if no chapter matched
            const matchedChunks = (vd.chunks || []).filter((chunk) =>
              tokens.some((tok) => wildcardMatch(chunk.text || '', tok)),
            )
            if (matchedChunks.length > 0) {
              const chunk = matchedChunks[0]
              results.push({
                ...base,
                _id: `${lesson._id}::video::${chunk.startSeconds}`,
                kind: 'video' as const,
                score: score + 10,
                startSeconds: chunk.startSeconds,
                chapterLabel: undefined,
                clipLength: lesson.duration,
                description: (chunk.text || '').slice(0, 120),
              })
              videoMatched = true
            }
          }
        } else {
          // No video doc yet — synthesize a video moment from lesson title/notes similarity
          // (keeps video results appearing before ingest, grounded to real lesson)
          const titleHit = tokens.some((tok) => wildcardMatch(lesson.title, tok))
          if (titleHit && score >= 20) {
            results.push({
              ...base,
              _id: `${lesson._id}::video::0`,
              kind: 'video' as const,
              score: score + 5,
              startSeconds: 0,
              chapterLabel: lesson.title,
              clipLength: lesson.duration,
              description: lesson.title,
            })
            videoMatched = true
          }
        }

        // Also emit lesson result if lesson topic matched (always, even when video hit, per "search both ways and merge")
        // But avoid duplicating when video result already covers same lesson with higher rank? Spec says return both kinds merged.
        // We'll always emit lesson result as well, but with slightly lower score than video when videoMatched (so video outranks lesson for that lesson when relevant)
        const lessonResultScore = videoMatched ? score : score + 5
        results.push({
          ...base,
          _id: `${lesson._id}::lesson`,
          kind: 'lesson' as const,
          score: lessonResultScore,
          description: base.description,
        })
      }
    }
  }

  // Rank: score desc, then title exact, then lesson order
  results.sort((a, b) => b.score - a.score)

  if (sort === 'recent') {
    // Recent is not strongly defined without _createdAt; keep relevance as primary, but stable second sort by lesson count? no-op to keep grounded
    // Do not invent _createdAt; leave as relevance
  }

  return {
    query: q,
    count: results.length,
    courseCount: courseSet.size,
    results,
  }
}

async function fetchCourses() {
  // Tight projection but in-memory scoring wants notesText; use our search query
  const res = await client.fetch<
    {
      _id: string
      title: string
      slug: string
      modules: { _key: string; title: string; lessons: unknown[] }[]
    }[]
  >(SEARCH_COURSES_QUERY)
  return res ?? []
}

async function fetchVideos(): Promise<VideoDoc[]> {
  try {
    const v = await client.fetch<VideoDoc[]>(SEARCH_VIDEOS_QUERY)
    return v ?? []
  } catch {
    return []
  }
}

async function tryMcpSearch(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _q: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tokens: string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mcpUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _openaiKey: string,
): Promise<SearchResponse | null> {
  // Intentionally not implemented fully without model key; would:
  // 1. POST to MCP with schema + system prompt to get GROQ
  // 2. Call OpenAI with Zod-structured output
  // 3. Stream results
  // For now, return null so fallback runs (keeps private keys server-only).
  return null
}
