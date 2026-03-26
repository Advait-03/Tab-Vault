'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, LayoutGrid, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSetupState, useStats } from '@/hooks/useQueries'
import ThemeToggle from '@/components/ThemeToggle'

export default function Topbar() {
  const pathname = usePathname()
  const { data: stats } = useStats()
  const { data: setup } = useSetupState()

  return (
    <header className="sticky top-0 z-50 border-b border-bh-s4/70 bg-bh-s1/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bh-green/10 text-bh-green">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="tv-logo-text text-lg text-bh-text">TabVault</div>
            <div className="text-xs text-bh-text3">Local browser activity, without the clutter.</div>
          </div>
        </Link>

        <nav className="ml-2 flex items-center gap-2 rounded-full bg-bh-s2 p-1">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
              pathname === '/' ? 'bg-bh-s1 text-bh-text shadow-sm' : 'text-bh-text2 hover:text-bh-text'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/activity"
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
              pathname === '/activity' ? 'bg-bh-s1 text-bh-text shadow-sm' : 'text-bh-text2 hover:text-bh-text'
            )}
          >
            <Activity className="h-4 w-4" />
            Activity
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <div className="rounded-full border border-black/8 bg-bh-s2 px-4 py-2 text-right">
            <div className="text-xs text-bh-text3">Tracked browsers</div>
            <div className="text-sm font-semibold text-bh-text">{setup?.trackedBrowsers?.length ?? 0}</div>
          </div>
          <div className="rounded-full border border-black/8 bg-bh-s2 px-4 py-2 text-right">
            <div className="text-xs text-bh-text3">Open tabs</div>
            <div className="text-sm font-semibold text-bh-text">{stats?.totalTabs ?? 0}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
