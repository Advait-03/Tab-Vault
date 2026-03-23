'use client'
import { Monitor, Clock, Globe, Layers } from 'lucide-react'
import { useStats } from '@/hooks/useQueries'
import { formatSeconds } from '@/lib/utils'

export default function StatsRow() {
  const { data: stats, isLoading } = useStats()

  const cards = [
    { icon: <Clock className="w-4 h-4"/>,   val: isLoading ? '…' : formatSeconds(stats?.totalTime   ?? 0), label: "Today's Usage",    delta: '↑ tracking live',     color: 'text-bh-green',  bg: 'bg-bh-green/10'  },
    { icon: <Monitor className="w-4 h-4"/>, val: isLoading ? '…' : String(stats?.totalTabs    ?? 0), label: 'Open Tabs',          delta: 'across all browsers', color: 'text-bh-chrome', bg: 'bg-bh-chrome/10' },
    { icon: <Globe className="w-4 h-4"/>,   val: isLoading ? '…' : String(stats?.totalVisits  ?? 0), label: 'Visits Today',       delta: 'pages visited',       color: 'text-bh-cyan',   bg: 'bg-bh-cyan/10'   },
    { icon: <Layers className="w-4 h-4"/>,  val: isLoading ? '…' : String(stats?.browsers?.length ?? 0), label: 'Browsers Active', delta: 'being monitored',  color: 'text-bh-brave',  bg: 'bg-bh-brave/10'  },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="bh-card p-4 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
          <div className={`inline-flex p-2 rounded-lg ${c.bg} ${c.color} mb-3`}>{c.icon}</div>
          <div className={`text-2xl font-black font-mono ${c.color} leading-none`}>{c.val}</div>
          <div className="text-[11px] text-bh-text3 uppercase tracking-wide font-mono mt-1.5">{c.label}</div>
          <div className="text-[11px] text-bh-text3 mt-1">{c.delta}</div>
        </div>
      ))}
    </div>
  )
}
