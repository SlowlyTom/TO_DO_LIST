import { useState, useMemo, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { sortTasks } from '../../utils/taskSort'
import type { Task, Category, SubCategory } from '../../types'

// ─── Drag handle icon ─────────────────────────────────────────────────────────
function GripHandle(props: React.HTMLAttributes<SVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
      fill="currentColor"
      {...props}
    >
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  )
}

// ─── Sortable Task Item ────────────────────────────────────────────────────────
function SortableTaskItem({
  task,
  onOpen,
  onArchive,
}: {
  task: Task
  onOpen: (id: number) => void
  onArchive: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id! })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(task.id!)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group/task ${task.status === 'DONE' ? 'opacity-60' : ''}`}
    >
      <span {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
        <GripHandle />
      </span>
      <StatusBadge status={task.status} />
      <span className={`flex-1 text-sm text-gray-700 dark:text-gray-200 truncate ${task.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>
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
          onClick={(e) => { e.stopPropagation(); onArchive(task.id!) }}
          className="opacity-0 group-hover/task:opacity-100 text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
          title="보관"
        >
          보관
        </button>
      )}
    </li>
  )
}

// ─── SubCategory Row (TASK) ──────────────────────────────────────────────────
function SortableSubCategoryRow({
  subCat,
  categoryId,
  projectId,
  searchQuery,
  sortBy,
}: {
  subCat: SubCategory & { id: number }
  categoryId: number
  projectId: number
  searchQuery: string
  sortBy: string
}) {
  const tasks = useTasks(subCat.id)
  const { openTaskSlideover, showCompleted } = useUiStore()
  const { archiveSubCategory, reopenSubCategory, reorderSubCategories } = useSubCategories(categoryId)
  const { archiveTask, reorderTasks } = useTaskMutations()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [open, setOpen] = useState(true)

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: subCat.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const isCompleted = subCat.status === 'COMPLETED'

  // Filter + sort tasks
  const visibleTasks = useMemo(() => {
    let result = showCompleted ? tasks : tasks.filter((t) => t.status !== 'DONE')
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
    }
    return sortBy !== 'default' ? sortTasks(result, sortBy) : result
  }, [tasks, showCompleted, searchQuery, sortBy])

  const [localTasks, setLocalTasks] = useState<Task[]>([])
  // Sync localTasks when visibleTasks changes (DB updates)
  useEffect(() => { setLocalTasks(visibleTasks) }, [visibleTasks])

  const avgProgress = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0

  // Must call all hooks before any conditional return (Rules of Hooks)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  if (!showCompleted && isCompleted) return null

  async function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localTasks.findIndex((t) => t.id === active.id)
    const newIndex = localTasks.findIndex((t) => t.id === over.id)
    const reordered = arrayMove(localTasks, oldIndex, newIndex)
    setLocalTasks(reordered)
    await reorderTasks(reordered.map((t) => t.id!))
  }

  // Suppress unused warning — reorderSubCategories is used by parent but referenced here
  void reorderSubCategories

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`ml-6 border-l border-gray-100 dark:border-gray-700 pl-4 mt-1 ${isCompleted ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2 py-1.5 group">
        <span {...attributes} {...listeners}>
          <GripHandle />
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-4 h-4 text-gray-400 flex-shrink-0"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={open ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
          </svg>
        </button>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">TASK</span>
        <span className={`text-sm font-medium text-gray-700 dark:text-gray-200 ${isCompleted ? 'line-through text-gray-400' : ''}`}>{subCat.name}</span>
        <span className="text-xs text-gray-400">({tasks.length})</span>
        <div className="flex-1 max-w-[120px]">
          <ProgressBar value={avgProgress} size="sm" />
        </div>
        <span className="text-xs text-gray-400">{avgProgress}%</span>
        {isCompleted && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 ml-auto">
            <button
              onClick={() => archiveSubCategory(subCat.id)}
              className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="보관"
            >
              보관
            </button>
            <button
              onClick={() => reopenSubCategory(subCat.id)}
              className="text-xs text-blue-500 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
          <SortableContext items={localTasks.map((t) => t.id!)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-0.5">
              {localTasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onOpen={openTaskSlideover}
                  onArchive={archiveTask}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Modal isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} title="ACTION 추가" size="md">
        <TaskForm
          subCategoryId={subCat.id}
          categoryId={categoryId}
          projectId={projectId}
          onClose={() => setShowTaskForm(false)}
        />
      </Modal>
    </div>
  )
}

// ─── Category Row (EPIC) ──────────────────────────────────────────────────────
function SortableCategoryRow({
  cat,
  projectId,
  searchQuery,
  sortBy,
}: {
  cat: Category & { id: number }
  projectId: number
  searchQuery: string
  sortBy: string
}) {
  const { subCategories, createSubCategory, reorderSubCategories } = useSubCategories(cat.id)
  const { deleteCategory, archiveCategory, reopenCategory } = useCategories(projectId)
  const { showCompleted } = useUiStore()
  const [open, setOpen] = useState(true)
  const [showSubCatForm, setShowSubCatForm] = useState(false)
  const [newSubCatName, setNewSubCatName] = useState('')
  const [localSubCats, setLocalSubCats] = useState<typeof subCategories>([])

  // Sync localSubCats when subCategories changes
  useEffect(() => { setLocalSubCats(subCategories) }, [subCategories])

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const isCompleted = cat.status === 'COMPLETED'
  const isOnHold = cat.status === 'ON_HOLD'

  // Must call all hooks before any conditional return (Rules of Hooks)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  if (!showCompleted && (isCompleted || isOnHold)) return null

  async function handleAddSubCat() {
    if (!newSubCatName.trim()) return
    await createSubCategory({
      categoryId: cat.id,
      projectId,
      name: newSubCatName.trim(),
      order: subCategories.length,
    })
    setNewSubCatName('')
    setShowSubCatForm(false)
  }

  async function handleSubCatDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localSubCats.findIndex((s) => s.id === active.id)
    const newIndex = localSubCats.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(localSubCats, oldIndex, newIndex)
    setLocalSubCats(reordered)
    await reorderSubCategories(reordered.map((s) => s.id!))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 dark:border-gray-700 rounded-xl mb-3 overflow-hidden ${isCompleted ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 group">
        <span {...attributes} {...listeners}>
          <GripHandle />
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={open ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
          </svg>
        </button>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">EPIC</span>
        <span className={`font-semibold text-gray-800 dark:text-gray-100 text-sm ${isCompleted ? 'line-through text-gray-400' : ''}`}>{cat.name}</span>
        <span className="text-xs text-gray-400">({subCategories.length} TASK)</span>
        {isOnHold && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">보류</span>
        )}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
          {isCompleted ? (
            <>
              <button
                onClick={() => archiveCategory(cat.id)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                보관
              </button>
              <button
                onClick={() => reopenCategory(cat.id)}
                className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
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
                  if (confirm('EPIC과 하위 항목을 모두 삭제하시겠습니까?')) deleteCategory(cat.id)
                }}
              >
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="px-2 py-2 dark:bg-gray-800/50">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubCatDragEnd}>
            <SortableContext items={localSubCats.filter((s) => s.id != null).map((s) => s.id!)} strategy={verticalListSortingStrategy}>
              {localSubCats.map((s) =>
                s.id != null ? (
                  <SortableSubCategoryRow
                    key={s.id}
                    subCat={s as SubCategory & { id: number }}
                    categoryId={cat.id}
                    projectId={projectId}
                    searchQuery={searchQuery}
                    sortBy={sortBy}
                  />
                ) : null
              )}
            </SortableContext>
          </DndContext>
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
export function ProjectTreeView({
  projectId,
  searchQuery = '',
  sortBy = 'default',
}: {
  projectId: number
  searchQuery?: string
  sortBy?: string
}) {
  const { categories, createCategory, reorderCategories } = useCategories(projectId)
  const [localCategories, setLocalCategories] = useState<typeof categories>([])
  const [showCatForm, setShowCatForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  // Sync local copy when DB changes
  useEffect(() => { setLocalCategories(categories) }, [categories])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    await createCategory({ projectId, name: newCatName.trim(), order: categories.length })
    setNewCatName('')
    setShowCatForm(false)
  }

  async function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localCategories.findIndex((c) => c.id === active.id)
    const newIndex = localCategories.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(localCategories, oldIndex, newIndex)
    setLocalCategories(reordered)
    await reorderCategories(reordered.map((c) => c.id!))
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
        <SortableContext items={localCategories.filter((c) => c.id != null).map((c) => c.id!)} strategy={verticalListSortingStrategy}>
          {localCategories.map((cat) =>
            cat.id != null ? (
              <SortableCategoryRow
                key={cat.id}
                cat={cat as Category & { id: number }}
                projectId={projectId}
                searchQuery={searchQuery}
                sortBy={sortBy}
              />
            ) : null
          )}
        </SortableContext>
      </DndContext>

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
