// prisma/seed.js
// Populates the database with realistic demo data
// Run with: npm run db:seed
// This makes the dashboard look real on first launch

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const BROWSERS = ['chrome', 'edge', 'firefox', 'brave', 'safari']
const PROFILES = {
  chrome:  ['Personal', 'Work', 'Guest'],
  edge:    ['Personal', 'Personal 1', 'Personal 2'],
  firefox: ['Default'],
  brave:   ['Personal'],
  safari:  ['Personal'],
}
const SAMPLE_SITES = [
  { title: 'GitHub — Dashboard',        url: 'https://github.com',             favicon: null },
  { title: 'YouTube — Home',            url: 'https://youtube.com',            favicon: null },
  { title: 'Google — Search',           url: 'https://google.com',             favicon: null },
  { title: 'Stack Overflow',            url: 'https://stackoverflow.com',      favicon: null },
  { title: 'Reddit — r/programming',   url: 'https://reddit.com/r/programming',favicon: null },
  { title: 'MDN Web Docs',              url: 'https://developer.mozilla.org',  favicon: null },
  { title: 'Notion — Workspace',        url: 'https://notion.so',              favicon: null },
  { title: 'Slack — Messages',          url: 'https://app.slack.com',          favicon: null },
  { title: 'Gmail — Inbox',             url: 'https://mail.google.com',        favicon: null },
  { title: 'Twitter / X',              url: 'https://x.com',                  favicon: null },
  { title: 'LinkedIn — Feed',           url: 'https://linkedin.com',           favicon: null },
  { title: 'Amazon — Shopping',         url: 'https://amazon.in',              favicon: null },
  { title: 'Figma — Design',            url: 'https://figma.com',              favicon: null },
  { title: 'VS Code — Web',             url: 'https://vscode.dev',             favicon: null },
  { title: 'Claude AI',                 url: 'https://claude.ai',              favicon: null },
  { title: 'ChatGPT',                   url: 'https://chatgpt.com',            favicon: null },
  { title: 'Medium — Articles',         url: 'https://medium.com',             favicon: null },
  { title: 'Hacker News',              url: 'https://news.ycombinator.com',   favicon: null },
  { title: 'NPM — Packages',            url: 'https://npmjs.com',              favicon: null },
  { title: 'Tailwind CSS Docs',         url: 'https://tailwindcss.com',        favicon: null },
]

const CATEGORIES_DATA = [
  { name: 'Work',          emoji: '💼', color: '#34D399' },
  { name: 'Research',      emoji: '🔬', color: '#3BA0E9' },
  { name: 'Shopping',      emoji: '🛒', color: '#FF9500' },
  { name: 'Entertainment', emoji: '🎮', color: '#A78BFA' },
  { name: 'Learning',      emoji: '📚', color: '#C8FF57' },
]

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  console.log('🌱 Seeding TabVault database…')

  // Clear existing data
  await prisma.history.deleteMany()
  await prisma.tab.deleteMany()
  await prisma.dailyStats.deleteMany()
  await prisma.category.deleteMany()
  console.log('✓ Cleared existing data')

  // ── Create categories ──────────────────────────────
  const categories = await Promise.all(
    CATEGORIES_DATA.map((c) => prisma.category.create({ data: c }))
  )
  console.log(`✓ Created ${categories.length} categories`)

  // ── Create 30 days of history + stats ─────────────
  const historyEntries = []
  const statsMap       = new Map()

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date   = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(0, 0, 0, 0)
    const dateStr = date.toISOString().split('T')[0]

    // Each browser active on this day
    for (const browser of BROWSERS) {
      const profiles = PROFILES[browser]
      for (const profile of profiles) {
        // Random number of visits per browser per day
        const visits = rand(5, 30)
        let totalTime = 0

        for (let v = 0; v < visits; v++) {
          const site     = pick(SAMPLE_SITES)
          const duration = rand(30, 600) // 30s to 10 min per visit
          totalTime     += duration

          const visitTime = new Date(date)
          visitTime.setHours(rand(8, 22), rand(0, 59), rand(0, 59))

          historyEntries.push({
            browser,
            profile,
            url:        site.url,
            title:      site.title,
            visitedAt:  visitTime,
            duration,
            categoryId: Math.random() > 0.6 ? pick(categories).id : null,
          })
        }

        // Accumulate daily stats
        const key = `${dateStr}|${browser}|${profile}`
        statsMap.set(key, {
          date:       dateStr,
          browser,
          profile,
          totalTime,
          tabsOpened: rand(3, 20),
          visits,
        })
      }
    }
  }

  // Bulk insert history (in chunks to avoid SQLite limits)
  const CHUNK = 100
  for (let i = 0; i < historyEntries.length; i += CHUNK) {
    await prisma.history.createMany({ data: historyEntries.slice(i, i + CHUNK) })
  }
  console.log(`✓ Created ${historyEntries.length} history entries`)

  // Bulk insert daily stats
  const statsArr = Array.from(statsMap.values())
  await prisma.dailyStats.createMany({ data: statsArr })
  console.log(`✓ Created ${statsArr.length} daily stat records`)

  // ── Create open tabs snapshot ──────────────────────
  const openTabs = []
  const now      = new Date()
  for (const browser of BROWSERS) {
    const profiles = PROFILES[browser]
    for (const profile of profiles) {
      const count = rand(2, 8)
      for (let t = 0; t < count; t++) {
        const site     = pick(SAMPLE_SITES)
        const openedAt = new Date(now - rand(0, 3600000)) // opened in last hour
        openTabs.push({
          tabId:     rand(1000, 9999),
          browser,
          profile,
          title:     site.title,
          url:       site.url,
          openedAt,
          isOpen:    true,
          timeSpent: rand(0, 300000),
        })
      }
    }
  }

  await prisma.tab.createMany({ data: openTabs })
  console.log(`✓ Created ${openTabs.length} open tabs`)

  console.log('\n✅ TabVault database seeded successfully!')
  console.log('   Run: npm run dev to start the app')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
