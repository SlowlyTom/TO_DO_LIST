import { create } from 'zustand'
import type { Toast } from '../types'

interface TaskSlideoverState {
  isOpen: boolean
  taskId: number | null
}

interface ModalState {
  type: 'createProject' | 'editProject' | 'createCategory' | 'editCategory' |
        'createSubCategory' | 'editSubCategory' | 'createTask' | 'editTask' |
        'deleteConfirm' | 'importData' | null
  payload?: Record<string, unknown>
}

interface UiStore {
  // Task slideover panel
  taskSlideover: TaskSlideoverState
  openTaskSlideover: (taskId: number) => void
  closeTaskSlideover: () => void

  // Generic modal
  modal: ModalState
  openModal: (type: ModalState['type'], payload?: Record<string, unknown>) => void
  closeModal: () => void

  // Sidebar collapsed state
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Selected project in sidebar
  selectedProjectId: number | null
  setSelectedProjectId: (id: number | null) => void

  // Show/hide completed items (session-only, resets to false on reload)
  showCompleted: boolean
  toggleShowCompleted: () => void

  // Toast notifications
  toasts: Toast[]
  addToast: (message: string, action?: Toast['action']) => void
  removeToast: (id: string) => void

  // Bulk task selection (MyTasksPage)
  selectedTaskIds: number[]
  toggleSelectedTask: (id: number) => void
  clearSelectedTasks: () => void
  selectAllTasks: (ids: number[]) => void

  // Browser notifications
  notificationsEnabled: boolean
  toggleNotifications: () => void
  notifiedTaskIds: Set<number>
  markTaskNotified: (id: number) => void

  // Dark mode
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  taskSlideover: { isOpen: false, taskId: null },
  openTaskSlideover: (taskId) => set({ taskSlideover: { isOpen: true, taskId } }),
  closeTaskSlideover: () => set({ taskSlideover: { isOpen: false, taskId: null } }),

  modal: { type: null },
  openModal: (type, payload) => set({ modal: { type, payload } }),
  closeModal: () => set({ modal: { type: null } }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),

  showCompleted: false,
  toggleShowCompleted: () => set((s) => ({ showCompleted: !s.showCompleted })),

  toasts: [],
  addToast: (message, action) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, action }] }))
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  selectedTaskIds: [],
  toggleSelectedTask: (id) => set((s) => ({
    selectedTaskIds: s.selectedTaskIds.includes(id)
      ? s.selectedTaskIds.filter((x) => x !== id)
      : [...s.selectedTaskIds, id],
  })),
  clearSelectedTasks: () => set({ selectedTaskIds: [] }),
  selectAllTasks: (ids) => set({ selectedTaskIds: ids }),

  notificationsEnabled: false,
  toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
  notifiedTaskIds: new Set<number>(
    JSON.parse(sessionStorage.getItem('notifiedTaskIds') ?? '[]') as number[]
  ),
  markTaskNotified: (id) => set((s) => {
    const next = new Set(s.notifiedTaskIds)
    next.add(id)
    try {
      sessionStorage.setItem('notifiedTaskIds', JSON.stringify([...next]))
    } catch {
      // sessionStorage not available
    }
    return { notifiedTaskIds: next }
  }),

  isDarkMode: localStorage.getItem('darkMode') === 'true',
  toggleDarkMode: () => set((s) => {
    const next = !s.isDarkMode
    localStorage.setItem('darkMode', String(next))
    return { isDarkMode: next }
  }),
}))
