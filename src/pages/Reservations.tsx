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
import { CalendarClock, Plus, CheckCircle, XCircle, Edit } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

export const Reservations: React.FC = () => {
  const { role, userId } = useAuth();
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
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Pending</Badge>;
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>;
      case 'Returned':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Returned</Badge>;
      case 'Cancelled':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReturn = async (id: string) => {
    if (!window.confirm('Mark this equipment as returned?')) return;
    try {
      await apiClient.post(`/reservation/${id}/return`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process return.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await apiClient.post(`/reservation/${id}/cancel`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel reservation.');
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
      setErrorMessage('Please select an equipment.');
      return;
    }
    if (!formData.user_id) {
      setErrorMessage('Please select a user.');
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
      setErrorMessage(err.response?.data?.message || 'An error occurred.');
    }
  };

  // Only equipments that are Available can be selected for new reservation
  const availableEquipments = isEditing
    ? equipments.filter(e => e.status === 'Available' || e.id === formData.equipment_id)
    : equipments.filter(e => e.status === 'Available');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reservations</h1>
          <p className="text-muted-foreground mt-1">Book hardware or view your active rentals.</p>
        </div>
        <Button onClick={openCreateForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Reservation
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">Loading reservations...</div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Asset Name</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No reservations found.
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((res) => {
                  const assetName = res.equipment?.name || equipments.find(e => e.id === res.equipment_id)?.name || 'Unknown Asset';
                  const userEmail = res.user?.email || users.find(u => u.id === res.user_id)?.email || res.user_id;

                  return (
                    <TableRow key={res.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-secondary text-muted-foreground">
                            <CalendarClock className="w-4 h-4" />
                          </div>
                          {assetName}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{userEmail}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {new Date(res.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {res.end_date ? new Date(res.end_date).toLocaleDateString() : 'Continuous'}
                      </TableCell>
                      <TableCell>{getStatusBadge(res.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {res.status === 'Active' && (
                            <Button 
                              onClick={() => handleReturn(res.id)} 
                              size="sm" 
                              variant="outline" 
                              className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Return
                            </Button>
                          )}
                          {(res.status === 'Pending' || res.status === 'Active') && (
                            <Button 
                              onClick={() => handleCancel(res.id)} 
                              size="sm" 
                              variant="outline" 
                              className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </Button>
                          )}
                          {(role === 'Admin' || role === 'Manager') && (
                            <Button 
                              onClick={() => openEditForm(res)} 
                              size="sm" 
                              variant="outline" 
                              className="border-border text-foreground hover:bg-secondary/50 flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
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
        </div>
      )}

      {/* Create / Edit Reservation Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing ? 'Modify Equipment Booking' : 'Request Equipment Booking'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details for this reservation.' : 'Submit a reservation request. You will be notified when it is ready.'}
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Equipment</label>
              <select
                value={formData.equipment_id}
                onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="">-- Choose Equipment --</option>
                {availableEquipments.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.serial_number})</option>
                ))}
              </select>
            </div>

            {(role === 'Admin' || role === 'Manager') ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign to User</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">-- Select User --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Account</label>
                <input 
                  type="text" 
                  disabled
                  value="Your Employee Profile (Self)"
                  className="w-full px-3 py-2 rounded-md border border-border bg-secondary/50 text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>
            )}

            {isEditing && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ReservationStatus })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Returned">Returned</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date (Optional)</label>
                <input 
                  type="date" 
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking Notes</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Indicate purpose (e.g. Remote work, Client presentation)" 
                className="w-full h-20 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Submit Reservation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
