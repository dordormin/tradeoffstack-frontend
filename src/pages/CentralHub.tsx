import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { Logo } from '@/components/Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MonitorSmartphone, 
  ShieldAlert, 
  Users, 
  Coins, 
  Activity, 
  LogOut, 
  Settings, 
  User as UserIcon,
  Sparkles,
  ChevronRight,
  AppWindow
} from 'lucide-react';

export const CentralHub: React.FC = () => {
  const { user, logout, role } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isFr = language === 'fr';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
      icon: MonitorSmartphone,
      active: true,
      path: '/dashboard',
      gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      borderGlow: 'hover:border-blue-500/40 hover:shadow-blue-500/5',
      badge: isFr ? 'Actif' : 'Active',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      id: 'identity-manager',
      name: isFr ? 'Portail Identités' : 'Identity & Access',
      description: isFr
        ? 'Gestion des rôles, permissions de sécurité et annuaire centralisé.'
        : 'Secure identity access, single sign-on, and RBAC governance.',
      icon: Users,
      active: false,
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderGlow: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
      badge: isFr ? 'Bientôt disponible' : 'Coming Soon',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      id: 'finops-console',
      name: 'Cloud FinOps',
      description: isFr
        ? 'Optimisation des coûts d\'infrastructure et suivi des budgets cloud en temps réel.'
        : 'Cloud resource financial management, cost allocation, and anomaly detection.',
      icon: Coins,
      active: false,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderGlow: 'hover:border-emerald-500/30 hover:shadow-emerald-500/5',
      badge: isFr ? 'Bientôt disponible' : 'Coming Soon',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      id: 'security-hub',
      name: 'Security & Audit',
      description: isFr
        ? 'Rapports de conformité réglementaire, audits système et détection des menaces.'
        : 'Continuous compliance monitoring, log audits, and real-time security events.',
      icon: ShieldAlert,
      active: false,
      gradient: 'from-rose-500/10 via-red-500/5 to-transparent',
      borderGlow: 'hover:border-rose-500/30 hover:shadow-rose-500/5',
      badge: isFr ? 'Bientôt disponible' : 'Coming Soon',
      badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    },
    {
      id: 'network-monitor',
      name: 'Network Ops',
      description: isFr
        ? 'Supervision de la bande passante, latences et état de santé du serveur central.'
        : 'Bandwidth traffic insights, packet latencies, and main server health status.',
      icon: Activity,
      active: false,
      gradient: 'from-purple-500/10 via-violet-500/5 to-transparent',
      borderGlow: 'hover:border-purple-500/30 hover:shadow-purple-500/5',
      badge: isFr ? 'Bientôt disponible' : 'Coming Soon',
      badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
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

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-foreground">
              {user ? `${user.first_name} ${user.last_name || ''}`.trim() || user.email : 'User'}
            </div>
            <div className="text-xs text-muted-foreground">{role}</div>
          </div>
          
          <div className="relative">
            <Avatar className="cursor-pointer border border-border/80 hover:border-primary/50 transition-colors" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <AvatarImage src={user?.profile_image_url || ''} alt="@user" />
              <AvatarFallback className="bg-primary/20 text-primary font-medium">
                {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-lg z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <div className="text-sm font-medium text-foreground">
                      {user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </div>
                  
                  <button 
                    onClick={() => { navigate('/settings/profile'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/60 text-left transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-primary" />
                    {t('profileSettings')}
                  </button>
                  
                  <button 
                    onClick={() => { navigate('/settings/system'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/60 text-left transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-primary" />
                    {t('systemSettings')}
                  </button>

                  <div className="border-t border-border/60 my-1" />

                  <button 
                    onClick={() => { handleLogout(); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 text-left transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('signOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <AppWindow className="w-3.5 h-3.5" />
            {isFr ? 'Portail Central' : 'Central Hub'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            {isFr ? 'Portail Applications' : 'Application Central'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isFr 
              ? 'Bienvenue dans votre espace centralisé. Accédez à vos outils et services autorisés ci-dessous.'
              : 'Welcome to your workspace. Select any of your authorized tools and management hubs below.'}
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const IconComponent = app.icon;
            return (
              <Card 
                key={app.id} 
                onClick={() => app.active ? navigate(app.path!) : showMockToast(app.name)}
                className={`relative overflow-hidden border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-300 group ${app.borderGlow} cursor-pointer hover:-translate-y-1`}
              >
                {/* Visual gradient accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-40 transition-opacity duration-300 group-hover:opacity-60`} />

                <CardHeader className="relative pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-secondary/80 text-foreground border border-border/60 group-hover:text-primary transition-colors duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${app.badgeColor}`}>
                      {app.badge}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300 mt-4 flex items-center gap-1.5">
                    {app.name}
                    {app.active && (
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative">
                  <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                    {app.description}
                  </CardDescription>
                </CardContent>
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
