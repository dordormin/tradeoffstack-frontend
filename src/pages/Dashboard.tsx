import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitorSmartphone, CalendarClock, Wrench, ShieldAlert, Plus, AlertCircle } from 'lucide-react';
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

        setStats({
          totalAssets,
          availableGear,
          activeReservations,
          criticalMaintenances,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFr ? 'Total Équipements' : 'Total Assets'}
            </CardTitle>
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalAssets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr ? 'Matériel actif enregistré' : 'Active hardware in database'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFr ? 'Équipements disponibles' : 'Available Gear'}
            </CardTitle>
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.availableGear}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalAssets > 0 
                ? isFr 
                  ? `${Math.round((stats.availableGear / stats.totalAssets) * 100)}% de l'inventaire total` 
                  : `${Math.round((stats.availableGear / stats.totalAssets) * 100)}% of total inventory` 
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFr ? 'Réservations Actives' : 'Active Reservations'}
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeReservations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr ? 'Actuellement assignés aux utilisateurs' : 'Currently checked out by users'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFr ? 'Maintenance Critique' : 'Critical Maintenance'}
            </CardTitle>
            <Wrench className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.criticalMaintenances}</div>
            <p className="text-xs text-muted-foreground mt-1 text-rose-500 font-medium">
              {isFr ? 'Nécessite une action immédiate' : 'Requires immediate action'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">
              {isFr ? 'Activité Récente' : 'Recent Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                {isFr ? 'Aucune activité récente trouvée.' : 'No recent activities found.'}
              </div>
            ) : (
              <div className="space-y-6">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className={`p-2 rounded-full bg-secondary ${activity.color || 'text-primary'}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.target} • <span className="font-medium">{activity.user}</span>
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links / Notifications */}
        <Card className="col-span-3 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">
              {isFr ? 'État du système' : 'System Health'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
             <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-500/10 animate-pulse">
                    <span className="text-2xl font-bold text-emerald-500">99%</span>
                  </div>
                </div>
             </div>
             <div>
                <h3 className="text-lg font-medium text-foreground">
                  {isFr ? 'Tous les systèmes sont opérationnels' : 'All Systems Operational'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isFr ? 'L\'API, la base de données et les serveurs fonctionnent normalement.' : 'API, Database, and Storage are running smoothly.'}
                </p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
