// app/api/browsers/route.ts
// Scans the Windows machine for installed browsers
// Checks registry paths + common install locations
// Saves results to DetectedBrowser table

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// ── Browser definitions with ALL possible Windows paths ──
const BROWSER_DEFINITIONS = [
  {
    id:   'chrome',
    name: 'Google Chrome',
    icon: '🔴',
    color: '#F4845F',
    paths: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
    ],
    registryKeys: [
      'HKLM\\SOFTWARE\\Google\\Chrome',
      'HKCU\\SOFTWARE\\Google\\Chrome',
    ],
    extensionUrl:  'chrome://extensions',
    storeUrl:      'https://chrome.google.com/webstore',
    installGuide:  'chrome://extensions → Developer Mode ON → Load Unpacked → select /extension folder',
  },
  {
    id:   'edge',
    name: 'Microsoft Edge',
    icon: '🔵',
    color: '#3BA0E9',
    paths: [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.PROGRAMFILES + '\\Microsoft\\Edge\\Application\\msedge.exe',
      // Edge is built into Windows 10/11 — check system path
      'C:\\Windows\\SystemApps\\Microsoft.MicrosoftEdge_8wekyb3d8bbwe\\MicrosoftEdge.exe',
    ],
    registryKeys: [
      'HKLM\\SOFTWARE\\Microsoft\\Edge',
      'HKCU\\SOFTWARE\\Microsoft\\Edge',
    ],
    extensionUrl:  'edge://extensions',
    storeUrl:      'https://microsoftedge.microsoft.com/addons',
    installGuide:  'edge://extensions → Developer Mode ON → Load Unpacked → select /extension folder',
    alwaysPresent: true, // Edge comes with Windows 10/11
  },
  {
    id:   'brave',
    name: 'Brave Browser',
    icon: '🦁',
    color: '#A78BFA',
    paths: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      process.env.LOCALAPPDATA + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    ],
    registryKeys: [
      'HKLM\\SOFTWARE\\BraveSoftware\\Brave-Browser',
      'HKCU\\SOFTWARE\\BraveSoftware\\Brave-Browser',
    ],
    extensionUrl:  'brave://extensions',
    storeUrl:      'https://chrome.google.com/webstore',
    installGuide:  'brave://extensions → Developer Mode ON → Load Unpacked → select /extension folder',
  },
  {
    id:   'firefox',
    name: 'Mozilla Firefox',
    icon: '🟠',
    color: '#FF9500',
    paths: [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
      process.env.PROGRAMFILES + '\\Mozilla Firefox\\firefox.exe',
    ],
    registryKeys: [
      'HKLM\\SOFTWARE\\Mozilla\\Mozilla Firefox',
      'HKCU\\SOFTWARE\\Mozilla\\Mozilla Firefox',
    ],
    extensionUrl:  'about:debugging#/runtime/this-firefox',
    storeUrl:      'https://addons.mozilla.org',
    installGuide:  'about:debugging → This Firefox → Load Temporary Add-on → select extension/manifest.json',
    note:          'Firefox uses a slightly different extension format. See extension/firefox-manifest.json',
  },
  {
    id:   'opera',
    name: 'Opera',
    icon: '🎭',
    color: '#FF3B30',
    paths: [
      'C:\\Program Files\\Opera\\launcher.exe',  // Opera uses launcher.exe
      'C:\\Program Files (x86)\\Opera\\launcher.exe',
      process.env.LOCALAPPDATA + '\\Programs\\Opera\\launcher.exe',
      'C:\\Program Files\\Opera GX\\launcher.exe',  // Opera GX
      'C:\\Program Files (x86)\\Opera GX\\launcher.exe',
    ],
    registryKeys: [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Opera',
      'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Opera',
      'HKLM\\SOFTWARE\\Opera Software',
      'HKCU\\SOFTWARE\\Opera Software',
    ],
    extensionUrl:  'opera://extensions',
    storeUrl:      'https://addons.opera.com',
    installGuide:  'opera://extensions → Developer Mode ON → Load Unpacked → select /extension folder',
  },
]

