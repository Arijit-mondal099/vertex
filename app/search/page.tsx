import type {Metadata} from 'next'
import Link from 'next/link'
import {Show, SignInButton, SignUpButton, UserButton} from '@clerk/nextjs'
import {Icon} from '@/components/ui/icon'
import {Logo} from '@/components/ui/logo'
import {performSearch} from '@/sanity/lib/search'
import {SearchInput} from '@/components/search/search-input'
import {SearchResults} from '@/components/search/search-results'

export const metadata: Metadata = {
  title: 'Search — Vertex',
  description: 'Search your learning in plain English.',
}

const BAR_LEFT = [[7.4,48],[6.3,65],[4.0,79],[5.8,97],[9.3,69],[5.3,50]] as const
const BAR_RIGHT = [[3.2,35],[9.2,45],[7.4,59],[6.2,79],[5.5,97],[5.1,57],[3.9,68],[5.3,80],[5.3,87]] as const
function FooterBar({w,h}:{w:number;h:number}) {
  return <div className="bg-linear-to-b from-transparent via-[#fda98c] via-60% to-[#fdbea5]" style={{width:`${w}%`,height:`${h}%`}} />
}

const PAGE_SIZE = 5

function buildPageHref(q: string, sort: string, page: number) {
  const params = new URLSearchParams()
  params.set('q', q)
  params.set('sort', sort)
  if (page > 1) params.set('page', String(page))
  return `/search?${params.toString()}`
}

