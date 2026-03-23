'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ── Types ──────────────────────────────────────────────
export interface Tab {
  id: number; tabId: number; browser: string; profile: string
  title: string; url: string; favicon?: string
  openedAt: string; timeSpent: number; isOpen: boolean
}
export interface HistoryItem {
  id: number; browser: string; profile: string
  url: string; title: string; favicon?: string
  visitedAt: string; duration: number; categoryId: number | null
  category?: { id: number; name: string; emoji: string; color: string }
}
export interface Category {
  id: number; name: string; emoji: string; color: string
  _count?: { history: number }
}
export interface StatsResponse {
  daily:       { date: string; browser: string; profile: string; totalTime: number; tabsOpened: number; visits: number }[]
  totalTabs:   number
  totalTime:   number
  totalVisits: number
  browsers:    { browser: string; totalTime: number; visits: number }[]
}

// ── Fetchers ───────────────────────────────────────────
const fetchTabs = async (browser?: string | null, profile?: string | null) => {
  const p = new URLSearchParams()
  if (browser) p.set('browser', browser)
  if (profile) p.set('profile', profile)
  const r = await fetch(`/api/tabs?${p}`)
  if (!r.ok) throw new Error('Failed to fetch tabs')
  return r.json() as Promise<Tab[]>
}

const fetchHistory = async (opts?: { browser?: string | null; profile?: string | null; limit?: number; page?: number; q?: string }) => {
  const p = new URLSearchParams()
  if (opts?.browser) p.set('browser', opts.browser)
  if (opts?.profile) p.set('profile', opts.profile)
  if (opts?.limit)   p.set('limit',   String(opts.limit))
  if (opts?.page)    p.set('page',    String(opts.page))
  if (opts?.q)       p.set('q',       opts.q)
  const r = await fetch(`/api/history?${p}`)
  if (!r.ok) throw new Error('Failed to fetch history')
  return r.json() as Promise<HistoryItem[]>
}

const fetchStats = async (days = 30) => {
  const r = await fetch(`/api/stats?days=${days}`)
  if (!r.ok) throw new Error('Failed to fetch stats')
  return r.json() as Promise<StatsResponse>
}

const fetchCategories = async () => {
  const r = await fetch('/api/categories')
  if (!r.ok) throw new Error('Failed to fetch categories')
  return r.json() as Promise<Category[]>
}

// ── Hooks ──────────────────────────────────────────────
export const useTabs = (browser?: string | null, profile?: string | null) =>
  useQuery({ queryKey: ['tabs', browser, profile], queryFn: () => fetchTabs(browser, profile), refetchInterval: 10_000, staleTime: 5_000 })

export const useHistory = (opts?: { browser?: string | null; profile?: string | null; limit?: number; page?: number; q?: string }) =>
  useQuery({ queryKey: ['history', opts?.browser, opts?.profile, opts?.page, opts?.q], queryFn: () => fetchHistory(opts), staleTime: 30_000 })

export const useStats = (days = 1) =>
  useQuery({ queryKey: ['stats', days], queryFn: () => fetchStats(days), refetchInterval: 30_000, staleTime: 5_000 })

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: fetchCategories, staleTime: 60_000 })

// ── Mutations ──────────────────────────────────────────
export const useAssignCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ historyId, categoryId }: { historyId: number; categoryId: number | null }) => {
      const r = await fetch(`/api/history/${historyId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId }) })
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['history'] }); qc.invalidateQueries({ queryKey: ['categories'] }) },
  })
}

export const useCreateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; emoji: string; color: string }) => {
      const r = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
