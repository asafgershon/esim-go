import * as React from "react"
import {
  Home,
  Users,
  ShoppingCart,
  MapPin,
  Package,
  Zap,
  DollarSign,
  Database,
  CardSim,
  Send,
  Building2,
} from "lucide-react"

import { NavMain } from "./nav-main"
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
    name: "Hiilo Admin",
    email: "admin@hiilo.com",
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
      title: "eSIMs",
      url: "/esims",
      icon: CardSim,
    },
    {
      title: "eSIM Requests",
      url: "/esim-requests",
      icon: Send,
    },
    {
      title: "Catalog",
      url: "/catalog",
      icon: Database,
    },
    {
      title: "Trips",
      url: "/trips",
      icon: MapPin,
      disabled: true,
      tooltipText: "Soon",
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: DollarSign,
    },
    {
      title: "Tenants",
      url: "/tenants",
      icon: Building2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r" {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold">
                  Hiilo Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="p-2">
          <NavMain items={data.navMain} />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
} 