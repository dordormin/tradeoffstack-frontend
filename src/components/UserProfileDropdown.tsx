import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';

export const UserProfileDropdown: React.FC = () => {
  const { role, user, logout } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isFr = language === 'fr';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'User';
  const initial = user?.first_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-4" ref={dropdownRef}>
      <div className="text-right hidden sm:block">
        <div className="text-sm font-medium text-foreground">
          {userName}
        </div>
        <div className="text-xs text-muted-foreground capitalize">{role}</div>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="rounded-full ring-2 ring-transparent hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all cursor-pointer"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          aria-label={isFr ? "Menu utilisateur" : "User menu"}
        >
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>

        {dropdownOpen && (
          <div 
            className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-md border border-border py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
            
            <button 
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors"
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                navigate('/settings/profile');
              }}
            >
              <UserIcon className="w-4 h-4 text-muted-foreground" />
              {isFr ? 'Mon Profil' : 'My Profile'}
            </button>
            
            <button 
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors"
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                navigate('/settings/system');
              }}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              {isFr ? 'Paramètres' : 'Settings'}
            </button>

            <div className="border-t border-border my-1" />
            
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              {isFr ? 'Se déconnecter' : 'Sign out'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
