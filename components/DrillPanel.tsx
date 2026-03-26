'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useActivityStore } from '@/store/activity'
import { useAssignCategory, useAutoCategorizeHistory, useCategories, useHistory, useSetupState, useTabs } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_ICONS, BROWSER_NAMES, shortUrl, timeAgo } from '@/lib/utils'

export default function DrillPanel() {
  const { drillLevel, selectedBrowser, selectedProfile, selectBrowser, selectProfile, goBack } = useActivityStore()

  const title =
    drillLevel === 0
      ? 'Tracked Browsers'
      : drillLevel === 1
        ? `${selectedBrowser ? BROWSER_NAMES[selectedBrowser] : ''} Profiles`
        : `${selectedProfile} History`

  return (
    <div className="flex h-full w-full shrink-0 flex-col rounded-[28px] border border-black/8 bg-white shadow-sm md:w-[300px] lg:w-[320px]">
      <div className="flex items-center gap-2 border-b border-black/6 px-4 py-4 shrink-0">
        {drillLevel > 0 && (
          <button
            onClick={goBack}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-bh-s2 text-bh-text2 transition-colors hover:border-bh-green/30 hover:text-bh-green"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <span className="text-sm font-semibold text-bh-text">{title}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {drillLevel === 0 && <BrowserList onSelect={selectBrowser} />}
        {drillLevel === 1 && selectedBrowser && <ProfileList browser={selectedBrowser} onSelect={selectProfile} />}
        {drillLevel === 2 && selectedBrowser && selectedProfile && (
          <HistoryList browser={selectedBrowser} profile={selectedProfile} />
        )}
      </div>
    </div>
  )
}

function BrowserList({ onSelect }: { onSelect: (browser: string) => void }) {
  const { data: setup } = useSetupState()
  const { data: tabs } = useTabs()
  const { data: history } = useHistory({ limit: 200 })

  const trackedBrowsers = setup?.trackedBrowsers ?? []
  const tabsByBrowser = (tabs ?? []).reduce<Record<string, number>>((acc, tab) => {
    acc[tab.browser] = (acc[tab.browser] ?? 0) + 1
    return acc
  }, {})
  const visitsByBrowser = (history ?? []).reduce<Record<string, number>>((acc, item) => {
    acc[item.browser] = (acc[item.browser] ?? 0) + 1
    return acc
  }, {})

  if (!trackedBrowsers.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-bh-text">No tracked browsers yet</p>
        <p className="text-xs text-bh-text3">Install the TabVault extension in setup to start collecting real activity.</p>
      </div>
    )
  }

  return (
    <div className="animate-slide-right">
      {trackedBrowsers.map((browser) => {
        const browserId = browser.browserId
        const color = BROWSER_COLORS[browserId] ?? '#1a73e8'
        return (
          <button
            key={browserId}
            onClick={() => onSelect(browserId)}
            className="group flex w-full items-center gap-3 border-b border-black/6 px-4 py-4 text-left transition-colors hover:bg-bh-s2"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {BROWSER_ICONS[browserId] ?? browser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-bh-text">{BROWSER_NAMES[browserId] ?? browser.name}</div>
              <div className="mt-1 text-xs text-bh-text3">
                {tabsByBrowser[browserId] ?? 0} open tabs · {visitsByBrowser[browserId] ?? 0} recent visits
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-bh-text3 transition-colors group-hover:text-bh-text" />
          </button>
        )
      })}
    </div>
  )
}

function ProfileList({ browser, onSelect }: { browser: string; onSelect: (profile: string) => void }) {
  const { data: tabs } = useTabs(browser)
  const tabsByProfile = (tabs ?? []).reduce<Record<string, number>>((acc, tab) => {
    acc[tab.profile] = (acc[tab.profile] ?? 0) + 1
    return acc
  }, {})
  const profiles = Object.entries(tabsByProfile).sort((a, b) => b[1] - a[1])
  const color = BROWSER_COLORS[browser] ?? '#1a73e8'

  if (!profiles.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-bh-text">No open profiles found</p>
        <p className="text-xs text-bh-text3">Open a few tabs in {BROWSER_NAMES[browser] ?? browser} and they will appear here.</p>
      </div>
    )
  }

  return (
    <div className="animate-slide-right">
      <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-bh-text3">
        {BROWSER_NAMES[browser] ?? browser} profiles
      </div>
      {profiles.map(([profile, count], index) => (
        <button
          key={profile}
          onClick={() => onSelect(profile)}
          className="group flex w-full items-center gap-3 border-b border-black/6 px-4 py-4 text-left transition-colors hover:bg-bh-s2"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: color }}>
            {index + 1}
          </div>
          <div className="min-w-0 flex-1 text-sm font-medium text-bh-text">{profile}</div>
          <div className="rounded-full border px-2 py-1 text-xs font-mono" style={{ color, borderColor: `${color}30`, backgroundColor: `${color}12` }}>
            {count} tabs
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-bh-text3 transition-colors group-hover:text-bh-text" />
        </button>
      ))}
    </div>
  )
}

function HistoryList({ browser, profile }: { browser: string; profile: string }) {
  const { data: history, isLoading } = useHistory({ browser, profile, limit: 60 })
  const { data: categories } = useCategories()
  const assignCategory = useAssignCategory()
  const autoCategorize = useAutoCategorizeHistory()
  const color = BROWSER_COLORS[browser] ?? '#1a73e8'

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-2xl bg-bh-s2" />
        ))}
      </div>
    )
  }

  if (!history?.length) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-bh-text">No history yet</p>
        <p className="text-xs text-bh-text3">New visits in this profile will appear here automatically.</p>
      </div>
    )
  }

  return (
    <div className="animate-slide-right">
      <div className="flex items-center justify-between px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-bh-text3">
        <span>{profile} history</span>
        <button
          onClick={() => autoCategorize.mutate()}
          className="rounded-full border border-bh-green/20 bg-bh-green/10 px-3 py-1 text-[10px] font-semibold text-bh-green"
        >
          {autoCategorize.isPending ? 'Categorizing...' : 'Auto-categorize'}
        </button>
      </div>
      {history.map((item) => (
        <div
          key={item.id}
          className="group border-b border-black/6 px-4 py-3 transition-colors hover:bg-bh-s2"
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {item.favicon ? <img src={item.favicon} className="h-4 w-4 rounded" alt="" /> : '•'}
            </div>
            <div className="min-w-0 flex-1">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-semibold text-bh-text transition-colors group-hover:text-bh-green">
                {item.title || 'Untitled'}
              </a>
              <div className="mt-1 inline-flex rounded-full bg-bh-s3 px-2 py-1 text-[10px] font-mono text-bh-text2">
                {shortUrl(item.url)}
              </div>
              {item.note && <div className="mt-2 text-xs text-bh-text2">{item.note}</div>}
            </div>
            <div className="mt-0.5 shrink-0 text-[10px] font-mono text-bh-text3">{timeAgo(item.visitedAt)}</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={item.categoryId ?? ''}
              onChange={(event) => assignCategory.mutate({ historyId: item.id, categoryId: event.target.value ? Number(event.target.value) : null })}
              className="rounded-full border border-black/10 bg-bh-s1 px-3 py-1 text-xs text-bh-text2"
            >
              <option value="">Uncategorized</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {item.category && (
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${item.category.color}18`, color: item.category.color }}>
                {item.category.emoji} {item.category.name}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
