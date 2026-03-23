'use client'
import { Plus, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useCategories, useCreateCategory, useHistory } from '@/hooks/useQueries'
import { useCategoriesStore } from '@/store/categories'
import { BROWSER_COLORS, BROWSER_NAMES, cn } from '@/lib/utils'

export default function CategoryPanel() {
  const { activeCategoryId, setActiveCategory } = useCategoriesStore()
  const { data: categories, isLoading }         = useCategories()
  const createCategory                           = useCreateCategory()
  const [showNew, setShowNew]                    = useState(false)
  const [newName, setNewName]                    = useState('')
  const [newEmoji, setNewEmoji]                  = useState('📁')

  const activeId = activeCategoryId ?? categories?.[0]?.id ?? null

  async function handleCreate() {
    if (!newName.trim()) return
    await createCategory.mutateAsync({ name: newName.trim(), emoji: newEmoji, color: '#8B86AE' })
    setNewName(''); setNewEmoji('📁'); setShowNew(false)
  }

  return (
    <div className="flex flex-col h-full border-l border-white/[0.07] w-full md:w-[260px] shrink-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07] shrink-0">
        <span className="font-black text-sm flex-1">📁 Categories</span>
        <button onClick={() => setShowNew(!showNew)}
          className="w-6 h-6 rounded-lg border border-white/10 bg-bh-s2 flex items-center justify-center
                     text-bh-text2 hover:border-bh-green/40 hover:text-bh-green transition-all">
          <Plus className="w-3.5 h-3.5"/>
        </button>
      </div>

      {showNew && (
        <div className="px-3 py-2 border-b border-white/[0.07] bg-bh-s2">
          <div className="flex gap-2 mb-2">
            <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)}
              className="w-10 text-center bg-bh-s3 border border-white/10 rounded-lg text-sm px-1 py-1.5 outline-none focus:border-bh-green/50"/>
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Category name"
              className="flex-1 bg-bh-s3 border border-white/10 rounded-lg text-xs px-3 py-1.5
                         text-bh-text placeholder:text-bh-text3 outline-none focus:border-bh-green/50"/>
          </div>
          <button onClick={handleCreate}
            className="w-full py-1.5 rounded-lg bg-bh-green/20 text-bh-green text-xs font-black
                       hover:bg-bh-green/30 transition-colors">
            Create
          </button>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 p-3 border-b border-white/[0.07] shrink-0">
        {isLoading && <div className="h-6 w-full bg-bh-s2 rounded-full animate-pulse"/>}
        {categories?.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={cn('px-3 py-1 rounded-full text-[11px] font-bold border transition-all',
              activeId === cat.id
                ? 'bg-bh-green text-bh-bg border-transparent font-black'
                : 'text-bh-text2 border-white/10 bg-bh-s2 hover:border-white/20')}>
            {cat.emoji} {cat.name}
            {(cat._count?.history ?? 0) > 0 && (
              <span className={cn('ml-1.5 text-[9px] font-mono', activeId === cat.id ? 'text-bh-bg/70' : 'text-bh-text3')}>
                {cat._count!.history}
              </span>
            )}
          </button>
        ))}
        {!isLoading && !categories?.length && (
          <p className="text-xs text-bh-text3 w-full text-center py-2">No categories — create one!</p>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {activeId && <CategoryItems categoryId={activeId}/>}
      </div>
    </div>
  )
}

function CategoryItems({ categoryId }: { categoryId: number }) {
  const { data: history, isLoading } = useHistory({ limit: 100 })
  const items = history?.filter((h) => h.categoryId === categoryId) ?? []

  if (isLoading) return (
    <div className="p-3 flex flex-col gap-2">
      {Array.from({length:4}).map((_,i) => <div key={i} className="h-10 bg-bh-s2 rounded-xl animate-pulse"/>)}
    </div>
  )

  if (!items.length) return (
    <div className="flex flex-col items-center justify-center h-32 gap-2 text-bh-text3">
      <span className="text-2xl opacity-30">✦</span>
      <p className="text-xs">Assign history items here</p>
    </div>
  )

  return (
    <div>
      {items.map((item) => {
        const color = item.browser ? BROWSER_COLORS[item.browser] : '#8B86AE'
        return (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.05]
                       hover:bg-bh-s2 transition-colors group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border border-white/10"
                 style={{ background: `${color}15` }}>
              {item.favicon ? <img src={item.favicon} className="w-4 h-4 rounded" alt=""/> : '🌐'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold truncate group-hover:text-bh-green transition-colors">{item.title || 'Untitled'}</div>
              <div className="text-[9px] font-mono mt-0.5" style={{ color }}>{BROWSER_NAMES[item.browser] ?? item.browser}</div>
            </div>
            <ExternalLink className="w-3 h-3 text-bh-text3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
          </a>
        )
      })}
    </div>
  )
}
