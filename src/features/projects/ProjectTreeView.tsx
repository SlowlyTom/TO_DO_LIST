import { useState } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { useSubCategories } from '../../hooks/useSubCategories'
import { useTasks } from '../../hooks/useTasks'
import { useTaskMutations } from '../../hooks/useTasks'
import { useUiStore } from '../../stores/uiStore'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { TaskForm } from './TaskForm'

// ─── SubCategory Row (TASK) ──────────────────────────────────────────────────
function SubCategoryRow({
  subCatId,
  categoryId,
  projectId,
  name,
  status,
}: {
  subCatId: number
  categoryId: number
  projectId: number
  name: string
  status: 'ACTIVE' | 'COMPLETED'
}) {
  const tasks = useTasks(subCatId)
  const { openTaskSlideover, showCompleted } = useUiStore()
  const { archiveSubCategory, reopenSubCategory } = useSubCategories(categoryId)
  const { archiveTask } = useTaskMutations()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [open, setOpen] = useState(true)

  const isCompleted = status === 'COMPLETED'

  // Filter tasks based on showCompleted
  const visibleTasks = showCompleted ? tasks : tasks.filter((t) => t.status !== 'DONE')

  const avgProgress = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0

  if (!showCompleted && isCompleted) return null

  return (
    <div className={`ml-6 border-l border-gray-100 pl-4 mt-1 ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 py-1.5 group">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-4 h-4 text-gray-400 flex-shrink-0"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={open ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
          </svg>
        </button>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600`}>TASK</span>
        <span className={`text-sm font-medium text-gray-700 ${isCompleted ? 'line-through text-gray-400' : ''}`}>{name}</span>
        <span className="text-xs text-gray-400">({tasks.length})</span>
        <div className="flex-1 max-w-[120px]">
          <ProgressBar value={avgProgress} size="sm" />
        </div>
        <span className="text-xs text-gray-400">{avgProgress}%</span>
        {isCompleted && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 ml-auto">
            <button
              onClick={() => archiveSubCategory(subCatId)}
              className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
              title="보관"
            >
              보관
            </button>
            <button
              onClick={() => reopenSubCategory(subCatId)}
              className="text-xs text-blue-500 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
            >
              다시 열기
            </button>
          </div>
        )}
        {!isCompleted && (
          <button
            onClick={() => setShowTaskForm(true)}
            className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:underline ml-auto"
          >
            + ACTION
          </button>
        )}
      </div>

      {open && (
        <ul className="space-y-0.5">
          {visibleTasks.map((task) => (
            <li
              key={task.id}
              onClick={() => openTaskSlideover(task.id!)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer group/task ${task.status === 'DONE' ? 'opacity-60' : ''}`}
            >
              <StatusBadge status={task.status} />
              <span className={`flex-1 text-sm text-gray-700 truncate ${task.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>
                {task.title}
              </span>
              <PriorityBadge priority={task.priority} />
              {task.dueDate && (
                <span className="text-xs text-gray-400">{task.dueDate}</span>
              )}
              <div className="w-16">
                <ProgressBar value={task.progress} size="sm" />
              </div>
              {task.status === 'DONE' && (
                <button
                  onClick={(e) => { e.stopPropagation(); archiveTask(task.id!) }}
                  className="opacity-0 group-hover/task:opacity-100 text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                  title="보관"
                >
                  보관
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} title="ACTION 추가" size="md">
        <TaskForm
          subCategoryId={subCatId}
          categoryId={categoryId}
          projectId={projectId}
          onClose={() => setShowTaskForm(false)}
        />
      </Modal>
    </div>
  )
}

// ─── Category Row (EPIC) ──────────────────────────────────────────────────────
function CategoryRow({
  catId,
  projectId,
  name,
  status,
}: {
  catId: number
  projectId: number
  name: string
  status: 'ACTIVE' | 'COMPLETED'
}) {
  const { subCategories, createSubCategory } = useSubCategories(catId)
  const { deleteCategory, archiveCategory, reopenCategory } = useCategories(projectId)
  const { showCompleted } = useUiStore()
  const [open, setOpen] = useState(true)
  const [showSubCatForm, setShowSubCatForm] = useState(false)
  const [newSubCatName, setNewSubCatName] = useState('')

  const isCompleted = status === 'COMPLETED'

  if (!showCompleted && isCompleted) return null

  async function handleAddSubCat() {
    if (!newSubCatName.trim()) return
    await createSubCategory({
      categoryId: catId,
      projectId,
      name: newSubCatName.trim(),
      order: subCategories.length,
    })
    setNewSubCatName('')
    setShowSubCatForm(false)
  }

  return (
    <div className={`border border-gray-200 rounded-xl mb-3 overflow-hidden ${isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 group">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-4 h-4 text-gray-500 flex-shrink-0"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={open ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
          </svg>
        </button>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">EPIC</span>
        <span className={`font-semibold text-gray-800 text-sm ${isCompleted ? 'line-through text-gray-400' : ''}`}>{name}</span>
        <span className="text-xs text-gray-400">({subCategories.length} TASK)</span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
          {isCompleted ? (
            <>
              <button
                onClick={() => archiveCategory(catId)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                보관
              </button>
              <button
                onClick={() => reopenCategory(catId)}
                className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                다시 열기
              </button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setShowSubCatForm(true)}>
                + TASK
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-600"
                onClick={() => {
                  if (confirm('EPIC과 하위 항목을 모두 삭제하시겠습니까?')) deleteCategory(catId)
                }}
              >
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="px-2 py-2">
          {subCategories.map((s) => (
            <SubCategoryRow
              key={s.id}
              subCatId={s.id!}
              categoryId={catId}
              projectId={projectId}
              name={s.name}
              status={s.status}
            />
          ))}
          {subCategories.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-2">TASK가 없습니다.</p>
          )}
        </div>
      )}

      <Modal isOpen={showSubCatForm} onClose={() => setShowSubCatForm(false)} title="TASK 추가" size="sm">
        <div className="space-y-3">
          <Input
            label="TASK 이름"
            value={newSubCatName}
            onChange={(e) => setNewSubCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubCat()}
            placeholder="TASK 이름 입력"
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowSubCatForm(false)}>취소</Button>
            <Button className="flex-1" onClick={handleAddSubCat}>추가</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Main Tree View ──────────────────────────────────────────────────────────
export function ProjectTreeView({ projectId }: { projectId: number }) {
  const { categories, createCategory } = useCategories(projectId)
  const [showCatForm, setShowCatForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    await createCategory({ projectId, name: newCatName.trim(), order: categories.length })
    setNewCatName('')
    setShowCatForm(false)
  }

  return (
    <div>
      {categories.map((cat) => (
        <CategoryRow
          key={cat.id}
          catId={cat.id!}
          projectId={projectId}
          name={cat.name}
          status={cat.status}
        />
      ))}

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm mb-3">EPIC이 없습니다. 추가해보세요.</p>
        </div>
      )}

      <Button variant="secondary" size="sm" onClick={() => setShowCatForm(true)}>
        + EPIC 추가
      </Button>

      <Modal isOpen={showCatForm} onClose={() => setShowCatForm(false)} title="EPIC 추가" size="sm">
        <div className="space-y-3">
          <Input
            label="EPIC 이름"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="EPIC 이름 입력"
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCatForm(false)}>취소</Button>
            <Button className="flex-1" onClick={handleAddCategory}>추가</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
