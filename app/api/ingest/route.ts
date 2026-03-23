import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const EventSchema = z.object({
  type:      z.enum(['tab_opened','tab_closed','tab_updated','tab_focused','history_visit']),
  browser:   z.string().min(1),
  profile:   z.string().min(1),
  tabId:     z.number().optional().default(0),
  title:     z.string().default(''),
  url:       z.string().default(''),
  favicon:   z.string().optional(),
  timestamp: z.number(),
  timeSpent: z.number().default(0),
  duration:  z.number().default(0),
})

const BatchSchema = z.object({ events: z.array(EventSchema) })

export async function POST(req: NextRequest) {
  try {
    const body         = await req.json()
    const { events }   = BatchSchema.parse(body)
    if (!events.length) return NextResponse.json({ ok: true, processed: 0 })

    const tabOps:     any[] = []
    const historyOps: any[] = []
    const statsMap = new Map<string, { time: number; tabs: number; visits: number }>()

    for (const e of events) {
      const dateKey  = new Date(e.timestamp).toISOString().split('T')[0]
      const stKey    = `${dateKey}|${e.browser}|${e.profile}`
      if (!statsMap.has(stKey)) statsMap.set(stKey, { time: 0, tabs: 0, visits: 0 })
      const st = statsMap.get(stKey)!

      if (e.type === 'tab_opened') {
        st.tabs += 1
        tabOps.push(
          prisma.tab.create({
            data: {
              tabId:    e.tabId,
              browser:  e.browser,
              profile:  e.profile,
              title:    e.title,
              url:      e.url,
              favicon:  e.favicon,
              openedAt: new Date(e.timestamp),
              isOpen:   true,
            },
          }).catch(() => null)
        )
      }

      if (e.type === 'tab_closed') {
        tabOps.push(
          prisma.tab.updateMany({
            where: { tabId: e.tabId, browser: e.browser, profile: e.profile, isOpen: true },
            data:  { closedAt: new Date(e.timestamp), isOpen: false, timeSpent: e.timeSpent },
          })
        )
      }

      if (e.type === 'tab_updated') {
        tabOps.push(
          prisma.tab.updateMany({
            where: { tabId: e.tabId, browser: e.browser, profile: e.profile, isOpen: true },
            data:  { title: e.title, url: e.url, favicon: e.favicon },
          })
        )
      }

      if (e.type === 'tab_focused') {
        st.time += Math.floor(e.timeSpent / 1000)
        tabOps.push(
          prisma.tab.updateMany({
            where: { tabId: e.tabId, browser: e.browser, profile: e.profile, isOpen: true },
            data:  { timeSpent: { increment: e.timeSpent } },
          })
        )
      }

      if (e.type === 'history_visit') {
        st.visits += 1
        // st.time   += e.duration  // Removed to avoid double counting with tab_focused time
        historyOps.push(
          prisma.history.create({
            data: {
              browser:   e.browser,
              profile:   e.profile,
              url:       e.url,
              title:     e.title,
              favicon:   e.favicon,
              visitedAt: new Date(e.timestamp),
              duration:  e.duration,
            },
          })
        )
      }
    }

    // Upsert daily stats
    const statsOps = Array.from(statsMap.entries()).map(([key, d]) => {
      const [date, browser, profile] = key.split('|')
      return prisma.dailyStats.upsert({
        where:  { date_browser_profile: { date, browser, profile } },
        create: { date, browser, profile, totalTime: d.time, tabsOpened: d.tabs, visits: d.visits },
        update: {
          totalTime:  { increment: d.time },
          tabsOpened: { increment: d.tabs },
          visits:     { increment: d.visits },
        },
      })
    })

    await Promise.all([...tabOps, ...historyOps, ...statsOps])
    return NextResponse.json({ ok: true, processed: events.length })

  } catch (err) {
    console.error('[TabVault] Ingest error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'TabVault is running 🛡' })
}
