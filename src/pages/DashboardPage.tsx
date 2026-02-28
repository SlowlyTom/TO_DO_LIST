import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import { ProjectCard } from '../features/dashboard/ProjectCard'
import { UpcomingTasks } from '../features/dashboard/UpcomingTasks'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { ProjectForm } from '../features/projects/ProjectForm'
import { TaskSlideover } from '../features/tasks/TaskSlideover'
import { useAllTasks } from '../hooks/useTasks'

export default function DashboardPage() {
  const { projects } = useProjects()
  const tasks = useAllTasks()
  const [showCreateProject, setShowCreateProject] = useState(false)

  const todoCount = tasks.filter((t) => t.status === 'TODO').length
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const doneCount = tasks.filter((t) => t.status === 'DONE').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">PMC SW 개발 태스크 현황</p>
        </div>
        <Button onClick={() => setShowCreateProject(true)}>
          + 프로젝트 추가
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">TODO</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{todoCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <p className="text-xs text-blue-400 uppercase tracking-wide">진행중</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <p className="text-xs text-green-400 uppercase tracking-wide">완료</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{doneCount}</p>
        </div>
      </div>

      {/* Project cards */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">프로젝트 ({projects.length})</h2>
        {projects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-400 text-sm mb-3">아직 프로젝트가 없습니다.</p>
            <Button variant="secondary" onClick={() => setShowCreateProject(true)}>첫 프로젝트 만들기</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      <UpcomingTasks />

      <Modal isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} title="새 프로젝트" size="md">
        <ProjectForm onClose={() => setShowCreateProject(false)} />
      </Modal>

      <TaskSlideover />
    </div>
  )
}
