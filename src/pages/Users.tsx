import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import type { User, Department, UserRole } from '@/types';
import { Users as UsersIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

export const Users: React.FC = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'Employee' as UserRole,
    department_id: '',
    is_active: true
  });

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get<User[]>('/user');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get<Department[]>('/department');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchDepartments()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'Admin':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Admin</Badge>;
      case 'Manager':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Manager</Badge>;
      case 'Employee':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Employee</Badge>;
      default:
        return <Badge variant="outline">{userRole}</Badge>;
    }
  };

  const openAddForm = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      role: 'Employee',
      department_id: '',
      is_active: true
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (usr: User) => {
    setIsEditing(true);
    setFormData({
      id: usr.id,
      first_name: usr.first_name,
      last_name: usr.last_name,
      email: usr.email,
      phone_number: usr.phone_number || '',
      role: usr.role,
      department_id: usr.department_id || '',
      is_active: usr.is_active
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      await apiClient.delete(`/user/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setErrorMessage('First name, Last name and Email are required.');
      return;
    }

    try {
      const payload = {
        ...formData,
        id: isEditing ? formData.id : crypto.randomUUID(),
        department_id: formData.department_id || null,
        created_at: new Date().toISOString()
      };

      if (isEditing) {
        await apiClient.put(`/user/${formData.id}`, payload);
      } else {
        await apiClient.post('/user', payload);
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'An error occurred.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user access rights, roles, and corporate departments.</p>
        </div>
        {role === 'Admin' && (
          <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">Loading directory...</div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                {role === 'Admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === 'Admin' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((usr) => {
                  const depName = usr.department?.name || departments.find(d => d.id === usr.department_id)?.name || 'None';

                  return (
                    <TableRow key={usr.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-secondary text-muted-foreground">
                            <UsersIcon className="w-4 h-4" />
                          </div>
                          {usr.first_name} {usr.last_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{usr.email}</TableCell>
                      <TableCell>{getRoleBadge(usr.role)}</TableCell>
                      <TableCell className="text-muted-foreground">{depName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={usr.is_active ? 'border-emerald-500/20 text-emerald-500' : 'border-rose-500/20 text-rose-500'}>
                          {usr.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      {role === 'Admin' && (
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              onClick={() => openEditForm(usr)} 
                              size="sm" 
                              variant="outline" 
                              className="border-border hover:bg-secondary flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                            <Button 
                              onClick={() => handleDelete(usr.id)} 
                              size="sm" 
                              variant="destructive" 
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit User Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing ? 'Modify Account' : 'Create Account'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update profile and roles.' : 'Add new team member. Default password is Password123!'}
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. John" 
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="e.g. Doe" 
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@company.com" 
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
              <input 
                type="text" 
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="Contact phone" 
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role Access</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer select-none">
                Account Active
              </label>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isEditing ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
