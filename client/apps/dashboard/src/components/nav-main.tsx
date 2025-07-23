import { NavLink, useLocation } from 'react-router-dom'
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { type LucideIcon } from 'lucide-react'

interface NavMainProps {
  items: {
    title: string
    url: string
    icon: LucideIcon
    disabled?: boolean
    tooltipText?: string
  }[]
}

export function NavMain({ items }: NavMainProps) {
  const location = useLocation()

  return (
    <TooltipProvider>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.disabled ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all cursor-not-allowed opacity-50 text-muted-foreground`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.tooltipText || 'Coming soon'}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
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
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </TooltipProvider>
  )
} 