import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/LanguageContext';
import { Logo } from '@/components/Logo';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { 
  Cloud,
  LayoutDashboard, 
  KeySquare,
  Users,
  Grid,
  ChevronDown,
  Sparkles,
  Check,
  CreditCard
} from 'lucide-react';

export const SaaSLayout: React.FC = () => {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const isFr = language === 'fr';

  const navItems = [
    { label: isFr ? 'Tableau de bord' : 'Dashboard', path: '/saas', icon: LayoutDashboard, exact: true },
    { label: isFr ? 'Licences SaaS' : 'SaaS Licenses', path: '/saas/licenses', icon: KeySquare },
    { label: isFr ? 'Utilisateurs' : 'Users', path: '/saas/users', icon: Users },
    { label: isFr ? 'Facturation' : 'Billing', path: '/saas/billing', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-[260px] border-r bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <Logo />
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Back to Central Hub button */}
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-sky-500 hover:bg-sky-500/10 transition-colors border border-sky-500/10 mb-4 bg-sky-500/5"
          >
            <Grid className="w-4 h-4 text-sky-500" />
            <span>{isFr ? 'Accueil central' : 'Central Hub'}</span>
          </NavLink>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-sky-500/10 text-sky-500' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10 relative">
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-2 hover:bg-secondary px-2 py-1.5 rounded-md transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold leading-none">{isFr ? 'Gestion SaaS' : 'SaaS Mgmt'}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Workspace</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute left-0 mt-14 top-0 w-64 rounded-xl border border-border bg-card p-2 shadow-lg z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60 mb-1">
                    {isFr ? 'Mes Applications' : 'My Applications'}
                  </div>
                  
                  <button 
                    onClick={() => { navigate('/dashboard'); setSwitcherOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/60 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-primary" />
                      <span>{isFr ? 'Accueil central' : 'Central Hub'}</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => { navigate('/asset-portal'); setSwitcherOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/60 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                      <span>Asset Portal</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => { navigate('/saas'); setSwitcherOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-sky-500 font-medium bg-sky-500/5 hover:bg-sky-500/10 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-sky-500" />
                      <span>{isFr ? 'Gestion SaaS' : 'SaaS Mgmt'}</span>
                    </div>
                    <Check className="w-4 h-4 text-sky-500" />
                  </button>

                  <div className="border-t border-border/60 my-1" />
                  
                  <div className="px-3 py-1 text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{isFr ? 'Autres apps disponibles bientôt' : 'More apps coming soon'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <UserProfileDropdown />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background/50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
