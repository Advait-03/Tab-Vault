// app/api/tabs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const browser = searchParams.get('browser')
  const profile = searchParams.get('profile')

  const tabs = await prisma.tab.findMany({
    where: {
      isOpen: true,
      ...(browser ? { browser } : {}),
      ...(profile ? { profile } : {}),
    },
    orderBy: { openedAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(tabs)
}
