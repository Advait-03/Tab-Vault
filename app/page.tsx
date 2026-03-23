'use client'
import Topbar from '@/components/Topbar'
import BarChart from '@/components/BarChart'
import StatsRow from '@/components/StatsRow'
import BrowserLauncher from '@/components/BrowserLauncher'
import { useStats } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_NAMES, formatSeconds } from '@/lib/utils'

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar/>
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Left 70% */}
        <div className="flex-1 lg:flex-[7] overflow-y-auto p-4 md:p-6 flex flex-col gap-4 md:gap-5">
          <StatsRow/>
          <BarChart/>
          <TodayBreakdown/>
        </div>

        {/* Right 30% */}
        <div className="lg:flex-[3] lg:max-w-xs xl:max-w-sm border-t lg:border-t-0 lg:border-l
                        border-white/[0.07] overflow-y-auto p-4 flex flex-col gap-4">
          <BrowserLauncher/>
          <div className="bh-card p-4">
            <div className="text-[10px] font-black text-bh-text3 uppercase tracking-widest font-mono mb-3">
              Quick Actions
            </div>
            <div className="flex flex-col gap-2">
              {[
                { icon: '⚡', label: 'View All Activity', href: '/activity' },
                { icon: '📁', label: 'Manage Categories',  href: '/activity' },
                { icon: '🗄',  label: 'Browse Database',    href: 'http://localhost:5555', ext: true },
              ].map((a) => (
                <a key={a.label} href={a.href} target={a.ext ? '_blank' : undefined} rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/[0.07]
                             hover:border-bh-green/30 hover:bg-bh-s2 transition-all text-sm font-semibold
                             text-bh-text2 hover:text-bh-text">
                  <span>{a.icon}</span>{a.label}
                  <span className="ml-auto text-bh-text3">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function TodayBreakdown() {
  const { data: stats } = useStats()
  if (!stats?.browsers?.length) return null
  const totalTime = stats.browsers.reduce((s: number, b: any) => s + b.totalTime, 0)

  return (
    <div className="bh-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm">Today's Breakdown</h3>
        <span className="text-[11px] font-mono text-bh-text3">
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {stats.browsers.map((b: any) => {
          const pct   = totalTime > 0 ? Math.round((b.totalTime / totalTime) * 100) : 0
          const color = BROWSER_COLORS[b.browser] ?? '#8B86AE'
          return (
            <div key={b.browser} className="flex items-center gap-3">
              <div className="w-20 text-xs font-bold shrink-0" style={{ color }}>
                {BROWSER_NAMES[b.browser] ?? b.browser}
              </div>
              <div className="flex-1 h-2 bg-bh-s3 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                     style={{ width: `${pct}%`, background: color }}/>
              </div>
              <div className="text-[11px] font-mono text-bh-text2 w-12 text-right shrink-0">
                {formatSeconds(b.totalTime)}
              </div>
              <div className="text-[10px] font-mono text-bh-text3 w-8 text-right shrink-0">{pct}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
