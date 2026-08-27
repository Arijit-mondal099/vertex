import {NextRequest, NextResponse} from 'next/server'
import {performSearch} from '@/sanity/lib/search'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url)
  const q = searchParams.get('q') ?? searchParams.get('query') ?? ''
  const sortParam = searchParams.get('sort') as 'relevance' | 'recent' | null
  const sort = sortParam === 'recent' ? 'recent' : 'relevance'

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      {query: q, count: 0, courseCount: 0, results: [], error: 'Query must be at least 2 characters'},
      {status: 400}
    )
  }

  if (q.length > 100) {
    return NextResponse.json(
      {query: q.slice(0, 100), count: 0, courseCount: 0, results: [], error: 'Query too long'},
      {status: 400}
    )
  }

  try {
    const res = await performSearch(q, sort)
    // Ensure we never expose internal tokens or whole transcripts — results already filtered
    return NextResponse.json(res, {
      headers: {
        'Cache-Control': 'private, max-age=10, s-maxage=10',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    // Fallback to keyword error: if embeddings disabled message, downgrade already handled in performSearch
    if (message.includes('text::semanticSimilarity') || message.includes('embeddings')) {
      // retry fallback already done, so just return empty gracefully
      return NextResponse.json({query: q, count: 0, courseCount: 0, results: []})
    }
    return NextResponse.json({query: q, count: 0, courseCount: 0, results: [], error: message}, {status: 500})
  }
}
