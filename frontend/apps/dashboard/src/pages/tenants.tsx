import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_ALL_TENANTS,
  CREATE_TENANT,
  UPDATE_TENANT,
  DELETE_TENANT,
} from '@/lib/graphql/queries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui';
import { Building2, Plus, Edit, Trash2, Users, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  slug: string;
  name: string;
  imgUrl?: string;
  tenantType?: 'STANDARD' | 'MASTER';
  userCount?: number;
}

export default function TenantsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    imgUrl: '',
    tenantType: 'STANDARD' as 'STANDARD' | 'MASTER',
  });

  // Fetch all tenants
  const { data, loading, error, refetch } = useQuery(GET_ALL_TENANTS, {
    errorPolicy: 'all',
  });

  // Mutations
  const [createTenant] = useMutation(CREATE_TENANT, {
    onCompleted: () => {
      toast.success('Tenant created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create tenant: ${error.message}`);
    },
  });

  const [updateTenant] = useMutation(UPDATE_TENANT, {
    onCompleted: () => {
      toast.success('Tenant updated successfully');
      setEditingTenant(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update tenant: ${error.message}`);
    },
  });

  const [deleteTenant] = useMutation(DELETE_TENANT, {
    onCompleted: () => {
      toast.success('Tenant deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete tenant: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      imgUrl: '',
      tenantType: 'STANDARD',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTenant) {
      await updateTenant({
        variables: {
          slug: editingTenant.slug,
          input: {
            name: formData.name,
            imgUrl: formData.imgUrl || null,
            tenantType: formData.tenantType,
          },
        },
      });
    } else {
      await createTenant({
        variables: {
          input: formData,
        },
      });
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      slug: tenant.slug,
      name: tenant.name,
      imgUrl: tenant.imgUrl || '',
      tenantType: tenant.tenantType || 'STANDARD',
    });
  };

  const handleDelete = async (slug: string) => {
    if (slug === 'public' || slug === 'hiilo-master') {
      toast.error('Cannot delete system tenants');
      return;
    }
    
    if (confirm(`Are you sure you want to delete tenant "${slug}"?`)) {
      await deleteTenant({ variables: { slug } });
    }
  };

  const tenants = data?.allTenants?.nodes || [];

  const getTenantIcon = (tenant: Tenant) => {
    if (tenant.slug === 'hiilo-master') return <Crown className="h-4 w-4 text-yellow-500" />;
    if (tenant.slug === 'public') return <Building2 className="h-4 w-4 text-blue-500" />;
    return <Building2 className="h-4 w-4 text-gray-500" />;
  };

  const getTenantBadge = (tenant: Tenant) => {
    if (tenant.tenantType === 'MASTER') {
      return <Badge variant="default" className="bg-yellow-500">Master</Badge>;
    }
    if (tenant.slug === 'public') {
      return <Badge variant="secondary">B2C</Badge>;
    }
    return <Badge variant="outline">B2B</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tenants...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive">Error loading tenants: {error.message}</div>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage organization tenants and access control
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogDescription>
                  Add a new organization tenant to the system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug (URL-friendly ID)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="company-name"
                    required
                    disabled={!!editingTenant}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Company Name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imgUrl">Logo URL (optional)</Label>
                  <Input
                    id="imgUrl"
                    value={formData.imgUrl}
                    onChange={(e) => setFormData({ ...formData, imgUrl: e.target.value })}
                    placeholder="https://company.com/logo.png"
                    type="url"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenantType">Tenant Type</Label>
                  <Select
                    value={formData.tenantType}
                    onValueChange={(value) => setFormData({ ...formData, tenantType: value as 'STANDARD' | 'MASTER' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="MASTER">Master (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Tenant</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
              <DialogDescription>
                Update tenant information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Company Name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-imgUrl">Logo URL (optional)</Label>
                <Input
                  id="edit-imgUrl"
                  value={formData.imgUrl}
                  onChange={(e) => setFormData({ ...formData, imgUrl: e.target.value })}
                  placeholder="https://company.com/logo.png"
                  type="url"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tenantType">Tenant Type</Label>
                <Select
                  value={formData.tenantType}
                  onValueChange={(value) => setFormData({ ...formData, tenantType: value as 'STANDARD' | 'MASTER' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="MASTER">Master (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Tenant</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tenants Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No tenants found
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant: Tenant) => (
                <TableRow key={tenant.slug}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        {tenant.imgUrl ? (
                          <img 
                            src={tenant.imgUrl} 
                            alt={tenant.name}
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={tenant.imgUrl ? 'hidden' : ''}>
                          {getTenantIcon(tenant)}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {tenant.slug}
                    </code>
                  </TableCell>
                  <TableCell>{getTenantBadge(tenant)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{tenant.userCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                        disabled={tenant.slug === 'public'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tenant.slug)}
                        disabled={tenant.slug === 'public' || tenant.slug === 'hiilo-master'}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}