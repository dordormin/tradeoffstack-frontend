import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Inventory } from '@/pages/Inventory';
import { Licenses } from '@/pages/Licenses';
import { SaaSLayout } from '@/layouts/SaaSLayout';
import { SaaSDashboard } from '@/pages/saas/SaaSDashboard';
import { SaaSLicenses } from '@/pages/saas/SaaSLicenses';
import { SaaSProviders } from '@/pages/saas/SaaSProviders';
import { SaaSUsers } from '@/pages/saas/SaaSUsers';
import { SaaSBilling } from '@/pages/saas/SaaSBilling';
import { SelfService } from '@/pages/SelfService';
import { Reservations } from '@/pages/Reservations';
import { Maintenance } from '@/pages/Maintenance';
import { Departments } from '@/pages/Departments';
import { Users } from '@/pages/Users';
import { AuditLogs } from '@/pages/AuditLogs';
import { Settings } from '@/pages/Settings';
import { CentralHub } from '@/pages/CentralHub';
import { ComingSoon } from '@/pages/ComingSoon';
import { apiClient } from '@/api/apiClient';
import { Shield, UserPlus, LogIn, Lock, Mail, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Logo } from './components/Logo';
import { withPermission } from '@/components/withPermission';

// Protected Components wrapped with HOC (Higher-Order Component Pattern)
const ProtectedSaaSDashboard = withPermission(SaaSDashboard, ['Admin', 'Manager', 'Tester']);
const ProtectedSaaSProviders = withPermission(SaaSProviders, ['Admin', 'Manager', 'Tester']);
const ProtectedSaaSLicenses = withPermission(SaaSLicenses, ['Admin', 'Manager', 'Tester']);
const ProtectedSaaSUsers = withPermission(SaaSUsers, ['Admin', 'Manager', 'Tester']);
const ProtectedSaaSBilling = withPermission(SaaSBilling, ['Admin', 'Manager', 'Tester']);
const ProtectedInventory = withPermission(Inventory, ['Admin', 'Manager', 'Tester']);
const ProtectedLicenses = withPermission(Licenses, ['Admin', 'Manager', 'Tester']);
const ProtectedSelfService = withPermission(SelfService, ['Employee']);
const ProtectedUsers = withPermission(Users, ['Admin']);
const ProtectedAuditLogs = withPermission(AuditLogs, ['Admin', 'Tester']);

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/hub" replace />;
  
  return children ? <>{children}</> : <Outlet />;
};

