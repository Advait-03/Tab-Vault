// app/api/tabs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTrackedBrowserIds } from '@/lib/browser-state'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const browser = searchParams.get('browser')
  const profile = searchParams.get('profile')
  const trackedBrowserIds = await getTrackedBrowserIds()

  if (!trackedBrowserIds.length) {
    return NextResponse.json([])
  }

  if (browser && !trackedBrowserIds.includes(browser)) {
    return NextResponse.json([])
  }

  const tabs = await prisma.tab.findMany({
    where: {
      isOpen: true,
      browser: browser ? browser : { in: trackedBrowserIds },
      ...(profile ? { profile } : {}),
    },
    orderBy: { openedAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(tabs)
}
