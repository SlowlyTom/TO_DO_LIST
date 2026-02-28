import { useEffect, useState } from 'react'
import { useTask, useTaskHistory, useTaskMutations } from '../../hooks/useTasks'
import { useUiStore } from '../../stores/uiStore'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ProgressBar } from '../../components/ui/ProgressBar'
import type { Task, TaskStatus, TaskPriority, ChecklistItem } from '../../types'

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

export function TaskSlideover() {
  const { taskSlideover, closeTaskSlideover } = useUiStore()
  const { isOpen, taskId } = taskSlideover
  const task = useTask(taskId)
  const history = useTaskHistory(taskId)
  const { updateTask, deleteTask } = useTaskMutations()
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
    await updateTask(taskId, form)
    setEditMode(false)
  }

  async function handleDelete() {
    if (!taskId) return
    if (!confirm('태스크를 삭제하시겠습니까?')) return
    await deleteTask(taskId)
    closeTaskSlideover()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={closeTaskSlideover} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {task && <StatusBadge status={task.status} />}
            {task && <PriorityBadge priority={task.priority} />}
          </div>
          <div className="flex items-center gap-1">
            {!editMode && (
              <Button size="sm" variant="ghost" onClick={() => setEditMode(true)}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-600 hover:bg-red-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
            <Button size="sm" variant="ghost" onClick={closeTaskSlideover}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!task ? (
            <p className="text-sm text-gray-400">로딩 중...</p>
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
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
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
              <ChecklistSection
                items={form.checklist ?? []}
                onChange={(items) => setForm((f) => ({ ...f, checklist: items }))}
              />
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setForm(task); setEditMode(false) }}>취소</Button>
                <Button className="flex-1" onClick={handleSave}>저장</Button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
                {task.description && (
                  <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">담당자</p>
                  <p className="font-medium text-gray-800">{task.assignee || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">마감일</p>
                  <p className="font-medium text-gray-800">{task.dueDate || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">진척율</p>
                <ProgressBar value={task.progress} showLabel />
              </div>

              {task.checklist.length > 0 && (
                <ChecklistSection
                  items={task.checklist}
                  onChange={async (items) => {
                    await updateTask(task.id!, { checklist: items })
                  }}
                />
              )}

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">변경 이력</p>
                  <ul className="space-y-1.5 text-xs">
                    {history.slice(0, 10).map((h) => (
                      <li key={h.id} className="flex gap-2 text-gray-500">
                        <span className="text-gray-300">{h.changedAt.slice(0, 16).replace('T', ' ')}</span>
                        <span className="font-medium text-gray-600">{h.field}</span>
                        <span className="text-gray-400 truncate max-w-[120px]">{h.oldValue}</span>
                        <span>→</span>
                        <span className="text-gray-600 truncate max-w-[120px]">{h.newValue}</span>
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
