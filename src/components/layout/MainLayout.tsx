import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ImportModal } from '../../features/tasks/ImportModal'

export function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ImportModal />
    </div>
  )
}
