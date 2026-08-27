"use client"

import Link from 'next/link'
import {useRouter, useSearchParams} from 'next/navigation'
import type {SearchResult} from '@/sanity/lib/types'
import {Icon} from '@/components/ui/icon'
import {Pagination} from '@/components/ui/pagination'
import {urlFor} from '@/sanity/lib/image'

const V_PAGE_SIZE = 6
const L_PAGE_SIZE = 6

function formatSeconds(s: number): string {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return '—'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  let hours = h
  let mins = m
  if (mins === 60) { hours += 1; mins = 0 }
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

function CourseIcon({title, slug}: {title: string; slug: string}) {
  const key = `${title} ${slug}`.toLowerCase()
  if (key.includes('docker') || key.includes('devops')) {
    return <span className="flex size-9 items-center justify-center rounded-lg bg-[#3793ec] text-[0.7rem] font-bold text-white">D</span>
  }
  if (key.includes('typescript')) return <span className="flex size-9 items-center justify-center rounded-lg bg-[#3f7dce] text-[0.7rem] font-bold text-white">TS</span>
  if (key.includes('next.js') || key.includes('nextjs')) return <span className="flex size-9 items-center justify-center rounded-lg bg-neutral-900 text-[0.7rem] font-bold text-white">N</span>
  const letter = title.trim().charAt(0).toUpperCase() || 'V'
  return <span className="flex size-9 items-center justify-center rounded-lg bg-neutral-900 text-[0.7rem] font-bold text-white">{letter}</span>
}

function VideoCard({r}: {r: Extract<SearchResult, {kind: 'video'}>}) {
  const label = `Lesson ${r.moduleIndex + 1}.${r.lessonIndex + 1} in ${r.moduleTitle}`
  const href = `/courses/${r.course.slug}/${r.lesson.slug}?t=${r.startSeconds ?? 0}`
  const thumbUrl = r.lesson.thumbnail?.asset?._ref
    ? (() => {
        try {
          return urlFor(r.lesson.thumbnail).width(320).height(180).fit('crop').url()
        } catch {
          return null
        }
      })()
    : null
  return (
    <Link href={href} className="flex gap-4 rounded-xl border border-[#f3e8e1] bg-white p-4 shadow-[0_2px_12px_-2px_rgba(232,90,52,0.08)] transition-colors hover:bg-[#fdfcfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400">
      <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-neutral-900">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt={r.lesson.thumbnail?.alt ?? r.lesson.title} className="size-full object-cover" />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow">
            <Icon name="play-circle" className="size-5" />
          </span>
        </div>
        <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
          {r.startSeconds != null ? formatSeconds(r.startSeconds) : formatDuration(r.clipLength ?? r.lesson.duration ?? 0)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[0.6875rem] leading-4 text-[#696973]">
          <CourseIcon title={r.course.title} slug={r.course.slug} />
          <span className="truncate font-medium text-[#4b4f57]">{r.course.title}</span>
          <span className="hidden truncate sm:inline">• {label}</span>
        </div>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-5 text-black">{r.lesson.title}</h3>
        <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-5 text-[#6b7280]">{r.description}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-[#e54b21]">
          <Icon name="play-circle" className="size-4" />
          Watch from {r.startSeconds ?? 0}s
        </span>
      </div>
    </Link>
  )
}

function LessonCard({r}: {r: Extract<SearchResult, {kind: 'lesson'}>}) {
  const label = `Lesson ${r.moduleIndex + 1}.${r.lessonIndex + 1} in ${r.moduleTitle}`
  const href = `/courses/${r.course.slug}/${r.lesson.slug}`
  return (
    <Link href={href} className="flex flex-col rounded-xl border border-[#f3e8e1] bg-[#fefcfb] p-5 shadow-[0_2px_12px_-2px_rgba(232,90,52,0.08)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400">
      <div className="flex items-center gap-2 text-[0.6875rem] leading-4 text-[#696973]">
        <CourseIcon title={r.course.title} slug={r.course.slug} />
        <span className="font-medium text-[#4b4f57]">{r.course.title}</span>
        <span className="truncate">• {label}</span>
      </div>
      <h3 className="mt-3 font-semibold leading-5 text-black">{r.lesson.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-5 text-[#6b7280]">{r.description}</p>
      {r.lesson.keyPoints && r.lesson.keyPoints.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {r.lesson.keyPoints.slice(0, 3).map((kp, i) => (
            <li key={i} className="flex gap-2 text-[0.8125rem] leading-5 text-[#4b4f57]">
              <Icon name="check-circle" className="mt-0.5 size-4 shrink-0 text-[#e66b50]" />
              <span className="line-clamp-1">{kp}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <span className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-[#e54b21]">
        Open lesson
        <Icon name="arrow-right" className="size-3.5" />
      </span>
    </Link>
  )
}

export function SearchResults({
  results,
  query,
}: {
  results: SearchResult[]
  query: string
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const sort = sp.get('sort') === 'recent' ? 'recent' : 'relevance'
  const vpage = Math.max(1, parseInt(sp.get('vpage') ?? '1', 10) || 1)
  const lpage = Math.max(1, parseInt(sp.get('lpage') ?? '1', 10) || 1)

  if (!query) {
    return <p className="py-16 text-center text-body text-neutral-500">Type a query to search your learning.</p>
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#f3e8e1] bg-[#fdfcfa] px-6 py-12 text-center">
        <p className="font-display text-h2 text-black">No results for “{query}”</p>
        <p className="mx-auto mt-2 max-w-md text-body leading-6 text-[#6b7280]">
          We couldn&apos;t find any lessons matching that. Try different keywords or browse the full catalog.
        </p>
        <Link href="/courses" className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-[#e66b50] px-6 text-[0.9375rem] font-medium text-white hover:bg-[#d95a3f]">
          View all courses
        </Link>
      </div>
    )
  }

  const videoResults = results.filter((r) => r.kind === 'video') as Extract<SearchResult, {kind: 'video'}>[]
  const lessonResults = results.filter((r) => r.kind === 'lesson') as Extract<SearchResult, {kind: 'lesson'}>[]

  const vTotal = Math.max(1, Math.ceil(videoResults.length / V_PAGE_SIZE))
  const lTotal = Math.max(1, Math.ceil(lessonResults.length / L_PAGE_SIZE))
  const vSafe = Math.min(vpage, vTotal)
  const lSafe = Math.min(lpage, lTotal)
  const vSlice = videoResults.slice((vSafe - 1) * V_PAGE_SIZE, vSafe * V_PAGE_SIZE)
  const lSlice = lessonResults.slice((lSafe - 1) * L_PAGE_SIZE, lSafe * L_PAGE_SIZE)

  function onSort(v: string) {
    const params = new URLSearchParams(sp.toString())
    params.set('sort', v)
    params.set('q', query)
    params.set('vpage', '1')
    params.set('lpage', '1')
    router.push(`/search?${params.toString()}`)
  }

  function goToVPage(p: number) {
    const params = new URLSearchParams(sp.toString())
    params.set('q', query)
    params.set('sort', sort)
    params.set('vpage', String(p))
    if (!sp.get('lpage')) params.set('lpage', String(lSafe))
    router.push(`/search?${params.toString()}`)
  }

  function goToLPage(p: number) {
    const params = new URLSearchParams(sp.toString())
    params.set('q', query)
    params.set('sort', sort)
    params.set('lpage', String(p))
    if (!sp.get('vpage')) params.set('vpage', String(vSafe))
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-body text-[#4b4f57]">
          Found <span className="font-semibold text-black">{results.length}</span> results
          <span className="hidden sm:inline"> • ordered by {sort === 'recent' ? 'recent' : 'most relevant'}</span>
        </p>
        <label className="inline-flex items-center gap-2 text-small">
          <span className="text-[#6b7280]">Sort</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="rounded-md border border-[#e8ddd6] bg-white px-2.5 py-1.5 text-small text-black shadow-sm"
          >
            <option value="relevance">Most relevant</option>
            <option value="recent">Recent</option>
          </select>
        </label>
      </div>

      {videoResults.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="font-display text-h2 font-semibold text-black">Video moments</h2>
              <p className="mt-1 text-small text-[#6b7280]">Chapters first, then transcript matches — each links to the exact second.</p>
            </div>
            <span className="shrink-0 text-small text-neutral-500">
              {videoResults.length} results
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {vSlice.map((r) => (
              <VideoCard key={r._id} r={r} />
            ))}
          </div>
          {vTotal > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={vSafe} total={vTotal} onPageChange={goToVPage} />
            </div>
          )}
        </section>
      )}

      {lessonResults.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="font-display text-h2 font-semibold text-black">Lessons</h2>
              <p className="mt-1 text-small text-[#6b7280]">Matched on title, key points, and notes.</p>
            </div>
            <span className="shrink-0 text-small text-neutral-500">
              {lessonResults.length} results
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {lSlice.map((r) => (
              <LessonCard key={r._id} r={r} />
            ))}
          </div>
          {lTotal > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination page={lSafe} total={lTotal} onPageChange={goToLPage} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
