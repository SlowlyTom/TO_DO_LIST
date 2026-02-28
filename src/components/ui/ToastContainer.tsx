import { useUiStore } from '../../stores/uiStore'
import { ToastItem } from './Toast'

export function ToastContainer() {
  const { toasts } = useUiStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 left-5 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
