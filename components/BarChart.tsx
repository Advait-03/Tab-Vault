'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboard'
import { useStats } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_NAMES, cn, formatSeconds, toLocalDateKey } from '@/lib/utils'

function getLast30Days() {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - index))
    return {
      date: toLocalDateKey(date),
      label: labels[date.getDay()],
      day: date.getDate(),
      isToday: index === 29,
    }
  })
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function BarChart() {
  const { weekOffset, setWeekOffset, activeBrowserFilter, toggleBrowser, clearFilter } = useDashboardStore()
  const { data: stats, isLoading } = useStats(30)
  const [tooltip, setTooltip] = useState<any>(null)
  const ref = useRef<HTMLDivElement>(null)
  const days = getLast30Days()
  const availableBrowsers = stats?.trackedBrowsers?.length ? stats.trackedBrowsers : stats?.browsers?.map((browser) => browser.browser) ?? []
  const activeBrowsers = activeBrowserFilter.length ? availableBrowsers.filter((browser) => activeBrowserFilter.includes(browser)) : availableBrowsers

  const end = 29 - weekOffset * 7
  const start = Math.max(0, end - 6)
  const visibleDays = days.slice(start, end + 1)

  const dataMap = new Map<string, number>()
  stats?.daily.forEach((entry) => {
    const key = `${entry.date}|${entry.browser}`
    dataMap.set(key, (dataMap.get(key) ?? 0) + entry.totalTime)
  })

  const maxTotal = Math.max(
    ...visibleDays.map((day) =>
      activeBrowsers.reduce((sum, browser) => sum + (dataMap.get(`${day.date}|${browser}`) ?? 0), 0)
    ),
    1
  )

  const rangeLabel = visibleDays.length
    ? `${visibleDays[0].day} ${MONTHS[new Date(visibleDays[0].date).getMonth()]} - ${visibleDays[visibleDays.length - 1].day} ${MONTHS[new Date(visibleDays[visibleDays.length - 1].date).getMonth()]}`
    : ''

  function showTooltip(event: React.MouseEvent, day: (typeof visibleDays)[number]) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return

    const browsers = activeBrowsers
      .map((browser) => ({ browser, totalTime: dataMap.get(`${day.date}|${browser}`) ?? 0 }))
      .filter((browser) => browser.totalTime > 0)
      .sort((a, b) => b.totalTime - a.totalTime)

    setTooltip({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      day,
      browsers,
      totalTime: browsers.reduce((sum, browser) => sum + browser.totalTime, 0),
    })
  }

  return (
    <div className="bh-card p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-bh-text">Usage over the last 30 days</h2>
          <p className="mt-1 text-sm text-bh-text3">Only tracked browsers contribute to these totals. {rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 3}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-bh-s2 text-bh-text2 transition-colors hover:text-bh-text disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-20 text-center text-xs font-medium text-bh-text2">Week {4 - weekOffset} of 4</span>
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            disabled={weekOffset <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-bh-s2 text-bh-text2 transition-colors hover:text-bh-text disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={clearFilter}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs transition-colors',
            activeBrowserFilter.length === 0
              ? 'border-bh-green/25 bg-bh-green/10 text-bh-green'
              : 'border-black/10 bg-white text-bh-text2'
          )}
        >
          All browsers
        </button>
        {availableBrowsers.map((browser) => (
          <button
            key={browser}
            onClick={() => toggleBrowser(browser)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors',
              activeBrowserFilter.includes(browser)
                ? 'border-bh-green/25 bg-bh-green/10 text-bh-green'
                : 'border-black/10 bg-white text-bh-text2'
            )}
          >
            {BROWSER_NAMES[browser] ?? browser}
          </button>
        ))}
      </div>

      {!availableBrowsers.length ? (
        <div className="rounded-3xl bg-bh-s2 px-6 py-12 text-center">
          <p className="text-sm font-medium text-bh-text">No tracked browser data yet</p>
          <p className="mt-1 text-xs text-bh-text3">Connect the extension in Brave and new activity will appear here.</p>
        </div>
      ) : (
        <div ref={ref} className="relative" onMouseLeave={() => setTooltip(null)}>
          <div className="flex h-56 items-end gap-2">
            {(isLoading ? visibleDays : visibleDays).map((day, index) => {
              const total = activeBrowsers.reduce((sum, browser) => sum + (dataMap.get(`${day.date}|${browser}`) ?? 0), 0)
              const height = total > 0 ? Math.max(10, (total / maxTotal) * 100) : 6

              return (
                <button
                  key={day.date}
                  onMouseMove={(event) => showTooltip(event, day)}
                  className="group flex flex-1 flex-col items-center justify-end gap-2"
                >
                  <div className="text-[10px] font-mono text-bh-text3">{total > 0 ? `${Math.round(total / 3600)}h` : ''}</div>
                  <div
                    className={cn('flex w-full flex-col-reverse overflow-hidden rounded-t-2xl bg-bh-s3 transition-transform group-hover:scale-y-[1.02]', day.isToday && 'ring-2 ring-bh-green/30')}
                    style={{ height: `${height}%` }}
                  >
                    {activeBrowsers.map((browser) => {
                      const value = dataMap.get(`${day.date}|${browser}`) ?? 0
                      if (!value) return null
                      return (
                        <div
                          key={browser}
                          style={{
                            height: `${(value / Math.max(total, 1)) * 100}%`,
                            backgroundColor: BROWSER_COLORS[browser] ?? '#1a73e8',
                          }}
                        />
                      )
                    })}
                  </div>
                  <div className={cn('text-[11px] text-bh-text3', day.isToday && 'font-semibold text-bh-green')}>
                    {day.label}
                  </div>
                  <div className="text-[10px] font-mono text-bh-text3">{day.day}</div>
                </button>
              )
            })}
          </div>

          {tooltip && (
            <div
              className="absolute z-50 min-w-[180px] rounded-2xl border border-black/8 bg-white p-3 shadow-lg"
              style={{
                left: Math.min(tooltip.x + 12, (ref.current?.clientWidth ?? 300) - 190),
                top: Math.max(0, tooltip.y - 110),
              }}
            >
              <div className="text-sm font-semibold text-bh-text">
                {tooltip.day.label} {tooltip.day.day}
              </div>
              <div className="mt-2 space-y-1">
                {tooltip.browsers.map((browser: any) => (
                  <div key={browser.browser} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BROWSER_COLORS[browser.browser] ?? '#1a73e8' }} />
                    <span className="flex-1 text-bh-text2">{BROWSER_NAMES[browser.browser] ?? browser.browser}</span>
                    <span className="font-mono text-bh-text">{formatSeconds(browser.totalTime)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-black/6 pt-2 text-xs">
                <span className="text-bh-text3">Total</span>
                <span className="font-mono font-semibold text-bh-text">{formatSeconds(tooltip.totalTime)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
