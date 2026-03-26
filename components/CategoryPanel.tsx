'use client'

import { Sparkles, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAssignCategory, useAutoCategorizeHistory, useCategories, useCreateCategory, useHistory } from '@/hooks/useQueries'
import { useCategoriesStore } from '@/store/categories'
import { BROWSER_COLORS, BROWSER_NAMES, shortUrl } from '@/lib/utils'

export default function CategoryPanel() {
  const { activeCategoryId, setActiveCategory } = useCategoriesStore()
  const { data: categories, isLoading } = useCategories()
  const { data: history } = useHistory({ limit: 120 })
  const createCategory = useCreateCategory()
  const assignCategory = useAssignCategory()
  const autoCategorize = useAutoCategorizeHistory()

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('F')
  const [draggedHistoryId, setDraggedHistoryId] = useState<number | null>(null)

  const activeId = activeCategoryId ?? categories?.[0]?.id ?? null
  const uncategorized = useMemo(
    () => (history ?? []).filter((item) => item.categoryId == null).slice(0, 12),
    [history]
  )

  async function handleCreate() {
    if (!newName.trim()) return
    await createCategory.mutateAsync({ name: newName.trim(), emoji: newEmoji || 'F', color: '#7c8cff' })
    setNewName('')
    setNewEmoji('F')
    setShowNew(false)
  }

  async function assignDraggedItem(categoryId: number) {
    if (!draggedHistoryId) return
    await assignCategory.mutateAsync({ historyId: draggedHistoryId, categoryId })
    setDraggedHistoryId(null)
  }

  return (
    <div className="flex h-full w-full shrink-0 flex-col rounded-[28px] border border-bh-s4/70 bg-bh-s1 shadow-sm md:w-[320px]">
      <div className="border-b border-bh-s4/60 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-bh-text">Categories</div>
            <div className="text-xs text-bh-text3">Drag uncategorized items onto a category or assign them manually.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => autoCategorize.mutate()}
              className="rounded-full border border-bh-green/20 bg-bh-green/10 px-3 py-1.5 text-xs font-medium text-bh-green"
            >
              {autoCategorize.isPending ? 'Categorizing...' : 'Auto'}
            </button>
            <button
              onClick={() => setShowNew((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-bh-s4 bg-bh-s2 text-bh-text2"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showNew && (
        <div className="border-b border-bh-s4/60 bg-bh-s2 px-4 py-3">
          <div className="flex gap-2">
            <input
              value={newEmoji}
              onChange={(event) => setNewEmoji(event.target.value)}
              className="w-12 rounded-2xl border border-bh-s4 bg-bh-s1 px-3 py-2 text-center text-sm text-bh-text"
            />
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Category name"
              className="flex-1 rounded-2xl border border-bh-s4 bg-bh-s1 px-3 py-2 text-sm text-bh-text"
            />
          </div>
          <button
            onClick={handleCreate}
            className="mt-3 w-full rounded-2xl bg-bh-green px-4 py-2 text-sm font-semibold text-white"
          >
            Create category
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 border-b border-bh-s4/60 px-4 py-4">
        {isLoading && <div className="h-16 animate-pulse rounded-3xl bg-bh-s2" />}
        {categories?.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => assignDraggedItem(category.id)}
            className={`rounded-3xl border px-4 py-4 text-left transition-all ${
              activeId === category.id
                ? 'border-bh-green/30 bg-bh-green/10'
                : 'border-bh-s4/70 bg-bh-s2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-bh-text">
                {category.emoji} {category.name}
              </div>
              <div className="text-xs text-bh-text3">{category._count?.history ?? 0}</div>
            </div>
            <div className="mt-2 text-xs text-bh-text3">
              Drop an item here to file it under {category.name.toLowerCase()}.
            </div>
          </button>
        ))}
      </div>

      <div className="border-b border-bh-s4/60 px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-bh-text">
          <Sparkles className="h-4 w-4 text-bh-green" />
          Uncategorized queue
        </div>
        <div className="space-y-2">
          {uncategorized.length === 0 && (
            <div className="rounded-3xl bg-bh-s2 px-4 py-6 text-center text-xs text-bh-text3">
              Nothing waiting right now.
            </div>
          )}
          {uncategorized.map((item) => {
            const color = BROWSER_COLORS[item.browser] ?? '#7c8cff'
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDraggedHistoryId(item.id)}
                className="cursor-grab rounded-3xl border border-bh-s4/70 bg-bh-s2 px-4 py-3 active:cursor-grabbing"
              >
                <div className="truncate text-sm font-medium text-bh-text">{item.title || 'Untitled'}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-bh-text3">{shortUrl(item.url)}</span>
                  <span className="rounded-full px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: `${color}18`, color }}>
                    {BROWSER_NAMES[item.browser] ?? item.browser}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeId ? <CategoryItems categoryId={activeId} /> : null}
      </div>
    </div>
  )
}

function CategoryItems({ categoryId }: { categoryId: number }) {
  const { data: history, isLoading } = useHistory({ limit: 150 })
  const items = (history ?? []).filter((item) => item.categoryId === categoryId)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-2xl bg-bh-s2" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl bg-bh-s2 px-4 py-8 text-center text-xs text-bh-text3">
        This category is empty for now.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const color = BROWSER_COLORS[item.browser] ?? '#7c8cff'
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-3xl border border-bh-s4/70 bg-bh-s2 px-4 py-3"
          >
            <div className="truncate text-sm font-medium text-bh-text">{item.title || 'Untitled'}</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs text-bh-text3">{shortUrl(item.url)}</span>
              <span className="rounded-full px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: `${color}18`, color }}>
                {BROWSER_NAMES[item.browser] ?? item.browser}
              </span>
            </div>
            {item.note && <div className="mt-2 text-xs text-bh-text2">{item.note}</div>}
          </a>
        )
      })}
    </div>
  )
}
