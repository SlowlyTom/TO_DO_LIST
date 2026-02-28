import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ImportModal } from '../../features/tasks/ImportModal'
import { ToastContainer } from '../ui/ToastContainer'

export function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ImportModal />
      <ToastContainer />
    </div>
  )
}
