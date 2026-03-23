'use client'
import { create } from 'zustand'

// Dashboard store — week navigation + browser filters
interface DashboardState {
  weekOffset:          number
  activeBrowserFilter: string[]
  setWeekOffset:       (n: number) => void
  toggleBrowser:       (b: string) => void
  clearFilter:         () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  weekOffset:          0,
  activeBrowserFilter: [],
  setWeekOffset:  (n) => set({ weekOffset: Math.max(0, Math.min(3, n)) }),
  toggleBrowser:  (b) => set((s) => ({
    activeBrowserFilter: s.activeBrowserFilter.includes(b)
      ? s.activeBrowserFilter.filter((x) => x !== b)
      : [...s.activeBrowserFilter, b],
  })),
  clearFilter: () => set({ activeBrowserFilter: [] }),
}))
