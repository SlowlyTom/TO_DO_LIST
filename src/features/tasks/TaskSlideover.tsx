import { useEffect, useState } from 'react'
import { useTask, useTaskHistory, useTaskMutations } from '../../hooks/useTasks'
import { db } from '../../db/database'
import { useTaskComments, useTaskCommentMutations } from '../../hooks/useTaskComments'
import { useUiStore } from '../../stores/uiStore'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { RecurrenceSection, recurrenceLabel } from './RecurrenceSection'
import type { Task, TaskStatus, TaskPriority, ChecklistItem, RecurrenceConfig } from '../../types'

const statusOptions = [
  { value: 'TODO', label: 'TODO' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'DONE', label: '완료' },
]

const priorityOptions = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
  { value: 'CRITICAL', label: '긴급' },
]

const fieldLabelMap: Record<string, string> = {
  title: '제목',
  description: '설명',
  status: '상태',
  priority: '우선순위',
  assignee: '담당자',
  dueDate: '마감일',
  progress: '진척율',
  checklist: '체크리스트',
  tags: '태그',
  blockedBy: '블로커',
  recurrence: '반복',
  issueUrl: '이슈 URL',
}

const valueLabelMap: Record<string, string> = {
  TODO: 'TODO',
  IN_PROGRESS: '진행중',
  DONE: '완료',
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  CRITICAL: '긴급',
  'null': '없음',
  '""': '없음',
}

function formatHistoryValue(raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    if (parsed === null || parsed === '') return '없음'
    if (typeof parsed === 'string') return valueLabelMap[parsed] ?? parsed
    if (typeof parsed === 'number') return String(parsed)
    if (Array.isArray(parsed)) return parsed.length === 0 ? '없음' : `${parsed.length}개`
    return raw
  } catch {
    return raw
  }
}

function abbreviateUrl(url: string): string {
  try {
    const u = new URL(url)
    const pathParts = u.pathname.split('/').filter(Boolean)
    const short = pathParts.length > 2 ? `.../${pathParts.slice(-2).join('/')}` : u.pathname
    return `${u.hostname}${short}`
  } catch {
    return url
  }
}

function ChecklistSection({
  items,
  onChange,
}: {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}) {
  const [newText, setNewText] = useState('')

  function toggle(id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id))
  }

  function add() {
    if (!newText.trim()) return
    onChange([...items, { id: Date.now().toString(), text: newText.trim(), done: false }])
    setNewText('')
  }

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">체크리스트</span>
        <span className="text-xs text-gray-400">{doneCount}/{items.length}</span>
      </div>
      {items.length > 0 && (
        <ProgressBar value={items.length ? (doneCount / items.length) * 100 : 0} size="sm" />
      )}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggle(item.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item.text}
            </span>
            <button
              onClick={() => remove(item.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="항목 추가..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button size="sm" variant="secondary" onClick={add}>추가</Button>
      </div>
    </div>
  )
}

function TagsSection({
  tags,
  onChange,
  readonly,
}: {
  tags: string[]
  onChange?: (tags: string[]) => void
  readonly?: boolean
}) {
  const [input, setInput] = useState('')

  function addTag(value: string) {
    const trimmed = value.trim()
    if (!trimmed || tags.includes(trimmed)) { setInput(''); return }
    onChange?.([...tags, trimmed])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange?.(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-700">태그</span>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-100"
          >
            {tag}
            {!readonly && (
              <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </span>
        ))}
        {tags.length === 0 && readonly && (
          <span className="text-xs text-gray-400">태그 없음</span>
        )}
      </div>
      {!readonly && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag(input)
            }
          }}
          placeholder="태그 입력 후 Enter..."
          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  )
}

function CommentsSection({ taskId }: { taskId: number }) {
  const comments = useTaskComments(taskId)
  const { addComment, deleteComment } = useTaskCommentMutations()
  const [newText, setNewText] = useState('')

  async function handleAdd() {
    if (!newText.trim()) return
    await addComment(taskId, newText.trim())
    setNewText('')
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">댓글 / 메모</p>
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="group flex gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex-1">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.text}</p>
              <p className="text-xs text-gray-400 mt-1">{c.createdAt.slice(0, 16).replace('T', ' ')}</p>
            </div>
            <button
              onClick={() => deleteComment(c.id!)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity self-start mt-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-xs text-gray-400">댓글이 없습니다.</li>
        )}
      </ul>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="댓글 추가..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button size="sm" variant="secondary" onClick={handleAdd}>추가</Button>
      </div>
    </div>
  )
}

