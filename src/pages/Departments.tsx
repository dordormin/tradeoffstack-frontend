import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import type { Department } from '@/types';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';

export const Departments: React.FC = () => {
  const { role } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: ''
  });

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Department[]>('/department');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddForm = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      description: ''
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (dep: Department) => {
    setIsEditing(true);
    setFormData({
      id: dep.id,
      name: dep.name,
      description: dep.description
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isFr ? 'Supprimer ce département ?' : 'Delete this department?')) return;
    try {
      await apiClient.delete(`/department/${id}`);
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || (isFr ? 'Échec de la suppression.' : 'Failed to delete department.'));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.name) {
      setErrorMessage(isFr ? 'Le nom est obligatoire.' : 'Name is required.');
      return;
    }

    try {
      const payload = {
        ...formData,
        id: isEditing ? formData.id : crypto.randomUUID()
      };

      if (isEditing) {
        await apiClient.put(`/department/${formData.id}`, payload);
      } else {
        await apiClient.post('/department', payload);
      }
      setIsFormOpen(false);
      fetchDepartments();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isFr ? 'Départements' : 'Departments'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? 'Gérez les départements de l\'entreprise et la structure organisationnelle.' : 'Manage corporate departments and organizational structures.'}
          </p>
        </div>
        {role === 'Admin' && (
          <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            {isFr ? 'Ajouter un département' : 'Add Department'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">
            {isFr ? 'Chargement des départements...' : 'Loading departments...'}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{isFr ? 'Nom du département' : 'Department Name'}</TableHead>
                <TableHead>Description</TableHead>
                {role === 'Admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === 'Admin' ? 3 : 2} className="text-center py-8 text-muted-foreground">
                    {isFr ? 'Aucun département trouvé.' : 'No departments found.'}
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((dep) => (
                  <TableRow key={dep.id} className="border-border hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-secondary text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                        </div>
                        {dep.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{dep.description || (isFr ? 'Aucune description fournie.' : 'No description provided.')}</TableCell>
                    {role === 'Admin' && (
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            onClick={() => openEditForm(dep)} 
                            size="sm" 
                            variant="outline" 
                            className="border-border hover:bg-secondary flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            {isFr ? 'Modifier' : 'Edit'}
                          </Button>
                          <Button 
                            onClick={() => handleDelete(dep.id)} 
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Department Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing 
                ? isFr ? 'Modifier le département' : 'Modify Department' 
                : isFr ? 'Créer le département' : 'Create Department'}
            </DialogTitle>
            <DialogDescription>
              {isFr ? 'Fournissez les détails organisationnels pour le département.' : 'Provide organizational details for the department.'}
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isFr ? 'Nom du département' : 'Department Name'}
              </label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Engineering, HR" 
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isFr ? 'Bref résumé du rôle du département' : 'Brief summary of department\'s purpose'} 
                className="w-full h-24 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border cursor-pointer">
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {isEditing 
                  ? isFr ? 'Enregistrer les modifications' : 'Save Changes' 
                  : isFr ? 'Créer le département' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
