import { Outlet } from 'react-router-dom'
import { AppSidebar } from '../app-sidebar'

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-screen bg-background">
      <AppSidebar />
      <main className="flex-1 md:ml-64 flex flex-col min-h-0">
        <div className="container mx-auto p-6 flex-1 flex flex-col min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}