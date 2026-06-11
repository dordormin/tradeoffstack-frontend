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
import type { Reservation, Equipment, User, ReservationStatus } from '@/types';
import { Plus, CheckCircle, XCircle, Edit } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useTableState } from '@/hooks/useTableState';
import { DataTableControls, DataTablePagination, SortableHeader } from '@/components/DataTableControls';
import { getAssetImageUrl } from '@/utils/assetImages';

export const Reservations: React.FC = () => {
  const { role, userId } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    equipment_id: '',
    user_id: '',
    status: 'Pending' as ReservationStatus,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  });

  const table = useTableState<Reservation>({
    data: reservations,
    initialPageSize: 10,
    searchableKeys: ['status', 'notes', 'user_id', 'equipment_id'],
  });

  const fetchReservations = async () => {
    try {
      const response = await apiClient.get<Reservation[]>('/reservation');
      setReservations(response.data || []);
    } catch (err) {
      console.error('Failed to fetch reservations', err);
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

  const fetchUsers = async () => {
    if (role === 'Admin' || role === 'Manager') {
      try {
        const response = await apiClient.get<User[]>('/user');
        setUsers(response.data || []);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchReservations(), fetchEquipments(), fetchUsers()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">{isFr ? 'En attente' : 'Pending'}</Badge>;
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{isFr ? 'Active' : 'Active'}</Badge>;
      case 'Returned':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">{isFr ? 'Retourné' : 'Returned'}</Badge>;
      case 'Cancelled':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">{isFr ? 'Annulé' : 'Cancelled'}</Badge>;
      case 'Approved':
        return <Badge className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20">{isFr ? 'Approuvée' : 'Approved'}</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-600/10 text-red-600 hover:bg-red-600/20 border-red-600/20">{isFr ? 'Rejetée' : 'Rejected'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReturn = async (id: string) => {
    if (!window.confirm(isFr ? 'Marquer cet équipement comme retourné ?' : 'Mark this equipment as returned?')) return;
    try {
      await apiClient.post(`/reservation/${id}/return`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || (isFr ? 'Échec du retour.' : 'Failed to process return.'));
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm(isFr ? 'Annuler cette réservation ?' : 'Cancel this reservation?')) return;
    try {
      await apiClient.post(`/reservation/${id}/cancel`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || (isFr ? 'Échec de l\'annulation.' : 'Failed to cancel reservation.'));
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm(isFr ? 'Approuver cette réservation ?' : 'Approve this reservation?')) return;
    try {
      await apiClient.post(`/reservation/${id}/approve`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || (isFr ? 'Échec de l\'approbation.' : 'Failed to approve reservation.'));
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt(isFr ? 'Motif du rejet :' : 'Reason for rejection:');
    if (!reason) return;
    try {
      await apiClient.post(`/reservation/${id}/reject`, { reason });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || (isFr ? 'Échec du rejet.' : 'Failed to reject reservation.'));
    }
  };

  const openCreateForm = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      equipment_id: '',
      user_id: role === 'Employee' ? (userId || '') : '',
      status: 'Pending',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: ''
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (res: Reservation) => {
    setIsEditing(true);
    setFormData({
      id: res.id,
      equipment_id: res.equipment_id,
      user_id: res.user_id,
      status: res.status,
      start_date: res.start_date ? res.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: res.end_date ? res.end_date.split('T')[0] : '',
      notes: res.notes || ''
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
    if (!formData.user_id) {
      setErrorMessage(isFr ? 'Veuillez sélectionner un utilisateur.' : 'Please select a user.');
      return;
    }

    try {
      const payload = {
        id: isEditing ? formData.id : crypto.randomUUID(),
        equipment_id: formData.equipment_id,
        user_id: formData.user_id,
        status: formData.status,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        notes: formData.notes
      };

      if (isEditing) {
        await apiClient.put(`/reservation/${formData.id}`, payload);
      } else {
        await apiClient.post('/reservation', payload);
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || (isFr ? 'Une erreur est survenue.' : 'An error occurred.'));
    }
  };

  const availableEquipments = isEditing
    ? equipments.filter(e => e.status === 'Available' || e.id === formData.equipment_id)
    : equipments.filter(e => e.status === 'Available');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isFr ? 'Réservations' : 'Reservations'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? 'Réservez du matériel ou visualisez vos locations actives.' : 'Book hardware or view your active rentals.'}
          </p>
        </div>
        <Button onClick={openCreateForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          {isFr ? 'Nouvelle réservation' : 'New Reservation'}
        </Button>
      </div>

      <DataTableControls
        searchTerm={table.searchTerm}
        onSearchChange={table.setSearchTerm}
        searchPlaceholder={isFr ? 'Rechercher par statut, notes...' : 'Search by status, notes...'}
        isFr={isFr}
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">
            {isFr ? 'Chargement des réservations...' : 'Loading reservations...'}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>{isFr ? 'Nom de l\'équipement' : 'Asset Name'}</TableHead>
                <TableHead>{isFr ? 'Utilisateur' : 'User'}</TableHead>
                <TableHead>
                  <SortableHeader label={isFr ? 'Date de début' : 'Start Date'} sortKey="start_date" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label={isFr ? 'Date de fin' : 'End Date'} sortKey="end_date" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label={isFr ? 'Statut' : 'Status'} sortKey="status" sortConfig={table.sortConfig} onSort={table.handleSort} />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isFr ? 'Aucune réservation trouvée.' : 'No reservations found.'}
                  </TableCell>
                </TableRow>
              ) : (
                table.paginatedData.map((res) => {
                  const assetName = res.equipment?.name || equipments.find(e => e.id === res.equipment_id)?.name || (isFr ? 'Équipement inconnu' : 'Unknown Asset');
                  const userEmail = res.user?.email || users.find(u => u.id === res.user_id)?.email || res.user_id;

                  return (
                    <TableRow key={res.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded border border-border overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                            <img 
                              src={getAssetImageUrl(res.equipment || equipments.find(e => e.id === res.equipment_id))} 
                              alt={assetName} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {assetName}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{userEmail}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {new Date(res.start_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {res.end_date ? new Date(res.end_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US') : (isFr ? 'Continu' : 'Continuous')}
                      </TableCell>
                      <TableCell>{getStatusBadge(res.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {res.status === 'Active' && (
                            <Button 
                              onClick={() => handleReturn(res.id)} 
                              size="sm" 
                              variant="outline" 
                              className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {isFr ? 'Retourner' : 'Return'}
                            </Button>
                          )}
                          {(res.status === 'Pending' || res.status === 'Active' || res.status === 'Approved') && (
                            <Button 
                              onClick={() => handleCancel(res.id)} 
                              size="sm" 
                              variant="outline" 
                              className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {isFr ? 'Annuler' : 'Cancel'}
                            </Button>
                          )}
                          {(role === 'Admin' || role === 'Manager') && res.status === 'Pending' && (
                            <>
                              <Button 
                                onClick={() => handleApprove(res.id)} 
                                size="sm" 
                                variant="outline" 
                                className="border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/10 flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {isFr ? 'Approuver' : 'Approve'}
                              </Button>
                              <Button 
                                onClick={() => handleReject(res.id)} 
                                size="sm" 
                                variant="outline" 
                                className="border-red-600/20 text-red-600 hover:bg-red-600/10 flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {isFr ? 'Rejeter' : 'Reject'}
                              </Button>
                            </>
                          )}
                          {(role === 'Admin' || role === 'Manager') && (
                            <Button 
                              onClick={() => openEditForm(res)} 
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

          <DataTablePagination
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

      {/* Create / Edit Reservation Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing 
                ? isFr ? 'Modifier la réservation d\'équipement' : 'Modify Equipment Booking' 
                : isFr ? 'Demande de réservation d\'équipement' : 'Request Equipment Booking'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? isFr ? 'Mettez à jour les détails de cette réservation.' : 'Update the details for this reservation.' 
                : isFr ? 'Soumettez une demande de réservation. Vous serez notifié lorsqu\'elle sera prête.' : 'Submit a reservation request. You will be notified when it is ready.'}
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
                {availableEquipments.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.serial_number})</option>
                ))}
              </select>
            </div>

            {(role === 'Admin' || role === 'Manager') ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Assigner à l\'utilisateur' : 'Assign to User'}
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="">{isFr ? '-- Sélectionner l\'utilisateur --' : '-- Select User --'}</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Compte utilisateur' : 'User Account'}
                </label>
                <input 
                  type="text" 
                  disabled
                  value={isFr ? 'Votre profil employé (Même)' : 'Your Employee Profile (Self)'}
                  className="w-full px-3 py-2 rounded-md border border-border bg-secondary/50 text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>
            )}

            {isEditing && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Statut' : 'Status'}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ReservationStatus })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="Pending">{isFr ? 'En attente' : 'Pending'}</option>
                  <option value="Active">{isFr ? 'Active' : 'Active'}</option>
                  <option value="Returned">{isFr ? 'Retourné' : 'Returned'}</option>
                  <option value="Cancelled">{isFr ? 'Annulé' : 'Cancelled'}</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Date de début' : 'Start Date'}
                </label>
                <input 
                  type="date" 
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Date de fin (Optionnel)' : 'End Date (Optional)'}
                </label>
                <input 
                  type="date" 
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isFr ? 'Notes de réservation' : 'Booking Notes'}
              </label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isFr ? 'Indiquez le motif (ex: Télétravail, Présentation client)' : 'Indicate purpose (e.g. Remote work, Client presentation)'} 
                className="w-full h-20 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border cursor-pointer">
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {isFr ? 'Soumettre la réservation' : 'Submit Reservation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
