'use client'
import './globals.css'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function SetupGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Don't redirect if already on setup page
    if (pathname === '/setup') { setChecked(true); return }

    fetch('/api/setup')
      .then((r) => r.json())
      .then((data) => {
        if (!data.completed) {
          router.replace('/setup')
        } else {
          setChecked(true)
        }
      })
      .catch(() => {
        // If API fails (first run before migration), go to setup
        router.replace('/setup')
      })
  }, [pathname])

  // Show nothing while checking — avoids flash of dashboard
  if (!checked && pathname !== '/setup') {
    return (
      <div className="min-h-screen bg-bh-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 4L34 11V24C34 32 20 38 20 38C20 38 6 32 6 24V11L20 4Z"
                  fill="rgba(200,255,87,0.08)" stroke="#C8FF57" strokeWidth="1.5"/>
            <rect x="13" y="19" width="14" height="3" rx="1.5" fill="#C8FF57" className="animate-pulse"/>
          </svg>
          <span className="text-bh-text3 text-xs font-mono animate-pulse">Loading TabVault…</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          retry: (count, err: any) => err?.status >= 400 ? false : count < 2,
          staleTime: 30_000,
        },
      },
    })
  )
  return (
    <QueryClientProvider client={queryClient}>
      <SetupGuard>{children}</SetupGuard>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false}/>}
    </QueryClientProvider>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <title>TabVault — All Your Browsers, One Place</title>
        <meta name="description" content="Monitor all your browsers in one place. All data stays local."/>
      </head>
      <body className="bh-gradient-bg min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
