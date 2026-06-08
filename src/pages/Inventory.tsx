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
import { Input } from '@/components/ui/input';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import type { Equipment, AssetStatus, AssetCategory } from '@/types';
import { Search, Filter, Plus, MonitorSmartphone, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

export const Inventory: React.FC = () => {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedAsset, setSelectedAsset] = useState<Equipment | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    serial_number: '',
    status: 'Available' as AssetStatus,
    category: 'Laptop' as AssetCategory,
    description: '',
    price: 0,
    image: '',
    image_url: '',
    image_url_https: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Equipment[]>('/equipment');
      setInventory(response.data || []);
    } catch (err: any) {
      console.error('Failed to load inventory', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'Available':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Available</Badge>;
      case 'Reserved':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Reserved</Badge>;
      case 'OutForRepair':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Repair</Badge>;
      case 'Retired':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Retired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRowClick = (asset: Equipment) => {
    setSelectedAsset(asset);
    setIsSheetOpen(true);
  };

  const openAddForm = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      serial_number: '',
      status: 'Available',
      category: 'Laptop',
      description: '',
      price: 0,
      image: '',
      image_url: '',
      image_url_https: '',
      purchase_date: new Date().toISOString().split('T')[0]
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (asset: Equipment) => {
    setIsEditing(true);
    setFormData({
      id: asset.id,
      name: asset.name,
      serial_number: asset.serial_number,
      status: asset.status,
      category: asset.category,
      description: asset.description,
      price: asset.price,
      image: asset.image || '',
      image_url: asset.image_url || '',
      image_url_https: asset.image_url_https || '',
      purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setErrorMessage('');
    setIsSheetOpen(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await apiClient.delete(`/equipment/${id}`);
      fetchInventory();
      setIsSheetOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete asset.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const payload = {
        ...formData,
        id: isEditing ? formData.id : crypto.randomUUID(),
        purchase_date: formData.purchase_date ? new Date(formData.purchase_date).toISOString() : null
      };

      if (isEditing) {
        await apiClient.put(`/equipment/${formData.id}`, payload);
      } else {
        await apiClient.post('/equipment', payload);
      }
      setIsFormOpen(false);
      fetchInventory();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'An error occurred during submission.');
    }
  };

  const filteredData = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage all IT assets and equipment.</p>
        </div>
        {(role === 'Admin' || role === 'Manager') && (
          <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or serial..." 
            className="pl-9 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Categories</option>
            <option value="Laptop">Laptop</option>
            <option value="Monitor">Monitor</option>
            <option value="Peripheral">Peripheral</option>
            <option value="NetworkDevice">Network Device</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="OutForRepair">Repair</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">Loading assets database...</div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[300px]">Asset Name</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No assets found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((asset) => (
                  <TableRow 
                    key={asset.id} 
                    className="cursor-pointer border-border hover:bg-secondary/50 transition-colors"
                    onClick={() => handleRowClick(asset)}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-secondary text-muted-foreground">
                          <MonitorSmartphone className="w-4 h-4" />
                        </div>
                        {asset.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{asset.serial_number}</TableCell>
                    <TableCell className="text-muted-foreground">{asset.category}</TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell className="text-right text-foreground font-mono">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md border-l border-border bg-card/95 backdrop-blur-xl">
          <SheetHeader>
            <SheetTitle className="text-xl text-foreground flex items-center gap-2">
              <MonitorSmartphone className="w-5 h-5 text-primary" />
              Asset Details
            </SheetTitle>
            <SheetDescription>
              View and manage this equipment's lifecycle.
            </SheetDescription>
          </SheetHeader>
          
          {selectedAsset && (
            <div className="mt-6 space-y-6">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h3 className="font-semibold text-lg text-foreground">{selectedAsset.name}</h3>
                <p className="font-mono text-sm text-muted-foreground mt-1">{selectedAsset.serial_number}</p>
                <div className="mt-4 flex items-center gap-2">
                  {getStatusBadge(selectedAsset.status)}
                  <Badge variant="outline" className="border-border text-muted-foreground">{selectedAsset.category}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Specifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Purchase Price</p>
                    <p className="text-sm font-mono text-foreground mt-0.5">${selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Purchase Date</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground mt-0.5">{selectedAsset.description || 'No description provided.'}</p>
                  </div>
                </div>
              </div>

              {(role === 'Admin' || role === 'Manager') && (
                <div className="pt-6 border-t border-border flex justify-end gap-3">
                  {role === 'Admin' && (
                    <Button onClick={() => handleDelete(selectedAsset.id)} variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                  <Button onClick={() => openEditForm(selectedAsset)} variant="outline" className="border-border flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Asset
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing ? 'Modify IT Asset' : 'Add New IT Asset'}
            </DialogTitle>
            <DialogDescription>
              Provide the equipment information. All fields are required.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. MacBook Pro 16 M3" 
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serial Number</label>
                <input 
                  type="text" 
                  required
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Manufacturer Serial No." 
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Peripheral">Peripheral</option>
                  <option value="NetworkDevice">Network Device</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="OutForRepair">Repair</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00" 
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Date</label>
                <input 
                  type="date" 
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe specifications or department assignment" 
                  className="w-full h-20 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isEditing ? 'Save Changes' : 'Create Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
