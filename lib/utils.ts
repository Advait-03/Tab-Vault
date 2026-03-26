import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BROWSER_COLORS: Record<string, string> = {
  chrome: '#ea4335',
  edge: '#1a73e8',
  firefox: '#ff8c00',
  brave: '#fb542b',
  safari: '#34a853',
  opera: '#d93025',
}

export const BROWSER_ICONS: Record<string, string> = {
  chrome: 'C',
  edge: 'E',
  firefox: 'F',
  brave: 'B',
  safari: 'S',
  opera: 'O',
}

export const BROWSER_NAMES: Record<string, string> = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  brave: 'Brave',
  safari: 'Safari',
  opera: 'Opera',
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

export function timeAgo(date: Date | string): string {
  const parsed = new Date(date)
  const diff = Date.now() - parsed.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return `${Math.floor(hours / 24)}d ago`
}

export function shortUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace('www.', '') + (parsed.pathname !== '/' ? parsed.pathname : '')
  } catch {
    return url
  }
}

export function getFavicon(url: string): string {
  try {
    const parsed = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`
  } catch {
    return ''
  }
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const BROWSER_INSTALL_PATHS: Record<string, string[]> = {
  chrome: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe',
  ],
  edge: [
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  brave: [
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    '%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  ],
  firefox: [
    'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
    'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
  ],
  opera: [
    'C:\\Program Files\\Opera\\launcher.exe',
    '%LOCALAPPDATA%\\Programs\\Opera\\launcher.exe',
  ],
}
