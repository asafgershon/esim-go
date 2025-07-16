import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { UPDATE_USER_ROLE, GET_USERS } from '@/lib/graphql/queries'
import { ChevronDown } from 'lucide-react'

const ROLES = [
  { value: 'USER', label: 'User', variant: 'outline' as const },
  { value: 'PARTNER', label: 'Partner', variant: 'secondary' as const },
  { value: 'ADMIN', label: 'Admin', variant: 'default' as const },
]

interface RoleSelectorProps {
  userId: string
  currentRole: string
  userEmail: string
  userName: string
}

export function RoleSelector({ userId, currentRole, userEmail, userName }: RoleSelectorProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingRole, setPendingRole] = useState<string | null>(null)

  const [updateUserRole, { loading }] = useMutation(UPDATE_USER_ROLE, {
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: (data) => {
      if (data.updateUserRole) {
        console.log(`Successfully updated ${userName || userEmail} to ${data.updateUserRole.role} role`)
        setShowConfirmDialog(false)
        setPendingRole(null)
      }
    },
    onError: (error) => {
      console.error('Error updating user role:', error.message)
      alert(`Error: ${error.message}`)
      setShowConfirmDialog(false)
      setPendingRole(null)
    },
  })

  const handleRoleChange = (newRole: string) => {
    if (newRole === currentRole) return
    
    setPendingRole(newRole)
    setShowConfirmDialog(true)
  }

  const handleConfirmRoleChange = () => {
    if (pendingRole) {
      updateUserRole({
        variables: {
          userId,
          role: pendingRole,
        },
      })
    }
  }

  const handleCancelRoleChange = () => {
    setShowConfirmDialog(false)
    setPendingRole(null)
  }

  const getCurrentRoleConfig = () => {
    return ROLES.find(role => role.value === currentRole) || ROLES[0]
  }

  const getPendingRoleConfig = () => {
    return ROLES.find(role => role.value === pendingRole) || ROLES[0]
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={loading}
          >
            <Badge variant={getCurrentRoleConfig().variant}>
              {getCurrentRoleConfig().label}
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ROLES.map((role) => (
            <DropdownMenuItem
              key={role.value}
              onClick={() => handleRoleChange(role.value)}
              disabled={role.value === currentRole}
            >
              <Badge variant={role.variant}>
                {role.label}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change {userName || userEmail}'s role from{' '}
              <Badge variant={getCurrentRoleConfig().variant} className="mx-1">
                {getCurrentRoleConfig().label}
              </Badge>{' '}
              to{' '}
              <Badge variant={getPendingRoleConfig().variant} className="mx-1">
                {getPendingRoleConfig().label}
              </Badge>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelRoleChange}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRoleChange} disabled={loading}>
              {loading ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}