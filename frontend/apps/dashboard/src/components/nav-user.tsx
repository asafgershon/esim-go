import { LogOut, Building2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { useAuth } from '../contexts/auth-context'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { GET_USER_TENANTS } from '../lib/graphql/queries'

interface NavUserProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
}

export function NavUser({ user: userProp }: NavUserProps) {
  const { user: authUser, signOut } = useAuth()
  const navigate = useNavigate()
  
  // Fetch user's tenants
  const { data: tenantsData } = useQuery(GET_USER_TENANTS, {
    skip: !authUser, // Only fetch if user is authenticated
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Use auth user if available, fallback to prop user
  const user = authUser || userProp

  if (!user) {
    return null
  }

  // Simple display name and initials
  const displayName = userProp?.name || user.email || 'User'
  const initials = userProp?.name 
    ? userProp.name.slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || 'U'
    
  // Get the first tenant if available
  const primaryTenant = tenantsData?.tenants?.[0]
  
  // Don't show tenant badge for public B2C users
  const shouldShowTenant = primaryTenant && primaryTenant.slug !== 'public'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 justify-start w-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProp?.avatar} alt={displayName} />
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left ml-2 flex-1 overflow-hidden">
            <p className="text-sm font-medium leading-none truncate">
              {displayName}
            </p>
            {shouldShowTenant && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground truncate">
                  {primaryTenant.name}
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 