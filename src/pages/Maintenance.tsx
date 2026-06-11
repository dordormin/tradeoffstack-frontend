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
import type { MaintenanceRequest, Equipment, MaintenanceStatus, MaintenancePriority } from '@/types';
import { Plus, CheckCircle, XCircle, Edit } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useTableState } from '@/hooks/useTableState';
import { DataTable } from '@/components/DataTableControls';
import { getAssetImageUrl } from '@/utils/assetImages';

export const Maintenance: React.FC = () => {
  const { role, userId } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [techNotes, setTechNotes] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    equipment_id: '',
    priority: 'Medium' as MaintenancePriority,
    status: 'Pending' as MaintenanceStatus,
    description: '',
    scheduled_date: ''
  });

  const table = useTableState<MaintenanceRequest>({
    data: requests,
    initialPageSize: 10,
    searchableKeys: ['description', 'status', 'priority'],
  });

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get<MaintenanceRequest[]>('/maintenancerequest');
      setRequests(response.data || []);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const fetchEquipments = async () => {
    try {
      const response = await apiClient.get<Equipment[]>('/equipment');
      setEquipments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch equipments', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchRequests(), fetchEquipments()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">{isFr ? 'En attente' : 'Pending'}</Badge>;
      case 'InProgress':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">{isFr ? 'En cours' : 'In Progress'}</Badge>;
      case 'Completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{isFr ? 'Terminé' : 'Completed'}</Badge>;
      case 'Cancelled':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">{isFr ? 'Annulé' : 'Cancelled'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'Low':
        return <Badge variant="outline" className="border-border text-muted-foreground">{isFr ? 'Basse' : 'Low'}</Badge>;
      case 'Medium':
        return <Badge variant="outline" className="border-blue-500/20 text-blue-500">{isFr ? 'Moyenne' : 'Medium'}</Badge>;
      case 'High':
        return <Badge variant="outline" className="border-amber-500/20 text-amber-500">{isFr ? 'Haute' : 'High'}</Badge>;
      case 'Critical':
        return <Badge variant="outline" className="border-rose-500/20 text-rose-500 font-bold animate-pulse">{isFr ? 'Critique' : 'Critical'}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm(isFr ? 'Annuler cette demande de maintenance ?' : 'Cancel this maintenance request?')) return;
    try {
      await apiClient.post(`/maintenancerequest/${id}/cancel`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || (isFr ? 'Échec de l\'annulation de la demande.' : 'Failed to cancel maintenance request.'));
    }
  };

  const openCompleteModal = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setTechNotes('');
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await apiClient.post(`/maintenancerequest/${selectedRequest.id}/complete`, {
        technicianNotes: techNotes
      });
      setIsCompleteOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || (isFr ? 'Échec de la validation de la demande.' : 'Failed to complete request.'));
    }
  };

  const openCreateForm = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      equipment_id: '',
      priority: 'Medium',
      status: 'Pending',
      description: '',
      scheduled_date: ''
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (req: MaintenanceRequest) => {
    setIsEditing(true);
    setFormData({
      id: req.id,
      equipment_id: req.equipment_id,
      priority: req.priority,
      status: req.status,
      description: req.description,
      scheduled_date: req.scheduled_date ? req.scheduled_date.split('T')[0] : ''
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.equipment_id) {
      setErrorMessage(isFr ? 'Veuillez sélectionner un équipement.' : 'Please select an equipment.');
      return;
    }
    if (!formData.description) {
      setErrorMessage(isFr ? 'Une description est requise.' : 'Description is required.');
      return;
    }

    try {
      const payload = {
        id: isEditing ? formData.id : crypto.randomUUID(),
        equipment_id: formData.equipment_id,
        requested_by_id: userId || '00000002-0000-0000-0000-000000000001',
        status: formData.status,
        priority: formData.priority,
        description: formData.description,
        scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : null
      };

      if (isEditing) {
        await apiClient.put(`/maintenancerequest/${formData.id}`, payload);
      } else {
        await apiClient.post('/maintenancerequest', payload);
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isFr ? 'Demandes de maintenance' : 'Maintenance Requests'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? 'Suivi des pannes matérielles, réparations et historique d\'entretien.' : 'Track hardware faults, repairs, and service history.'}
          </p>
        </div>
        <Button onClick={openCreateForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          {isFr ? 'Signaler une panne' : 'Report Fault'}
        </Button>
      </div>

      <DataTable.Controls
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder={isFr ? 'Rechercher par description, statut, priorité...' : 'Search by description, status, priority...'}
        isFr={isFr}
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">
            {isFr ? 'Chargement des tickets...' : 'Loading tickets...'}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{isFr ? 'Nom de l\'équipement' : 'Asset Name'}</TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'Priorité' : 'Priority'} sortKey="priority" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'Statut' : 'Status'} sortKey="status" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'Date programmée' : 'Scheduled Date'} sortKey="scheduled_date" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isFr ? 'Aucune demande de maintenance trouvée.' : 'No maintenance requests found.'}
                  </TableCell>
                </TableRow>
              ) : (
                table.paginatedData.map((req) => {
                  const assetName = req.equipment?.name || equipments.find(e => e.id === req.equipment_id)?.name || (isFr ? 'Équipement inconnu' : 'Unknown Asset');

                  return (
                    <TableRow key={req.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded border border-border overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                            <img 
                              src={getAssetImageUrl(req.equipment || equipments.find(e => e.id === req.equipment_id))} 
                              alt={assetName} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {assetName}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">{req.description}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {req.scheduled_date ? new Date(req.scheduled_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US') : (isFr ? 'Non planifié' : 'Unscheduled')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {(role === 'Admin' || role === 'Manager') && (req.status === 'Pending' || req.status === 'InProgress') && (
                            <Button 
                              onClick={() => openCompleteModal(req)} 
                              size="sm" 
                              variant="outline" 
                              className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {isFr ? 'Terminer' : 'Complete'}
                            </Button>
                          )}
                          {(req.status === 'Pending' || req.status === 'InProgress') && (
                            <Button 
                              onClick={() => handleCancel(req.id)} 
                              size="sm" 
                              variant="outline" 
                              className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {isFr ? 'Annuler' : 'Cancel'}
                            </Button>
                          )}
                          {(role === 'Admin' || role === 'Manager') && (
                            <Button 
                              onClick={() => openEditForm(req)} 
                              size="sm" 
                              variant="outline" 
                              className="border-border text-foreground hover:bg-secondary/50 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              {isFr ? 'Modifier' : 'Edit'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
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

      {/* Create / Edit Maintenance Ticket Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing 
                ? isFr ? 'Modifier la demande de maintenance' : 'Modify Maintenance Request' 
                : isFr ? 'Signaler un problème d\'équipement' : 'Report Equipment Issue'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? isFr ? 'Mettez à jour les détails de ce ticket de maintenance.' : 'Update the details for this maintenance ticket.' 
                : isFr ? 'Créez un ticket de support pour réparation ou dépannage.' : 'Create a support ticket for repair or troubleshooting.'}
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
                {isFr ? 'Sélectionner l\'équipement' : 'Select Equipment'}
              </label>
              <select
                value={formData.equipment_id}
                onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="">{isFr ? '-- Choisir l\'équipement --' : '-- Choose Equipment --'}</option>
                {equipments.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.serial_number})</option>
                ))}
              </select>
            </div>

            {isEditing && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Statut' : 'Status'}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="Pending">{isFr ? 'En attente' : 'Pending'}</option>
                  <option value="InProgress">{isFr ? 'En cours' : 'In Progress'}</option>
                  <option value="Completed">{isFr ? 'Terminé' : 'Completed'}</option>
                  <option value="Cancelled">{isFr ? 'Annulé' : 'Cancelled'}</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Niveau de priorité' : 'Priority Level'}</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenancePriority })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="Low">{isFr ? 'Basse' : 'Low'}</option>
                  <option value="Medium">{isFr ? 'Moyenne' : 'Medium'}</option>
                  <option value="High">{isFr ? 'Haute' : 'High'}</option>
                  <option value="Critical">{isFr ? 'Critique' : 'Critical'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Date programmée' : 'Schedule Date'}</label>
                <input 
                  type="date" 
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Description du problème' : 'Issue Description'}</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isFr ? 'Expliquez la panne ou la maintenance requise (ex: dysfonctionnement du clavier, écran qui clignote)' : 'Explain the fault or requested maintenance (e.g. keyboard malfunctioning, screen flicker)'} 
                className="w-full h-20 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border cursor-pointer">
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {isFr ? 'Soumettre le ticket' : 'Submit Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Maintenance Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isFr ? 'Marquer le ticket comme terminé' : 'Mark Ticket as Completed'}
            </DialogTitle>
            <DialogDescription>
              {isFr ? 'Notez les détails de la solution mise en œuvre pour réparer l\'équipement.' : 'Write down details of the solution implemented to repair the asset.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isFr ? 'Notes du technicien' : 'Technician Notes'}
              </label>
              <textarea 
                required
                value={techNotes}
                onChange={(e) => setTechNotes(e.target.value)}
                placeholder={isFr ? 'Détails sur le remplacement de matériel, nettoyage du système ou détails de la réparation...' : 'Details about hardware replacement, system clean, or repair details...'} 
                className="w-full h-24 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsCompleteOpen(false)} className="border-border cursor-pointer">
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {isFr ? 'Soumettre la résolution' : 'Submit Resolution'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
