import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { KeySquare, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Download, Building2 } from 'lucide-react';
import { saasApi, type SaaSSubscription, type SaaSProvider } from '@/api/saas';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export const SaaSLicenses: React.FC = () => {
  const { role } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const { success, error } = useToast();
  const [licenses, setLicenses] = useState<SaaSSubscription[]>([]);
  const [providers, setProviders] = useState<SaaSProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProviderFormOpen, setIsProviderFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [providerForm, setProviderForm] = useState({ name: '', category: '', website_url: '', contact_email: '' });

  const [formData, setFormData] = useState<Partial<SaaSSubscription>>({
    id: '', provider_id: '', plan_name: '', billing_cycle: 'Monthly',
    cost_per_seat: 0, total_seats: 1, status: 'Active', renewal_date: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subs, provs] = await Promise.all([saasApi.getSubscriptions(), saasApi.getProviders()]);
      setLicenses(subs || []);
      setProviders(provs || []);
    } catch (err) {
      error(isFr ? 'Impossible de charger les données SaaS' : 'Failed to load SaaS data');
      console.error('Failed to load saas data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddForm = () => {
    setIsEditing(false);
    setFormData({ id: '', provider_id: '', plan_name: '', billing_cycle: 'Monthly', cost_per_seat: 0, total_seats: 1, status: 'Active', renewal_date: '' });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (license: SaaSSubscription) => {
    setIsEditing(true);
    setFormData({
      id: license.id, provider_id: license.provider_id, plan_name: license.plan_name,
      billing_cycle: license.billing_cycle, cost_per_seat: license.cost_per_seat,
      total_seats: license.total_seats, status: license.status,
      renewal_date: license.renewal_date ? license.renewal_date.split('T')[0] : ''
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isFr ? 'Supprimer cet abonnement ?' : 'Delete this subscription?')) return;
    try {
      await saasApi.deleteSubscription(id);
      success(isFr ? 'Abonnement supprimé avec succès.' : 'Subscription deleted successfully.');
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || (isFr ? 'Échec de la suppression.' : 'Failed to delete.'));
    }
  };

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerForm.name.trim()) return;
    try {
      const created = await saasApi.createProvider({ ...providerForm, id: crypto.randomUUID() });
      setProviders(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, provider_id: created.id }));
      setProviderForm({ name: '', category: '', website_url: '', contact_email: '' });
      setIsProviderFormOpen(false);
      success(isFr ? 'Fournisseur créé avec succès.' : 'Provider created successfully.');
    } catch (err: any) {
      error(err.response?.data?.message || (isFr ? 'Erreur création fournisseur' : 'Failed to create provider'));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.provider_id || !formData.plan_name) {
      setErrorMessage(isFr ? 'Le fournisseur et le plan sont obligatoires.' : 'Provider and plan name are required.');
      return;
    }
    try {
      const payload = {
        ...formData,
        renewal_date: formData.renewal_date ? new Date(formData.renewal_date).toISOString() : undefined
      };
      if (isEditing && formData.id) {
        await saasApi.updateSubscription(formData.id, payload as Partial<SaaSSubscription>);
        success(isFr ? 'Abonnement mis à jour avec succès.' : 'Subscription updated successfully.');
      } else {
        await saasApi.createSubscription({ ...payload, id: crypto.randomUUID() } as Partial<SaaSSubscription>);
        success(isFr ? 'Abonnement créé avec succès.' : 'Subscription created successfully.');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.'));
    }
  };

  const isExpiringSoon = (dateString?: string) => {
    if (!dateString) return false;
    const diffDays = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const isExpired = (dateString?: string) => dateString ? new Date(dateString) < new Date() : false;

  const handleExportCSV = () => {
    const headers = [isFr ? 'Fournisseur' : 'Provider', isFr ? 'Plan' : 'Plan', isFr ? 'Cycle' : 'Cycle', isFr ? 'Postes' : 'Seats', isFr ? 'Coût par poste' : 'Cost per seat', isFr ? 'Renouvellement' : 'Renewal', 'Status'];
    const rows = licenses.map(lic => [lic.provider?.name || '', lic.plan_name || '', lic.billing_cycle || '', lic.total_seats.toString(), lic.cost_per_seat.toString(), lic.renewal_date ? new Date(lic.renewal_date).toLocaleDateString() : 'Auto', lic.status]);
    const blob = new Blob([[headers.join(','), ...rows.map(e => e.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'saas_subscriptions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canManage = role === 'Admin' || role === 'Manager';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{isFr ? 'Licences Logicielles' : 'Software Licenses'}</h1>
          <p className="text-muted-foreground mt-1">{isFr ? 'Gérez vos abonnements SaaS et fournisseurs.' : 'Manage SaaS subscriptions and providers.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-background cursor-pointer">
            <Download className="w-4 h-4 mr-2" />{isFr ? 'Exporter CSV' : 'Export CSV'}
          </Button>
          {canManage && (
            <>
              <Button onClick={() => setIsProviderFormOpen(true)} variant="outline" className="cursor-pointer">
                <Building2 className="w-4 h-4 mr-2" />{isFr ? 'Nouveau fournisseur' : 'New Provider'}
              </Button>
              <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />{isFr ? 'Ajouter un abonnement' : 'Add Subscription'}
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">{isFr ? 'Chargement des licences...' : 'Loading licenses...'}</div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{isFr ? 'Fournisseur / Plan' : 'Provider / Plan'}</TableHead>
                <TableHead>{isFr ? 'Cycle de facturation' : 'Billing Cycle'}</TableHead>
                <TableHead>{isFr ? 'Postes (Total)' : 'Seats (Total)'}</TableHead>
                <TableHead>{isFr ? 'Renouvellement' : 'Renewal'}</TableHead>
                <TableHead className="text-right">{isFr ? 'Prix par poste' : 'Cost per seat'}</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    {isFr ? 'Aucun abonnement trouvé.' : 'No subscriptions found.'}
                  </TableCell>
                </TableRow>
              ) : licenses.map((lic) => {
                const expired = isExpired(lic.renewal_date);
                const expiring = isExpiringSoon(lic.renewal_date);
                return (
                  <TableRow key={lic.id} className="border-border hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-indigo-500/10 text-indigo-500"><KeySquare className="w-4 h-4" /></div>
                        <div>
                          <div>{lic.provider?.name || 'Unknown Provider'}</div>
                          <div className="text-xs text-muted-foreground font-normal">{lic.plan_name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground tracking-wider">{lic.billing_cycle}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono">{lic.total_seats}</Badge></TableCell>
                    <TableCell>
                      {!lic.renewal_date ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{isFr ? 'Renouvellement auto' : 'Auto-renew'}</Badge>
                      ) : expired ? (
                        <div className="flex items-center gap-2 text-rose-500 text-sm"><AlertTriangle className="w-4 h-4" />{isFr ? 'Expiré' : 'Expired'}</div>
                      ) : expiring ? (
                        <div className="flex items-center gap-2 text-amber-500 text-sm"><AlertTriangle className="w-4 h-4" />{new Date(lic.renewal_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm"><CheckCircle className="w-4 h-4 text-emerald-500/70" />{new Date(lic.renewal_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-foreground font-mono">${lic.cost_per_seat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => openEditForm(lic)} size="sm" variant="outline" className="border-border hover:bg-secondary flex items-center gap-1 cursor-pointer">
                            <Edit className="w-3.5 h-3.5" />{isFr ? 'Modifier' : 'Edit'}
                          </Button>
                          <Button onClick={() => handleDelete(lic.id)} size="sm" variant="destructive" className="flex items-center gap-1 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />{isFr ? 'Supprimer' : 'Delete'}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">{isEditing ? (isFr ? 'Modifier l\'abonnement' : 'Modify Subscription') : (isFr ? 'Ajouter un abonnement' : 'Add Subscription')}</DialogTitle>
            <DialogDescription>{isFr ? 'Enregistrez les informations relatives à l\'abonnement SaaS.' : 'Record SaaS subscription information.'}</DialogDescription>
          </DialogHeader>
          {errorMessage && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive font-medium">{errorMessage}</div>}
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Fournisseur' : 'Provider'}</label>
              <select required value={formData.provider_id} onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">{isFr ? 'Sélectionner un fournisseur' : 'Select a provider'}</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Nom du plan' : 'Plan Name'}</label>
              <input type="text" required value={formData.plan_name} onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })} placeholder="e.g. Pro, Enterprise" className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Nombre de postes' : 'Total Seats'}</label>
                <input type="number" min="1" required value={formData.total_seats} onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Coût par poste ($)' : 'Cost per seat ($)'}</label>
                <input type="number" step="0.01" min="0" required value={formData.cost_per_seat} onChange={(e) => setFormData({ ...formData, cost_per_seat: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Cycle de facturation' : 'Billing Cycle'}</label>
                <select required value={formData.billing_cycle} onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm">
                  <option value="Monthly">{isFr ? 'Mensuel' : 'Monthly'}</option>
                  <option value="Yearly">{isFr ? 'Annuel' : 'Yearly'}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Renouvellement (optionnel)' : 'Renewal Date (Optional)'}</label>
                <input type="date" value={formData.renewal_date} onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm" />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border cursor-pointer">{isFr ? 'Annuler' : 'Cancel'}</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">{isEditing ? (isFr ? 'Enregistrer' : 'Save') : (isFr ? 'Ajouter' : 'Add')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProviderFormOpen} onOpenChange={setIsProviderFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle>{isFr ? 'Nouveau fournisseur' : 'New Provider'}</DialogTitle>
            <DialogDescription>{isFr ? 'Ajoutez un éditeur SaaS (Microsoft, Adobe, etc.)' : 'Add a SaaS vendor (Microsoft, Adobe, etc.)'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProviderSubmit} className="space-y-4 pt-2">
            <input type="text" required placeholder={isFr ? 'Nom du fournisseur' : 'Provider name'} value={providerForm.name} onChange={e => setProviderForm({ ...providerForm, name: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <input type="text" placeholder={isFr ? 'Catégorie (ex: Productivity)' : 'Category (e.g. Productivity)'} value={providerForm.category} onChange={e => setProviderForm({ ...providerForm, category: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <input type="url" placeholder="https://..." value={providerForm.website_url} onChange={e => setProviderForm({ ...providerForm, website_url: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <input type="email" placeholder="contact@vendor.com" value={providerForm.contact_email} onChange={e => setProviderForm({ ...providerForm, contact_email: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProviderFormOpen(false)}>{isFr ? 'Annuler' : 'Cancel'}</Button>
              <Button type="submit">{isFr ? 'Créer' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
