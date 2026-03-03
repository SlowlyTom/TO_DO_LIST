import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import MyTasksPage from './pages/MyTasksPage'
import ArchivePage from './pages/ArchivePage'
import { useEffect } from 'react'
import { seedDatabase } from './db/database'
import { useUiStore } from './stores/uiStore'

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
    <BrowserRouter>
      <DatabaseInitializer />
      <DarkModeSync />
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
  )
}
