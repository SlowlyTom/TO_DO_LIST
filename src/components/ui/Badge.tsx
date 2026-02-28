import type { TaskStatus, TaskPriority, ProjectStatus } from '../../types'

type BadgeVariant = TaskStatus | TaskPriority | ProjectStatus | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClass: Record<string, string> = {
  // TaskStatus
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  // TaskPriority
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
  // ProjectStatus
  ACTIVE: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  // default
  default: 'bg-gray-100 text-gray-600',
}

const labelMap: Record<string, string> = {
  TODO: 'TODO',
  IN_PROGRESS: '진행중',
  DONE: '완료',
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  CRITICAL: '긴급',
  ACTIVE: '진행중',
  ON_HOLD: '보류',
  CANCELLED: '취소',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const cls = variantClass[variant as string] ?? variantClass.default
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={status}>{labelMap[status] ?? status}</Badge>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={priority}>{labelMap[priority] ?? priority}</Badge>
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={status}>{labelMap[status] ?? status}</Badge>
}
