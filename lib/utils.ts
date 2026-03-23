import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BROWSER_COLORS: Record<string, string> = {
  chrome:  '#F4845F',
  edge:    '#3BA0E9',
  firefox: '#FF9500',
  brave:   '#A78BFA',
  safari:  '#34C759',
  opera:   '#FF3B30',
}

export const BROWSER_ICONS: Record<string, string> = {
  chrome:  '🔴',
  edge:    '🔵',
  firefox: '🟠',
  brave:   '🦁',
  safari:  '🧭',
  opera:   '🎭',
}

export const BROWSER_NAMES: Record<string, string> = {
  chrome:  'Chrome',
  edge:    'Edge',
  firefox: 'Firefox',
  brave:   'Brave',
  safari:  'Safari',
  opera:   'Opera',
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

export function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

export function timeAgo(date: Date | string): string {
  const d    = new Date(date)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}hr ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}

export function getFavicon(url: string): string {
  try {
    const u = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`
  } catch {
    return ''
  }
}

// Seed browser list for UI when DB is empty
export const SEED_BROWSERS = [
  {
    id: 'chrome', name: 'Chrome', icon: '🔴', color: '#F4845F',
    profiles: [
      { name: 'Personal',   color: '#F4845F', initial: 'P', tabs: 0 },
      { name: 'Work',       color: '#34D399', initial: 'W', tabs: 0 },
      { name: 'Guest',      color: '#94A3B8', initial: 'G', tabs: 0 },
    ],
  },
  {
    id: 'edge', name: 'Edge', icon: '🔵', color: '#3BA0E9',
    profiles: [
      { name: 'Personal',   color: '#3BA0E9', initial: 'P', tabs: 0 },
      { name: 'Personal 1', color: '#60A5FA', initial: '1', tabs: 0 },
      { name: 'Personal 2', color: '#93C5FD', initial: '2', tabs: 0 },
    ],
  },
  {
    id: 'firefox', name: 'Firefox', icon: '🟠', color: '#FF9500',
    profiles: [{ name: 'Default', color: '#FF9500', initial: 'D', tabs: 0 }],
  },
  {
    id: 'brave', name: 'Brave', icon: '🦁', color: '#A78BFA',
    profiles: [{ name: 'Personal', color: '#A78BFA', initial: 'P', tabs: 0 }],
  },
  {
    id: 'safari', name: 'Safari', icon: '🧭', color: '#34C759',
    profiles: [{ name: 'Personal', color: '#34C759', initial: 'P', tabs: 0 }],
  },
]

// Browser install paths for reference (used in README)
export const BROWSER_INSTALL_PATHS: Record<string, string[]> = {
  chrome:  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe',
  ],
  edge:    [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'Built into Windows 10 and Windows 11',
  ],
  brave:   [
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    '%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  ],
  firefox: [
    'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
    'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
  ],
  opera:   [
    'C:\\Program Files\\Opera\\opera.exe',
    '%LOCALAPPDATA%\\Programs\\Opera\\opera.exe',
  ],
}
