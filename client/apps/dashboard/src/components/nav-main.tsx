import { NavLink, useLocation } from 'react-router-dom'
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar'
import { type LucideIcon } from 'lucide-react'

interface NavMainProps {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
}

export function NavMain({ items }: NavMainProps) {
  const location = useLocation()

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
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
            <span>{item.title}</span>
          </NavLink>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
} 