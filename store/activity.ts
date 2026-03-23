'use client'
import { create } from 'zustand'

interface ActivityState {
  selectedBrowser: string | null
  selectedProfile: string | null
  drillLevel:      0 | 1 | 2
  selectBrowser:   (b: string) => void
  selectProfile:   (p: string) => void
  goBack:          () => void
  reset:           () => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  selectedBrowser: null,
  selectedProfile: null,
  drillLevel:      0,
  selectBrowser: (b) => set({ selectedBrowser: b, selectedProfile: null, drillLevel: 1 }),
  selectProfile: (p) => set((s) => ({ ...s, selectedProfile: p, drillLevel: 2 })),
  goBack: () => set((s) => {
    if (s.drillLevel === 2) return { ...s, selectedProfile: null, drillLevel: 1 }
    if (s.drillLevel === 1) return { ...s, selectedBrowser: null, drillLevel: 0 }
    return s
  }),
  reset: () => set({ selectedBrowser: null, selectedProfile: null, drillLevel: 0 }),
}))
