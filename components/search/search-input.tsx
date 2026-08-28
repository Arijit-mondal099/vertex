"use client"

import {useRouter} from 'next/navigation'
import {useEffect, useState, useTransition} from 'react'
import {Icon} from '@/components/ui/icon'

export function SearchInput({initialQ}: {initialQ: string}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [, startTransition] = useTransition()

  useEffect(() => {
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
    <form
      onSubmit={submit}
      className="relative flex h-12 w-full items-center rounded-xl border border-[#ece8e6] bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]"
    >
      <Icon name="search" className="pointer-events-none absolute left-4 size-5 text-[#9ca3af]" />
      <input
        id="vertex-search-input"
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ask anything about your learning..."
        aria-label="Search your learning"
        className="h-full w-full rounded-xl bg-transparent pl-11 pr-24 text-[0.9375rem] text-neutral-900 outline-none placeholder:text-[#9ca3af]"
      />
      <div className="absolute right-2 flex items-center gap-1.5">
        {hasValue ? (
          <>
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQ('')
                document.getElementById('vertex-search-input')?.focus()
              }}
              className="flex size-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f5ece6] hover:text-black"
            >
              ×
            </button>
            <button
              type="submit"
              aria-label="Search"
              className="flex size-7 items-center justify-center rounded-md bg-[#f5ece6] text-[#6b7280] hover:bg-[#f0dfd6]"
            >
              <Icon name="search" className="size-4" />
            </button>
          </>
        ) : (
          <kbd className="hidden h-7 items-center gap-1 rounded-md border border-[#ece8e6] bg-[#fbf8f5] px-2 text-[11px] font-medium leading-none text-[#9ca3af] sm:inline-flex">
            <span>⌘</span> K
          </kbd>
        )}
      </div>
    </form>
  )
}
