import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useProject, useProjects } from '../hooks/useProjects'
import { useTasksByProject } from '../hooks/useTasks'
import { ProjectTreeView } from '../features/projects/ProjectTreeView'
import { TaskSlideover } from '../features/tasks/TaskSlideover'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { ProjectForm } from '../features/projects/ProjectForm'
import { ProjectStatusBadge } from '../components/ui/Badge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ShowCompletedToggle } from '../components/ui/ShowCompletedToggle'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = id ? Number(id) : null
  const project = useProject(projectId)
  const tasks = useTasksByProject(projectId)
  const { archiveProject } = useProjects()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)

  if (project === undefined) {
    return <div className="p-6 text-sm text-gray-400">로딩 중...</div>
  }

  if (project === null) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">프로젝트를 찾을 수 없습니다.</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/projects')}>
          목록으로
        </Button>
      </div>
    )
  }

  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'DONE').length
  const progress = total > 0
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / total)
    : 0

  const isCompleted = project.status === 'COMPLETED' || project.status === 'CANCELLED'

  async function handleArchive() {
    if (!projectId) return
    if (!confirm('프로젝트를 보관함으로 이동하시겠습니까?')) return
    await archiveProject(projectId)
    navigate('/projects')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <button onClick={() => navigate('/projects')} className="hover:text-gray-600 transition-colors">
          프로젝트
        </button>
        <span>/</span>
        <span className="text-gray-700 font-medium">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="text-sm text-gray-500">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ShowCompletedToggle />
          {isCompleted && (
            <Button variant="secondary" size="sm" onClick={handleArchive} className="text-gray-500">
              보관
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>수정</Button>
        </div>
      </div>

      {/* Progress overview */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">전체 진척율</span>
          <span className="text-sm font-semibold text-gray-800">{done}/{total} 완료</span>
        </div>
        <ProgressBar value={progress} showLabel size="md" />
        <div className="grid grid-cols-3 gap-4 mt-4 text-center text-xs text-gray-500">
          <div>
            <p className="text-lg font-bold text-gray-700">{tasks.filter((t) => t.status === 'TODO').length}</p>
            <p>TODO</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{tasks.filter((t) => t.status === 'IN_PROGRESS').length}</p>
            <p>진행중</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{done}</p>
            <p>완료</p>
          </div>
        </div>
      </div>

      {/* Tree view */}
      {projectId && <ProjectTreeView projectId={projectId} />}

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="프로젝트 수정" size="md">
        <ProjectForm project={project} onClose={() => setShowEdit(false)} />
      </Modal>

      <TaskSlideover />
    </div>
  )
}
