import * as React from "react"
import {
  Home,
  Users,
  ShoppingCart,
  MapPin,
  Package,
  Zap,
  DollarSign,
  Settings,
  HelpCircle,
  BarChart3,
  Database,
  FileText,
  Search,
} from "lucide-react"

import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

const data = {
  user: {
    name: "eSIM Admin",
    email: "admin@esim-go.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
    },
    {
      title: "Orders",
      url: "/orders",
      icon: ShoppingCart,
    },
    {
      title: "Bundles",
      url: "/bundles",
      icon: Zap,
    },
    {
      title: "Trips",
      url: "/trips",
      icon: MapPin,
    },
    {
      title: "Package Assignment",
      url: "/package-assignment",
      icon: Package,
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: DollarSign,
    },
  ],
  navAnalytics: [
    {
      name: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Data Management",
      url: "/data-management",
      icon: Database,
    },
    {
      name: "Reports",
      url: "/reports",
      icon: FileText,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold">
                  eSIM Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.navAnalytics} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
} 