import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/api/apiClient';
import { ShieldAlert, Users, Search, Filter, Mail, KeySquare, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { saasApi, type SaaSAssignment } from '@/api/saas';
import { StatCard } from '@/components/StatCard';

export const SaaSUsers: React.FC = () => {
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const { error, success } = useToast();

  const [assignments, setAssignments] = useState<SaaSAssignment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignData, usersData, subsData] = await Promise.all([
        saasApi.getAllAssignments(),
        apiClient.get('/user').then(res => res.data),
        saasApi.getSubscriptions()
      ]);
      setAssignments(assignData || []);
      setUsers(usersData || []);
      setSubscriptions(subsData || []);
    } catch {
      error(isFr ? 'Erreur lors du chargement des données SaaS' : 'Error fetching SaaS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManageAccess = (userData: any) => {
    setSelectedUserData(userData);
    setIsAssigning(false);
    setSelectedSubId('');
    setIsModalOpen(true);
  };

  const handleRevoke = async (assignmentId: string) => {
    if (!window.confirm(isFr ? 'Révoquer cet accès ?' : 'Revoke this access?')) return;
    try {
      await saasApi.unassignUser(assignmentId);
      await loadData();
      success(isFr ? 'Accès révoqué avec succès.' : 'Access revoked successfully.');
      setSelectedUserData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          assignments: prev.assignments.filter((a: any) => a.id !== assignmentId),
          appCount: prev.appCount - 1
        };
      });
    } catch (err: any) {
      error(err.response?.data?.message || 'Error revoking access');
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedSubId || !selectedUserData) return;
    try {
      await saasApi.assignUser({
        user_id: selectedUserData.user.id,
        subscription_id: selectedSubId
      });
      await loadData();
      success(isFr ? 'Application assignée avec succès.' : 'Application assigned successfully.');
      setIsModalOpen(false);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error assigning application');
    }
  };

  const activeUsersCount = new Set(assignments.filter(a => a.is_active).map(a => a.user_id)).size;

  const totalUnusedSeats = subscriptions.reduce((acc, sub) => {
    if (sub.status !== 'Active') return acc;
    const assigned = assignments.filter(a => a.is_active && a.subscription_id === sub.id).length;
    return acc + Math.max(0, sub.total_seats - assigned);
  }, 0);

  const usersWithoutAccess = users.filter(
    u => !assignments.some(a => a.is_active && a.user_id === u.id)
  ).length;

  const usersMap = users.reduce((acc, user) => {
    acc[user.id] = { user, appCount: 0, lastActive: null, assignments: [] };
    return acc;
  }, {} as Record<string, any>);

  assignments.forEach(assignment => {
    if (usersMap[assignment.user_id]) {
      usersMap[assignment.user_id].appCount += 1;
      usersMap[assignment.user_id].assignments.push(assignment);
      if (!usersMap[assignment.user_id].lastActive || (assignment.last_login_date && new Date(assignment.last_login_date) > new Date(usersMap[assignment.user_id].lastActive))) {
        usersMap[assignment.user_id].lastActive = assignment.last_login_date;
      }
    }
  });

  const usersList = Object.values(usersMap).filter((data: any) => {
    if (!search) return true;
    const user = data.user;
    const name = `${user.first_name || ''} ${user.last_name || ''} ${user.email || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const availableSubscriptions = subscriptions.filter(sub =>
    !selectedUserData?.assignments.some((a: any) => a.subscription_id === sub.id)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-500" />
            {isFr ? 'Utilisateurs & Accès SaaS' : 'SaaS Users & Access'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? 'Gérez les assignations de licences et analysez le Shadow IT.' : 'Manage license assignments and monitor Shadow IT.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard>
          <StatCard.Header icon={<Users className="w-5 h-5" />} iconColor="sky" title={isFr ? 'Utilisateurs Actifs' : 'Active Users'} />
          <StatCard.Value value={activeUsersCount} />
        </StatCard>

        <StatCard>
          <StatCard.Header icon={<ShieldAlert className="w-5 h-5" />} iconColor="amber" title={isFr ? 'Sans accès SaaS' : 'Without SaaS Access'} />
          <StatCard.Value value={usersWithoutAccess} />
        </StatCard>

        <StatCard>
          <StatCard.Header icon={<KeySquare className="w-5 h-5" />} iconColor="emerald" title={isFr ? 'Sièges Inutilisés' : 'Unused Seats'} />
          <StatCard.Value value={totalUnusedSeats} />
        </StatCard>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isFr ? 'Rechercher un utilisateur...' : 'Search user...'}
              className="pl-9 bg-background"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-secondary transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            {isFr ? 'Filtres' : 'Filters'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">{isFr ? 'Utilisateur' : 'User'}</th>
                <th className="px-4 py-3">{isFr ? 'Département' : 'Department'}</th>
                <th className="px-4 py-3">{isFr ? 'Apps Assignées' : 'Assigned Apps'}</th>
                <th className="px-4 py-3">{isFr ? 'Dernière Activité' : 'Last Activity'}</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Loading...</td></tr>
              ) : usersList.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No users found.</td></tr>
              ) : usersList.map((data: any, idx) => {
                const user = data.user || { first_name: 'Unknown', last_name: '', email: 'unknown' };
                const name = `${user.first_name} ${user.last_name}`.trim() || user.email;
                return (
                <tr key={idx} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                      {user.department_id ? 'IT Department' : 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{data.appCount}</span>
                      <span className="text-xs text-muted-foreground">apps</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {data.lastActive ? new Date(data.lastActive).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleManageAccess(data)}
                      className="text-sky-500 hover:text-sky-600 font-medium text-xs border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 px-2 py-1.5 rounded transition-colors cursor-pointer"
                    >
                      {isFr ? 'Gérer les Accès' : 'Manage Access'}
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              {isFr ? 'Gérer les Accès' : 'Manage Access'}
            </DialogTitle>
            <DialogDescription>
              {selectedUserData && `${selectedUserData.user.first_name} ${selectedUserData.user.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-foreground border-b pb-2">
              {isFr ? 'Applications Assignées' : 'Assigned Applications'}
            </h4>
            {selectedUserData?.assignments.map((assignment: SaaSAssignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{assignment.subscription?.plan_name || 'Application'}</span>
                  <span className="text-xs text-muted-foreground">
                    {isFr ? 'Assigné le ' : 'Assigned on '}
                    {new Date(assignment.assigned_date).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRevoke(assignment.id)}
                  className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  {isFr ? 'Révoquer' : 'Revoke'}
                </button>
              </div>
            ))}

            {selectedUserData?.assignments.length === 0 && (
              <p className="text-sm text-muted-foreground">{isFr ? 'Aucune application assignée.' : 'No assigned applications.'}</p>
            )}

            {!isAssigning ? (
              <button
                onClick={() => setIsAssigning(true)}
                className="w-full mt-2 py-2 border border-dashed border-sky-500/50 text-sky-500 rounded-lg text-sm hover:bg-sky-500/5 transition-colors cursor-pointer"
              >
                + {isFr ? 'Assigner une nouvelle application' : 'Assign new application'}
              </button>
            ) : (
              <div className="mt-4 p-3 border border-border rounded-lg bg-muted/20 space-y-3">
                <h5 className="text-xs font-semibold uppercase text-muted-foreground">
                  {isFr ? 'Sélectionner l\'application' : 'Select Application'}
                </h5>
                <select
                  className="w-full px-3 py-2 text-sm rounded border border-border bg-background focus:outline-none focus:border-sky-500 transition-colors"
                  value={selectedSubId}
                  onChange={e => setSelectedSubId(e.target.value)}
                >
                  <option value="">{isFr ? '-- Choisir --' : '-- Choose --'}</option>
                  {availableSubscriptions.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.plan_name} ({sub.provider?.name || 'SaaS'})</option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => { setIsAssigning(false); setSelectedSubId(''); }}
                    className="px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-background transition-colors cursor-pointer"
                  >
                    {isFr ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleAssignSubmit}
                    disabled={!selectedSubId}
                    className="px-3 py-1.5 text-xs font-medium bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isFr ? 'Confirmer' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
