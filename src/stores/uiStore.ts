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
    const id = Date.now().toString()
    set((s) => ({ toasts: [...s.toasts, { id, message, action }] }))
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
