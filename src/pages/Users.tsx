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
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useTableState } from '@/hooks/useTableState';
import { DataTable } from '@/components/DataTableControls';

export const Users: React.FC = () => {
  const { role } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const table = useTableState<User>({
    data: users,
    initialPageSize: 10,
    searchableKeys: ['first_name', 'last_name', 'email', 'role'],
  });

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get<User[]>('/user');
      setUsers(response.data || []);
    } catch (err) {
      error('Failed to load users');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get<Department[]>('/department');
      setDepartments(response.data || []);
    } catch (err) {
      error('Failed to load departments');
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
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">{isFr ? 'Administrateur' : 'Admin'}</Badge>;
      case 'Manager':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">{isFr ? 'Gestionnaire' : 'Manager'}</Badge>;
      case 'Employee':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{isFr ? 'Employé' : 'Employee'}</Badge>;
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
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isFr ? 'Supprimer ce compte utilisateur ?' : 'Delete this user account?')) return;
    try {
      await apiClient.delete(`/user/${id}`);
      success(isFr ? 'Utilisateur supprimé avec succès.' : 'User deleted successfully.');
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.message || (isFr ? 'Échec de la suppression.' : 'Failed to delete user.'));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email) {
      error(isFr ? 'Le prénom, le nom et l\'adresse e-mail sont requis.' : 'First name, Last name and Email are required.');
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
        success(isFr ? 'Utilisateur mis à jour avec succès.' : 'User updated successfully.');
      } else {
        await apiClient.post('/user', payload);
        success(isFr ? 'Utilisateur créé avec succès.' : 'User created successfully.');
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isFr ? 'Utilisateurs' : 'Users'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? 'Gérez les droits d\'accès des utilisateurs, leurs rôles et leurs départements.' : 'Manage user access rights, roles, and corporate departments.'}
          </p>
        </div>
        {role === 'Admin' && (
          <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            {isFr ? 'Ajouter un utilisateur' : 'Add User'}
          </Button>
        )}
      </div>

      <DataTable.Controls
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder={isFr ? 'Rechercher par nom, e-mail, rôle...' : 'Search by name, email, role...'}
        isFr={isFr}
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">
            {isFr ? 'Chargement de l\'annuaire...' : 'Loading directory...'}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>
                  <DataTable.Header label={isFr ? 'Nom complet' : 'Full Name'} sortKey="first_name" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'E-mail' : 'Email'} sortKey="email" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'Rôle' : 'Role'} sortKey="role" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead>{isFr ? 'Département' : 'Department'}</TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'Statut' : 'Status'} sortKey="is_active" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                {role === 'Admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === 'Admin' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    {isFr ? 'Aucun utilisateur trouvé.' : 'No users found.'}
                  </TableCell>
                </TableRow>
              ) : (
                table.paginatedData.map((usr) => {
                  const depName = usr.department?.name || departments.find(d => d.id === usr.department_id)?.name || (isFr ? 'Aucun' : 'None');

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
                          {usr.is_active ? (isFr ? 'Actif' : 'Active') : (isFr ? 'Inactif' : 'Inactive')}
                        </Badge>
                      </TableCell>
                      {role === 'Admin' && (
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              onClick={() => openEditForm(usr)} 
                              size="sm" 
                              variant="outline" 
                              className="border-border hover:bg-secondary flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              {isFr ? 'Modifier' : 'Edit'}
                            </Button>
                            <Button 
                              onClick={() => handleDelete(usr.id)} 
                              size="sm" 
                              variant="destructive" 
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {isFr ? 'Supprimer' : 'Delete'}
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

          <DataTable.Pagination
            currentPage={table.currentPage}
            totalPages={table.totalPages}
            totalFiltered={table.totalFiltered}
            pageSize={table.pageSize}
            onPageChange={table.setCurrentPage}
            onPageSizeChange={table.setPageSize}
            isFr={isFr}
          />
        </div>
      )}

      {/* Add / Edit User Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing 
                ? isFr ? 'Modifier le compte' : 'Modify Account' 
                : isFr ? 'Créer le compte' : 'Create Account'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? isFr ? 'Mettez à jour le profil et les rôles.' : 'Update profile and roles.' 
                : isFr ? 'Ajouter un nouveau membre. Le mot de passe par défaut est Password123!' : 'Add new team member. Default password is Password123!'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Prénom' : 'First Name'}
                </label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Nom' : 'Last Name'}
                </label>
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isFr ? 'Adresse e-mail' : 'Email Address'}
              </label>
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isFr ? 'Numéro de téléphone' : 'Phone Number'}
              </label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Accès rôle' : 'Role Access'}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="Employee">{isFr ? 'Employé' : 'Employee'}</option>
                  <option value="Manager">{isFr ? 'Gestionnaire' : 'Manager'}</option>
                  <option value="Admin">{isFr ? 'Administrateur' : 'Admin'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Département' : 'Department'}
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="">{isFr ? '-- Choisir le département --' : '-- Choose Department --'}</option>
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
                className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer select-none">
                {isFr ? 'Compte actif' : 'Account Active'}
              </label>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border cursor-pointer">
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {isEditing 
                  ? isFr ? 'Enregistrer les modifications' : 'Save Changes' 
                  : isFr ? 'Créer l\'utilisateur' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
