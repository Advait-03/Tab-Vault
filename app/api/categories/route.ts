import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  emoji: z.string().default('📁'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#8B86AE'),
})

export async function GET() {
  const categories = await prisma.category.findMany({
    include:  { _count: { select: { history: true } } },
    orderBy:  { createdAt: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = CreateCategorySchema.parse(body)
    const category = await prisma.category.create({
      data: validated,
    })
    return NextResponse.json(category, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
