import { useState } from 'react'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { useTaskMutations } from '../../hooks/useTasks'
import type { TaskStatus, TaskPriority } from '../../types'

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
    dueDate: '',
    progress: 0,
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
      await createTask({ ...form, subCategoryId, categoryId, projectId, checklist: [] })
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
        <Input label="마감일" type="date" value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" className="flex-1" type="button" onClick={onClose}>취소</Button>
        <Button className="flex-1" type="submit" loading={loading}>생성</Button>
      </div>
    </form>
  )
}
