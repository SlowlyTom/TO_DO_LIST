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
  const [showCascadePrompt, setShowCascadePrompt] = useState(false)

  const isFinishing = project && (form.status === 'COMPLETED' || form.status === 'CANCELLED')
    && (project.status !== 'COMPLETED' && project.status !== 'CANCELLED')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (isFinishing && !showCascadePrompt) {
      setShowCascadePrompt(true)
      return
    }
    setLoading(true)
    try {
      if (project?.id) {
        await updateProject(project.id, form, false)
      } else {
        await createProject(form)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleCascadeSave() {
    if (!project?.id) return
    setLoading(true)
    try {
      await updateProject(project.id, form, true)
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
        onChange={(e) => { setForm((f) => ({ ...f, status: e.target.value as ProjectStatus })); setShowCascadePrompt(false) }}
      />

      {showCascadePrompt && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
          <p className="text-sm text-amber-800 font-medium">하위 항목 처리 방법을 선택하세요</p>
          <p className="text-xs text-amber-700">EPIC / TASK / ACTION을 모두 완료 처리하시겠습니까?</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="flex-1" loading={loading} onClick={handleCascadeSave}>
              하위 항목 일괄 완료
            </Button>
            <Button type="submit" size="sm" variant="secondary" className="flex-1" loading={loading}>
              프로젝트 상태만 변경
            </Button>
          </div>
        </div>
      )}

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
      {!showCascadePrompt && (
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" type="button" onClick={onClose}>취소</Button>
          <Button className="flex-1" type="submit" loading={loading}>
            {project ? '수정' : '생성'}
          </Button>
        </div>
      )}
    </form>
  )
}
