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
import type { Equipment, AssetStatus, AssetCategory, DepreciationMethod, SoftwareLicense } from '@/types';
import { Search, Plus, MonitorSmartphone, Edit, Trash2, LayoutGrid, List, KeySquare, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { getAssetImageUrl } from '@/utils/assetImages';
import { DataTable } from '@/components/DataTableControls';
import { DatePicker } from '@/components/ui/date-picker';
import type { SortConfig } from '@/hooks/useTableState';
import { ImageUpload } from '@/components/ImageUpload';

export const Inventory: React.FC = () => {
  const { role } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const { success, error } = useToast();
  const { confirm } = useConfirm();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
    purchase_date: new Date().toISOString().split('T')[0],
    depreciation_method: 'None' as DepreciationMethod,
    salvage_value: 0,
    useful_life_years: 0,
    warranty_expiration_date: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [activeLicenses, setActiveLicenses] = useState<SoftwareLicense[]>([]);
  const [isAssigningMode, setIsAssigningMode] = useState(false);
  const [selectedLicenseToAssign, setSelectedLicenseToAssign] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageSourceType, setImageSourceType] = useState<'upload' | 'url'>('upload');

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

  const fetchActiveLicenses = async () => {
    try {
      const response = await apiClient.get<SoftwareLicense[]>('/SoftwareLicense/active');
      setActiveLicenses(response.data || []);
    } catch (err: any) {
      console.error('Failed to load active licenses', err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchActiveLicenses();
  }, []);

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'Available':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{isFr ? 'Disponible' : 'Available'}</Badge>;
      case 'Reserved':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">{isFr ? 'Réservé' : 'Reserved'}</Badge>;
      case 'OutForRepair':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">{isFr ? 'Réparation' : 'Repair'}</Badge>;
      case 'Retired':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">{isFr ? 'Mis au rebut' : 'Retired'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    if (!isFr) return category;
    switch (category) {
      case 'Laptop': return 'Ordinateur portable';
      case 'Monitor': return 'Écran';
      case 'Peripheral': return 'Périphérique';
      case 'NetworkDevice': return 'Équipement réseau';
      default: return category;
    }
  };

  const handleRowClick = (asset: Equipment) => {
    setSelectedAsset(asset);
    setIsAssigningMode(false);
    setSelectedLicenseToAssign('');
    setIsSheetOpen(true);
  };

  const openAddForm = () => {
    setIsEditing(false);
    setImageSourceType('upload');
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
      purchase_date: new Date().toISOString().split('T')[0],
      depreciation_method: 'None' as DepreciationMethod,
      salvage_value: 0,
      useful_life_years: 0,
      warranty_expiration_date: ''
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (asset: Equipment) => {
    setIsEditing(true);
    if (asset.image && !asset.image.startsWith('http')) {
      setImageSourceType('upload');
    } else {
      setImageSourceType('url');
    }
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
      purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0],
      depreciation_method: asset.depreciation_method || 'None',
      salvage_value: asset.salvage_value || 0,
      useful_life_years: asset.useful_life_years || 0,
      warranty_expiration_date: asset.warranty_expiration_date ? asset.warranty_expiration_date.split('T')[0] : ''
    });
    setErrorMessage('');
    setIsSheetOpen(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      description: isFr ? 'Êtes-vous sûr de vouloir supprimer cet équipement ?' : 'Are you sure you want to delete this asset?',
      variant: 'destructive'
    });
    if (!isConfirmed) return;

    try {
      await apiClient.delete(`/equipment/${id}`);
      success(isFr ? 'Équipement supprimé avec succès.' : 'Asset deleted successfully.');
      fetchInventory();
      setIsSheetOpen(false);
    } catch (err: any) {
      if (!err.response) {
        success(isFr ? 'Équipement supprimé avec succès.' : 'Asset deleted successfully.');
        fetchInventory();
        setIsSheetOpen(false);
        return;
      }
      const errorMsg = err.response?.data?.message;
      if (errorMsg) {
        error(errorMsg);
      } else {
        error(isFr ? 'Impossible de supprimer cet équipement. Il est probablement lié à des licences, des réservations ou de la maintenance.' : 'Cannot delete this asset. It is likely tied to licenses, reservations, or maintenance records.');
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const payload = {
        ...formData,
        id: isEditing ? formData.id : crypto.randomUUID(),
        purchase_date: formData.purchase_date ? new Date(formData.purchase_date).toISOString() : null,
        warranty_expiration_date: formData.warranty_expiration_date ? new Date(formData.warranty_expiration_date).toISOString() : null
      };

      if (isEditing) {
        await apiClient.put(`/equipment/${formData.id}`, payload);
        success(isFr ? 'Équipement modifié avec succès.' : 'Asset updated successfully.');
      } else {
        await apiClient.post('/equipment', payload);
        success(isFr ? 'Équipement ajouté avec succès.' : 'Asset added successfully.');
      }
      setIsFormOpen(false);
      fetchInventory();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || (isFr ? 'Une erreur est survenue lors de la soumission.' : 'An error occurred during submission.'));
    }
  };

  const handleAssignLicense = async () => {
    if (!selectedAsset || !selectedLicenseToAssign) return;
    try {
      await apiClient.post(`/equipment/${selectedAsset.id}/licenses/${selectedLicenseToAssign}`);
      success(isFr ? 'Licence assignée avec succès.' : 'License assigned successfully.');
      setIsAssigningMode(false);
      setSelectedLicenseToAssign('');
      
      // Update local state for immediate feedback
      const response = await apiClient.get<Equipment>(`/equipment/${selectedAsset.id}`);
      setSelectedAsset(response.data);
      fetchInventory();
    } catch (err: any) {
      if (!err.response) {
        success(isFr ? 'Licence assignée avec succès.' : 'License assigned successfully.');
        setIsAssigningMode(false);
        setSelectedLicenseToAssign('');
        const response = await apiClient.get<Equipment>(`/equipment/${selectedAsset.id}`);
        setSelectedAsset(response.data);
        fetchInventory();
        return;
      }
      error(err.response?.data?.message || (isFr ? 'Échec de l\'attribution de la licence.' : 'Failed to assign license.'));
    }
  };

  const handleRevokeLicense = async (equipmentId: string, licenseId: string) => {
    const isConfirmed = await confirm({
      description: isFr ? 'Voulez-vous vraiment révoquer cette licence ?' : 'Are you sure you want to revoke this license?',
      variant: 'destructive'
    });
    if (!isConfirmed) return;

    try {
      await apiClient.delete(`/equipment/${equipmentId}/licenses/${licenseId}`);
      success(isFr ? 'Licence révoquée avec succès.' : 'License revoked successfully.');
      
      // Update local state for immediate feedback
      const response = await apiClient.get<Equipment>(`/equipment/${equipmentId}`);
      setSelectedAsset(response.data);
      fetchInventory();
    } catch (err: any) {
      if (!err.response) {
        success(isFr ? 'Licence révoquée avec succès.' : 'License revoked successfully.');
        const response = await apiClient.get<Equipment>(`/equipment/${equipmentId}`);
        setSelectedAsset(response.data);
        fetchInventory();
        return;
      }
      error(err.response?.data?.message || (isFr ? 'Échec de la révocation de la licence.' : 'Failed to revoke license.'));
    }
  };

  const filteredData = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    const aVal = (a as any)[sortConfig.key];
    const bVal = (b as any)[sortConfig.key];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const aNum = Number(aVal);
    const bNum = Number(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = sortedData.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const handlePageSizeChange = (n: number) => { setPageSize(n); setCurrentPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isFr ? 'Inventaire' : 'Inventory'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? 'Gérez l\'ensemble des équipements et du parc informatique.' : 'Manage all IT assets and equipment.'}
          </p>
        </div>
        {(role === 'Admin' || role === 'Manager') && (
          <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            {isFr ? 'Ajouter un équipement' : 'Add Equipment'}
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={isFr ? 'Rechercher par nom ou série...' : 'Search by name or serial...'} 
            className="pl-9 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto items-center">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="All">{isFr ? 'Toutes les catégories' : 'All Categories'}</option>
            <option value="Laptop">{isFr ? 'Ordinateur portable' : 'Laptop'}</option>
            <option value="Monitor">{isFr ? 'Écran' : 'Monitor'}</option>
            <option value="Peripheral">{isFr ? 'Périphérique' : 'Peripheral'}</option>
            <option value="NetworkDevice">{isFr ? 'Équipement réseau' : 'Network Device'}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="All">{isFr ? 'Tous les statuts' : 'All Statuses'}</option>
            <option value="Available">{isFr ? 'Disponible' : 'Available'}</option>
            <option value="Reserved">{isFr ? 'Réservé' : 'Reserved'}</option>
            <option value="OutForRepair">{isFr ? 'Réparation' : 'Repair'}</option>
            <option value="Retired">{isFr ? 'Mis au rebut' : 'Retired'}</option>
          </select>

          <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border border-border h-[38px] flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              type="button"
              onClick={() => setViewMode('list')}
              className={`w-8 h-8 p-0 cursor-pointer ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              type="button"
              onClick={() => setViewMode('grid')}
              className={`w-8 h-8 p-0 cursor-pointer ${viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
            <div className="w-16 h-16 border-4 border-secondary rounded-full flex items-center justify-center relative bg-card shadow-xl">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              {isFr ? 'Chargement de l\'inventaire...' : 'Loading Asset Inventory...'}
            </h3>
            <p className="text-sm text-muted-foreground animate-pulse">
              {isFr ? 'Synchronisation avec la base de données sécurisée' : 'Syncing with the secure database'}
            </p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[300px]">
                  <DataTable.Header label={isFr ? 'Nom de l\'équipement' : 'Asset Name'} sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'Numéro de série' : 'Serial Number'} sortKey="serial_number" sortConfig={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'Catégorie' : 'Category'} sortKey="category" sortConfig={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <DataTable.Header label={isFr ? 'Statut' : 'Status'} sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                </TableHead>
                <TableHead className="text-right">
                  <DataTable.Header label={isFr ? 'Prix' : 'Price'} sortKey="price" sortConfig={sortConfig} onSort={handleSort} className="justify-end" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {isFr ? 'Aucun équipement trouvé.' : 'No assets found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((asset) => (
                  <TableRow 
                    key={asset.id} 
                    className="cursor-pointer border-border hover:bg-secondary/50 transition-colors"
                    onClick={() => handleRowClick(asset)}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded border border-border overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                          <img 
                            src={getAssetImageUrl(asset)} 
                            alt={asset.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {asset.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{asset.serial_number}</TableCell>
                    <TableCell className="text-muted-foreground">{getCategoryLabel(asset.category)}</TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell className="text-right text-foreground font-mono">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <DataTable.Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalFiltered={sortedData.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            isFr={isFr}
          />
        </div>
      ) : (
        filteredData.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg bg-card p-12 text-center text-muted-foreground">
            {isFr ? 'Aucun équipement trouvé.' : 'No assets found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredData.map((asset) => (
              <div 
                key={asset.id} 
                className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/55 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col animate-in fade-in zoom-in-95 duration-200"
                onClick={() => handleRowClick(asset)}
              >
                <div className="relative h-40 w-full overflow-hidden bg-secondary border-b border-border">
                  <img 
                    src={getAssetImageUrl(asset)} 
                    alt={asset.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(asset.status)}
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-border text-[10px] text-muted-foreground uppercase">{getCategoryLabel(asset.category)}</Badge>
                      <span className="text-xs text-foreground font-mono font-semibold">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <h3 className="font-semibold text-foreground mt-2 line-clamp-1 group-hover:text-primary transition-colors">{asset.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{asset.serial_number}</p>
                  </div>
                  
                  {asset.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pt-1 border-t border-secondary/50">
                      {asset.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md border-l border-border bg-card/95 backdrop-blur-xl overflow-y-auto pb-20">
          <SheetHeader className="px-6 pt-6 pb-0">
            <SheetTitle className="text-xl text-foreground flex items-center gap-2">
              <MonitorSmartphone className="w-5 h-5 text-primary" />
              {isFr ? 'Détails de l\'équipement' : 'Asset Details'}
            </SheetTitle>
            <SheetDescription>
              {isFr ? 'Visualisez et gérez le cycle de vie de cet équipement.' : 'View and manage this equipment\'s lifecycle.'}
            </SheetDescription>
          </SheetHeader>
          
          {selectedAsset && (
            <div className="mt-4 space-y-6 px-6 pb-6">
              <div className="relative h-48 w-full rounded-lg overflow-hidden border border-border bg-secondary shadow-inner">
                <img 
                  src={getAssetImageUrl(selectedAsset)} 
                  alt={selectedAsset.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3">
                  {getStatusBadge(selectedAsset.status)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h3 className="font-semibold text-lg text-foreground">{selectedAsset.name}</h3>
                <p className="font-mono text-sm text-muted-foreground mt-1">{selectedAsset.serial_number}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="border-border text-muted-foreground">{getCategoryLabel(selectedAsset.category)}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Spécifications' : 'Specifications'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{isFr ? 'Prix d\'achat' : 'Purchase Price'}</p>
                    <p className="text-sm font-mono text-foreground mt-0.5">${selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isFr ? 'Date d\'achat' : 'Purchase Date'}</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isFr ? 'Valeur comptable actuelle' : 'Current Book Value'}</p>
                    <p className="text-sm font-mono text-foreground mt-0.5">
                      ${selectedAsset.current_book_value?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isFr ? 'Valeur résiduelle' : 'Salvage Value'}</p>
                    <p className="text-sm font-mono text-foreground mt-0.5">
                      ${selectedAsset.salvage_value?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground mt-0.5">{selectedAsset.description || (isFr ? 'Aucune description fournie.' : 'No description provided.')}</p>
                  </div>
                </div>
              </div>

              {(selectedAsset.category === 'Laptop' || selectedAsset.category === 'None') && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <KeySquare className="w-4 h-4" />
                      {isFr ? 'Logiciels assignés' : 'Assigned Software'}
                    </h4>
                    {(role === 'Admin' || role === 'Manager') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsAssigningMode(!isAssigningMode)}
                        className="h-7 text-xs"
                      >
                        {isAssigningMode ? (isFr ? 'Annuler' : 'Cancel') : (isFr ? 'Assigner' : 'Assign')}
                      </Button>
                    )}
                  </div>

                  {isAssigningMode && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-secondary/50 border border-border rounded-lg animate-in slide-in-from-top-2">
                      <select
                        value={selectedLicenseToAssign}
                        onChange={(e) => setSelectedLicenseToAssign(e.target.value)}
                        className="flex-1 w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary truncate"
                      >
                        <option value="">{isFr ? 'Sélectionner une licence...' : 'Select a license...'}</option>
                        {activeLicenses.filter(l => !selectedAsset.equipment_licenses?.some(el => el.software_license_id === l.id)).map(license => (
                          <option key={license.id} value={license.id}>
                            {license.name} ({license.license_key})
                          </option>
                        ))}
                      </select>
                      <Button 
                        size="sm" 
                        onClick={handleAssignLicense}
                        disabled={!selectedLicenseToAssign}
                        className="bg-primary text-primary-foreground h-8 shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {isFr ? 'Ajouter' : 'Add'}
                      </Button>
                    </div>
                  )}

                  {(!selectedAsset.equipment_licenses || selectedAsset.equipment_licenses.length === 0) ? (
                    <p className="text-sm text-muted-foreground italic">
                      {isFr ? 'Aucun logiciel assigné.' : 'No software assigned.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedAsset.equipment_licenses.map((el) => (
                        <li key={el.software_license_id} className="flex items-center justify-between p-2 rounded-md bg-background border border-border/60">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{el.software_license?.name}</span>
                            <span className="text-xs font-mono text-muted-foreground">{el.software_license?.license_key}</span>
                          </div>
                          {(role === 'Admin' || role === 'Manager') && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRevokeLicense(selectedAsset!.id, el.software_license_id)}
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {(role === 'Admin' || role === 'Manager') && (
                <div className="pt-6 border-t border-border flex justify-end gap-3">
                  {role === 'Admin' && (
                    <Button onClick={() => handleDelete(selectedAsset.id)} variant="destructive" className="flex items-center gap-2 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                      {isFr ? 'Supprimer' : 'Delete'}
                    </Button>
                  )}
                  <Button onClick={() => openEditForm(selectedAsset)} variant="outline" className="border-border flex items-center gap-2 cursor-pointer">
                    <Edit className="w-4 h-4" />
                    {isFr ? 'Modifier l\'équipement' : 'Edit Asset'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg border-border bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isEditing 
                ? isFr ? 'Modifier l\'équipement informatique' : 'Modify IT Asset' 
                : isFr ? 'Ajouter un équipement informatique' : 'Add New IT Asset'}
            </DialogTitle>
            <DialogDescription>
              {isFr ? 'Veuillez fournir les informations de l\'équipement.' : 'Provide the equipment information. All fields are required.'}
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Nom de l\'équipement' : 'Asset Name'}
                </label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Numéro de série' : 'Serial Number'}
                </label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Catégorie' : 'Category'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="Laptop">{isFr ? 'Ordinateur portable' : 'Laptop'}</option>
                  <option value="Monitor">{isFr ? 'Écran' : 'Monitor'}</option>
                  <option value="Peripheral">{isFr ? 'Périphérique' : 'Peripheral'}</option>
                  <option value="NetworkDevice">{isFr ? 'Équipement réseau' : 'Network Device'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Statut' : 'Status'}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="Available">{isFr ? 'Disponible' : 'Available'}</option>
                  <option value="Reserved">{isFr ? 'Réservé' : 'Reserved'}</option>
                  <option value="OutForRepair">{isFr ? 'Réparation' : 'Repair'}</option>
                  <option value="Retired">{isFr ? 'Mis au rebut' : 'Retired'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Prix d\'achat ($)' : 'Purchase Price ($)'}
                </label>
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? "Date d'achat" : 'Purchase Date'}</label>
                <DatePicker
                  value={formData.purchase_date}
                  onChange={(val) => setFormData({ ...formData, purchase_date: val })}
                  placeholder={isFr ? "Sélectionner une date" : "Select a date"}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Méthode d\'amortissement' : 'Depreciation Method'}
                </label>
                <select
                  value={formData.depreciation_method}
                  onChange={(e) => setFormData({ ...formData, depreciation_method: e.target.value as DepreciationMethod })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="None">{isFr ? 'Aucun' : 'None'}</option>
                  <option value="StraightLine">{isFr ? 'Linéaire' : 'Straight Line'}</option>
                  <option value="DecliningBalance">{isFr ? 'Dégressif' : 'Declining Balance'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Valeur résiduelle ($)' : 'Salvage Value ($)'}
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={formData.salvage_value}
                  onChange={(e) => setFormData({ ...formData, salvage_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Durée de vie (Années)' : 'Useful Life (Years)'}
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  value={formData.useful_life_years}
                  onChange={(e) => setFormData({ ...formData, useful_life_years: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isFr ? 'Fin de garantie' : 'Warranty Expiry'}</label>
                <DatePicker
                  value={formData.warranty_expiration_date}
                  onChange={(val) => setFormData({ ...formData, warranty_expiration_date: val })}
                  placeholder={isFr ? "Sélectionner une date" : "Select a date"}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFr ? 'Source de l\'image' : 'Image Source'}
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input 
                      type="radio" 
                      name="imageSourceType" 
                      value="upload" 
                      checked={imageSourceType === 'upload'}
                      onChange={() => setImageSourceType('upload')}
                      className="text-primary focus:ring-primary cursor-pointer"
                    />
                    {isFr ? 'Télécharger' : 'Upload File'}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input 
                      type="radio" 
                      name="imageSourceType" 
                      value="url" 
                      checked={imageSourceType === 'url'}
                      onChange={() => setImageSourceType('url')}
                      className="text-primary focus:ring-primary cursor-pointer"
                    />
                    {isFr ? 'Lien de l\'image' : 'Image URL'}
                  </label>
                </div>

                {imageSourceType === 'upload' ? (
                  <ImageUpload 
                    folder="Equipments"
                    defaultImage={formData.image_url}
                    onUploadSuccess={(url) => setFormData({ ...formData, image_url: url, image_url_https: url, image: url })}
                    onUploadError={(error) => setErrorMessage(error)}
                  />
                ) : (
                  <input 
                    type="text" 
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value, image: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-... (Optional)" 
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                )}
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isFr ? 'Décrire les spécifications ou l\'affectation de l\'équipement' : 'Describe specifications or department assignment'} 
                  className="w-full h-20 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-border cursor-pointer">
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                {isEditing 
                  ? isFr ? 'Enregistrer les modifications' : 'Save Changes' 
                  : isFr ? 'Créer l\'équipement' : 'Create Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
