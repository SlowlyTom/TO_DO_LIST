import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Component, type ReactNode } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import MyTasksPage from './pages/MyTasksPage'
import ArchivePage from './pages/ArchivePage'
import { GlobalSearch } from './features/search/GlobalSearch'
import { useEffect } from 'react'
import { seedDatabase } from './db/database'
import { useUiStore } from './stores/uiStore'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-gray-800 font-semibold mb-2">오류가 발생했습니다</p>
            <p className="text-sm text-gray-500 mb-4">{(this.state.error as Error).message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              새로고침
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function DatabaseInitializer() {
  useEffect(() => {
    seedDatabase().catch(console.error)
  }, [])
  return null
}

function DarkModeSync() {
  const isDarkMode = useUiStore((s) => s.isDarkMode)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <DatabaseInitializer />
        <DarkModeSync />
        <GlobalSearch />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/archive" element={<ArchivePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
