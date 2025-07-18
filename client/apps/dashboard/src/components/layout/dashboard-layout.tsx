import { Outlet } from 'react-router-dom'
import { AppSidebar } from '../app-sidebar'

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto md:ml-64">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}