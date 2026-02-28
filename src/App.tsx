import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import MyTasksPage from './pages/MyTasksPage'
import { useEffect } from 'react'
import { seedDatabase } from './db/database'

function DatabaseInitializer() {
  useEffect(() => {
    seedDatabase().catch(console.error)
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <DatabaseInitializer />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/my-tasks" element={<MyTasksPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
