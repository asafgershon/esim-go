import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { UserPlus } from 'lucide-react';
import { INVITE_ADMIN_USER, GET_USERS } from '../lib/graphql/queries';
import type { InviteAdminUserMutation, InviteAdminUserMutationVariables } from '../__generated__/graphql';

export function InviteAdminDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'PARTNER'>('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [inviteAdminUser] = useMutation<InviteAdminUserMutation, InviteAdminUserMutationVariables>(
    INVITE_ADMIN_USER,
    {
      refetchQueries: [{ query: GET_USERS }],
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await inviteAdminUser({
        variables: {
          input: {
            email,
            role,
            redirectUrl: `${window.location.origin}/auth/callback`,
          },
        },
      });

      if (result.data?.inviteAdminUser.success) {
        setSuccess(`Invitation sent successfully to ${email}`);
        setEmail('');
        setRole('ADMIN');
        // Keep dialog open to show success message
        setTimeout(() => {
          setOpen(false);
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.data?.inviteAdminUser.error || 'Failed to send invitation');
      }
    } catch (err: any) {
      console.error('Error inviting admin user:', err);
      
      // Enhanced error handling based on error type
      let errorMessage = 'Failed to send invitation. Please try again.';
      
      if (err?.networkError) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err?.graphQLErrors?.length > 0) {
        const gqlError = err.graphQLErrors[0];
        switch (gqlError.extensions?.code) {
          case 'USER_ALREADY_EXISTS':
            errorMessage = 'A user with this email already exists in the system.';
            break;
          case 'INVALID_EMAIL':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'RATE_LIMIT_EXCEEDED':
            errorMessage = 'Too many invitations sent. Please try again later.';
            break;
          case 'FORBIDDEN':
            errorMessage = 'You do not have permission to invite users.';
            break;
          case 'SELF_INVITATION_FORBIDDEN':
            errorMessage = 'You cannot invite yourself to the system.';
            break;
          default:
            errorMessage = gqlError.message || errorMessage;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setEmail('');
      setRole('ADMIN');
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Admin</DialogTitle>
          <DialogDescription>
            Send an invitation to a new admin or partner user. They will receive an email with setup instructions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'ADMIN' | 'PARTNER') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PARTNER">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}