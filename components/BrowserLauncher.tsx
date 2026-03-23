'use client'
import { useRouter } from 'next/navigation'
import { Plus, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTabs } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_ICONS, BROWSER_NAMES, SEED_BROWSERS, cn } from '@/lib/utils'
import { useActivityStore } from '@/store/activity'

// Fetch only detected (installed) browsers from DB
function useDetectedBrowsers() {
  return useQuery({
    queryKey:  ['detected-browsers'],
    queryFn:   async () => {
      const r = await fetch('/api/setup')
      const d = await r.json()
      return d.browsers as { browserId: string; name: string; extensionInstalled: boolean; isEnabled: boolean }[]
    },
    staleTime: 60_000,
  })
}

export default function BrowserLauncher() {
  const router                    = useRouter()
  const { data: allTabs }         = useTabs()
  const { data: detectedBrowsers} = useDetectedBrowsers()
  const { selectBrowser }         = useActivityStore()

  // Count open tabs per browser
  const tabsByBrowser = (allTabs ?? []).reduce<Record<string, number>>((acc, t) => {
    acc[t.browser] = (acc[t.browser] ?? 0) + 1; return acc
  }, {})

  // Use detected browsers from DB — fall back to SEED_BROWSERS if not set up yet
  const browsersToShow = detectedBrowsers?.length
    ? detectedBrowsers
        .filter((b) => b.isEnabled)
        .map((b) => ({
          id:      b.browserId,
          name:    BROWSER_NAMES[b.browserId] ?? b.name,
          icon:    BROWSER_ICONS[b.browserId] ?? '🌐',
          color:   BROWSER_COLORS[b.browserId] ?? '#8B86AE',
          hasExt:  b.extensionInstalled,
          profiles: SEED_BROWSERS.find((s) => s.id === b.browserId)?.profiles ?? [],
        }))
    : SEED_BROWSERS.map((b) => ({ ...b, hasExt: false }))

  function handleLaunch(id: string) {
    selectBrowser(id)
    router.push('/activity')
  }

  return (
    <div className="bh-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-black text-bh-text3 uppercase tracking-widest font-mono">
          Launch Browser
        </div>
        <button
          onClick={() => router.push('/setup')}
          className="w-6 h-6 rounded-lg border border-white/10 bg-bh-s2 flex items-center
                     justify-center text-bh-text3 hover:border-bh-green/40 hover:text-bh-green
                     transition-all"
          title="Re-run setup / manage browsers">
          <Settings className="w-3.5 h-3.5"/>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {browsersToShow.map((b) => {
          const count = tabsByBrowser[b.id] ?? 0
          const color = b.color
          return (
            <button key={b.id} onClick={() => handleLaunch(b.id)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-3 rounded-xl',
                'border border-white/[0.07] bg-bh-s2',
                'hover:border-white/15 hover:-translate-y-0.5',
                'transition-all duration-200 active:scale-95'
              )}
              style={{ borderColor: count > 0 ? `${color}30` : undefined }}>
              <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center
                             text-2xl border border-white/10" style={{ background: `${color}18` }}>
                {b.icon}
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full
                                   flex items-center justify-center text-[9px] font-black font-mono
                                   text-bh-bg border-2 border-bh-bg px-1"
                        style={{ background: color }}>{count}</span>
                )}
                {count > 0 && (
                  <span className="absolute inset-[-4px] rounded-[20px] border-2 opacity-40"
                        style={{ borderColor: color }}/>
                )}
                {/* Extension not installed warning */}
                {!b.hasExt && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-bh-yellow
                                   flex items-center justify-center text-[8px] border-2 border-bh-bg"
                        title="Extension not installed">!</span>
                )}
              </div>
              <span className="text-xs font-black">{b.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-black font-mono" style={{ color }}>{count}</span>
                <span className="text-[9px] text-bh-text3 font-mono">tabs</span>
              </div>
              {'profiles' in b && b.profiles.length > 0 && (
                <div className="flex gap-1">
                  {b.profiles.map((p: any, i: number) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }}/>
                  ))}
                </div>
              )}
            </button>
          )
        })}

        {/* Add / manage browsers */}
        <button
          onClick={() => router.push('/setup')}
          className="flex flex-col items-center gap-2 p-3 rounded-xl
                     border border-dashed border-white/10 text-bh-text3
                     hover:border-bh-green/40 hover:text-bh-green transition-all">
          <div className="w-12 h-12 rounded-2xl border border-dashed border-current flex items-center justify-center">
            <Plus className="w-5 h-5"/>
          </div>
          <span className="text-[11px] font-bold">Manage</span>
        </button>
      </div>
    </div>
  )
}
