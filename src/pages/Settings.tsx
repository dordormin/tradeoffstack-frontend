import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { apiClient } from '@/api/apiClient';
import type { Department } from '@/types';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  Settings as SettingsIcon,
  Palette,
  Globe,
  Bell,
  Monitor,
  UploadCloud
} from 'lucide-react';

interface SettingsProps {
  view?: 'profile' | 'system';
}

export const Settings: React.FC<SettingsProps> = ({ view = 'profile' }) => {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    profile_image: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // System Settings state
  const [systemTheme, setSystemTheme] = useState(() => {
    return localStorage.getItem('system_theme') || 'dark';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('system_notifications') !== 'false';
  });
  const [debugLogsEnabled, setDebugLogsEnabled] = useState(() => {
    return localStorage.getItem('system_debug_logs') === 'true';
  });

  // Departments list for display mapping
  const [departments, setDepartments] = useState<Department[]>([]);

  // Feedback states
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [systemSuccess, setSystemSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [imageSourceType, setImageSourceType] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadProfileFile(file);
    }
  };

  const uploadProfileFile = async (file: File) => {
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('folder', 'Users');

    try {
      const response = await apiClient.post<{ image_url: string; filename: string }>('/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setProfileData(prev => ({
        ...prev,
        profile_image: response.data.image_url
      }));
    } catch (err: any) {
      console.error('Upload failed', err);
      alert(language === 'fr' ? 'Le téléchargement de l\'image a échoué.' : 'Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadProfileFile(file);
    }
  };

  useEffect(() => {
    // Load departments
    const fetchDeps = async () => {
      try {
        const res = await apiClient.get<Department[]>('/department');
        setDepartments(res.data || []);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDeps();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        profile_image: user.profile_image || '',
      });
      if (user.profile_image && !user.profile_image.startsWith('http')) {
        setImageSourceType('upload');
      } else {
        setImageSourceType('url');
      }
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    
    if (!user) return;
    
    if (!profileData.first_name.trim() || !profileData.last_name.trim()) {
      setProfileError(language === 'fr' ? 'Le prénom et le nom sont requis.' : 'First Name and Last Name are required.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        ...user,
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        phone_number: profileData.phone_number.trim() || null,
        profile_image: profileData.profile_image.trim() || null,
      };

      await apiClient.put(`/user/${user.id}`, payload);
      await refreshUser();
      setProfileSuccess(t('profileSuccess'));
    } catch (err: any) {
      setProfileError(err.response?.data?.message || (language === 'fr' ? 'Échec de la mise à jour.' : 'Failed to update profile details.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!user) return;

    if (!passwordData.old_password) {
      setPasswordError(language === 'fr' ? 'Le mot de passe actuel est requis.' : 'Current password is required.');
      return;
    }

    if (!passwordData.new_password) {
      setPasswordError(language === 'fr' ? 'Le nouveau mot de passe ne peut pas être vide.' : 'New password cannot be empty.');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError(language === 'fr' ? 'Les nouveaux mots de passe ne correspondent pas.' : 'New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const payload = {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      };

      await apiClient.put(`/user/${user.id}/change-password`, payload);
      setPasswordSuccess(t('passwordSuccess'));
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || (language === 'fr' ? 'Échec du changement de mot de passe. Assurez-vous que le mot de passe actuel est correct.' : 'Failed to change password. Make sure current password is correct.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleThemeChange = (theme: string) => {
    setSystemTheme(theme);
    localStorage.setItem('system_theme', theme);
    
    const root = document.documentElement;
    root.className = '';
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'cyberpunk') {
      root.classList.add('dark', 'theme-cyberpunk');
    }
    
    setSystemSuccess(t('themeSuccess'));
    setTimeout(() => setSystemSuccess(''), 3000);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as 'en' | 'fr');
    setSystemSuccess(lang === 'fr' ? 'Préférence de langue enregistrée !' : 'System language preference saved!');
    setTimeout(() => setSystemSuccess(''), 3000);
  };

  const toggleNotifications = () => {
    const val = !notificationsEnabled;
    setNotificationsEnabled(val);
    localStorage.setItem('system_notifications', String(val));
    setSystemSuccess(val ? t('notificationsEnabled') : t('notificationsDisabled'));
    setTimeout(() => setSystemSuccess(''), 3000);
  };

  const toggleDebugLogs = () => {
    const val = !debugLogsEnabled;
    setDebugLogsEnabled(val);
    localStorage.setItem('system_debug_logs', String(val));
    setSystemSuccess(val ? t('devLogsEnabled') : t('devLogsDisabled'));
    setTimeout(() => setSystemSuccess(''), 3000);
  };

  const depName = user?.department?.name || departments.find(d => d.id === user?.department_id)?.name || t('none');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('settings')}</h1>
        <p className="text-muted-foreground mt-1">{t('settingsDesc')}</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border/60 gap-4 mb-4">
        <button
          onClick={() => navigate('/settings/profile')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            view === 'profile'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('profileSettings')}
        </button>
        <button
          onClick={() => navigate('/settings/system')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            view === 'system'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('systemSettings')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card - Quick Details Overview */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card border-border shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/10 via-indigo-500/5 to-transparent border-b border-border" />
            <CardContent className="pt-0 flex flex-col items-center text-center -mt-12">
              <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden bg-secondary shadow-md flex items-center justify-center mb-4">
                {user?.profile_image_url ? (
                  <img src={user.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-semibold text-primary">{user?.first_name ? user.first_name[0].toUpperCase() : 'U'}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {user ? `${user.first_name} ${user.last_name}` : 'Loading User...'}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </p>

              <div className="w-full border-t border-border/60 my-5 pt-5 space-y-3.5 text-left">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('accessRole')}</span>
                  <Badge variant="outline" className={
                    user?.role === 'Admin' 
                      ? 'border-rose-500/20 text-rose-500 bg-rose-500/5' 
                      : user?.role === 'Manager' 
                        ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' 
                        : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                  }>
                    {user?.role}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('department')}</span>
                  <span className="font-medium text-foreground">{depName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('status')}</span>
                  <Badge variant="outline" className={user?.is_active ? 'border-emerald-500/20 text-emerald-500' : 'border-rose-500/20 text-rose-500'}>
                    {user?.is_active ? t('activeAccount') : t('inactiveAccount')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns - Views */}
        <div className="md:col-span-2 space-y-6">
          {view === 'profile' ? (
            <>
              {/* Profile Details Form */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2 text-xl">
                    <User className="w-5 h-5 text-primary" />
                    {t('personalProfile')}
                  </CardTitle>
                  <CardDescription>{t('personalProfileDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {profileSuccess && (
                    <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 font-medium flex items-center gap-2.5 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      {profileSuccess}
                    </div>
                  )}
                  {profileError && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium flex items-center gap-2.5 shadow-sm">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      {profileError}
                    </div>
                  )}

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('firstName')}</label>
                        <input
                          type="text"
                          required
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                          placeholder={t('firstName')}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('lastName')}</label>
                        <input
                          type="text"
                          required
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                          placeholder={t('lastName')}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('phoneNumber')}</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                          type="text"
                          value={profileData.phone_number}
                          onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                          placeholder="+33 6 12 34 56 78"
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                     <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('profileImage')}</label>
                      <div className="flex gap-4 mb-1">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input 
                            type="radio" 
                            name="profileImageSourceType" 
                            value="upload" 
                            checked={imageSourceType === 'upload'}
                            onChange={() => setImageSourceType('upload')}
                            className="text-primary focus:ring-primary cursor-pointer"
                          />
                          {language === 'fr' ? 'Télécharger' : 'Upload File'}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input 
                            type="radio" 
                            name="profileImageSourceType" 
                            value="url" 
                            checked={imageSourceType === 'url'}
                            onChange={() => setImageSourceType('url')}
                            className="text-primary focus:ring-primary cursor-pointer"
                          />
                          {language === 'fr' ? 'Nom / Lien' : 'Name / Link'}
                        </label>
                      </div>

                      {imageSourceType === 'upload' ? (
                        <div className="space-y-3">
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('profile-file-upload-input')?.click()}
                            className={`relative border border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                              isDragging 
                                ? 'border-primary bg-primary/5 scale-[0.99]' 
                                : 'border-border bg-secondary/10 hover:bg-secondary/20 hover:border-primary/40'
                            }`}
                          >
                            <input 
                              id="profile-file-upload-input"
                              type="file" 
                              accept="image/*"
                              onChange={handleProfileFileChange}
                              className="hidden"
                            />
                            
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                              <UploadCloud className="w-6 h-6 animate-pulse" />
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm font-semibold text-foreground">
                                {language === 'fr' ? 'Glissez-déposez votre avatar ici' : 'Drag & drop your avatar here'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {language === 'fr' ? 'ou cliquez pour parcourir vos fichiers' : 'or click to browse your files'}
                              </p>
                            </div>
                            
                            {isUploading && (
                              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                          
                          {profileData.profile_image && (
                            <div className="relative w-16 h-16 rounded border border-border overflow-hidden bg-secondary">
                              <img src={profileData.profile_image} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <input
                            type="text"
                            value={profileData.profile_image}
                            onChange={(e) => setProfileData({ ...profileData, profile_image: e.target.value })}
                            placeholder="mon_avatar.png"
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all"
                          />
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground px-1">{t('profileImageHint')}</span>
                    </div>

                    <div className="flex justify-end pt-3">
                      <Button type="submit" disabled={isSavingProfile} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5">
                        {isSavingProfile ? (
                          <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : t('saveProfile')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Security & Password Form */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2 text-xl">
                    <Lock className="w-5 h-5 text-primary" />
                    {t('securityPassword')}
                  </CardTitle>
                  <CardDescription>{t('securityPasswordDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {passwordSuccess && (
                    <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 font-medium flex items-center gap-2.5 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      {passwordSuccess}
                    </div>
                  )}
                  {passwordError && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium flex items-center gap-2.5 shadow-sm animate-shake">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('currentPassword')}</label>
                      <input
                        type="password"
                        required
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('newPassword')}</label>
                        <input
                          type="password"
                          required
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('confirmNewPassword')}</label>
                        <input
                          type="password"
                          required
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <Button type="submit" disabled={isSavingPassword} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5">
                        {isSavingPassword ? (
                          <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : t('updatePassword')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            /* System Settings View */
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2 text-xl">
                  <SettingsIcon className="w-5 h-5 text-primary" />
                  {t('systemPreferences')}
                </CardTitle>
                <CardDescription>{t('systemPreferencesDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {systemSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 font-medium flex items-center gap-2.5 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    {systemSuccess}
                  </div>
                )}

                {/* Theme Mode Selector */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('systemInterfaceTheme')}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Dark Theme */}
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        systemTheme === 'dark'
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-border bg-background hover:bg-secondary/45'
                      }`}
                    >
                      <div className="w-full h-10 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-2">
                        <span className="text-[10px] text-zinc-400 font-mono">Dark theme</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{t('darkMode')}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{t('darkModeDesc')}</span>
                    </button>

                    {/* Light Theme */}
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        systemTheme === 'light'
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-border bg-background hover:bg-secondary/45'
                      }`}
                    >
                      <div className="w-full h-10 rounded bg-white border border-slate-200 flex items-center justify-center mb-2">
                        <span className="text-[10px] text-slate-500 font-mono">Light theme</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{t('lightMode')}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{t('lightModeDesc')}</span>
                    </button>

                    {/* Cyberpunk Theme */}
                    <button
                      onClick={() => handleThemeChange('cyberpunk')}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        systemTheme === 'cyberpunk'
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-border bg-background hover:bg-secondary/45'
                      }`}
                    >
                      <div className="w-full h-10 rounded bg-purple-950 border border-fuchsia-500 flex items-center justify-center mb-2">
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">CYBERPUNK</span>
                      </div>
                      <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        {t('cyberpunkMode')}
                        <Badge className="bg-fuchsia-500 text-white hover:bg-fuchsia-600 text-[9px] px-1 py-0 border-none">Alt</Badge>
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">{t('cyberpunkModeDesc')}</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-border/60 my-4 pt-4 space-y-5">
                  {/* Language Selector */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">{t('localizationLanguage')}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('localizationLanguageDesc')}</p>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="en">English (US)</option>
                      <option value="fr">Français (FR)</option>
                    </select>
                  </div>

                  {/* Desktop Notifications Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">{t('systemNotifications')}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('systemNotificationsDesc')}</p>
                    </div>
                    <label className="relative inline-flex inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationsEnabled}
                        onChange={toggleNotifications}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Audit Logs / Debug Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">{t('developerLogs')}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('developerLogsDesc')}</p>
                    </div>
                    <label className="relative inline-flex inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={debugLogsEnabled}
                        onChange={toggleDebugLogs}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
