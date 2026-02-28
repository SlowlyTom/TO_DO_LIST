import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { ProjectStatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ProjectForm } from '../features/projects/ProjectForm'
import { useTasksByProject } from '../hooks/useTasks'
import { ProgressBar } from '../components/ui/ProgressBar'
import type { Project } from '../types'

function ProjectRow({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  const navigate = useNavigate()
  const tasks = useTasksByProject(project.id ?? null)
  const progress = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0
  const done = tasks.filter((t) => t.status === 'DONE').length

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          <span className="text-sm font-medium text-gray-900">{project.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <ProjectStatusBadge status={project.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar value={progress} className="flex-1" />
          <span className="text-xs text-gray-400 w-8">{progress}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{done}/{tasks.length}</td>
      <td className="px-4 py-3 text-xs text-gray-400">{project.updatedAt.slice(0, 10)}</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>수정</Button>
          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={onDelete}>삭제</Button>
        </div>
      </td>
    </tr>
  )
}

export default function ProjectsPage() {
  const { projects, deleteProject } = useProjects()
  const [showCreate, setShowCreate] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">프로젝트</h1>
        <Button onClick={() => setShowCreate(true)}>+ 프로젝트 추가</Button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm mb-3">아직 프로젝트가 없습니다.</p>
          <Button variant="secondary" onClick={() => setShowCreate(true)}>첫 프로젝트 만들기</Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">프로젝트</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">상태</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">진척율</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">완료</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">수정일</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onEdit={() => setEditProject(p)}
                  onDelete={async () => {
                    if (confirm(`"${p.name}" 프로젝트와 모든 하위 데이터를 삭제하시겠습니까?`)) {
                      await deleteProject(p.id!)
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="새 프로젝트" size="md">
        <ProjectForm onClose={() => setShowCreate(false)} />
      </Modal>

      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="프로젝트 수정" size="md">
        {editProject && <ProjectForm project={editProject} onClose={() => setEditProject(null)} />}
      </Modal>
    </div>
  )
}
