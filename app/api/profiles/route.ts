import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const browser = String(body.browser ?? '')
  const previousProfile = String(body.previousProfile ?? '')
  const nextProfile = String(body.nextProfile ?? '').trim()

  if (!browser || !previousProfile || !nextProfile) {
    return NextResponse.json({ error: 'browser, previousProfile and nextProfile are required' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.tab.updateMany({
      where: { browser, profile: previousProfile },
      data: { profile: nextProfile },
    }),
    prisma.history.updateMany({
      where: { browser, profile: previousProfile },
      data: { profile: nextProfile },
    }),
    prisma.dailyStats.updateMany({
      where: { browser, profile: previousProfile },
      data: { profile: nextProfile },
    }),
  ])

  return NextResponse.json({ ok: true })
}
