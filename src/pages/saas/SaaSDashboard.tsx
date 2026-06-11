import React from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cloud, CheckCircle, DollarSign, AlertTriangle } from 'lucide-react';
import { saasApi, type SaaSSubscription, type SaaSAssignment } from '@/api/saas';
import { StatCard } from '@/components/StatCard';
import { DataFetcher } from '@/components/DataFetcher';


interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  totalSpend: number;
  unassignedSeats: number;
  costByProvider: { name: string; spend: number }[];
}

const fetchDashboardData = async () => {
  const [subs, assignments] = await Promise.all([
    saasApi.getSubscriptions(),
    saasApi.getAllAssignments()
  ]);
  return { subs, assignments };
};

export const SaaSDashboard: React.FC = () => {
  const { language } = useTranslation();
  const isFr = language === 'fr';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{isFr ? 'Aperçu SaaS & Licences' : 'SaaS & Licenses Overview'}</h1>
        <p className="text-muted-foreground">{isFr ? 'Suivez vos dépenses et l\'utilisation de vos abonnements cloud.' : 'Track your spend and cloud subscription utilization.'}</p>
      </div>

      <DataFetcher fetchFn={fetchDashboardData}>
        {({ data, loading, error }) => {
          let stats: DashboardStats = { totalLicenses: 0, activeLicenses: 0, totalSpend: 0, unassignedSeats: 0, costByProvider: [] };
          let maxSpend = 1;

          if (data) {
            const { subs, assignments } = data;
            let spend = 0;
            const providerSpend: Record<string, number> = {};
            let unassigned = 0;

            subs.forEach((sub: SaaSSubscription) => {
              if (sub.status === 'Active') {
                const multiplier = sub.billing_cycle === 'Yearly' ? 1 : 12;
                const subSpend = sub.cost_per_seat * sub.total_seats * multiplier;
                spend += subSpend;
                const name = sub.provider?.name || sub.plan_name;
                providerSpend[name] = (providerSpend[name] || 0) + subSpend;
                const assigned = assignments.filter((a: SaaSAssignment) => a.is_active && a.subscription_id === sub.id).length;
                unassigned += Math.max(0, sub.total_seats - assigned);
              }
            });

            stats = {
              totalLicenses: subs.length,
              activeLicenses: assignments.filter((a: SaaSAssignment) => a.is_active).length,
              totalSpend: spend,
              unassignedSeats: unassigned,
              costByProvider: Object.entries(providerSpend).map(([name, s]) => ({ name, spend: s })).sort((a, b) => b.spend - a.spend)
            };
            maxSpend = stats.costByProvider[0]?.spend || 1;
          }

          if (error) {
            return (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{isFr ? 'Erreur lors du chargement des statistiques.' : 'Error loading dashboard statistics.'}</span>
              </div>
            );
          }

          return (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard>
                  <StatCard.Header icon={<DollarSign className="h-5 w-5" />} iconColor="emerald" title={isFr ? 'Total Dépenses Annuelles' : 'Total Annual Spend'} />
                  <StatCard.Value value={loading ? '...' : `$${stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                </StatCard>
                <StatCard>
                  <StatCard.Header icon={<Cloud className="h-5 w-5" />} iconColor="sky" title={isFr ? 'Abonnements Gérés' : 'Managed Subscriptions'} />
                  <StatCard.Value value={loading ? '...' : stats.totalLicenses} />
                </StatCard>
                <StatCard>
                  <StatCard.Header icon={<CheckCircle className="h-5 w-5" />} iconColor="amber" title={isFr ? 'Licences Actives' : 'Active Licenses'} />
                  <StatCard.Value value={loading ? '...' : stats.activeLicenses} />
                </StatCard>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card/50 backdrop-blur border-sky-500/10">
                  <CardHeader>
                    <CardTitle>{isFr ? 'Dépenses par Fournisseur' : 'Spend by Provider'}</CardTitle>
                    <CardDescription>{isFr ? 'Répartition annuelle des coûts' : 'Annual cost distribution'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 min-h-[300px]">
                    {loading ? <p className="text-muted-foreground text-sm">...</p> : stats.costByProvider.length === 0 ? (
                      <p className="text-muted-foreground text-sm flex items-center gap-2"><Cloud className="w-4 h-4" />{isFr ? 'Aucun abonnement actif' : 'No active subscriptions'}</p>
                    ) : stats.costByProvider.map(item => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.name}</span>
                          <span className="font-mono text-muted-foreground">${item.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(item.spend / maxSpend) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="col-span-3 bg-card/50 backdrop-blur border-sky-500/10">
                  <CardHeader>
                    <CardTitle>{isFr ? 'Optimisation' : 'Optimization'}</CardTitle>
                    <CardDescription>{isFr ? 'Sièges non assignés' : 'Unassigned seats'}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center min-h-[300px] gap-3">
                    {loading ? <p className="text-muted-foreground text-sm">...</p> : stats.unassignedSeats === 0 ? (
                      <p className="text-muted-foreground text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-sky-500" />{isFr ? 'Toutes les licences sont optimisées' : 'All licenses optimized'}</p>
                    ) : (
                      <>
                        <div className="text-4xl font-bold text-amber-500">{stats.unassignedSeats}</div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />{isFr ? 'sièges payés mais non assignés' : 'paid seats not assigned'}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          );
        }}
      </DataFetcher>
    </div>
  );
};

