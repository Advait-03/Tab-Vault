'use client'

import { Clock3, Layers3, MousePointerClick, Shield } from 'lucide-react'
import { useStats } from '@/hooks/useQueries'
import { formatSeconds } from '@/lib/utils'

export default function StatsRow() {
  const { data: stats, isLoading } = useStats()

  const cards = [
    {
      icon: Clock3,
      label: 'Today',
      value: isLoading ? '...' : formatSeconds(stats?.today?.totalTime ?? 0),
      hint: 'Focused browsing time',
    },
    {
      icon: Layers3,
      label: 'Open Tabs',
      value: isLoading ? '...' : String(stats?.totalTabs ?? 0),
      hint: 'Across tracked browsers',
    },
    {
      icon: MousePointerClick,
      label: 'Visits',
      value: isLoading ? '...' : String(stats?.today?.visits ?? 0),
      hint: 'Recorded today',
    },
    {
      icon: Shield,
      label: 'Tracked Browsers',
      value: isLoading ? '...' : String(stats?.trackedBrowsers?.length ?? 0),
      hint: 'Installed and connected',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="bh-card p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-bh-s2 p-3 text-bh-green">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-bh-text3">{card.label}</span>
            </div>
            <div className="mt-6 text-3xl font-semibold tracking-tight text-bh-text">{card.value}</div>
            <div className="mt-2 text-sm text-bh-text2">{card.hint}</div>
          </div>
        )
      })}
    </div>
  )
}