export function TaskSlideover() {
  const { taskSlideover, closeTaskSlideover } = useUiStore()
  const { isOpen, taskId } = taskSlideover
  const task = useTask(taskId)
  const history = useTaskHistory(taskId)
  const { updateTask, deleteTask, archiveTask } = useTaskMutations()
  const { addToast } = useUiStore()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<Partial<Task>>({})

  useEffect(() => {
    if (task) setForm(task)
    setEditMode(false)
  }, [task])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTaskSlideover() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeTaskSlideover])

  async function handleSave() {
    if (!taskId || !form.title) return
    const result = await updateTask(taskId, form)
    setEditMode(false)

    if (result.autoCompletedSubCat) {
      const { id: subCatId, name: subCatName, categoryId } = result.autoCompletedSubCat
      addToast(`TASK "${subCatName}" 자동 완료됨`, {
        label: '다시 열기',
        onClick: async () => {
          await db.transaction('rw', db.subCategories, db.categories, async () => {
            await db.subCategories.update(subCatId, { status: 'ACTIVE', updatedAt: new Date().toISOString() })
            const cat = await db.categories.get(categoryId)
            if (cat && cat.status === 'COMPLETED') {
              await db.categories.update(cat.id!, { status: 'ACTIVE', updatedAt: new Date().toISOString() })
            }
          })
        },
      })
    }
    if (result.autoCompletedCat) {
      const { id: catId, name: catName } = result.autoCompletedCat
      addToast(`EPIC "${catName}" 자동 완료됨`, {
        label: '다시 열기',
        onClick: async () => {
          await db.categories.update(catId, { status: 'ACTIVE', updatedAt: new Date().toISOString() })
        },
      })
    }
  }

  async function handleDelete() {
    if (!taskId || !task) return
    const deletedTitle = task.title
    await deleteTask(taskId)
    closeTaskSlideover()
    addToast(`"${deletedTitle}" ACTION을 삭제했습니다.`)
  }

  async function handleArchive() {
    if (!taskId) return
    await archiveTask(taskId)
    closeTaskSlideover()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40" onClick={closeTaskSlideover} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {task && <StatusBadge status={task.status} />}
            {task && <PriorityBadge priority={task.priority} />}
          </div>
          <div className="flex items-center gap-1">
            {!editMode && task?.status === 'DONE' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleArchive}
                className="text-gray-400 hover:text-gray-600"
                title="보관함으로 이동"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" />
                </svg>
              </Button>
            )}
            {!editMode && (
              <Button size="sm" variant="ghost" onClick={() => setEditMode(true)}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={closeTaskSlideover}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 dark:text-gray-100">
          {!task ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">로딩 중...</p>
          ) : editMode ? (
            /* Edit form */
            <div className="space-y-4">
              <Input
                label="제목"
                value={form.title ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Textarea
                label="설명"
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="상태"
                  value={form.status ?? 'TODO'}
                  options={statusOptions}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                />
                <Select
                  label="우선순위"
                  value={form.priority ?? 'MEDIUM'}
                  options={priorityOptions}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                />
              </div>
              <Input
                label="담당자"
                value={form.assignee ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              />
              <Input
                label="마감일"
                type="date"
                value={form.dueDate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value || null }))}
              />
              <Input
                label="이슈 URL"
                type="url"
                value={form.issueUrl ?? ''}
                placeholder="https://..."
                onChange={(e) => setForm((f) => ({ ...f, issueUrl: e.target.value }))}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  진척율: {form.progress ?? 0}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.progress ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <TagsSection
                tags={form.tags ?? []}
                onChange={(tags) => setForm((f) => ({ ...f, tags }))}
              />
              <ChecklistSection
                items={form.checklist ?? []}
                onChange={(items) => setForm((f) => ({ ...f, checklist: items }))}
              />
              <RecurrenceSection
                value={form.recurrence ?? null}
                onChange={(v) => setForm((f) => ({ ...f, recurrence: v as RecurrenceConfig | null }))}
              />
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setForm(task); setEditMode(false) }}>취소</Button>
                <Button className="flex-1" onClick={handleSave}>저장</Button>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                <button
                  onClick={handleDelete}
                  className="w-full text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg transition-colors"
                >
                  ACTION 삭제
                </button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task.title}</h2>
                {task.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mb-0.5">담당자</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{task.assignee || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mb-0.5">마감일</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{task.dueDate || '—'}</p>
                </div>
              </div>
              {task.issueUrl && (
                <div className="text-sm">
                  <p className="text-gray-400 dark:text-gray-500 text-xs mb-0.5">이슈 URL</p>
                  <a
                    href={task.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                    title={task.issueUrl}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {abbreviateUrl(task.issueUrl)}
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1">진척율</p>
                <ProgressBar value={task.progress} showLabel />
              </div>

              {(task.tags ?? []).length > 0 && (
                <TagsSection tags={task.tags ?? []} readonly />
              )}

              {task.recurrence && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-blue-600 font-medium">{recurrenceLabel(task.recurrence)}</span>
                </div>
              )}

              {task.checklist.length > 0 && (
                <ChecklistSection
                  items={task.checklist}
                  onChange={async (items) => {
                    await updateTask(task.id!, { checklist: items })
                  }}
                />
              )}

              {task.status === 'DONE' && (
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleArchive}
                    className="w-full text-gray-500"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" />
                    </svg>
                    보관함으로 이동
                  </Button>
                </div>
              )}

              {/* Comments */}
              <CommentsSection taskId={task.id!} />

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">변경 이력</p>
                  <ul className="space-y-1.5 text-xs">
                    {history.slice(0, 10).map((h) => (
                      <li key={h.id} className="flex gap-2 text-gray-500 dark:text-gray-400">
                        <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">{h.changedAt.slice(0, 16).replace('T', ' ')}</span>
                        <span className="font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">{fieldLabelMap[h.field] ?? h.field}</span>
                        <span className="text-gray-400 dark:text-gray-500 truncate max-w-[100px]">{formatHistoryValue(h.oldValue)}</span>
                        <span className="flex-shrink-0">→</span>
                        <span className="text-gray-600 dark:text-gray-300 truncate max-w-[100px]">{formatHistoryValue(h.newValue)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
