import { useState } from 'react'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { useProjects } from '../../hooks/useProjects'
import type { Project, ProjectStatus } from '../../types'

const statusOptions = [
  { value: 'ACTIVE', label: '진행중' },
  { value: 'ON_HOLD', label: '보류' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
]

const colorOptions = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]

interface ProjectFormProps {
  project?: Project
  onClose: () => void
}

export function ProjectForm({ project, onClose }: ProjectFormProps) {
  const { createProject, updateProject } = useProjects()
  const [form, setForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'ACTIVE' as ProjectStatus,
    color: project?.color ?? '#3b82f6',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      if (project?.id) {
        await updateProject(project.id, form)
      } else {
        await createProject(form)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="프로젝트 이름"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="프로젝트 이름 입력"
        required
      />
      <Textarea
        label="설명"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="프로젝트 설명 (선택)"
      />
      <Select
        label="상태"
        value={form.status}
        options={statusOptions}
        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
      />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">색상</label>
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" className="flex-1" type="button" onClick={onClose}>취소</Button>
        <Button className="flex-1" type="submit" loading={loading}>
          {project ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  )
}
