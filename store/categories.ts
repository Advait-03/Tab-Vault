'use client'
import { create } from 'zustand'

interface CategoriesState {
  activeCategoryId:  number | null
  setActiveCategory: (id: number | null) => void
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  activeCategoryId:  null,
  setActiveCategory: (id) => set({ activeCategoryId: id }),
}))
