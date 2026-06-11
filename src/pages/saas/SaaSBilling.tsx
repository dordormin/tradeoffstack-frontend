import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { CreditCard, DollarSign, Download, CalendarDays, Receipt } from 'lucide-react';
import { saasApi, type SaaSSubscription } from '@/api/saas';

export const SaaSBilling: React.FC = () => {
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const [subscriptions, setSubscriptions] = useState<SaaSSubscription[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subs, assigns] = await Promise.all([saasApi.getSubscriptions(), saasApi.getAllAssignments()]);
        setSubscriptions(subs);
        setAssignments(assigns);
      } catch (error) {
        console.error('Error fetching subscriptions', error);
      }
    };
    fetchData();
  }, []);

  const totalMonthlySpend = subscriptions.reduce((acc, sub) => {
    if (sub.status === 'Active') {
      const multiplier = sub.billing_cycle === 'Yearly' ? 1 / 12 : 1;
      return acc + sub.cost_per_seat * sub.total_seats * multiplier;
    }
    return acc;
  }, 0);

  const savingsPotential = subscriptions.reduce((acc, sub) => {
    if (sub.status !== 'Active') return acc;
    const assigned = assignments.filter(a => a.is_active && a.subscription_id === sub.id).length;
    const unused = Math.max(0, sub.total_seats - assigned);
    const monthlyCost = sub.billing_cycle === 'Yearly' ? sub.cost_per_seat / 12 : sub.cost_per_seat;
    return acc + unused * monthlyCost;
  }, 0);

  const upcomingRenewals = subscriptions
    .filter(sub => sub.status === 'Active' && sub.renewal_date)
    .map(sub => {
      const daysUntil = Math.floor((new Date(sub.renewal_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { id: sub.id, provider: sub.provider?.name || sub.plan_name, date: sub.renewal_date!, amount: sub.cost_per_seat * sub.total_seats, status: daysUntil <= 30 ? 'warning' : 'normal', daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const renewalsNext30Days = upcomingRenewals.filter(r => r.daysUntil <= 30 && r.daysUntil >= 0).reduce((acc, r) => acc + r.amount, 0);

  const chartData = subscriptions
    .filter(s => s.status === 'Active')
    .map(sub => ({
      name: sub.provider?.name || sub.plan_name,
      spend: (sub.billing_cycle === 'Yearly' ? sub.cost_per_seat * sub.total_seats / 12 : sub.cost_per_seat * sub.total_seats)
    }))
    .sort((a, b) => b.spend - a.spend);

  const maxChart = chartData[0]?.spend || 1;

  const handleExportCSV = () => {
    const headers = [isFr ? 'Fournisseur / Plan' : 'Provider / Plan', isFr ? 'Montant' : 'Amount', isFr ? 'Date de renouvellement' : 'Renewal Date', isFr ? 'Jours restants' : 'Days Until'];
    const rows = upcomingRenewals.map(r => [r.provider, r.amount.toString(), new Date(r.date).toLocaleDateString(), r.daysUntil.toString()]);
    const blob = new Blob([[headers.join(','), ...rows.map(e => e.join(','))].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'saas_renewals_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-sky-500" />
            {isFr ? 'Facturation & Renouvellements' : 'Billing & Renewals'}
          </h1>
          <p className="text-muted-foreground mt-1">{isFr ? 'Suivez vos dépenses mensuelles et anticipez les renouvellements SaaS.' : 'Track monthly spend and anticipate SaaS renewals.'}</p>
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer">
          <Download className="w-4 h-4" />{isFr ? 'Exporter Rapport' : 'Export Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-sky-500" />{isFr ? 'Dépense Mensuelle' : 'Monthly Spend'}</h3>
          <div className="text-3xl font-bold">${totalMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2"><CalendarDays className="w-4 h-4 text-amber-500" />{isFr ? 'Renouvellements (30j)' : 'Renewals (30d)'}</h3>
          <div className="text-3xl font-bold">${renewalsNext30Days.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2"><Receipt className="w-4 h-4 text-indigo-500" />{isFr ? 'Potentiel d\'Économie' : 'Savings Potential'}</h3>
          <div className="text-3xl font-bold">${savingsPotential.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <p className="text-xs text-muted-foreground mt-1">{isFr ? 'Sièges inutilisés / mois' : 'Unused seats / month'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-6">{isFr ? 'Coûts Mensuels par Application' : 'Monthly Cost by Application'}</h3>
          <div className="space-y-4">
            {chartData.length === 0 ? (
              <p className="text-muted-foreground text-sm">{isFr ? 'Aucune donnée' : 'No data'}</p>
            ) : chartData.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{item.name}</span><span className="font-mono">${item.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500/80 rounded-full" style={{ width: `${(item.spend / maxChart) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-foreground mb-4">{isFr ? 'Prochains Renouvellements' : 'Upcoming Renewals'}</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isFr ? 'Aucun renouvellement planifié' : 'No scheduled renewals'}</p>
            ) : upcomingRenewals.map(renewal => (
              <div key={renewal.id} className="p-3 border border-border rounded-lg bg-background">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-sm">{renewal.provider}</div>
                  <div className="font-bold text-sm">${renewal.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CalendarDays className={`w-3.5 h-3.5 ${renewal.status === 'warning' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <span className={renewal.status === 'warning' ? 'text-amber-500 font-medium' : 'text-muted-foreground'}>
                    {new Date(renewal.date).toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
