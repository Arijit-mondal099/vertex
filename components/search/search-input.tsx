"use client"

import {useRouter} from 'next/navigation'
import {useEffect, useState, useTransition} from 'react'
import {Icon} from '@/components/ui/icon'

export function SearchInput({initialQ}: {initialQ: string}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [, startTransition] = useTransition()

  // sync when server q changes (navigation) — do not reset on local edits
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ(initialQ)
  }, [initialQ])

  function submit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) return
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.getElementById('vertex-search-input')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hasValue = q.trim().length > 0

  return (
    <form onSubmit={submit} className="relative flex h-20 w-full items-center rounded-2xl border border-[#f3eae5] bg-[#fdfcfb] shadow-[0_10px_28px_-12px_rgba(232,90,52,0.16)]">
      <Icon name="search" className="pointer-events-none absolute left-7 size-6 text-neutral-400" />
      <input
        id="vertex-search-input"
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ask anything about your learning..."
        aria-label="Search your learning"
        className="h-full w-full rounded-2xl bg-transparent pl-[4.25rem] pr-4 text-[1.1875rem] text-neutral-900 outline-none placeholder:text-neutral-400 sm:pr-36 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      <div className="absolute right-3 flex items-center gap-2">
        {hasValue ? (
          <>
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQ('')
                document.getElementById('vertex-search-input')?.focus()
              }}
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
