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
import { Wrench, Plus, CheckCircle, XCircle, Edit } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

export const Maintenance: React.FC = () => {
  const { role, userId } = useAuth();
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
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Pending</Badge>;
      case 'InProgress':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">In Progress</Badge>;
      case 'Completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Completed</Badge>;
      case 'Cancelled':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'Low':
        return <Badge variant="outline" className="border-border text-muted-foreground">Low</Badge>;
      case 'Medium':
        return <Badge variant="outline" className="border-blue-500/20 text-blue-500">Medium</Badge>;
      case 'High':
        return <Badge variant="outline" className="border-amber-500/20 text-amber-500">High</Badge>;
      case 'Critical':
        return <Badge variant="outline" className="border-rose-500/20 text-rose-500 font-bold animate-pulse">Critical</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this maintenance request?')) return;
    try {
      await apiClient.post(`/maintenancerequest/${id}/cancel`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel maintenance request.');
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
      alert(err.response?.data?.message || 'Failed to complete request.');
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
      setErrorMessage('Please select an equipment.');
      return;
    }
    if (!formData.description) {
      setErrorMessage('Description is required.');
      return;
    }

    try {
      const payload = {
        id: isEditing ? formData.id : crypto.randomUUID(),
        equipment_id: formData.equipment_id,
        requested_by_id: userId || '00000002-0000-0000-0000-000000000001', // fallback if empty
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
      setErrorMessage(err.response?.data?.message || 'An error occurred.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Maintenance Requests</h1>
          <p className="text-muted-foreground mt-1">Track hardware faults, repairs, and service history.</p>
        </div>
        <Button onClick={openCreateForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Report Fault
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">Loading tickets...</div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Asset Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No maintenance requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => {
                  const assetName = req.equipment?.name || equipments.find(e => e.id === req.equipment_id)?.name || 'Unknown Asset';

                  return (
                    <TableRow key={req.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-secondary text-muted-foreground">
                            <Wrench className="w-4 h-4" />
                          </div>
                          {assetName}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">{req.description}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {req.scheduled_date ? new Date(req.scheduled_date).toLocaleDateString() : 'Unscheduled'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {(role === 'Admin' || role === 'Manager') && (req.status === 'Pending' || req.status === 'InProgress') && (
                            <Button 
                              onClick={() => openCompleteModal(req)} 
                              size="sm" 
                              variant="outline" 
                              className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Complete
                            </Button>
                          )}
                          {(req.status === 'Pending' || req.status === 'InProgress') && (
                            <Button 
                              onClick={() => handleCancel(req.id)} 
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
                              onClick={() => openEditForm(req)} 
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

      {/* Create / Edit Maintenance Ticket Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing ? 'Modify Maintenance Request' : 'Report Equipment Issue'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details for this maintenance ticket.' : 'Create a support ticket for repair or troubleshooting.'}
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
                {equipments.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.serial_number})</option>
                ))}
              </select>
            </div>

            {isEditing && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="Pending">Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority Level</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenancePriority })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schedule Date</label>
                <input 
                  type="date" 
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the fault or requested maintenance (e.g. keyboard malfunctioning, screen flicker)" 
                className="w-full h-20 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Submit Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Maintenance Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">Mark Ticket as Completed</DialogTitle>
            <DialogDescription>
              Write down details of the solution implemented to repair the asset.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Technician Notes</label>
              <textarea 
                required
                value={techNotes}
                onChange={(e) => setTechNotes(e.target.value)}
                placeholder="Details about hardware replacement, system clean, or repair details..." 
                className="w-full h-24 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsCompleteOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Submit Resolution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
