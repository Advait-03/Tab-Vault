import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const id   = Number(params.id)
  const updated = await prisma.history.update({
    where:   { id },
    data:    { categoryId: body.categoryId ?? null },
    include: { category: true },
  })
  return NextResponse.json(updated)
}
