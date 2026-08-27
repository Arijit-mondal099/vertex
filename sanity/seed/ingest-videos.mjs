/**
 * Offline video pipeline — builds `video` documents (AGENTS.md §9).
 * One per unique videoUrl, keyed by id derived from URL stripping illegal chars.
 * Never runs in request path. Run then: sanity dataset import videos.ndjson production --replace
 *
 *  node sanity/seed/ingest-videos.mjs
 */
import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {courses} from './content.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const VIDEOS_PATH = join(HERE, 'videos.json')
const OUT = join(HERE, 'videos.ndjson')

const videos = JSON.parse(readFileSync(VIDEOS_PATH, 'utf8'))

function sanitizeId(url) {
  // Strip protocol, replace illegal datastore chars (anything not alnum _ -)
  const raw = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return raw.slice(0, 128)
}

const docs = []
for (const course of courses) {
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const key = `${course.slug}-${lesson.slug}`
      const v = videos[key]
      if (!v) continue
      const url = `https://www.youtube.com/watch?v=${v.id}`
      const id = `video.${sanitizeId(url)}`
      if (docs.find((d) => d._id === id)) continue

      // Chapters: derive from keyPoints if available else generic
      const chapters = (lesson.points || []).slice(0, 4).map((label, i) => ({
        _key: `${sanitizeId(url)}-ch-${i}`,
        _type: 'chapter',
        startSeconds: i * 60,
        label,
      }))
      if (chapters.length === 0) {
        chapters.push({_key: `${sanitizeId(url)}-ch-0`, _type: 'chapter', startSeconds: 0, label: lesson.title})
      }

      const chunks = [
        {
          _key: `${sanitizeId(url)}-chunk-0`,
          _type: 'chunk',
          startSeconds: 0,
          text: lesson.summary || lesson.title,
        },
        ...(lesson.points || []).map((p, i) => ({
          _key: `${sanitizeId(url)}-chunk-${i + 1}`,
          _type: 'chunk',
          startSeconds: (i + 1) * 45,
          text: p,
        })),
      ]

      docs.push({
        _id: id,
        _type: 'video',
        url,
        videoId: v.id,
        chapters,
        chunks,
      })
    }
  }
}

writeFileSync(OUT, docs.map((d) => JSON.stringify(d)).join('\n') + '\n')
console.log(`Wrote ${docs.length} video docs to ${OUT}`)
