import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import fs from 'fs'
import { prisma } from '@/lib/prisma'

const BROWSER_DEFINITIONS = [
  {
    id: 'chrome',
    name: 'Google Chrome',
    icon: 'C',
    color: '#ea4335',
    paths: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe',
    ],
    registryPaths: [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe',
      'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe',
    ],
    extensionUrl: 'chrome://extensions',
    installGuide: 'Open Extensions, enable Developer Mode, then load the local extension folder.',
  },
  {
    id: 'edge',
    name: 'Microsoft Edge',
    icon: 'E',
    color: '#1a73e8',
    paths: [
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      '%LOCALAPPDATA%\\Microsoft\\Edge\\Application\\msedge.exe',
    ],
    registryPaths: [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe',
      'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe',
    ],
    extensionUrl: 'edge://extensions',
    installGuide: 'Open Extensions, enable Developer Mode, then load the local extension folder.',
  },
  {
    id: 'brave',
    name: 'Brave Browser',
    icon: 'B',
    color: '#fb542b',
    paths: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      '%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    ],
    registryPaths: [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\brave.exe',
      'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\brave.exe',
    ],
    extensionUrl: 'brave://extensions',
    installGuide: 'Open Extensions, enable Developer Mode, then load the local extension folder.',
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    icon: 'F',
    color: '#ff8c00',
    paths: [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
      '%LOCALAPPDATA%\\Mozilla Firefox\\firefox.exe',
    ],
    registryPaths: [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\firefox.exe',
      'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\firefox.exe',
    ],
    extensionUrl: 'about:debugging#/runtime/this-firefox',
    installGuide: 'Open about:debugging, then load the extension temporary manifest from the project folder.',
  },
  {
    id: 'opera',
    name: 'Opera',
    icon: 'O',
    color: '#d93025',
    paths: [
      'C:\\Program Files\\Opera\\launcher.exe',
      'C:\\Program Files (x86)\\Opera\\launcher.exe',
      '%LOCALAPPDATA%\\Programs\\Opera\\launcher.exe',
      'C:\\Program Files\\Opera GX\\launcher.exe',
      'C:\\Program Files (x86)\\Opera GX\\launcher.exe',
    ],
    registryPaths: [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\launcher.exe',
      'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\launcher.exe',
    ],
    extensionUrl: 'opera://extensions',
    installGuide: 'Open Extensions, enable Developer Mode, then load the local extension folder.',
  },
] as const

function expandEnvPath(rawPath: string) {
  return rawPath.replace(/%([^%]+)%/g, (_match, variable) => process.env[variable] ?? '')
}

function pathExists(filePath: string) {
  try {
    return filePath.length > 0 && fs.existsSync(filePath)
  } catch {
    return false
  }
}

function readRegistryDefaultValue(key: string) {
  try {
    const output = execSync(`reg query "${key}" /ve`, { stdio: 'pipe' }).toString()
    const match = output.match(/REG_\w+\s+(.+)\s*$/m)
    return match?.[1]?.trim() ?? null
  } catch {
    return null
  }
}

function getBrowserVersion(executablePath: string) {
  try {
    const result = execSync(
      `powershell -command "(Get-Item '${executablePath.replace(/'/g, "''")}').VersionInfo.ProductVersion"`,
      { stdio: 'pipe', timeout: 3000 }
    )
      .toString()
      .trim()
    return result || null
  } catch {
    return null
  }
}

function detectWindowsBrowser(definition: (typeof BROWSER_DEFINITIONS)[number]) {
  for (const rawPath of definition.paths) {
    const executablePath = expandEnvPath(rawPath)
    if (pathExists(executablePath)) {
      return {
        found: true,
        executablePath,
        version: getBrowserVersion(executablePath),
      }
    }
  }

  for (const registryKey of definition.registryPaths) {
    const registryPath = readRegistryDefaultValue(registryKey)
    if (registryPath && pathExists(registryPath)) {
      return {
        found: true,
        executablePath: registryPath,
        version: getBrowserVersion(registryPath),
      }
    }
  }

  return { found: false, executablePath: '', version: null }
}

export async function GET() {
  if (process.platform !== 'win32') {
    return NextResponse.json({ detected: [], platform: process.platform, total: 0 })
  }

  const detected = []

  for (const definition of BROWSER_DEFINITIONS) {
    const result = detectWindowsBrowser(definition)
    if (!result.found) continue

    const saved = await prisma.detectedBrowser.upsert({
      where: { browserId: definition.id },
      create: {
        browserId: definition.id,
        name: definition.name,
        executablePath: result.executablePath,
        version: result.version,
        isEnabled: true,
      },
      update: {
        name: definition.name,
        executablePath: result.executablePath,
        version: result.version,
        isEnabled: true,
      },
    })

    detected.push({
      ...saved,
      icon: definition.icon,
      color: definition.color,
      extensionUrl: definition.extensionUrl,
      installGuide: definition.installGuide,
    })
  }

  await prisma.detectedBrowser.updateMany({
    where: {
      browserId: { notIn: detected.map((browser) => browser.browserId) },
    },
    data: { isEnabled: false },
  })

  return NextResponse.json({
    detected,
    platform: process.platform,
    total: detected.length,
  })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { browserId, extensionInstalled, isEnabled } = body

  const updated = await prisma.detectedBrowser.update({
    where: { browserId },
    data: {
      ...(typeof extensionInstalled === 'boolean' ? { extensionInstalled } : {}),
      ...(typeof isEnabled === 'boolean' ? { isEnabled } : {}),
    },
  })

  return NextResponse.json(updated)
}
