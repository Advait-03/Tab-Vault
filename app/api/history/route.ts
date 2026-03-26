import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTrackedBrowserIds } from '@/lib/browser-state'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const browser = searchParams.get('browser')
  const profile = searchParams.get('profile')
  const limit   = Math.min(Number(searchParams.get('limit') ?? 100), 200)
  const page    = Number(searchParams.get('page') ?? 0)
  const search  = searchParams.get('q')
  const trackedBrowserIds = await getTrackedBrowserIds()

  if (!trackedBrowserIds.length) {
    return NextResponse.json([])
  }

  if (browser && !trackedBrowserIds.includes(browser)) {
    return NextResponse.json([])
  }

  const history = await prisma.history.findMany({
    where: {
      browser: browser ? browser : { in: trackedBrowserIds },
      ...(profile ? { profile }  : {}),
      ...(search  ? { OR: [{ title: { contains: search } }, { url: { contains: search } }] } : {}),
    },
    include:  { category: true },
    orderBy:  { visitedAt: 'desc' },
    take:     limit,
    skip:     page * limit,
  })
  return NextResponse.json(history)
}
