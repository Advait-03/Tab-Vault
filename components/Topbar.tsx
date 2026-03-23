'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useStats } from '@/hooks/useQueries'

export default function Topbar() {
  const pathname          = usePathname()
  const [search, setSearch] = useState('')
  const { data: stats }   = useStats()
  const totalTabs         = stats?.totalTabs ?? 0

  return (
    <header className="sticky top-0 z-50 h-14 flex items-center gap-3 px-4 md:px-6
                       bg-bh-bg/95 backdrop-blur-xl border-b border-white/[0.07]">

      {/* TabVault Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
        {/* Shield icon */}
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 3L28 9V18C28 24 16 29 16 29C16 29 4 24 4 18V9L16 3Z"
                  fill="rgba(200,255,87,0.08)"
                  stroke="#C8FF57"
                  strokeWidth="1.5"/>
            <path d="M16 6L25 11V18C25 23 16 27 16 27C16 27 7 23 7 18V11L16 6Z"
                  fill="rgba(200,255,87,0.05)"/>
            <rect x="10" y="14" width="12" height="2.5" rx="1.25" fill="#C8FF57"/>
            <rect x="10" y="18.5" width="8"  height="2.5" rx="1.25" fill="#C8FF57" opacity="0.6"/>
          </svg>
        </div>
        <span className="tv-logo-text text-lg hidden sm:block">
          Tab<span className="text-bh-green">Vault</span>
        </span>
      </Link>

      {/* Dashboard / Activity toggle */}
      <div className="flex items-center gap-1 bg-bh-s2 border border-white/10
                      rounded-full p-1 ml-1">
        <Link href="/" className={cn(
          'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
          pathname === '/'
            ? 'bg-bh-green text-bh-bg font-black'
            : 'text-bh-text2 hover:text-bh-text'
        )}>
          📊 Dashboard
        </Link>
        <Link href="/activity" className={cn(
          'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
          pathname === '/activity'
            ? 'bg-bh-green text-bh-bg font-black'
            : 'text-bh-text2 hover:text-bh-text'
        )}>
          ⚡ Activity
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bh-text3"/>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tabs, history, URLs…"
          className="w-full pl-9 pr-4 py-2 bg-bh-s2 border border-white/[0.07]
                     rounded-full text-sm text-bh-text placeholder:text-bh-text3
                     outline-none focus:border-bh-green/40 transition-all"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">

        {/* Total tabs badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5
                        bg-bh-yellow/10 border border-bh-yellow/25 rounded-full">
          <span className="text-base font-black text-bh-yellow font-mono leading-none">
            {totalTabs}
          </span>
          <span className="text-[10px] font-bold text-bh-yellow/70 uppercase tracking-wide">
            tabs
          </span>
        </div>

        {/* Live pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5
                        bg-bh-green/10 border border-bh-green/25 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-bh-green animate-blink"/>
          <span className="text-[10px] font-black text-bh-green font-mono uppercase hidden sm:block">
            Live
          </span>
        </div>

        {/* Bell */}
        <button className="relative w-8 h-8 rounded-xl border border-white/10
                           bg-bh-s2 flex items-center justify-center
                           hover:bg-bh-s3 transition-colors">
          <Bell className="w-4 h-4 text-bh-text2"/>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full
                           bg-bh-pink border border-bh-s2"/>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bh-yellow to-bh-pink
                        flex items-center justify-center text-xs font-black text-bh-bg cursor-pointer">
          Y
        </div>
      </div>
    </header>
  )
}
