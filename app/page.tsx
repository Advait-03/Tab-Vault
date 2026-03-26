'use client'

import Link from 'next/link'
import { Database, FolderKanban, History } from 'lucide-react'
import Topbar from '@/components/Topbar'
import BarChart from '@/components/BarChart'
import StatsRow from '@/components/StatsRow'
import BrowserLauncher from '@/components/BrowserLauncher'
import { useStats } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_NAMES, formatSeconds, toLocalDateKey } from '@/lib/utils'

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <StatsRow />
          <BarChart />
          <TodayBreakdown />
        </div>

        <aside className="flex w-full flex-col gap-6 xl:max-w-sm">
          <BrowserLauncher />
          <div className="bh-card p-5">
            <div className="text-sm font-semibold text-bh-text">Quick actions</div>
            <div className="mt-4 flex flex-col gap-3">
              <ActionLink href="/activity" icon={History} title="Open activity" description="Inspect current tabs and recent visits." />
              <ActionLink href="/activity" icon={FolderKanban} title="Manage categories" description="Organize browsing history into categories." />
              <ActionLink href="http://localhost:5555" icon={Database} title="Prisma Studio" description="Browse the local database directly." external />
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

function ActionLink({
  href,
  title,
  description,
  icon: Icon,
  external,
}: {
  href: string
  title: string
  description: string
  icon: typeof History
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="rounded-3xl border border-black/8 bg-bh-s2 p-4 transition-colors hover:bg-white"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-3 text-bh-green shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-medium text-bh-text">{title}</div>
          <div className="mt-1 text-xs text-bh-text3">{description}</div>
        </div>
      </div>
    </Link>
  )
}

function TodayBreakdown() {
  const { data: stats } = useStats(30)
  if (!stats?.daily?.length) return null

  const today = toLocalDateKey(new Date())
  const todayRows = stats.daily.filter((row) => row.date === today)
  if (!todayRows.length) return null

  const browserMap = new Map<string, number>()
  for (const row of todayRows) {
    browserMap.set(row.browser, (browserMap.get(row.browser) ?? 0) + row.totalTime)
  }

  const browsers = Array.from(browserMap.entries())
    .map(([browser, totalTime]) => ({ browser, totalTime }))
    .sort((a, b) => b.totalTime - a.totalTime)

  const totalTime = browsers.reduce((sum, browser) => sum + browser.totalTime, 0)

  return (
    <div className="bh-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-bh-text">Today's split</h3>
          <p className="text-sm text-bh-text3">How today’s tracked time is distributed.</p>
        </div>
        <span className="text-xs font-mono text-bh-text3">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>

      <div className="mt-5 space-y-4">
        {browsers.map((browser) => {
          const percentage = totalTime > 0 ? Math.round((browser.totalTime / totalTime) * 100) : 0
          const color = BROWSER_COLORS[browser.browser] ?? '#1a73e8'
          return (
            <div key={browser.browser}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-bh-text">{BROWSER_NAMES[browser.browser] ?? browser.browser}</span>
                <span className="font-mono text-bh-text2">{formatSeconds(browser.totalTime)} · {percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-bh-s3">
                <div className="h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
