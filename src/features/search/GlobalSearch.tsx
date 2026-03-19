import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db/database'
import { useUiStore } from '../../stores/uiStore'
import type { Project, Category, SubCategory, Task } from '../../types'

type SearchResult =
  | { type: 'project'; item: Project }
  | { type: 'epic'; item: Category; projectName: string }
  | { type: 'task'; item: SubCategory; projectName: string }
  | { type: 'action'; item: Task; projectName: string }

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { openTaskSlideover } = useUiStore()

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    const lower = q.toLowerCase()

    const [projects, categories, subCategories, tasks] = await Promise.all([
      db.projects.filter((p) => p.archivedAt == null && p.name.toLowerCase().includes(lower)).limit(5).toArray(),
      db.categories.filter((c) => c.archivedAt == null && c.name.toLowerCase().includes(lower)).limit(5).toArray(),
      db.subCategories.filter((s) => s.archivedAt == null && s.name.toLowerCase().includes(lower)).limit(5).toArray(),
      db.tasks.filter((t) => t.archivedAt == null && (t.title.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower))).limit(8).toArray(),
    ])

    // Build project name map
    const projectIds = new Set([
      ...categories.map((c) => c.projectId),
      ...subCategories.map((s) => s.projectId),
      ...tasks.map((t) => t.projectId),
    ])
    const projectMap = new Map<number, string>()
    for (const id of projectIds) {
      const p = await db.projects.get(id)
      if (p) projectMap.set(id, p.name)
    }

    const out: SearchResult[] = [
      ...projects.map((item): SearchResult => ({ type: 'project', item })),
      ...categories.map((item): SearchResult => ({ type: 'epic', item, projectName: projectMap.get(item.projectId) ?? '' })),
      ...subCategories.map((item): SearchResult => ({ type: 'task', item, projectName: projectMap.get(item.projectId) ?? '' })),
      ...tasks.map((item): SearchResult => ({ type: 'action', item, projectName: projectMap.get(item.projectId) ?? '' })),
    ]
    setResults(out)
    setSelectedIndex(0)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  function handleSelect(r: SearchResult) {
    setOpen(false)
    if (r.type === 'project') {
      navigate(`/projects/${r.item.id}`)
    } else if (r.type === 'epic' || r.type === 'task') {
      navigate(`/projects/${r.item.projectId}`)
    } else if (r.type === 'action') {
      navigate(`/projects/${r.item.projectId}`)
      setTimeout(() => openTaskSlideover(r.item.id!), 100)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]) }
  }

  const typeLabel = { project: '프로젝트', epic: 'EPIC', task: 'TASK', action: 'ACTION' }
  const typeColor = {
    project: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    epic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    task: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    action: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="프로젝트, EPIC, TASK, ACTION 검색..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => {
              const name = r.type === 'project' ? r.item.name
                : r.type === 'action' ? r.item.title
                : r.item.name
              const sub = r.type !== 'project' ? r.projectName : null
              return (
                <li key={`${r.type}-${r.item.id}`}>
                  <button
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => handleSelect(r)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${typeColor[r.type]}`}>
                      {typeLabel[r.type]}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1">{name}</span>
                    {sub && <span className="text-xs text-gray-400 truncate max-w-[120px]">{sub}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : query.trim() ? (
          <p className="text-sm text-gray-400 text-center py-8">검색 결과 없음</p>
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">검색어를 입력하세요</p>
        )}

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-xs text-gray-400">
          <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">↑↓</kbd> 이동</span>
          <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Enter</kbd> 선택</span>
          <span className="ml-auto"><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Ctrl K</kbd> 열기/닫기</span>
        </div>
      </div>
    </div>
  )
}
