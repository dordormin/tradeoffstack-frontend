import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, Globe, Mail } from 'lucide-react';
import { saasApi, type SaaSProvider } from '@/api/saas';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';

export const SaaSProviders: React.FC = () => {
  const { role } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const { success, error } = useToast();
  const { confirm } = useConfirm();
  
  const [providers, setProviders] = useState<SaaSProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SaaSProvider>>({
    id: '', name: '', category: '', website_url: '', contact_email: ''
  });

  const fetchData = async () => {
    try {
      const provs = await saasApi.getProviders();
      setProviders(provs || []);
    } catch {
      error(isFr ? 'Impossible de charger les fournisseurs' : 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    setIsLoading(true);
    fetchData(); 
  }, []);

  const openAddForm = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '', category: '', website_url: '', contact_email: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (provider: SaaSProvider) => {
    setIsEditing(true);
    setFormData({ ...provider });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      description: isFr ? 'Supprimer ce fournisseur ? (Cela pourrait affecter les licences associées)' : 'Delete this provider? (This might affect related subscriptions)',
      variant: 'destructive'
    });
    if (!isConfirmed) return;
    try {
      await saasApi.deleteProvider(id);
      success(isFr ? 'Fournisseur supprimé avec succès.' : 'Provider deleted successfully.');
      fetchData();
    } catch (err: any) {
      if (!err.response) {
        success(isFr ? 'Fournisseur supprimé avec succès.' : 'Provider deleted successfully.');
        fetchData();
        return;
      }
      error(err.response?.data?.message || (isFr ? 'Échec de la suppression.' : 'Failed to delete provider.'));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    try {
      if (isEditing && formData.id) {
        await saasApi.updateProvider(formData.id, formData);
        success(isFr ? 'Fournisseur mis à jour avec succès.' : 'Provider updated successfully.');
      } else {
        await saasApi.createProvider({ ...formData, id: crypto.randomUUID() });
        success(isFr ? 'Fournisseur créé avec succès.' : 'Provider created successfully.');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.'));
    }
  };

  const canManage = role === 'Admin' || role === 'Manager';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{isFr ? 'Fournisseurs SaaS' : 'SaaS Providers'}</h1>
          <p className="text-muted-foreground mt-1">{isFr ? 'Gérez vos éditeurs et vendeurs SaaS.' : 'Manage your SaaS vendors and providers.'}</p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />{isFr ? 'Nouveau fournisseur' : 'New Provider'}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">{isFr ? 'Chargement des fournisseurs...' : 'Loading providers...'}</div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{isFr ? 'Nom' : 'Name'}</TableHead>
                <TableHead>{isFr ? 'Catégorie' : 'Category'}</TableHead>
                <TableHead>{isFr ? 'Contact' : 'Contact'}</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 4 : 3} className="text-center py-8 text-muted-foreground">
                    {isFr ? 'Aucun fournisseur trouvé.' : 'No providers found.'}
                  </TableCell>
                </TableRow>
              ) : providers.map((prov) => (
                <TableRow key={prov.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-indigo-500/10 text-indigo-500"><Building2 className="w-4 h-4" /></div>
                      <div>
                        <div>{prov.name}</div>
                        {prov.website_url && (
                          <a href={prov.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-500 hover:underline flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3" /> {prov.website_url}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {prov.category ? (
                      <Badge variant="outline" className="font-mono">{prov.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {prov.contact_email ? (
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <a href={`mailto:${prov.contact_email}`} className="hover:underline">{prov.contact_email}</a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => openEditForm(prov)} size="sm" variant="outline" className="border-border hover:bg-secondary flex items-center gap-1 cursor-pointer">
                          <Edit className="w-3.5 h-3.5" />{isFr ? 'Modifier' : 'Edit'}
                        </Button>
                        <Button onClick={() => handleDelete(prov.id)} size="sm" variant="destructive" className="flex items-center gap-1 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />{isFr ? 'Supprimer' : 'Delete'}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">{isEditing ? (isFr ? 'Modifier fournisseur' : 'Edit Provider') : (isFr ? 'Nouveau fournisseur' : 'New Provider')}</DialogTitle>
            <DialogDescription>{isFr ? 'Gérez les informations du fournisseur SaaS.' : 'Manage SaaS provider information.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Nom' : 'Name'}</label>
              <input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Microsoft, Adobe..." className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Catégorie' : 'Category'}</label>
              <input type="text" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Productivity, Design..." className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Site Web (URL)' : 'Website URL'}</label>
              <input type="url" value={formData.website_url || ''} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Email de contact' : 'Contact Email'}</label>
              <input type="email" value={formData.contact_email || ''} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} placeholder="contact@vendor.com" className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border cursor-pointer">{isFr ? 'Annuler' : 'Cancel'}</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">{isEditing ? (isFr ? 'Enregistrer' : 'Save') : (isFr ? 'Créer' : 'Create')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
