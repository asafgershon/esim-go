import { Menu } from 'lucide-react'
import React, { createContext, useContext, useState } from 'react'
import { cn } from '../lib/utils'
import { Button } from './button'
import { Sheet, SheetContent } from './sheet'

interface SidebarContextType {
  collapsed: boolean
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  collapsible: 'offcanvas' | 'none'
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsible?: 'offcanvas' | 'none'
  collapsed?: boolean
}

export function Sidebar({
  className,
  children,
  collapsible = 'offcanvas',
  collapsed: collapsedProp = false,
  ...props
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(collapsedProp)
  const [open, setOpen] = useState(false)

  const toggleSidebar = () => {
    if (collapsible === 'offcanvas') {
      setOpen(!open)
    } else {
      setCollapsed(!collapsed)
    }
  }

  const contextValue: SidebarContextType = {
    collapsed,
    open,
    setOpen,
    toggleSidebar,
    collapsible,
  }

  if (collapsible === 'offcanvas') {
    return (
      <SidebarContext.Provider value={contextValue}>
        <div className="flex min-h-screen">
          {/* Mobile Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Desktop Sidebar */}
          <div
            className={cn(
              'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-50 md:w-64 md:bg-card md:border-r',
              className
            )}
            {...props}
          >
            {children}
          </div>

          {/* Mobile Sidebar */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="p-0 w-64">
              <div className="flex flex-col h-full">
                {children}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </SidebarContext.Provider>
    )
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={cn(
          'flex flex-col h-full bg-card border-r',
          collapsed ? 'w-16' : 'w-64',
          'transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function SidebarHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex h-14 items-center border-b px-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto py-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-t p-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarMenu({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn('space-y-1 px-2', className)}
      {...props}
    >
      {children}
    </ul>
  )
}

export function SidebarMenuItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      className={className}
      {...props}
    >
      {children}
    </li>
  )
}

export function SidebarMenuButton({
  className,
  isActive = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean
}) {
  const context = useContext(SidebarContext)

  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary',
        isActive
          ? 'bg-muted font-medium text-primary'
          : 'text-muted-foreground',
        context?.collapsed && 'justify-center px-2',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a Sidebar component')
  }
  return context
}

// Export SidebarProvider as an alias for easier use
export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
} 