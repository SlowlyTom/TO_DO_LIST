import { useNavigate } from 'react-router-dom'
import { useTasksByProject } from '../../hooks/useTasks'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ProjectStatusBadge } from '../../components/ui/Badge'
import type { Project } from '../../types'

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const tasks = useTasksByProject(project.id ?? null)

  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'DONE').length
  const progress = total > 0
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / total)
    : 0

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{project.name}</h3>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>진척율</span>
          <span>{done}/{total} 완료</span>
        </div>
        <ProgressBar value={progress} showLabel />
      </div>
    </div>
  )
}
