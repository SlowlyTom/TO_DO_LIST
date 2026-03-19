import { useState } from 'react'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { useTaskMutations } from '../../hooks/useTasks'
import { RecurrenceSection } from '../tasks/RecurrenceSection'
import type { TaskStatus, TaskPriority, RecurrenceConfig } from '../../types'

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

interface TaskFormProps {
  subCategoryId: number
  categoryId: number
  projectId: number
  onClose: () => void
}

export function TaskForm({ subCategoryId, categoryId, projectId, onClose }: TaskFormProps) {
  const { createTask } = useTaskMutations()
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assignee: '',
    dueDate: null as string | null,
    issueUrl: '',
    progress: 0,
    tags: [] as string[],
    recurrence: null as RecurrenceConfig | null,
  })
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)

  function addTag(value: string) {
    const trimmed = value.trim()
    if (!trimmed || form.tags.includes(trimmed)) { setTagInput(''); return }
    setForm((f) => ({ ...f, tags: [...f.tags, trimmed] }))
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
      await createTask({ ...form, subCategoryId, categoryId, projectId, checklist: [], blockedBy: [] })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="제목"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="태스크 제목 입력"
        required
      />
      <Textarea
        label="설명"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="태스크 설명 (선택)"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select label="상태" value={form.status} options={statusOptions}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))} />
        <Select label="우선순위" value={form.priority} options={priorityOptions}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="담당자" value={form.assignee}
          onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} />
        <Input label="마감일" type="date" value={form.dueDate ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value || null }))} />
      </div>
      <Input
        label="이슈 URL"
        type="url"
        value={form.issueUrl}
        placeholder="https://..."
        onChange={(e) => setForm((f) => ({ ...f, issueUrl: e.target.value }))}
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">태그</label>
        <div className="flex flex-wrap gap-1.5 mb-1">
          {form.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
            if (e.key === ',') { e.preventDefault(); addTag(tagInput) }
          }}
          placeholder="태그 입력 후 Enter..."
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />
      </div>
      <RecurrenceSection
        value={form.recurrence}
        onChange={(v) => setForm((f) => ({ ...f, recurrence: v }))}
      />
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" className="flex-1" type="button" onClick={onClose}>취소</Button>
        <Button className="flex-1" type="submit" loading={loading}>생성</Button>
      </div>
    </form>
  )
}
