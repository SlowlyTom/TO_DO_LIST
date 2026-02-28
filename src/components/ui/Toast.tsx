import { useEffect } from 'react'
import { useUiStore } from '../../stores/uiStore'
import type { Toast } from '../../types'

const TOAST_DURATION = 4000

export function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useUiStore()

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [toast.id, removeToast])

  return (
    <div className="flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg min-w-[240px] max-w-sm animate-fade-in">
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick()
            removeToast(toast.id)
          }}
          className="text-blue-300 hover:text-blue-200 font-medium whitespace-nowrap transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-gray-200 transition-colors ml-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
