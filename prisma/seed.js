const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  { name: 'Work', emoji: 'W', color: '#1a73e8' },
  { name: 'Learning', emoji: 'L', color: '#34a853' },
  { name: 'Personal', emoji: 'P', color: '#fbbc04' },
]

async function main() {
  console.log('Seeding TabVault starter data...')

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      create: category,
      update: category,
    })
  }

  console.log('Starter categories are ready.')
  console.log('Demo browsing data is intentionally disabled so the dashboard only reflects real activity.')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
