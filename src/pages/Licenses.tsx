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
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { KeySquare, Plus, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import type { SoftwareLicense } from '@/types';

export const Licenses: React.FC = () => {
  const { role } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    license_key: '',
    total_seats: 1,
    expiration_date: '',
    price: 0
  });

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<SoftwareLicense[]>('/softwarelicense');
      setLicenses(response.data || []);
    } catch (err) {
      console.error('Failed to load software licenses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const openAddForm = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      license_key: '',
      total_seats: 1,
      expiration_date: '',
      price: 0
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (license: SoftwareLicense) => {
    setIsEditing(true);
    setFormData({
      id: license.id,
      name: license.name,
      license_key: license.license_key,
      total_seats: license.total_seats,
      expiration_date: license.expiration_date ? license.expiration_date.split('T')[0] : '',
      price: license.price
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isFr ? 'Supprimer cette licence logicielle ?' : 'Delete this software license?')) return;
    try {
      await apiClient.delete(`/softwarelicense/${id}`);
      fetchLicenses();
    } catch (err: any) {
      alert(err.response?.data?.message || (isFr ? 'Échec de la suppression.' : 'Failed to delete license.'));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.name || !formData.license_key) {
      setErrorMessage(isFr ? 'Le nom et la clé sont obligatoires.' : 'Name and license key are required.');
      return;
    }

    try {
      const payload = {
        ...formData,
        id: isEditing ? formData.id : crypto.randomUUID(),
        expiration_date: formData.expiration_date ? new Date(formData.expiration_date).toISOString() : null
      };

      if (isEditing) {
        await apiClient.put(`/softwarelicense/${formData.id}`, payload);
      } else {
        await apiClient.post('/softwarelicense', payload);
      }
      setIsFormOpen(false);
      fetchLicenses();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.'));
    }
  };

  const isExpired = (dateString?: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const isExpiringSoon = (dateString?: string | null) => {
    if (!dateString) return false;
    const expDate = new Date(dateString);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isFr ? 'Licences Matérielles & OS' : 'Hardware & OS Licenses'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? 'Gérez vos clés de produits perpétuelles (Windows, etc).' : 'Manage your perpetual product keys (Windows, etc).'}
          </p>
        </div>
        {(role === 'Admin' || role === 'Manager') && (
          <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            {isFr ? 'Ajouter une licence' : 'Add License'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">
            {isFr ? 'Chargement des licences...' : 'Loading licenses...'}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{isFr ? 'Nom du logiciel' : 'Software Name'}</TableHead>
                <TableHead>{isFr ? 'Clé de licence' : 'License Key'}</TableHead>
                <TableHead>{isFr ? 'Postes (Total)' : 'Seats (Total)'}</TableHead>
                <TableHead>{isFr ? 'Expiration' : 'Expiration'}</TableHead>
                <TableHead className="text-right">{isFr ? 'Prix' : 'Price'}</TableHead>
                {(role === 'Admin' || role === 'Manager') && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(role === 'Admin' || role === 'Manager') ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    {isFr ? 'Aucune licence trouvée.' : 'No licenses found.'}
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((lic) => {
                  const expired = isExpired(lic.expiration_date);
                  const expiring = isExpiringSoon(lic.expiration_date);

                  return (
                    <TableRow key={lic.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-indigo-500/10 text-indigo-500">
                            <KeySquare className="w-4 h-4" />
                          </div>
                          {lic.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground tracking-wider">
                        {lic.license_key}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{lic.total_seats}</Badge>
                      </TableCell>
                      <TableCell>
                        {!lic.expiration_date ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                            {isFr ? 'Perpétuelle' : 'Perpetual'}
                          </Badge>
                        ) : expired ? (
                          <div className="flex items-center gap-2 text-rose-500 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {isFr ? 'Expirée' : 'Expired'}
                          </div>
                        ) : expiring ? (
                          <div className="flex items-center gap-2 text-amber-500 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {new Date(lic.expiration_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-500/70" />
                            {new Date(lic.expiration_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-foreground font-mono">
                        ${lic.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      {(role === 'Admin' || role === 'Manager') && (
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              onClick={() => openEditForm(lic)} 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-sky-500 hover:text-sky-600 hover:bg-sky-500/10 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDelete(lic.id)} 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing 
                ? isFr ? 'Modifier la licence' : 'Modify License' 
                : isFr ? 'Ajouter une licence' : 'Add License'}
            </DialogTitle>
            <DialogDescription>
              {isFr ? 'Enregistrez les informations relatives à la licence logicielle.' : 'Record software license information.'}
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
                {isFr ? 'Nom du logiciel' : 'Software Name'}
              </label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Windows 11 Pro, SQL Server" 
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isFr ? 'Clé de licence / Numéro de contrat' : 'License Key / Contract Number'}
              </label>
              <input 
                type="text" 
                required
                value={formData.license_key}
                onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                placeholder="XXXX-XXXX-XXXX-XXXX" 
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Nombre de postes' : 'Total Seats'}
                </label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={formData.total_seats}
                  onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Prix unitaire ($)' : 'Price ($)'}
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isFr ? 'Date d\'expiration (optionnel)' : 'Expiration Date (Optional)'}
              </label>
              <input 
                type="date" 
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="cursor-pointer">
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {isEditing 
                  ? isFr ? 'Enregistrer les modifications' : 'Save Changes' 
                  : isFr ? 'Ajouter la licence' : 'Add License'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
