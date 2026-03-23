import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days  = Number(searchParams.get('days') ?? 30)
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]

  const [daily, totalTabs, totalVisits, timeAgg, byBrowser] = await Promise.all([
    prisma.dailyStats.findMany({
      where:   { date: { gte: sinceStr } },
      orderBy: { date: 'asc' },
    }),
    prisma.tab.count({ where: { isOpen: true } }),
    prisma.history.count({ where: { visitedAt: { gte: since } } }),
    prisma.dailyStats.aggregate({
      where: { date: { gte: sinceStr } },
      _sum:  { totalTime: true },
    }),
    prisma.dailyStats.groupBy({
      by:      ['browser'],
      where:   { date: { gte: sinceStr } },
      _sum:    { totalTime: true, visits: true },
      orderBy: { _sum: { totalTime: 'desc' } },
    }),
  ])

  return NextResponse.json({
    daily,
    totalTabs,
    totalTime:   timeAgg._sum.totalTime ?? 0,
    totalVisits,
    browsers: byBrowser.map((b) => ({
      browser:   b.browser,
      totalTime: b._sum.totalTime ?? 0,
      visits:    b._sum.visits    ?? 0,
    })),
  })
}
