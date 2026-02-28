export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

export interface Project {
  id?: number
  name: string
  description: string
  status: ProjectStatus
  color: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id?: number
  projectId: number
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface SubCategory {
  id?: number
  categoryId: number
  projectId: number
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Task {
  id?: number
  subCategoryId: number
  categoryId: number
  projectId: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee: string
  dueDate: string
  progress: number
  checklist: ChecklistItem[]
  createdAt: string
  updatedAt: string
}

export interface TaskHistory {
  id?: number
  taskId: number
  field: string
  oldValue: string
  newValue: string
  changedAt: string
}

// Aggregated progress types
export interface SubCategoryWithProgress extends SubCategory {
  tasks: Task[]
  progress: number
}

export interface CategoryWithProgress extends Category {
  subCategories: SubCategoryWithProgress[]
  progress: number
}

export interface ProjectWithProgress extends Project {
  categories: CategoryWithProgress[]
  progress: number
  taskCount: number
  doneCount: number
}

// Export/Import
export interface BackupData {
  version: string
  exportedAt: string
  projects: Project[]
  categories: Category[]
  subCategories: SubCategory[]
  tasks: Task[]
  taskHistory: TaskHistory[]
}
