"use client"

import Link from 'next/link'
import {useRouter, useSearchParams} from 'next/navigation'
import type {SearchResult} from '@/sanity/lib/types'
import {Icon} from '@/components/ui/icon'
import {urlFor} from '@/sanity/lib/image'

function formatMmSs(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function CourseBadge({title, slug}: {title: string; slug: string}) {
  const key = `${title} ${slug}`.toLowerCase()
  // N black, JS yellow, React blue, Docker blue — match reference top-left course icon
  if (key.includes('next.js') || key.includes('nextjs')) {
    return <span className="flex size-6 items-center justify-center rounded-md bg-black text-[11px] font-bold leading-none text-white">N</span>
  }
  if (key.includes('typescript')) {
    return <span className="flex size-6 items-center justify-center rounded-md bg-[#f7df1e] text-[10px] font-bold leading-none text-black">TS</span>
  }
  if (key.includes('react')) {
    return <span className="flex size-6 items-center justify-center rounded-md bg-[#61dafb] text-[10px] font-bold leading-none text-black">⚛</span>
  }
  if (key.includes('node')) {
    return <span className="flex size-6 items-center justify-center rounded-md bg-[#7ec83a] text-[10px] font-bold leading-none text-white">JS</span>
  }
  if (key.includes('docker') || key.includes('devops')) {
    return <span className="flex size-6 items-center justify-center rounded-md bg-[#3793ec] text-[10px] font-bold leading-none text-white">D</span>
  }
  if (key.includes('javascript')) {
    return <span className="flex size-6 items-center justify-center rounded-md bg-[#f7df1e] text-[10px] font-bold leading-none text-black">JS</span>
  }
  const ch = title.trim().charAt(0).toUpperCase() || 'V'
  return <span className="flex size-6 items-center justify-center rounded-md bg-black text-[11px] font-bold leading-none text-white">{ch}</span>
}

function VideoCard({r}: {r: Extract<SearchResult, {kind: 'video'}>}) {
  const href = `/courses/${r.course.slug}/${r.lesson.slug}?t=${r.startSeconds ?? 0}`
  const thumb = r.lesson.thumbnail?.asset?._ref
    ? (() => { try { return urlFor(r.lesson.thumbnail).width(480).height(270).fit('crop').url() } catch { return null }})()
    : null
  // duration badge uses startSeconds per reference "12:45" is the seek point, not total duration
  const badge = r.startSeconds != null ? formatMmSs(r.startSeconds) : '00:00'
  const lessonLabel = `Lesson ${r.moduleIndex + 1}.${r.lessonIndex + 1}`
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-xl border border-[#f0e6e0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:bg-[#fefcfb] md:flex-row md:items-center"
    >
      {/* thumbnail */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg bg-black md:h-[126px] md:w-[220px]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={r.lesson.thumbnail?.alt ?? r.lesson.title} className="h-full w-full object-cover opacity-90" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-white/80">
            <CourseBadge title={r.course.title} slug={r.course.slug} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-white shadow-md">
            <span className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-black" aria-hidden />
          </span>
        </div>
        <span className="absolute bottom-2 right-2 rounded-md bg-black px-1.5 py-1 text-[11px] font-medium leading-none text-white">
          {badge}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CourseBadge title={r.course.title} slug={r.course.slug} />
            <span className="text-[12px] font-medium leading-4 text-[#6b7280]">{r.course.title}</span>
          </div>
          <span className="shrink-0 rounded-md bg-[#fff2eb] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#e54b21]">Video</span>
        </div>
        <h3 className="mt-2 text-[14px] font-semibold leading-5 text-black line-clamp-1 group-hover:text-[#e54b21]">{r.lesson.title}</h3>
        <p className="mt-1 text-[13px] leading-[18px] text-[#6b7280] line-clamp-2">{r.description}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] leading-4 text-[#6b7280]">
            <Icon name="file-text" className="size-3.5" />
            {lessonLabel}
            <span className="mx-1 text-[#d1d5db]">·</span>
            <Icon name="folder" className="size-3.5" />
            {r.moduleTitle}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#e54b21]">
            <Icon name="play-circle" className="size-4" />
            Watch from {badge}
            <Icon name="chevron-right" className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function LessonCard({r}: {r: Extract<SearchResult, {kind: 'lesson'}>}) {
  const href = `/courses/${r.course.slug}/${r.lesson.slug}`
  const lessonLabel = `Lesson ${r.moduleIndex + 1}.${r.lessonIndex + 1}`
  // left pane bullets: use keyPoints or derive from description fallback
  const bullets = (r.lesson.keyPoints && r.lesson.keyPoints.length > 0)
    ? r.lesson.keyPoints.slice(0, 3)
    : [r.description].filter(Boolean).slice(0, 3)
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-xl border border-[#f0e6e0] bg-white p-4 hover:bg-[#fefcfb] md:flex-row md:items-center"
    >
      <div className="relative flex h-36 w-full shrink-0 flex-col rounded-lg border border-[#f5ece6] bg-[#fdfaf7] p-3 md:h-[126px] md:w-[220px]">
        <div className="flex items-center gap-1.5 text-[#9ca3af]">
          <Icon name="file-text" className="size-4" />
        </div>
        <ul className="mt-2 space-y-1.5">
          {bullets.slice(0,3).map((b, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12px] leading-4 text-[#6b7280]">
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#9ca3af]" />
              <span className="line-clamp-1">{b}</span>
            </li>
          ))}
        </ul>
        <span className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full bg-white shadow-sm">
          <Icon name="check-circle" className="size-4 text-[#6b7280]" />
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CourseBadge title={r.course.title} slug={r.course.slug} />
            <span className="text-[12px] font-medium leading-4 text-[#6b7280]">{r.course.title}</span>
          </div>
          <span className="shrink-0 rounded-md bg-[#eef0ff] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6d64d6]">Lesson</span>
        </div>
        <h3 className="mt-2 text-[14px] font-semibold leading-5 text-black group-hover:text-[#e54b21]">{r.lesson.title}</h3>
        <p className="mt-1 text-[13px] leading-[18px] text-[#6b7280] line-clamp-2">{r.description}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] leading-4 text-[#6b7280]">
            {r.moduleTitle ? `Module ${r.moduleIndex + 1}` : null}
            {r.moduleTitle ? <span className="hidden sm:inline"> · {r.moduleTitle}</span> : null}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#e54b21]">
            View lesson
            <Icon name="external-link" className="size-3.5" />
            <Icon name="chevron-right" className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function SearchResults({
  results,
  query,
  count,
  courseCount: _courseCount,
}: {
  results: SearchResult[]
  query: string
  count: number
  courseCount: number
}) {
  void _courseCount
  const router = useRouter()
  const sp = useSearchParams()
  const sort = sp.get('sort') === 'recent' ? 'recent' : 'relevance'

  function onSort(v: string) {
    const params = new URLSearchParams(sp.toString())
    params.set('sort', v)
    if (query) params.set('q', query)
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  if (!query) {
    return <p className="py-10 text-center text-sm text-neutral-500">Type a query to search.</p>
  }

  if (results.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-[#f0e6e0] bg-[#fdfcfa] px-6 py-10 text-center">
          <p className="font-semibold text-black">No results for “{query}”</p>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-5 text-[#6b7280]">
            We couldn&apos;t find any lessons matching that. Try different keywords or browse the full catalog.
          </p>
        </div>
        <BottomBanner />
      </div>
    )
  }

  // Single ranked feed (interleaved VIDEO + LESSON) in performSearch order
  const sorted = [...results].sort((a, b) => b.score - a.score)

  return (
    <div>
      {/* count + sort row — matches reference bar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] font-medium text-black">{count} results</p>
        <label className="inline-flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="h-9 rounded-xl border border-[#ece8e6] bg-white px-3 pr-8 text-[13px] font-medium text-black shadow-sm outline-none"
          >
            <option value="relevance">Most Relevant</option>
            <option value="recent">Recent</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {sorted.map((r) =>
          r.kind === 'video' ? <VideoCard key={r._id} r={r as Extract<SearchResult,{kind:'video'}>} /> : <LessonCard key={r._id} r={r as Extract<SearchResult,{kind:'lesson'}>} />
        )}
      </div>

      <div className="mt-4">
        <BottomBanner />
      </div>
    </div>
  )
}

function BottomBanner() {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[#fcefe6] bg-[#fef7f2] p-4 sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ffe9de] text-[#e54b21]">
          <Icon name="search" className="size-5" />
        </span>
        <div>
          <p className="text-[13px] font-semibold leading-4 text-black">Can&apos;t find what you&apos;re looking for?</p>
          <p className="text-[12px] leading-4 text-[#6b7280]">Try different keywords or browse our full course catalog.</p>
        </div>
      </div>
      <Link href="/courses" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#f2e2d9] bg-white px-5 text-[13px] font-semibold text-[#e54b21] hover:bg-[#fffaf7]">
        Browse all courses
        <Icon name="arrow-right" className="size-4" />
      </Link>
    </div>
  )
}