const LoginForm = () => {
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Tab State: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Shared States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign Up States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }


  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const data = response.data;
      const token = data.token || data.Token;
      const role = data.role || data.Role;
      const userId = data.userId || data.UserId || data.user_id;
      if (token && role && userId) {
        console.log('handleSignInSubmit: about to await login(...)');
        await login(token, role, userId);
        console.log('handleSignInSubmit: login(...) finished');
      } else {
        setError('Invalid server response.');
      }
    } catch (err: any) {
      // Auto-recovery for demo accounts (in case backend DB was wiped by a migration)
      if (email === 'admin@tradeoffstack.com' && password === 'Admin123!Secure') {
        try {
          console.log('Demo account missing. Auto-recreating...');
          const regRes = await apiClient.post('/auth/register', {
            firstName: 'Admin', lastName: 'System', email, password
          });
          if (regRes.data?.token) {
            await login(regRes.data.token, regRes.data.role, regRes.data.userId || regRes.data.user_id);
            return;
          }
        } catch (regErr) {
          console.error('Auto-recovery failed', regErr);
        }
      } else if (email === 'tester@tradeoffstack.com' && password === 'Tester123!Secure') {
        try {
          console.log('Demo account missing. Auto-recreating...');
          const regRes = await apiClient.post('/auth/register', {
            firstName: 'Tester', lastName: 'User', email, password
          });
          if (regRes.data?.token) {
            await login(regRes.data.token, regRes.data.role, regRes.data.userId || regRes.data.user_id);
            return;
          }
        } catch (regErr) {
          console.error('Auto-recovery failed', regErr);
        }
      }
      
      setError(err.response?.data?.message || 'Invalid credentials or connection issue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        firstName,
        lastName,
        email,
        password
      });
      setSuccess('Account created successfully! Logging you in...');
      
      setTimeout(async () => {
        if (response.data && response.data.token) {
          setSuccess('Login successful! Redirecting to dashboard...');
          await login(response.data.token, response.data.role, response.data.userId);
        } else {
          setActiveTab('signin');
          setSuccess('');
        }
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Left Pane - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-16 lg:px-20 py-4 relative z-10 bg-gradient-to-br from-background via-background/95 to-secondary/10">
        
        {/* Decorative Neon Glow Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-md mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-3">
              <Logo className="scale-125 origin-left mb-4" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90 pt-4">
              {activeTab === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'signin' 
                ? 'Sign in to access your corporate IT asset workspace.' 
                : 'Get started with self-service hardware provisioning.'}
            </p>
          </div>

          {/* Custom Modern Tabs */}
          <div className="grid grid-cols-2 p-1 bg-secondary/40 border border-border/50 rounded-xl backdrop-blur-sm">
            <button
              onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'signin'
                  ? 'bg-background text-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'signup'
                  ? 'bg-background text-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="p-3 bg-secondary/20 border border-border/40 rounded-xl space-y-1.5 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground/80 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Demo Access / Accès démo :</span>
            </div>
            <div className="flex justify-between items-center bg-background/40 p-1.5 rounded-lg border border-border/20">
              <span>Admin: <code className="text-primary select-all">admin@tradeoffstack.com</code></span>
              <span className="font-mono text-[10px]">Admin123!Secure</span>
            </div>
            <div className="flex justify-between items-center bg-background/40 p-1.5 rounded-lg border border-border/20">
              <span>Tester: <code className="text-primary select-all">tester@tradeoffstack.com</code></span>
              <span className="font-mono text-[10px]">Tester123!Secure</span>
            </div>
          </div>

          {/* Notifications */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium flex items-start gap-2 shadow-sm animate-shake">
              <span className="text-base">⚠️</span>
              <div className="flex-1">{error}</div>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 font-medium flex items-start gap-2 shadow-sm">
              <span className="text-base">✅</span>
              <div className="flex-1">{success}</div>
            </div>
          )}

          {/* Form Content */}
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tradeoffstack.com"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-sm mt-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to Account
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@company.com"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-sm mt-3"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Free Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Info */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary/80" />
              Secured with AES-256 JWT Authorization tokens.
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane - Visual Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-6 bg-background">
        <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl border border-border/30">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/90 via-slate-900/60 to-transparent z-10" />
          <img
            src="/jetbrains_mosaic.png"
            alt="3D JetBrains Mosaic"
            className="object-cover w-full h-full"
          />
          
          {/* Overlay Content */}
          <div className="absolute bottom-12 left-12 right-12 z-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary-foreground font-mono">v4.0.0 Stable</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Hub, Orchestrated.
            </h1>
            <p className="text-slate-300 text-sm xl:text-base max-w-lg">
              Track hardware parameters, automate reservation lifecycles, and coordinate technical interventions inside a unified glassmorphic dashboard.
            </p>
            
            <div className="pt-4 grid grid-cols-3 gap-6 border-t border-white/10 max-w-md">
              <div>
                <p className="text-xl xl:text-2xl font-bold text-white">99.9%</p>
                <p className="text-xs text-slate-400">System Uptime</p>
              </div>
              <div>
                <p className="text-xl xl:text-2xl font-bold text-white">100ms</p>
                <p className="text-xs text-slate-400">Avg API Response</p>
              </div>
              <div>
                <p className="text-xl xl:text-2xl font-bold text-white">Active</p>
                <p className="text-xs text-slate-400">Audit Journaling</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemeInitializer = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (isAuthenticated) {
      const theme = localStorage.getItem('system_theme') || 'dark';
      root.className = '';
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'cyberpunk') {
        root.classList.add('dark', 'theme-cyberpunk');
      }
    } else {
      // Default to neutral dark mode when logged out (e.g. login screen)
      root.className = '';
      root.classList.add('dark');
    }
  }, [isAuthenticated]);

  return null;
};

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <ThemeInitializer />
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            
            <Route element={<ProtectedRoute />}>
              {/* Central Hub page - outside of the normal sub-app DashboardLayout */}
              <Route path="/dashboard" element={<CentralHub />} />
              
              {/* SaaS Management Module */}
              <Route element={<SaaSLayout />}>
                <Route path="/saas" element={<ProtectedSaaSDashboard />} />
                <Route path="/saas/providers" element={<ProtectedSaaSProviders />} />
                <Route path="/saas/licenses" element={<ProtectedSaaSLicenses />} />
                <Route path="/saas/users" element={<ProtectedSaaSUsers />} />
                <Route path="/saas/billing" element={<ProtectedSaaSBilling />} />
              </Route>

              {/* Placeholder Modules */}
              <Route path="/helpdesk" element={<ComingSoon title="IT Support Help Desk" />} />
              <Route path="/procurement" element={<ComingSoon title="Procurement & Purchasing" />} />
              <Route path="/hr" element={<ComingSoon title="HR & Onboarding Hub" />} />

              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/asset-portal" element={<Dashboard />} />
                <Route path="/inventory" element={<ProtectedInventory />} />
                <Route path="/licenses" element={<ProtectedLicenses />} />

                <Route path="/my-gear" element={<ProtectedSelfService />} />
                <Route path="/reservations" element={<Reservations />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/users" element={<ProtectedUsers />} />
                <Route path="/audit-logs" element={<ProtectedAuditLogs />} />
                <Route path="/settings/*" element={<Settings />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/hub" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