// ── Check if a file path exists ──────────────────────────
function pathExists(p: string): boolean {
  try {
    return fs.existsSync(p)
  } catch {
    return false
  }
}

// ── Check Windows registry for a browser ────────────────
function checkRegistry(key: string): boolean {
  try {
    execSync(`reg query "${key}"`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

// ── Try to get browser version from exe ─────────────────
function getBrowserVersion(exePath: string): string | null {
  try {
    const result = execSync(
      `powershell -command "(Get-Item '${exePath}').VersionInfo.FileVersion"`,
      { stdio: 'pipe', timeout: 3000 }
    ).toString().trim()
    return result || null
  } catch {
    return null
  }
}

// ── Detect a single browser ──────────────────────────────
function detectBrowser(def: typeof BROWSER_DEFINITIONS[0]): {
  found: boolean
  path: string
  version: string | null
} {
  // 1. Check file system paths
  for (const p of def.paths) {
    if (p && pathExists(p)) {
      const version = getBrowserVersion(p)
      return { found: true, path: p, version }
    }
  }

  // 2. Check Windows registry
  for (const key of def.registryKeys) {
    if (checkRegistry(key)) {
      return { found: true, path: 'registry-detected', version: null }
    }
  }

  // 3. Edge is always present on Windows 10/11
  if (def.alwaysPresent) {
    return { found: true, path: 'built-in', version: null }
  }

  return { found: false, path: '', version: null }
}

// ── Detect browsers on Mac/Linux ────────────────────────
function detectBrowserUnix(def: typeof BROWSER_DEFINITIONS[0]) {
  // On Mac, browsers are in /Applications/
  // On Linux, use 'which' command
  const isMac = process.platform === 'darwin'
  
  if (isMac) {
    const macPaths = [
      `/Applications/${def.id === 'chrome' ? 'Google Chrome' : def.id === 'edge' ? 'Microsoft Edge' : def.id === 'brave' ? 'Brave Browser' : 'Firefox'}.app/Contents/MacOS/${def.id === 'chrome' ? 'Google Chrome' : def.id === 'edge' ? 'Microsoft Edge' : def.id === 'brave' ? 'Brave Browser' : 'firefox'}`,
      `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`,
      `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`,
      `/Applications/Firefox.app/Contents/MacOS/firefox`,
    ]
    for (const p of macPaths) {
      if (pathExists(p)) {
        return { found: true, path: p, version: null }
      }
    }
  } else {
    // Linux — use 'which' command
    try {
      const cmd = execSync(`which ${def.id}`, { stdio: 'pipe', timeout: 1000 }).toString().trim()
      if (cmd) return { found: true, path: cmd, version: null }
    } catch (_) {}
  }
  
  return { found: false, path: '', version: null }
}

// ── GET /api/browsers — scan and return results ──────────
export async function GET() {
  const isWindows = process.platform === 'win32'

  const results = []

  for (const def of BROWSER_DEFINITIONS) {
    // Detect based on OS
    const detection = isWindows
      ? detectBrowser(def)
      : detectBrowserUnix(def)

    if (detection.found) {
      // Save/update in database
      const saved = await prisma.detectedBrowser.upsert({
        where:  { browserId: def.id },
        create: {
          browserId:      def.id,
          name:           def.name,
          executablePath: detection.path,
          version:        detection.version,
          isEnabled:      true,
        },
        update: {
          executablePath: detection.path,
          version:        detection.version,
        },
      })

      results.push({
        ...saved,
        icon:         def.icon,
        color:        def.color,
        extensionUrl: def.extensionUrl,
        installGuide: def.installGuide,
        note:         (def as any).note,
      })
    }
  }

  return NextResponse.json({
    detected: results,
    platform: process.platform,
    total:    results.length,
  })
}

// ── PATCH /api/browsers — mark extension as installed ────
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { browserId, extensionInstalled, isEnabled } = body

  const updated = await prisma.detectedBrowser.update({
    where: { browserId },
    data:  {
      ...(extensionInstalled !== undefined ? { extensionInstalled } : {}),
      ...(isEnabled          !== undefined ? { isEnabled }          : {}),
    },
  })
  return NextResponse.json(updated)
}
