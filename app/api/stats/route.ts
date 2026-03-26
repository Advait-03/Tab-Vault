import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTrackedBrowserIds } from '@/lib/browser-state'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = Math.min(90, Math.max(1, Number(searchParams.get('days') ?? 30)))
    const trackedBrowserIds = await getTrackedBrowserIds()

    if (!trackedBrowserIds.length) {
      return NextResponse.json({
        daily: [],
        totalTabs: 0,
        totalTime: 0,
        totalVisits: 0,
        tabsOpened: 0,
        browsers: [],
        today: { totalTime: 0, tabsOpened: 0, visits: 0 },
        trackedBrowsers: [],
        range: { from: null, to: null, days },
      })
    }

    // ── Date range ────────────────────────────────────────────────────────────
    // Build the date string for N days ago using LOCAL date (not UTC).
    // Same reason as ingest fix: UTC causes off-by-one errors in IST after 6:30 PM.
    const today = new Date()
    const from  = new Date(today)
    from.setDate(from.getDate() - (days - 1))

    const toLocalDateString = (d: Date): string => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    const fromDate = toLocalDateString(from)
    const toDate   = toLocalDateString(today)

    // ── Daily stats rows (for the bar chart) ─────────────────────────────────
    const daily = await prisma.dailyStats.findMany({
      where: {
        browser: { in: trackedBrowserIds },
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: { date: 'asc' },
    })

    // ── Totals for the stats row cards ────────────────────────────────────────
    const totals = daily.reduce(
      (acc, row) => ({
        totalTime:   acc.totalTime   + row.totalTime,
        tabsOpened:  acc.tabsOpened  + row.tabsOpened,
        totalVisits: acc.totalVisits + row.visits,
      }),
      { totalTime: 0, tabsOpened: 0, totalVisits: 0 }
    )

    // ── Per-browser breakdown (for TodayBreakdown + legend) ──────────────────
    // Group by browser across ALL days in range and sum time + visits
    const browserMap = new Map<string, { totalTime: number; visits: number; tabsOpened: number }>()
    for (const row of daily) {
      const existing = browserMap.get(row.browser) ?? { totalTime: 0, visits: 0, tabsOpened: 0 }
      browserMap.set(row.browser, {
        totalTime:  existing.totalTime  + row.totalTime,
        visits:     existing.visits     + row.visits,
        tabsOpened: existing.tabsOpened + row.tabsOpened,
      })
    }

    const browsers = Array.from(browserMap.entries())
      .map(([browser, data]) => ({ browser, ...data }))
      .sort((a, b) => b.totalTime - a.totalTime)

    // ── Open tabs count ───────────────────────────────────────────────────────
    const totalTabs = await prisma.tab.count({
      where: {
        isOpen: true,
        browser: { in: trackedBrowserIds },
      },
    })

    // ── Today-only stats (for the StatsRow "today" cards) ─────────────────────
    const todayStr   = toLocalDateString(today)
    const todayRows  = daily.filter(r => r.date === todayStr)
    const todayStats = todayRows.reduce(
      (acc, row) => ({
        totalTime:  acc.totalTime  + row.totalTime,
        tabsOpened: acc.tabsOpened + row.tabsOpened,
        visits:     acc.visits     + row.visits,
      }),
      { totalTime: 0, tabsOpened: 0, visits: 0 }
    )

    return NextResponse.json({
      // Raw daily rows — used by BarChart to build per-day bars
      daily,

      // Aggregate totals for the requested date range
      totalTabs,
      totalTime:   totals.totalTime,
      totalVisits: totals.totalVisits,
      tabsOpened:  totals.tabsOpened,

      // Per-browser breakdown sorted by time desc
      browsers,

      // Today-only breakdown — used by StatsRow cards
      today: todayStats,
      trackedBrowsers: trackedBrowserIds,

      // Meta
      range: { from: fromDate, to: toDate, days },
    })

  } catch (err) {
    console.error('[TabVault] Stats error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
