import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitorSmartphone, CalendarClock, Wrench, ShieldAlert, Plus, AlertCircle, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { apiClient } from '@/api/apiClient';
import type { Equipment, Reservation, MaintenanceRequest, AuditLog } from '@/types';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalAssets: number;
  availableGear: number;
  activeReservations: number;
  criticalMaintenances: number;
  totalBookValue: number;
  totalPurchaseValue: number;
  pendingApprovals: number;
}

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  user: string;
  time: string;
  icon: any;
  color?: string;
}

export const Dashboard: React.FC = () => {
  const { role } = useAuth();
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    availableGear: 0,
    activeReservations: 0,
    criticalMaintenances: 0,
    totalBookValue: 0,
    totalPurchaseValue: 0,
    pendingApprovals: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return isFr ? 'À l\'instant' : 'Just now';
      if (diffMins < 60) return isFr ? `Il y a ${diffMins}m` : `${diffMins}m ago`;
      if (diffHours < 24) return isFr ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
      return isFr ? `Il y a ${diffDays}j` : `${diffDays}d ago`;
    } catch {
      return isFr ? 'Récemment' : 'Recent';
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [equipRes, reserveRes, maintRes] = await Promise.all([
          apiClient.get<Equipment[]>('/equipment').catch(() => ({ data: [] })),
          apiClient.get<Reservation[]>('/reservation').catch(() => ({ data: [] })),
          apiClient.get<MaintenanceRequest[]>('/maintenancerequest').catch(() => ({ data: [] })),
        ]);

        const equipments = equipRes.data || [];
        const reservations = reserveRes.data || [];
        const maintenances = maintRes.data || [];

        const totalAssets = equipments.length;
        const availableGear = equipments.filter(e => e.status === 'Available').length;
        const activeReservations = reservations.filter(r => r.status === 'Active').length;
        const criticalMaintenances = maintenances.filter(
          m => m.priority === 'Critical' && m.status !== 'Completed' && m.status !== 'Cancelled'
        ).length;

        const totalPurchaseValue = equipments.reduce((sum, e) => sum + (e.price || 0), 0);
        const totalBookValue = equipments.reduce((sum, e) => sum + (e.current_book_value ?? e.price ?? 0), 0);
        const pendingApprovals = reservations.filter(r => r.status === 'Pending').length;

        setStats({
          totalAssets,
          availableGear,
          activeReservations,
          criticalMaintenances,
          totalBookValue,
          totalPurchaseValue,
          pendingApprovals,
        });

        const equipMap = new Map(equipments.map(e => [e.id, e.name]));

        if (role === 'Admin') {
          try {
            const auditRes = await apiClient.get<AuditLog[]>('/auditlog');
            const logs = auditRes.data || [];
            const mapped: ActivityItem[] = logs.slice(0, 5).map(log => {
              let actionLabel = `${log.entity_type} ${log.action}`;
              let targetLabel = log.entity_id;
              
              if (log.entity_type === 'Equipment') {
                targetLabel = equipMap.get(log.entity_id) || `Équipement ID: ${log.entity_id.slice(0, 8)}`;
                if (isFr) {
                  actionLabel = log.action === 'Created' ? 'Nouvel équipement créé' : log.action === 'Updated' ? 'Équipement mis à jour' : 'Équipement supprimé';
                } else {
                  actionLabel = log.action === 'Created' ? 'New Asset Added' : log.action === 'Updated' ? 'Asset Updated' : 'Asset Removed';
                }
              } else if (log.entity_type === 'Reservation') {
                if (isFr) {
                  actionLabel = log.action === 'Created' ? 'Réservation demandée' : log.action === 'Updated' ? 'Réservation modifiée' : 'Réservation annulée';
                } else {
                  actionLabel = log.action === 'Created' ? 'Reservation Request' : log.action === 'Updated' ? 'Reservation Modified' : 'Reservation Cancelled';
                }
              } else if (log.entity_type === 'MaintenanceRequest') {
                if (isFr) {
                  actionLabel = log.action === 'Created' ? 'Maintenance ouverte' : log.action === 'Updated' ? 'Maintenance mise à jour' : 'Demande de maintenance';
                } else {
                  actionLabel = log.action === 'Created' ? 'Maintenance Opened' : log.action === 'Updated' ? 'Maintenance Updated' : 'Maintenance Request';
                }
              }

              const userName = log.performed_by 
                ? `${log.performed_by.first_name} ${log.performed_by.last_name}` 
                : 'System Admin';

              let icon = MonitorSmartphone;
              let color = 'text-primary';
              if (log.action === 'Created') {
                icon = Plus;
                color = 'text-emerald-500';
              } else if (log.action === 'Deleted') {
                icon = ShieldAlert;
                color = 'text-rose-500';
              } else {
                icon = Wrench;
                color = 'text-amber-500';
              }

              return {
                id: log.id,
                action: actionLabel,
                target: targetLabel,
                user: userName,
                time: formatTime(log.performed_at),
                icon,
                color,
              };
            });
            setActivities(mapped);
          } catch {
            setActivities([]);
          }
        } else {
          const recentList: ActivityItem[] = [];
          
          reservations.slice(0, 3).forEach(r => {
            recentList.push({
              id: r.id,
              action: isFr ? 'Matériel assigné' : 'Equipment Assigned',
              target: r.equipment?.name || equipMap.get(r.equipment_id) || 'IT Asset',
              user: r.user ? `${r.user.first_name} ${r.user.last_name}` : 'Employee',
              time: formatTime(r.created_at || new Date().toISOString()),
              icon: CalendarClock,
              color: 'text-blue-500',
            });
          });

          maintenances.slice(0, 2).forEach(m => {
            recentList.push({
              id: m.id,
              action: isFr ? 'Ticket de maintenance' : 'Maintenance Ticket',
              target: m.equipment?.name || equipMap.get(m.equipment_id) || 'IT Asset',
              user: m.requested_by ? `${m.requested_by.first_name} ${m.requested_by.last_name}` : 'Requester',
              time: formatTime(m.created_at || new Date().toISOString()),
              icon: AlertCircle,
              color: m.priority === 'Critical' ? 'text-rose-500' : 'text-amber-500',
            });
          });

          setActivities(recentList.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5));
        }

      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [role, language]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground animate-pulse">
          {isFr ? 'Chargement des statistiques...' : 'Loading dashboard metrics...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isFr ? 'Tableau de bord' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? 'Aperçu général de la gestion de votre parc informatique.' : 'Overview of your IT Asset Management environment.'}
          </p>
        </div>
        <div className="flex gap-3">
          {role === 'Employee' && (
            <>
              <Button onClick={() => navigate('/my-gear')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                {isFr ? 'Demander un équipement' : 'Request Asset'}
              </Button>
              <Button onClick={() => navigate('/maintenance')} variant="outline" className="border-border hover:bg-secondary">
                <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                {isFr ? 'Signaler un problème' : 'Report Issue'}
              </Button>
            </>
          )}
          {(role === 'Admin' || role === 'Manager') && (
            <Button onClick={() => navigate('/inventory')} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              {isFr ? 'Gérer l\'inventaire' : 'Manage Inventory'}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-sm transition-all duration-300 group hover:border-indigo-500/30 hover:shadow-indigo-500/5 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {isFr ? 'Total Équipements' : 'Total Assets'}
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <MonitorSmartphone className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground font-outfit">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr ? 'Matériel actif enregistré' : 'Active hardware in database'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-sm transition-all duration-300 group hover:border-emerald-500/30 hover:shadow-emerald-500/5 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {isFr ? 'Équipements disponibles' : 'Available Gear'}
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <div className="h-3 w-3 rounded-full bg-current shadow-[0_0_10px_currentColor]"></div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground font-outfit">{stats.availableGear}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalAssets > 0 
                ? isFr 
                  ? `${Math.round((stats.availableGear / stats.totalAssets) * 100)}% de l'inventaire total` 
                  : `${Math.round((stats.availableGear / stats.totalAssets) * 100)}% of total inventory` 
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-sm transition-all duration-300 group hover:border-blue-500/30 hover:shadow-blue-500/5 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {isFr ? 'Réservations Actives' : 'Active Reservations'}
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <CalendarClock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground font-outfit">{stats.activeReservations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr ? 'Actuellement assignés aux utilisateurs' : 'Currently checked out by users'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-sm transition-all duration-300 group hover:border-rose-500/30 hover:shadow-rose-500/5 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {isFr ? 'Maintenance Critique' : 'Critical Maintenance'}
            </CardTitle>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground font-outfit">{stats.criticalMaintenances}</div>
            <p className="text-xs text-rose-500/80 mt-1 font-medium group-hover:text-rose-500 transition-colors">
              {isFr ? 'Nécessite une action immédiate' : 'Requires immediate action'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-sm transition-all duration-300 group hover:border-violet-500/30 hover:shadow-violet-500/5 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {isFr ? 'Valeur Nette du Parc' : 'Total Book Value'}
            </CardTitle>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-colors">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground font-outfit">${stats.totalBookValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr ? 'Valeur comptable après amortissement' : 'Net value after depreciation'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-sm transition-all duration-300 group hover:border-amber-500/30 hover:shadow-amber-500/5 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {isFr ? 'Approbations Requises' : 'Pending Approvals'}
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-foreground font-outfit">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr ? 'Réservations en attente d\'examen' : 'Reservations awaiting review'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4 relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <CardHeader className="relative z-10 border-b border-border/40 pb-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              {isFr ? 'Activité Récente' : 'Recent Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 pt-6">
            {activities.length === 0 ? (
              <div className="text-sm text-muted-foreground py-12 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-xl bg-secondary/20">
                <Activity className="w-8 h-8 text-muted-foreground/30 mb-3" />
                {isFr ? 'Aucune activité récente trouvée.' : 'No recent activities found.'}
              </div>
            ) : (
              <div className="space-y-6">
                {activities.map((activity, i) => (
                  <div key={activity.id} className="flex items-start gap-4 group">
                    <div className="relative mt-1">
                      <div className={`p-2.5 rounded-xl bg-background border border-border shadow-sm relative z-10 group-hover:scale-110 transition-transform ${activity.color || 'text-primary'}`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      {i !== activities.length - 1 && (
                        <div className="absolute top-10 bottom-[-24px] left-1/2 w-px bg-border/60 -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5 py-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{activity.action}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.target} <span className="opacity-50 mx-1">•</span> <span className="font-medium text-foreground/80">{activity.user}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links / Notifications */}
        <Card className="col-span-3 relative overflow-hidden bg-card/60 backdrop-blur-md border border-border/80 shadow-sm group hover:border-emerald-500/30 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          <CardHeader className="relative z-10 border-b border-border/40 pb-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
              </div>
              {isFr ? 'État du système' : 'System Health'}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-col items-center justify-center h-[320px] text-center space-y-6">
             <div className="relative group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                <div className="w-32 h-32 rounded-full border border-emerald-500/30 flex items-center justify-center relative bg-background/50 backdrop-blur-sm">
                  <div className="w-24 h-24 rounded-full border-[6px] border-emerald-500 flex items-center justify-center bg-card shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]">
                    <span className="text-3xl font-bold text-emerald-500 font-outfit">99<span className="text-lg opacity-70">%</span></span>
                  </div>
                </div>
             </div>
             <div>
                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                  {isFr ? 'Tous les systèmes sont opérationnels' : 'All Systems Operational'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[200px] mx-auto leading-relaxed">
                  {isFr ? 'L\'API, la base de données et les serveurs fonctionnent normalement.' : 'API, Database, and Storage are running smoothly.'}
                </p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
