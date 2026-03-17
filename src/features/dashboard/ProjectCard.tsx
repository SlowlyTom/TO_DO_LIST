import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasksByProject } from '../../hooks/useTasks'
import { useProjects } from '../../hooks/useProjects'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ProjectStatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useUiStore } from '../../stores/uiStore'
import type { Project } from '../../types'

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const tasks = useTasksByProject(project.id ?? null)
  const { archiveProject } = useProjects()
  const { addToast } = useUiStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'DONE').length
  const progress = total > 0
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / total)
    : 0

  async function handleArchive() {
    if (project.id == null) return
    await archiveProject(project.id)
    setShowConfirm(false)
    addToast(`"${project.name}" 프로젝트가 보관함으로 이동되었습니다`)
  }

  return (
    <>
      <div
        onClick={() => navigate(`/projects/${project.id}`)}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all relative group"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug truncate">{project.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ProjectStatusBadge status={project.status} />
            {/* 더보기 메뉴 버튼 */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu((prev) => !prev)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title="더보기"
              >
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false) }} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[140px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        setShowConfirm(true)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      보관함으로 이동
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{project.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>진척율</span>
            <span>{done}/{total} 완료</span>
          </div>
          <ProgressBar value={progress} showLabel />
        </div>
      </div>

      {/* 보관함 확인 모달 */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="프로젝트 보관" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>"{project.name}"</strong> 프로젝트와 하위 항목(대주제, 소주제, ACTION)이 모두 보관함으로 이동됩니다.
          </p>
          <p className="text-xs text-gray-400">보관함에서 언제든 복원할 수 있습니다.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>취소</Button>
            <Button onClick={handleArchive}>보관함으로 이동</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
