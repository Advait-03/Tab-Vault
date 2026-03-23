'use client'
import { ExternalLink } from 'lucide-react'
import { useActivityStore } from '@/store/activity'
import { useTabs } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_ICONS, BROWSER_NAMES, timeAgo, shortUrl } from '@/lib/utils'

export default function TabList() {
  const { selectedBrowser, selectedProfile, drillLevel } = useActivityStore()
  const { data: tabs, isLoading } = useTabs(selectedBrowser, selectedProfile)

  if (drillLevel === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-bh-text3">
      <span className="text-5xl opacity-20">👈</span>
      <p className="text-sm font-semibold">Select a browser to see open tabs</p>
    </div>
  )

  const color = selectedBrowser ? BROWSER_COLORS[selectedBrowser] : '#8B86AE'
  const title = drillLevel === 2 && selectedProfile
    ? `${selectedProfile} — Open Tabs`
    : selectedBrowser ? `${BROWSER_ICONS[selectedBrowser]} ${BROWSER_NAMES[selectedBrowser]} — All Tabs` : 'Open Tabs'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.07] shrink-0">
        <span className="font-black text-sm flex-1">{title}</span>
        <span className="text-xs font-black font-mono px-2 py-1 rounded-full"
              style={{ color, background: `${color}15` }}>
          {isLoading ? '…' : (tabs?.length ?? 0)} tabs
        </span>
        {(tabs?.length ?? 0) > 0 && (
          <button className="text-[11px] text-bh-text3 border border-white/10 px-3 py-1
                             rounded-full hover:border-bh-green/40 hover:text-bh-green transition-all">
            Open All ↗
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 flex flex-col gap-2">
            {Array.from({length:6}).map((_,i) => <div key={i} className="h-14 bg-bh-s2 rounded-xl animate-pulse"/>)}
          </div>
        )}
        {!isLoading && !tabs?.length && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-bh-text3">
            <span className="text-3xl opacity-20">📭</span>
            <p className="text-sm font-semibold">No open tabs found</p>
          </div>
        )}
        {!isLoading && tabs?.map((tab, i) => (
          <a key={tab.id} href={tab.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05]
                       hover:bg-bh-s2 transition-colors group">
            <span className="text-[11px] font-mono text-bh-text3 w-5 text-right shrink-0">{i + 1}</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border border-white/10"
                 style={{ background: `${color}15` }}>
              {tab.favicon ? <img src={tab.favicon} className="w-4 h-4 rounded" alt=""/> : '🌐'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate group-hover:text-bh-green transition-colors">{tab.title || 'New Tab'}</div>
              <div className="text-[10px] text-bh-text3 font-mono truncate mt-0.5">{shortUrl(tab.url)}</div>
            </div>
            {drillLevel === 1 && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full border font-mono shrink-0"
                    style={{ color, background: `${color}15`, borderColor: `${color}30` }}>
                {tab.profile}
              </span>
            )}
            <span className="text-[10px] text-bh-text3 font-mono shrink-0">{timeAgo(tab.openedAt)}</span>
            <ExternalLink className="w-3.5 h-3.5 text-bh-text3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
          </a>
        ))}
      </div>
    </div>
  )
}
