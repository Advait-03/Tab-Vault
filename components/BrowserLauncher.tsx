'use client'

import { Plus, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSetupState, useTabs } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_ICONS, BROWSER_NAMES, cn } from '@/lib/utils'
import { useActivityStore } from '@/store/activity'

export default function BrowserLauncher() {
  const router = useRouter()
  const { selectBrowser } = useActivityStore()
  const { data: allTabs } = useTabs()
  const { data: setup } = useSetupState()

  const tabsByBrowser = (allTabs ?? []).reduce<Record<string, number>>((acc, tab) => {
    acc[tab.browser] = (acc[tab.browser] ?? 0) + 1
    return acc
  }, {})

  const browsersToShow = (setup?.browsers ?? [])
    .filter((browser) => browser.isEnabled)
    .map((browser) => ({
      id: browser.browserId,
      name: BROWSER_NAMES[browser.browserId] ?? browser.name,
      icon: BROWSER_ICONS[browser.browserId] ?? browser.name.charAt(0).toUpperCase(),
      color: BROWSER_COLORS[browser.browserId] ?? '#1a73e8',
      hasExtension: browser.extensionInstalled,
      version: browser.version,
    }))

  function handleLaunch(id: string) {
    selectBrowser(id)
    router.push('/activity')
  }

  return (
    <div className="bh-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-bh-text">Installed Browsers</div>
          <div className="text-xs text-bh-text3">Only browsers found on this PC are listed here.</div>
        </div>
        <button
          onClick={() => router.push('/setup')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-bh-text2 transition-colors hover:border-bh-green/30 hover:text-bh-green"
          title="Manage detected browsers"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {browsersToShow.length === 0 ? (
        <button
          onClick={() => router.push('/setup')}
          className="w-full rounded-3xl border border-dashed border-black/10 bg-bh-s2 px-4 py-10 text-center transition-colors hover:border-bh-green/30"
        >
          <div className="text-sm font-medium text-bh-text">Run browser setup</div>
          <div className="mt-1 text-xs text-bh-text3">Scan again and connect Brave to start tracking.</div>
        </button>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {browsersToShow.map((browser) => {
            const count = tabsByBrowser[browser.id] ?? 0
            return (
              <button
                key={browser.id}
                onClick={() => handleLaunch(browser.id)}
                className={cn(
                  'flex items-center gap-4 rounded-3xl border border-black/8 bg-white px-4 py-4 text-left shadow-sm transition-all',
                  'hover:-translate-y-0.5 hover:shadow-md'
                )}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                  style={{ backgroundColor: `${browser.color}18`, color: browser.color }}
                >
                  {browser.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-bh-text">{browser.name}</div>
                  <div className="mt-1 text-xs text-bh-text3">
                    {browser.hasExtension ? 'Tracking enabled' : 'Installed, extension not connected'}
                  </div>
                  {browser.version && (
                    <div className="mt-1 text-[11px] font-mono text-bh-text3">v{browser.version.split('.')[0]}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold" style={{ color: browser.color }}>{count}</div>
                  <div className="text-[11px] text-bh-text3">open tabs</div>
                </div>
              </button>
            )
          })}

          <button
            onClick={() => router.push('/setup')}
            className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-black/10 bg-bh-s2 px-4 py-4 text-sm text-bh-text2 transition-colors hover:border-bh-green/30 hover:text-bh-green"
          >
            <Plus className="h-4 w-4" />
            Manage browsers
          </button>
        </div>
      )}
    </div>
  )
}
