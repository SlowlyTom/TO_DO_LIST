import { useState } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { useSubCategories } from '../../hooks/useSubCategories'
import { useTasks } from '../../hooks/useTasks'
import { useUiStore } from '../../stores/uiStore'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { TaskForm } from './TaskForm'

// ─── SubCategory Row ────────────────────────────────────────────────────────
function SubCategoryRow({
  subCatId,
  categoryId,
  projectId,
  name,
}: {
  subCatId: number
  categoryId: number
  projectId: number
  name: string
}) {
  const tasks = useTasks(subCatId)
  const { openTaskSlideover } = useUiStore()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [open, setOpen] = useState(true)

  const avgProgress = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0

  return (
    <div className="ml-6 border-l border-gray-100 pl-4 mt-1">
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
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className="text-xs text-gray-400">({tasks.length})</span>
        <div className="flex-1 max-w-[120px]">
          <ProgressBar value={avgProgress} size="sm" />
        </div>
        <span className="text-xs text-gray-400">{avgProgress}%</span>
        <button
          onClick={() => setShowTaskForm(true)}
          className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:underline ml-auto"
        >
          + 태스크
        </button>
      </div>

      {open && (
        <ul className="space-y-0.5">
          {tasks.map((task) => (
            <li
              key={task.id}
              onClick={() => openTaskSlideover(task.id!)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer group/task"
            >
              <StatusBadge status={task.status} />
              <span className="flex-1 text-sm text-gray-700 truncate">{task.title}</span>
              <PriorityBadge priority={task.priority} />
              {task.dueDate && (
                <span className="text-xs text-gray-400">{task.dueDate}</span>
              )}
              <div className="w-16">
                <ProgressBar value={task.progress} size="sm" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} title="태스크 추가" size="md">
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

// ─── Category Row ────────────────────────────────────────────────────────────
function CategoryRow({
  catId,
  projectId,
  name,
}: {
  catId: number
  projectId: number
  name: string
}) {
  const { subCategories, createSubCategory } = useSubCategories(catId)
  const { deleteCategory } = useCategories(projectId)
  const [open, setOpen] = useState(true)
  const [showSubCatForm, setShowSubCatForm] = useState(false)
  const [newSubCatName, setNewSubCatName] = useState('')

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
    <div className="border border-gray-200 rounded-xl mb-3 overflow-hidden">
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
        <span className="font-semibold text-gray-800 text-sm">{name}</span>
        <span className="text-xs text-gray-400">({subCategories.length} 소주제)</span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <Button size="sm" variant="ghost" onClick={() => setShowSubCatForm(true)}>
            + 소주제
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-600"
            onClick={() => {
              if (confirm('대주제와 하위 항목을 모두 삭제하시겠습니까?')) deleteCategory(catId)
            }}
          >
            삭제
          </Button>
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
            />
          ))}
          {subCategories.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-2">소주제가 없습니다.</p>
          )}
        </div>
      )}

      <Modal isOpen={showSubCatForm} onClose={() => setShowSubCatForm(false)} title="소주제 추가" size="sm">
        <div className="space-y-3">
          <Input
            label="소주제 이름"
            value={newSubCatName}
            onChange={(e) => setNewSubCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubCat()}
            placeholder="소주제 이름 입력"
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
        />
      ))}

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm mb-3">대주제가 없습니다. 추가해보세요.</p>
        </div>
      )}

      <Button variant="secondary" size="sm" onClick={() => setShowCatForm(true)}>
        + 대주제 추가
      </Button>

      <Modal isOpen={showCatForm} onClose={() => setShowCatForm(false)} title="대주제 추가" size="sm">
        <div className="space-y-3">
          <Input
            label="대주제 이름"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="대주제 이름 입력"
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