function pagesFor(page: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 6) return Array.from({length: total}, (_, i) => i + 1)
  if (page <= 3) return [1, 2, 3, 'ellipsis', total]
  if (page >= total - 2) return [1, 'ellipsis', total - 2, total - 1, total]
  return [1, 'ellipsis', page, 'ellipsis', total]
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{q?: string; sort?: string; page?: string}>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const sort = sp.sort === 'recent' ? 'recent' : 'relevance'
  const rawPage = parseInt(sp.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1

  let data: Awaited<ReturnType<typeof performSearch>> | null = null
  if (q.length >= 2) {
    data = await performSearch(q, sort)
  }

  const count = data?.count ?? 0
  const courseCount = data?.courseCount ?? 0
  const hasQuery = q.length >= 2
  const totalPages = data ? Math.max(1, Math.ceil(data.results.length / PAGE_SIZE)) : 1
  const currentPage = Math.min(page, totalPages)
  const paginatedResults = data ? data.results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : []

  return (
    <div className="flex-1 bg-[#fbf8f5] bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_8.2px,#f3e9e1_8.2px,#f3e9e1_9.2px)]">
      <div className="mx-auto w-[94%] max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]">
        {/* Header — matches home header, Courses active orange per reference */}
        <header className="border-b border-[#f2eae5]">
          <div className="flex h-[64px] items-center justify-between px-6 lg:px-10">
            <div className="flex items-center gap-8">
              <Link href="/" aria-label="Vertex home"><Logo /></Link>
              <nav className="hidden items-center gap-6 sm:flex">
                <Link href="/courses" className="text-[13px] font-semibold text-[#e54b21]">Courses</Link>
                <Link href="#" className="text-[13px] font-medium text-[#6b7280] hover:text-neutral-900">My Learning</Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Show when="signed-out">
                <SignInButton><button type="button" className="text-[13px] font-medium text-neutral-900 hover:text-[#e54b21]">Sign in</button></SignInButton>
                <SignUpButton><button type="button" className="inline-flex h-9 items-center rounded-full bg-[#e54b21] px-5 text-[13px] font-semibold text-white hover:bg-[#d43e15]">Get started</button></SignUpButton>
              </Show>
              <Show when="signed-in">
                <button type="button" aria-label="Notifications" className="text-[#6b7280] hover:text-neutral-900"><Icon name="bell" className="size-5" /></button>
                <UserButton />
              </Show>
            </div>
          </div>
        </header>

        {/* Hero — pill + serif title + subtitle + compact input */}
        <section className="px-6 pb-6 pt-8 text-center lg:px-10">
          <span className="inline-flex items-center rounded-full bg-[#fef2ec] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e54b21]">
            Search Results
          </span>
          <h1 className="mt-3 font-display text-[28px] font-bold leading-tight text-black sm:text-[34px]">
            Results for <span className="font-display italic font-semibold text-[#e54b21]">“{hasQuery ? q : 'data fetching'}”</span>
          </h1>
          {hasQuery ? (
            <p className="mt-2 text-[13px] leading-5 text-[#6b7280]">
              Found {count} results across {courseCount} courses
            </p>
          ) : (
            <p className="mt-2 text-[13px] leading-5 text-[#9ca3af]">Found 28 results across 8 courses</p>
          )}
          <div className="mx-auto mt-6 max-w-[640px]">
            <SearchInput initialQ={q} />
          </div>
        </section>

        {/* Results */}
        <section className="px-6 pb-6 lg:px-10">
          {!hasQuery ? (
            <div className="rounded-xl border border-dashed border-[#f0e6e0] bg-[#fdfcfa] px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-[#333439]">Start typing to search across all your courses.</p>
              <p className="mt-1 text-[13px] text-[#6b7280]">Try “caching and revalidation”, “useTransition”, or “Zod validation”.</p>
              <Link href="/courses" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e54b21] hover:text-[#d43e15]">
                View all courses <Icon name="arrow-right" className="size-4" />
              </Link>
            </div>
          ) : data ? (
            <>
              <SearchResults results={paginatedResults} query={data.query} count={count} courseCount={courseCount} />
              {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-1">
                  <Link
                    aria-label="Previous page"
                    href={buildPageHref(q, sort, Math.max(1, currentPage - 1))}
                    aria-disabled={currentPage <= 1}
                    className={`inline-flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage <= 1 ? 'pointer-events-none text-neutral-300' : 'text-neutral-500 hover:text-neutral-900'}`}
                  >
                    <Icon name="chevron-left" className="size-4" />
                  </Link>
                  {pagesFor(currentPage, totalPages).map((p, i) =>
                    p === 'ellipsis' ? (
                      <span key={`e-${i}`} className="inline-flex size-9 items-center justify-center text-sm text-neutral-400">
                        …
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={buildPageHref(q, sort, p)}
                        aria-current={p === currentPage ? 'page' : undefined}
                        className={`inline-flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${p === currentPage ? 'border border-primary-500 bg-white text-primary-500' : 'text-neutral-700 hover:bg-neutral-100'}`}
                      >
                        {p}
                      </Link>
                    ),
                  )}
                  <Link
                    aria-label="Next page"
                    href={buildPageHref(q, sort, Math.min(totalPages, currentPage + 1))}
                    aria-disabled={currentPage >= totalPages}
                    className={`inline-flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage >= totalPages ? 'pointer-events-none text-neutral-300' : 'text-neutral-500 hover:text-neutral-900'}`}
                  >
                    <Icon name="chevron-right" className="size-4" />
                  </Link>
                </nav>
              )}
            </>
          ) : null}
        </section>

        <div className="mt-2 flex items-center gap-4 px-6 lg:px-10">
          <div className="h-px flex-1 bg-[#f4ede8]" />
          <p className="flex items-center gap-2 text-[13px] text-[#6b7280]"><Icon name="star" className="size-4 text-[#f45f33]" />New courses and lessons added every week.</p>
          <div className="h-px flex-1 bg-[#f4ede8]" />
        </div>

        <div aria-hidden="true" className="flex h-36 items-end sm:h-44 lg:h-52">
          {BAR_LEFT.map(([w,h],i) => <FooterBar key={`l${i}`} w={w} h={h} />)}
          <div className="shrink-0" style={{width:'10.6%'}} />
          {BAR_RIGHT.map(([w,h],i) => <FooterBar key={`r${i}`} w={w} h={h} />)}
        </div>
      </div>
    </div>
  )
}
