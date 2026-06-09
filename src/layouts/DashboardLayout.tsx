import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { 
  LayoutDashboard, 
  MonitorSmartphone, 
  CalendarClock, 
  Wrench, 
  Users, 
  Building2, 
  ShieldAlert, 
  LogOut,
  Settings,
  User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const DashboardLayout: React.FC = () => {
  const { role, user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { labelKey: 'dashboard' as const, path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Employee'] },
    { labelKey: 'inventory' as const, path: '/inventory', icon: MonitorSmartphone, roles: ['Admin', 'Manager'] },
    { labelKey: 'myGear' as const, path: '/my-gear', icon: MonitorSmartphone, roles: ['Employee'] },
    { labelKey: 'reservations' as const, path: '/reservations', icon: CalendarClock, roles: ['Admin', 'Manager', 'Employee'] },
    { labelKey: 'maintenance' as const, path: '/maintenance', icon: Wrench, roles: ['Admin', 'Manager', 'Employee'] },
    { labelKey: 'departments' as const, path: '/departments', icon: Building2, roles: ['Admin'] },
    { labelKey: 'users' as const, path: '/users', icon: Users, roles: ['Admin'] },
    { labelKey: 'auditLogs' as const, path: '/audit-logs', icon: ShieldAlert, roles: ['Admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-[260px] border-r bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
              TS
            </div>
            TradeOffStack
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <div className="font-semibold text-lg text-foreground">
            Asset Portal
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-foreground">
                {user ? `${user.first_name} ${user.last_name || ''}`.trim() || user.email : t('signOut')}
              </div>
              <div className="text-xs text-muted-foreground">{role}</div>
            </div>
            <div className="relative">
              <Avatar className="cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <AvatarImage src={user?.profile_image_url || ''} alt="@user" />
                <AvatarFallback className="bg-primary/20 text-primary">
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
                      <User className="w-4 h-4 text-primary" />
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

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
