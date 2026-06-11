import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/LanguageContext';
import { Logo } from '@/components/Logo';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LifeBuoy, 
  ShoppingCart, 
  Briefcase, 
  Cloud, 
  Sparkles,
  ChevronRight,
  AppWindow
} from 'lucide-react';
import { AssetPortalIcon } from '@/components/AssetPortalIcon';

export const CentralHub: React.FC = () => {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isFr = language === 'fr';

  const showMockToast = (appName: string) => {
    const message = isFr 
      ? `L'application "${appName}" est en cours de développement et sera disponible prochainement.`
      : `The "${appName}" application is under development and will be available soon.`;
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // List of applications in the Central Hub
  const apps = [
    {
      id: 'asset-portal',
      name: 'Asset Portal',
      description: isFr 
        ? 'Gestion complète du parc informatique, inventaire et réservations de matériel.'
        : 'End-to-end IT hardware management, real-time inventory, and reservations.',
      icon: (props: any) => <AssetPortalIcon showWrapper={false} {...props} />,
      active: true,
      path: '/asset-portal',
      gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      borderGlow: 'hover:border-blue-500/40 hover:shadow-blue-500/5',
      badge: isFr ? 'Actif' : 'Active',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      id: 'saas-manager',
      name: isFr ? 'Gestion SaaS & Licences' : 'SaaS & License Mgmt',
      description: isFr
        ? 'Suivi des licences logicielles, optimisation des abonnements et gestion des accès cloud.'
        : 'Track software licenses, optimize cloud subscriptions, and monitor seat utilization.',
      icon: Cloud,
      active: true,
      path: '/saas',
      gradient: 'from-sky-500/10 via-cyan-500/5 to-transparent',
      borderGlow: 'hover:border-sky-500/30 hover:shadow-sky-500/5',
      badge: isFr ? 'Nouveau' : 'New',
      badgeColor: 'bg-sky-500/10 text-sky-500 border-sky-500/20'
    },
    {
      id: 'help-desk',
      name: isFr ? 'Support & Help Desk' : 'IT Help Desk',
      description: isFr
        ? 'Création de tickets de support, assistance technique et résolution des incidents.'
        : 'Create support tickets, technical assistance, and incident resolution tracking.',
      icon: LifeBuoy,
      active: true,
      path: '/helpdesk',
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderGlow: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
      badge: isFr ? 'Nouveau' : 'New',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      id: 'procurement',
      name: isFr ? 'Achats & Fournisseurs' : 'Procurement',
      description: isFr
        ? 'Gestion des bons de commande, évaluation des fournisseurs et remboursements de frais.'
        : 'Manage purchase orders, vendor evaluation, and expense reimbursements.',
      icon: ShoppingCart,
      active: true,
      path: '/procurement',
      gradient: 'from-purple-500/10 via-fuchsia-500/5 to-transparent',
      borderGlow: 'hover:border-purple-500/30 hover:shadow-purple-500/5',
      badge: isFr ? 'Nouveau' : 'New',
      badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    },
    {
      id: 'hr-onboarding',
      name: isFr ? 'Portail RH & Onboarding' : 'HR & Onboarding',
      description: isFr
        ? 'Annuaire de l\'entreprise, organigrammes et suivi des arrivées/départs des employés.'
        : 'Company directory, org charts, and employee onboarding/offboarding workflows.',
      icon: Briefcase,
      active: true,
      path: '/hr',
      gradient: 'from-rose-500/10 via-red-500/5 to-transparent',
      borderGlow: 'hover:border-rose-500/30 hover:shadow-rose-500/5',
      badge: isFr ? 'Nouveau' : 'New',
      badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.22),rgba(15,15,20,0))] flex flex-col">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-card/90 backdrop-blur border border-border px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 max-w-sm">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-foreground">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-border/40 bg-background/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
            Hub Portal
          </span>
        </div>

        <UserProfileDropdown />
      </header>

      {/* Hero Banner */}
      <div className="relative w-full h-[320px] lg:h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
        <img src="/jetbrains_mosaic.png" alt="Hero Background" className="w-full h-full object-cover object-center opacity-60" />
        
        <div className="absolute inset-0 flex flex-col justify-center items-center z-20 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-background/50 backdrop-blur-md text-foreground border border-border/60 mb-4 shadow-xl">
            <AppWindow className="w-3.5 h-3.5 text-primary" />
            {isFr ? 'Portail Central' : 'Central Hub'}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4 text-center font-outfit drop-shadow-xl">
            {isFr ? 'Enterprise Hub' : 'Application Central'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl text-center drop-shadow-md">
            {isFr 
              ? 'Bienvenue dans votre espace centralisé. Accédez à vos outils et services autorisés ci-dessous.'
              : 'Welcome to your workspace. Select any of your authorized tools and management hubs below.'}
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 pb-12 -mt-16 relative z-30">
        {/* Apps Bento Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const IconComponent = app.icon;
            const isMainApp = app.id === 'asset-portal';
            
            return (
              <Card 
                key={app.id} 
                onClick={() => app.active ? navigate(app.path!) : showMockToast(app.name)}
                className={`relative overflow-hidden border border-border/80 bg-card/80 backdrop-blur-xl shadow-xl transition-all duration-300 group ${app.borderGlow} cursor-pointer hover:-translate-y-1 hover:shadow-2xl ${isMainApp ? 'sm:col-span-2 lg:col-span-2 min-h-[220px]' : ''}`}
              >
                {/* Visual gradient accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-40 transition-opacity duration-300 group-hover:opacity-70 pointer-events-none`} />

                <CardHeader className="relative pb-2 z-10 h-full flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="p-4 rounded-2xl bg-secondary/80 text-foreground border border-border/60 group-hover:text-primary transition-colors duration-300 shadow-sm">
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${app.badgeColor} shadow-sm bg-background/50 backdrop-blur-sm`}>
                      {app.badge}
                    </span>
                  </div>
                  <div className="mt-auto pt-6">
                    <CardTitle className={`font-semibold text-foreground group-hover:text-primary transition-colors duration-300 flex items-center gap-1.5 ${isMainApp ? 'text-3xl' : 'text-xl'}`}>
                      {app.name}
                      {app.active && (
                        <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      )}
                    </CardTitle>
                    <CardDescription className={`text-muted-foreground leading-relaxed mt-2 ${isMainApp ? 'text-base max-w-md' : 'text-sm'}`}>
                      {app.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border/40 text-center text-xs text-muted-foreground space-y-1">
        <p>© 2026 TradeOffStack. All rights reserved. Suite v2.0.</p>
        <p className="font-medium text-primary/80">{isFr ? 'Fait par Dordor Minetdi' : 'Made by Dordor Minetdi'}</p>
      </footer>
    </div>
  );
};
