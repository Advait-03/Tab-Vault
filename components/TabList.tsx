'use client'

import { ExternalLink } from 'lucide-react'
import { useActivityStore } from '@/store/activity'
import { useTabs } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_ICONS, BROWSER_NAMES, shortUrl, timeAgo } from '@/lib/utils'

export default function TabList() {
  const { selectedBrowser, selectedProfile, drillLevel } = useActivityStore()
  const { data: tabs, isLoading } = useTabs(selectedBrowser, selectedProfile)

  if (drillLevel === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-bh-text3">
        <p className="text-sm font-medium text-bh-text">Select a tracked browser to see open tabs</p>
      </div>
    )
  }

  const color = selectedBrowser ? BROWSER_COLORS[selectedBrowser] ?? '#1a73e8' : '#1a73e8'
  const title =
    drillLevel === 2 && selectedProfile
      ? `${selectedProfile} Open Tabs`
      : selectedBrowser
        ? `${BROWSER_ICONS[selectedBrowser] ?? ''} ${BROWSER_NAMES[selectedBrowser] ?? selectedBrowser} Tabs`
        : 'Open Tabs'

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-black/6 px-5 py-4 shrink-0">
        <span className="flex-1 text-sm font-semibold text-bh-text">{title}</span>
        <span className="rounded-full px-3 py-1 text-xs font-mono" style={{ color, backgroundColor: `${color}12` }}>
          {isLoading ? '...' : tabs?.length ?? 0} tabs
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-2xl bg-bh-s2" />
            ))}
          </div>
        )}

        {!isLoading && !tabs?.length && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium text-bh-text">No open tabs found</p>
            <p className="text-xs text-bh-text3">This view only shows currently tracked browser tabs.</p>
          </div>
        )}

        {!isLoading && tabs?.map((tab, index) => (
          <a
            key={tab.id}
            href={tab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 border-b border-black/6 px-5 py-3 transition-colors hover:bg-bh-s2"
          >
            <span className="w-5 shrink-0 text-right text-[11px] font-mono text-bh-text3">{index + 1}</span>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
              style={{ backgroundColor: `${color}12`, color }}
            >
              {tab.favicon ? <img src={tab.favicon} className="h-4 w-4 rounded" alt="" /> : '•'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-bh-text transition-colors group-hover:text-bh-green">
                {tab.title || 'New Tab'}
              </div>
              <div className="mt-0.5 truncate text-[10px] font-mono text-bh-text3">{shortUrl(tab.url)}</div>
            </div>
            {drillLevel === 1 && (
              <span
                className="shrink-0 rounded-full border px-2 py-1 text-[10px] font-mono"
                style={{ color, borderColor: `${color}25`, backgroundColor: `${color}10` }}
              >
                {tab.profile}
              </span>
            )}
            <span className="shrink-0 text-[10px] font-mono text-bh-text3">{timeAgo(tab.openedAt)}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-bh-text3 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </div>
  )
}
