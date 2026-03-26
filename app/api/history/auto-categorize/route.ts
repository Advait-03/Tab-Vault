import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function scoreHistoryItem({
  title,
  url,
  categoryName,
  examples,
}: {
  title: string
  url: string
  categoryName: string
  examples: { title: string; url: string }[]
}) {
  const domain = hostname(url)
  const tokens = new Set([...tokenize(title), ...tokenize(url), ...tokenize(domain)])
  let score = 0

  for (const token of tokenize(categoryName)) {
    if (tokens.has(token)) score += 4
  }

  for (const example of examples) {
    const exampleDomain = hostname(example.url)
    if (exampleDomain && exampleDomain === domain) score += 6

    for (const token of tokenize(example.title)) {
      if (tokens.has(token)) score += 1
    }
  }

  const keywordMap: Record<string, string[]> = {
    work: ['github', 'jira', 'slack', 'notion', 'meet', 'calendar'],
    research: ['docs', 'paper', 'arxiv', 'wikipedia', 'reference'],
    learning: ['course', 'tutorial', 'learn', 'academy', 'udemy', 'youtube'],
    shopping: ['amazon', 'flipkart', 'checkout', 'cart', 'store'],
    entertainment: ['netflix', 'primevideo', 'youtube', 'spotify', 'hotstar'],
    personal: ['mail', 'bank', 'drive', 'photos'],
  }

  for (const [categoryToken, keywords] of Object.entries(keywordMap)) {
    if (!categoryName.toLowerCase().includes(categoryToken)) continue
    for (const keyword of keywords) {
      if (tokens.has(keyword) || domain.includes(keyword)) score += 2
    }
  }

  return { score, domain }
}

export async function POST() {
  const [categories, labeledHistory, uncategorized] = await Promise.all([
    prisma.category.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.history.findMany({
      where: { categoryId: { not: null } },
      orderBy: { visitedAt: 'desc' },
      take: 400,
      include: { category: true },
    }),
    prisma.history.findMany({
      where: { categoryId: null },
      orderBy: { visitedAt: 'desc' },
      take: 150,
    }),
  ])

  const examplesByCategory = new Map<number, { title: string; url: string }[]>()
  for (const item of labeledHistory) {
    if (!item.categoryId) continue
    const examples = examplesByCategory.get(item.categoryId) ?? []
    examples.push({ title: item.title, url: item.url })
    examplesByCategory.set(item.categoryId, examples.slice(0, 20))
  }

  const updates = []

  for (const item of uncategorized) {
    let best:
      | {
          categoryId: number
          categoryName: string
          score: number
          domain: string
        }
      | undefined

    for (const category of categories) {
      const result = scoreHistoryItem({
        title: item.title,
        url: item.url,
        categoryName: category.name,
        examples: examplesByCategory.get(category.id) ?? [],
      })

      if (!best || result.score > best.score) {
        best = {
          categoryId: category.id,
          categoryName: category.name,
          score: result.score,
          domain: result.domain,
        }
      }
    }

    if (!best || best.score < 3) continue

    updates.push(
      prisma.history.update({
        where: { id: item.id },
        data: {
          categoryId: best.categoryId,
          note: best.domain
            ? `Auto-matched from ${best.domain} and similar ${best.categoryName.toLowerCase()} activity.`
            : `Auto-matched to ${best.categoryName}.`,
        },
      })
    )
  }

  await Promise.all(updates)
  return NextResponse.json({ ok: true, updated: updates.length })
}
