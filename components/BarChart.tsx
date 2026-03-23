'use client'
import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboard'
import { useStats } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_NAMES, formatSeconds, cn } from '@/lib/utils'

function getLast30Days() {
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    return { date: d.toISOString().split('T')[0], label: names[d.getDay()], day: d.getDate(), isToday: i === 29 }
  })
}

const BROWSERS = ['chrome','edge','firefox','brave','safari']
const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function BarChart() {
  const { weekOffset, setWeekOffset } = useDashboardStore()
  const { data: stats, isLoading }    = useStats(30)
  const [tooltip, setTooltip]         = useState<any>(null)
  const ref                           = useRef<HTMLDivElement>(null)
  const days30                        = getLast30Days()

  // Which 7 days to show
  const end     = 29 - weekOffset * 7
  const start   = Math.max(0, end - 6)
  const visible = days30.slice(start, end + 1)

  // Build data lookup: date|browser -> seconds
  const dataMap = new Map<string, number>()
  const tabsMap = new Map<string, number>()
  stats?.daily?.forEach((d) => {
    const k = `${d.date}|${d.browser}`
    dataMap.set(k, (dataMap.get(k) ?? 0) + d.totalTime)
    tabsMap.set(d.date, (tabsMap.get(d.date) ?? 0) + d.tabsOpened)
  })

  const maxTotal = Math.max(...visible.map((d) => BROWSERS.reduce((s, b) => s + (dataMap.get(`${d.date}|${b}`) ?? 0), 0)), 1)

  const rangeLabel = visible.length
    ? `${visible[0].day} ${MONTHS[new Date(visible[0].date).getMonth()]} – ${visible[visible.length-1].day} ${MONTHS[new Date(visible[visible.length-1].date).getMonth()]}, ${new Date(visible[visible.length-1].date).getFullYear()}`
    : ''

  function showTip(e: React.MouseEvent, day: typeof days30[0]) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const bs  = BROWSERS.map((b) => ({ b, t: dataMap.get(`${day.date}|${b}`) ?? 0 })).filter((x) => x.t > 0).sort((a,z) => z.t - a.t)
    const tot = bs.reduce((s, x) => s + x.t, 0)
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: `${day.label} ${day.day}`, bs, tot, tabs: tabsMap.get(day.date) ?? 0 })
  }

  return (
    <div className="bh-card p-5 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-black text-base">Browser Usage — Last 30 Days</h2>
          <p className="text-bh-text3 text-xs font-mono mt-0.5">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset >= 3}
            className="w-7 h-7 rounded-lg border border-white/10 bg-bh-s2 flex items-center justify-center
                       text-bh-text2 hover:border-bh-green/50 hover:text-bh-green
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <span className="text-[11px] font-mono text-bh-text3 w-16 text-center">
            Week {4 - weekOffset}/4
          </span>
          <button onClick={() => setWeekOffset(weekOffset - 1)} disabled={weekOffset <= 0}
            className="w-7 h-7 rounded-lg border border-white/10 bg-bh-s2 flex items-center justify-center
                       text-bh-text2 hover:border-bh-green/50 hover:text-bh-green
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Bars */}
      <div ref={ref} className="relative" onMouseLeave={() => setTooltip(null)}>
        <div className="flex items-end gap-1.5 md:gap-2 h-40">
          {isLoading
            ? Array.from({length:7}).map((_,i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-bh-s3 rounded-t-lg animate-pulse" style={{height:`${30+Math.random()*70}%`}}/>
                  <div className="w-5 h-2 bg-bh-s3 rounded animate-pulse mt-1"/>
                </div>
              ))
            : visible.map((day) => {
                const total  = BROWSERS.reduce((s,b) => s + (dataMap.get(`${day.date}|${b}`) ?? 0), 0)
                const hPct   = total > 0 ? Math.max(6, (total / maxTotal) * 100) : 4
                const tabs   = tabsMap.get(day.date) ?? 0

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer group"
                       onMouseMove={(e) => showTip(e, day)}>
                    {/* Tab count pin */}
                    <span className={cn('text-[9px] font-mono font-black transition-opacity h-[14px]',
                      tabs > 0 ? 'text-bh-green opacity-0 group-hover:opacity-100' : 'opacity-0')}>
                      {tabs > 0 ? `${tabs}t` : ''}
                    </span>
                    {/* Time */}
                    <span className="text-[9px] font-mono text-bh-text3 h-[12px]">
                      {total > 0 ? `${Math.round(total/3600)}h` : ''}
                    </span>
                    {/* Bar */}
                    <div className={cn('w-full rounded-t-lg overflow-hidden transition-all duration-200 group-hover:brightness-125',
                      day.isToday && 'ring-2 ring-bh-green ring-offset-1 ring-offset-bh-bg')}
                      style={{ height: `${hPct}%`, minHeight: 4, background: '#21203F' }}>
                      <div className="w-full h-full flex flex-col-reverse">
                        {BROWSERS.map((b) => {
                          const t = dataMap.get(`${day.date}|${b}`) ?? 0
                          if (!t) return null
                          return <div key={b} style={{ height: `${(t/Math.max(total,1))*100}%`, background: BROWSER_COLORS[b], minHeight: 2 }}/>
                        })}
                      </div>
                    </div>
                    {/* Label */}
                    <div className="text-center mt-0.5">
                      <div className={cn('text-[10px] font-semibold transition-colors',
                        day.isToday ? 'text-bh-green font-black' : 'text-bh-text3 group-hover:text-bh-text')}>
                        {day.label}
                      </div>
                      <div className="text-[9px] font-mono text-bh-text3">{day.day}</div>
                    </div>
                  </div>
                )
              })
          }
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute z-50 pointer-events-none bg-bh-s3 border border-white/15
                          rounded-xl p-3 shadow-2xl min-w-[160px]"
               style={{ left: Math.min(tooltip.x + 12, (ref.current?.clientWidth ?? 300) - 175), top: Math.max(0, tooltip.y - 90) }}>
            <div className="font-black text-sm mb-2">{tooltip.label}</div>
            {tooltip.bs.map((x: any) => (
              <div key={x.b} className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: BROWSER_COLORS[x.b] }}/>
                <span className="text-[11px] text-bh-text2 flex-1">{BROWSER_NAMES[x.b]}</span>
                <span className="text-[11px] font-mono">{formatSeconds(x.t)}</span>
              </div>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
              <span className="text-[10px] text-bh-text3">Total</span>
              <span className="text-[11px] font-mono font-black text-bh-green">{formatSeconds(tooltip.tot)}</span>
            </div>
            {tooltip.tabs > 0 && (
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-bh-text3">Tabs opened</span>
                <span className="text-[11px] font-mono text-bh-yellow">{tooltip.tabs}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {BROWSERS.map((b) => (
          <div key={b} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: BROWSER_COLORS[b] }}/>
            <span className="text-[11px] font-semibold text-bh-text2">{BROWSER_NAMES[b]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
