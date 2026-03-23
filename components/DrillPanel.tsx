'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useActivityStore } from '@/store/activity'
import { useTabs, useHistory } from '@/hooks/useQueries'
import { BROWSER_COLORS, BROWSER_ICONS, SEED_BROWSERS, timeAgo, shortUrl, cn } from '@/lib/utils'

export default function DrillPanel() {
  const { drillLevel, selectedBrowser, selectedProfile, selectBrowser, selectProfile, goBack } = useActivityStore()

  const title = drillLevel === 0 ? 'Browsers'
    : drillLevel === 1 ? `${selectedBrowser ? BROWSER_ICONS[selectedBrowser] : ''} ${selectedBrowser ?? ''} — Profiles`
    : `${selectedProfile} — History`

  return (
    <div className="flex flex-col h-full border-r border-white/[0.07] w-full md:w-[300px] lg:w-[320px] shrink-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07] shrink-0">
        {drillLevel > 0 && (
          <button onClick={goBack}
            className="w-7 h-7 rounded-lg border border-white/10 bg-bh-s2 flex items-center justify-center
                       text-bh-text2 hover:border-bh-green/40 hover:text-bh-green transition-all">
            <ChevronLeft className="w-4 h-4"/>
          </button>
        )}
        <span className="font-black text-sm">{title}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {drillLevel === 0 && <BrowserList onSelect={selectBrowser}/>}
        {drillLevel === 1 && selectedBrowser && <ProfileList browser={selectedBrowser} onSelect={selectProfile}/>}
        {drillLevel === 2 && selectedBrowser && selectedProfile && <HistoryList browser={selectedBrowser} profile={selectedProfile}/>}
      </div>
    </div>
  )
}

function BrowserList({ onSelect }: { onSelect: (b: string) => void }) {
  const { data: tabs } = useTabs()
  const tabsByBrowser  = (tabs ?? []).reduce<Record<string,number>>((a,t) => { a[t.browser]=(a[t.browser]??0)+1; return a }, {})
  const profilesByBrowser = (tabs ?? []).reduce<Record<string,Set<string>>>((a,t) => { (a[t.browser]??=new Set()).add(t.profile); return a }, {})

  return (
    <div className="animate-slide-right">
      {SEED_BROWSERS.map((b) => {
        const color = BROWSER_COLORS[b.id]
        const count = tabsByBrowser[b.id] ?? 0
        const profiles = profilesByBrowser[b.id]
        return (
          <button key={b.id} onClick={() => onSelect(b.id)}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.05]
                       hover:bg-bh-s2 transition-colors text-left group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-white/10 shrink-0"
                 style={{ background: `${color}18` }}>{b.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm">{b.name}</div>
              <div className="flex gap-1 mt-1 flex-wrap">
                {b.profiles.map((p) => (
                  <span key={p.name} className="text-[9px] font-black px-1.5 py-0.5 rounded-full border font-mono"
                        style={{ color, background: `${color}15`, borderColor: `${color}30` }}>
                    {p.name} {count > 0 ? `${profiles?.has(p.name) ? (tabsByBrowser[b.id] ?? 0) : 0}t` : '0t'}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-black font-mono leading-none" style={{ color }}>{count}</div>
              <div className="text-[9px] text-bh-text3 font-mono uppercase">tabs</div>
            </div>
            <ChevronRight className="w-4 h-4 text-bh-text3 group-hover:text-bh-text transition-colors shrink-0"/>
          </button>
        )
      })}
    </div>
  )
}

function ProfileList({ browser, onSelect }: { browser: string; onSelect: (p: string) => void }) {
  const b     = SEED_BROWSERS.find((x) => x.id === browser)
  const { data: tabs } = useTabs(browser)
  const tabsByProfile  = (tabs ?? []).reduce<Record<string,number>>((a,t) => { a[t.profile]=(a[t.profile]??0)+1; return a }, {})

  return (
    <div className="animate-slide-right">
      <div className="px-4 py-2 text-[10px] font-mono text-bh-text3 uppercase tracking-widest">{browser} profiles</div>
      {b?.profiles.map((p) => (
        <button key={p.name} onClick={() => onSelect(p.name)}
          className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]
                     hover:bg-bh-s2 transition-colors text-left group">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-bh-bg shrink-0"
               style={{ background: p.color }}>{p.initial}</div>
          <div className="flex-1 font-bold text-sm">{p.name}</div>
          <div className="text-xs font-black font-mono px-2 py-1 rounded-full border"
               style={{ color: p.color, background: `${p.color}15`, borderColor: `${p.color}30` }}>
            {tabsByProfile[p.name] ?? 0}t
          </div>
          <ChevronRight className="w-4 h-4 text-bh-text3 shrink-0"/>
        </button>
      ))}
    </div>
  )
}

function HistoryList({ browser, profile }: { browser: string; profile: string }) {
  const { data: history, isLoading } = useHistory({ browser, profile, limit: 60 })
  const color = BROWSER_COLORS[browser]

  if (isLoading) return (
    <div className="p-4 flex flex-col gap-2">
      {Array.from({length:8}).map((_,i) => <div key={i} className="h-12 bg-bh-s2 rounded-xl animate-pulse"/>)}
    </div>
  )

  if (!history?.length) return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 text-bh-text3">
      <span className="text-3xl opacity-30">📭</span>
      <p className="text-sm font-semibold">No history yet</p>
      <p className="text-xs">Install the extension to start tracking</p>
    </div>
  )

  return (
    <div className="animate-slide-right">
      <div className="px-4 py-2 text-[10px] font-mono text-bh-text3 uppercase tracking-widest">{profile} — history</div>
      {history.map((item) => (
        <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
          className="flex items-start gap-2.5 px-4 py-3 border-b border-white/[0.05] hover:bg-bh-s2 transition-colors group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5 border border-white/10"
               style={{ background: `${color}15` }}>
            {item.favicon ? <img src={item.favicon} className="w-4 h-4 rounded" alt=""/> : '🌐'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate group-hover:text-bh-green transition-colors">{item.title || 'Untitled'}</div>
            <div className="text-[10px] text-bh-text3 font-mono truncate mt-0.5">{shortUrl(item.url)}</div>
          </div>
          <div className="text-[10px] text-bh-text3 font-mono shrink-0 mt-0.5">{timeAgo(item.visitedAt)}</div>
        </a>
      ))}
    </div>
  )
}
