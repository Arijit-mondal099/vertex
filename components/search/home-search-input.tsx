"use client"

import {useRouter} from 'next/navigation'
import {useState} from 'react'
import {Icon} from '@/components/ui/icon'

export function HomeSearchInput() {
  const router = useRouter()
  const [q, setQ] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const hasValue = q.trim().length > 0

  return (
    <form onSubmit={submit} className="relative mx-auto mt-12 flex h-20 w-[87.5%] items-center rounded-2xl border border-[#f3eae5] bg-[#fdfcfb] shadow-[0_10px_28px_-12px_rgba(232,90,52,0.16)]">
      <Icon name="search" className="pointer-events-none absolute left-7 size-6 text-neutral-400" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ask anything about your learning..."
        aria-label="Search your learning"
        className="h-full w-full rounded-2xl bg-transparent pl-[4.25rem] pr-4 text-[1.1875rem] text-neutral-900 outline-none placeholder:text-neutral-400 sm:pr-36"
      />
      <div className="absolute right-3 flex items-center gap-2">
        {hasValue ? (
          <>
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQ('')}
              className="flex size-8 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3e8e1] hover:text-black"
            >
              ×
            </button>
            <button
              type="submit"
              className="hidden h-9 items-center rounded-md bg-[#e66b50] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#d95a3f] sm:inline-flex"
            >
              Search
            </button>
          </>
        ) : (
          <kbd className="hidden h-9 items-center rounded-md border border-[#f1e8e0] bg-white px-3 text-body text-[#696973] sm:inline-flex">⌘ K</kbd>
        )}
      </div>
    </form>
  )
}
