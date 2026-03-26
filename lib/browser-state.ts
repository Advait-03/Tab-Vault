import { prisma } from '@/lib/prisma'

export async function getDetectedBrowsers() {
  return prisma.detectedBrowser.findMany({
    where: { isEnabled: true },
    orderBy: { detectedAt: 'asc' },
  })
}

export async function getTrackedBrowsers() {
  return prisma.detectedBrowser.findMany({
    where: {
      isEnabled: true,
      extensionInstalled: true,
    },
    orderBy: { detectedAt: 'asc' },
  })
}

export async function getTrackedBrowserIds() {
  const tracked = await getTrackedBrowsers()
  return tracked.map((browser) => browser.browserId)
}
