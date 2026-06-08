import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  MonitorSmartphone, 
  CalendarClock, 
  Wrench, 
  Users, 
  Building2, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const DashboardLayout: React.FC = () => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Inventory', path: '/inventory', icon: MonitorSmartphone, roles: ['Admin', 'Manager'] },
    { name: 'My Gear', path: '/my-gear', icon: MonitorSmartphone, roles: ['Employee'] },
    { name: 'Reservations', path: '/reservations', icon: CalendarClock, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Departments', path: '/departments', icon: Building2, roles: ['Admin'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['Admin'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['Admin'] },
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
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <div className="font-semibold text-lg text-foreground">
            {/* Contextual Title can go here via React Context or Router Matches */}
            Asset Portal
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-foreground">Logged in as</div>
              <div className="text-xs text-muted-foreground">{role}</div>
            </div>
            <Avatar>
              <AvatarImage src="" alt="@user" />
              <AvatarFallback className="bg-primary/20 text-primary">U</AvatarFallback>
            </Avatar>
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
