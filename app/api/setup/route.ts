// app/api/setup/route.ts
// Manages the one-time setup wizard state
// GET  → check if setup has been completed
// POST → mark setup as complete

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SETUP_KEY = 'setup_completed'

export async function GET() {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: SETUP_KEY },
    })
    const completed = setting?.value === 'true'

    // Also fetch detected browsers
    const browsers = await prisma.detectedBrowser.findMany({
      where:   { isEnabled: true },
      orderBy: { detectedAt: 'asc' },
    })

    return NextResponse.json({ completed, browsers })
  } catch {
    // If tables don't exist yet (before migration), return not completed
    return NextResponse.json({ completed: false, browsers: [] })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  await prisma.appSettings.upsert({
    where:  { key: SETUP_KEY },
    create: { key: SETUP_KEY, value: 'true' },
    update: { value: 'true' },
  })

  // If they want to reset setup
  if (body?.reset) {
    await prisma.appSettings.upsert({
      where:  { key: SETUP_KEY },
      create: { key: SETUP_KEY, value: 'false' },
      update: { value: 'false' },
    })
    return NextResponse.json({ reset: true })
  }

  return NextResponse.json({ completed: true })
}
