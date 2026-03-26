import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const EventSchema = z.object({
  type: z.enum(['tab_opened', 'tab_snapshot', 'tab_closed', 'tab_updated', 'tab_focused', 'history_visit']),
  browser: z.string().min(1),
  profile: z.string().min(1),
  tabId: z.number().optional().default(0),
  title: z.string().default(''),
  url: z.string().default(''),
  favicon: z.string().optional(),
  timestamp: z.number(),
  timeSpent: z.number().default(0),
  duration: z.number().default(0),
})

const BatchSchema = z.object({
  events: z.array(EventSchema),
})

function getLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function msToSeconds(milliseconds: number): number {
  return Math.floor(milliseconds / 1000)
}

function normalizeDuration(value: number): number {
  if (!value) return 0
  return value > 1000 ? Math.floor(value / 1000) : Math.floor(value)
}

async function upsertOpenTab(event: z.infer<typeof EventSchema>) {
  const existing = await prisma.tab.findFirst({
    where: {
      tabId: event.tabId,
      browser: event.browser,
      profile: event.profile,
      isOpen: true,
    },
  })

  if (existing) {
    await prisma.tab.update({
      where: { id: existing.id },
      data: {
        title: event.title,
        url: event.url,
        favicon: event.favicon,
      },
    })
    return false
  }

  await prisma.tab.create({
    data: {
      tabId: event.tabId,
      browser: event.browser,
      profile: event.profile,
      title: event.title,
      url: event.url,
      favicon: event.favicon,
      openedAt: new Date(event.timestamp),
      isOpen: true,
    },
  })

  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { events } = BatchSchema.parse(body)

    if (!events.length) {
      return NextResponse.json({ ok: true, processed: 0 })
    }

    const statsMap = new Map<string, { time: number; tabs: number; visits: number }>()

    for (const event of events) {
      const dateKey = getLocalDateKey(event.timestamp)
      const statsKey = `${dateKey}|${event.browser}|${event.profile}`
      if (!statsMap.has(statsKey)) {
        statsMap.set(statsKey, { time: 0, tabs: 0, visits: 0 })
      }
      const stats = statsMap.get(statsKey)!

      if (event.type === 'tab_opened') {
        const created = await upsertOpenTab(event)
        if (created) {
          stats.tabs += 1
        }
      }

      if (event.type === 'tab_snapshot') {
        await upsertOpenTab(event)
      }

      if (event.type === 'tab_closed') {
        const seconds = msToSeconds(event.timeSpent)
        stats.time += seconds

        await prisma.tab.updateMany({
          where: {
            tabId: event.tabId,
            browser: event.browser,
            profile: event.profile,
            isOpen: true,
          },
          data: {
            closedAt: new Date(event.timestamp),
            isOpen: false,
            timeSpent: seconds,
          },
        })
      }

      if (event.type === 'tab_updated') {
        await prisma.tab.updateMany({
          where: {
            tabId: event.tabId,
            browser: event.browser,
            profile: event.profile,
            isOpen: true,
          },
          data: {
            title: event.title,
            url: event.url,
            favicon: event.favicon,
          },
        })
      }

      if (event.type === 'tab_focused') {
        const seconds = msToSeconds(event.timeSpent)
        stats.time += seconds

        await prisma.tab.updateMany({
          where: {
            tabId: event.tabId,
            browser: event.browser,
            profile: event.profile,
            isOpen: true,
          },
          data: {
            timeSpent: { increment: seconds },
          },
        })
      }

      if (event.type === 'history_visit') {
        stats.visits += 1
        await prisma.history.create({
          data: {
            browser: event.browser,
            profile: event.profile,
            url: event.url,
            title: event.title,
            favicon: event.favicon,
            visitedAt: new Date(event.timestamp),
            duration: normalizeDuration(event.duration),
          },
        })
      }
    }

    for (const [key, value] of Array.from(statsMap.entries())) {
      const [date, browser, profile] = key.split('|')
      await prisma.dailyStats.upsert({
        where: {
          date_browser_profile: { date, browser, profile },
        },
        create: {
          date,
          browser,
          profile,
          totalTime: value.time,
          tabsOpened: value.tabs,
          visits: value.visits,
        },
        update: {
          totalTime: { increment: value.time },
          tabsOpened: { increment: value.tabs },
          visits: { increment: value.visits },
        },
      })
    }

    return NextResponse.json({ ok: true, processed: events.length })
  } catch (error) {
    console.error('[TabVault] Ingest error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'TabVault is running' })
}
