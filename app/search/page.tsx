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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{q?: string; sort?: string}>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const sort = sp.sort === 'recent' ? 'recent' : 'relevance'

  let data: Awaited<ReturnType<typeof performSearch>> | null = null
  if (q.length >= 2) {
    data = await performSearch(q, sort)
  }

  const count = data?.count ?? 0
  const courseCount = data?.courseCount ?? 0

  return (
    <div className="flex-1 bg-[#fbf8f5] bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_8.2px,#f3e9e1_8.2px,#f3e9e1_9.2px)]">
      <div className="mx-auto w-[94%] max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]">
        {/* Header */}
        <header className="border-b border-[#f2eae5]">
          <div className="flex h-24 items-center px-6 lg:px-14">
            <div className="flex min-w-0 flex-1 items-center gap-10">
              <Link href="/" aria-label="Vertex home"><Logo /></Link>
              <ul className="hidden items-center gap-7 sm:flex">
                <li><Link href="/courses" className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]">Courses</Link></li>
                <li><a href="#" className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]">My Learning</a></li>
              </ul>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <Show when="signed-out">
                <SignInButton><button type="button" className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]">Sign in</button></SignInButton>
                <SignUpButton><button type="button" className="inline-flex h-11 items-center rounded-[10px] bg-[#e66b50] px-5 text-[0.9375rem] font-medium text-white shadow-[0_4px_12px_-2px_rgba(230,107,80,0.35)] transition-colors hover:bg-[#d95a3f]">Get started</button></SignUpButton>
              </Show>
              <Show when="signed-in">
                <button type="button" aria-label="Notifications" className="text-[#413f3f] transition-colors hover:text-neutral-950"><Icon name="bell" className="size-6" /></button>
                <UserButton />
              </Show>
            </div>
          </div>
        </header>

        {/* Search hero */}
        <section className="px-6 pb-8 pt-8 lg:px-14">
          <h1 className="font-display text-display-2 text-black">Search your learning</h1>
          <p className="mt-2 text-body leading-6 text-[#4b4f57]">Plain English, ranked results — video moments and lessons, grounded in your courses.</p>
          <div className="mt-6">
            <SearchInput initialQ={q} />
          </div>

          {q.length >= 2 && data ? (
            <div className="mt-6 flex flex-wrap items-center gap-2 text-small">
              <span className="text-[#6b7280]">Found</span>
              <span className="font-semibold text-black">{count} result{count===1?'':'s'}</span>
              <span className="text-[#6b7280]">across</span>
              <span className="font-semibold text-black">{courseCount} course{courseCount===1?'':'s'}</span>
              <span className="text-[#6b7280]">for “{q}”</span>
            </div>
          ) : q.length >= 2 ? null : (
            <p className="mt-6 text-small text-[#6b7280]">Try “caching and revalidation”, “useTransition”, or “Zod validation”.</p>
          )}
        </section>

        <div className="h-px bg-[#f5ede7]" />

        {/* Results */}
        <section className="px-6 pb-6 pt-6 lg:px-14">
          {q.length < 2 ? (
            <div className="rounded-xl border border-dashed border-[#f3e8e1] bg-[#fdfcfa] px-6 py-12 text-center">
              <p className="text-body-lg text-[#333439]">Start typing to search across all your courses.</p>
              <Link href="/courses" className="mt-4 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-[#e54b21] hover:text-[#d43e15]">
                View all courses <Icon name="arrow-right" className="size-4" />
              </Link>
            </div>
          ) : data ? (
            <SearchResults results={data.results} query={data.query} />
          ) : null}
        </section>

        <div className="mt-6 flex items-center gap-4 lg:gap-6 px-6 lg:px-14">
          <div className="h-px flex-1 bg-[#f4ede8]" />
          <p className="flex items-center gap-3 text-body-lg text-[#333439]"><Icon name="star" className="size-6 text-[#f45f33]" />New courses and lessons added every week.</p>
          <div className="h-px flex-1 bg-[#f4ede8]" />
        </div>

        <div aria-hidden="true" className="flex h-44 items-end sm:h-52 lg:h-60">
          {BAR_LEFT.map(([w,h],i) => <FooterBar key={`l${i}`} w={w} h={h} />)}
          <div className="shrink-0" style={{width:'10.6%'}} />
          {BAR_RIGHT.map(([w,h],i) => <FooterBar key={`r${i}`} w={w} h={h} />)}
        </div>
      </div>
    </div>
  )
}
