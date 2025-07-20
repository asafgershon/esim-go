import { NavLink, useLocation } from 'react-router-dom'
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar'
import { type LucideIcon } from 'lucide-react'

interface NavDocumentsProps {
  items: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}

export function NavDocuments({ items }: NavDocumentsProps) {
  const location = useLocation()

  return (
    <div className="px-2">
      <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Resources
      </h3>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <NavLink 
              to={item.url}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary ${
                  isActive || location.pathname === item.url
                    ? 'bg-muted font-medium text-primary'
                    : 'text-muted-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  )
} 