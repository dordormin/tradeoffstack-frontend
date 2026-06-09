import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

export const translations = {
  en: {
    dashboard: "Dashboard",
    inventory: "Inventory",
    myGear: "My Gear",
    reservations: "Reservations",
    maintenance: "Maintenance",
    departments: "Departments",
    users: "Users",
    auditLogs: "Audit Logs",
    signOut: "Sign Out",
    settings: "Settings",
    settingsDesc: "Manage your workspace preferences, personal details, and security.",
    profileSettings: "My Profile Settings",
    systemSettings: "System Settings",
    personalProfile: "Personal Profile",
    personalProfileDesc: "Update your personal information and contact details.",
    firstName: "First Name",
    lastName: "Last Name",
    phoneNumber: "Phone Number",
    profileImage: "Profile Image URL / Path",
    profileImageHint: "Specify an image name or a custom web image URL to customize your avatar.",
    saveProfile: "Save Profile Details",
    securityPassword: "Security & Password",
    securityPasswordDesc: "Update your login credentials to secure your workspace account.",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePassword: "Update Password",
    systemPreferences: "System Preferences",
    systemPreferencesDesc: "Configure localization settings, interface themes, and visual parameters.",
    systemInterfaceTheme: "System Interface Theme",
    darkMode: "Dark mode",
    darkModeDesc: "Warm obsidian scheme",
    lightMode: "Light mode",
    lightModeDesc: "Clean & high contrast",
    cyberpunkMode: "Cyberpunk",
    cyberpunkModeDesc: "Neon cyan & fuchsia",
    localizationLanguage: "Localization Language",
    localizationLanguageDesc: "Change the primary translation system for labels.",
    systemNotifications: "System Notifications",
    systemNotificationsDesc: "Receive workspace triggers and reservation warnings on desktop.",
    developerLogs: "Developer Logs",
    developerLogsDesc: "Print audit trace events and API calls in the browser logs.",
    accessRole: "Access Role",
    department: "Department",
    status: "Status",
    activeAccount: "Active Account",
    inactiveAccount: "Inactive",
    profileSuccess: "Profile details successfully updated!",
    passwordSuccess: "Password successfully updated!",
    themeSuccess: "System theme updated successfully!",
    languageSuccess: "System language preference saved!",
    notificationsEnabled: "Desktop notifications enabled",
    notificationsDisabled: "Desktop notifications disabled",
    devLogsEnabled: "Developer mode log auditing active",
    devLogsDisabled: "Developer mode log auditing disabled",
    saving: "Saving...",
    updating: "Updating...",
    none: "None"
  },
  fr: {
    dashboard: "Tableau de bord",
    inventory: "Inventaire",
    myGear: "Mon équipement",
    reservations: "Réservations",
    maintenance: "Maintenance",
    departments: "Départements",
    users: "Utilisateurs",
    auditLogs: "Journaux d'audit",
    signOut: "Se déconnecter",
    settings: "Paramètres",
    settingsDesc: "Gérez vos préférences d'espace de travail, vos informations personnelles et votre sécurité.",
    profileSettings: "Paramètres du profil",
    systemSettings: "Paramètres système",
    personalProfile: "Profil personnel",
    personalProfileDesc: "Mettez à jour vos informations personnelles et vos coordonnées.",
    firstName: "Prénom",
    lastName: "Nom",
    phoneNumber: "Numéro de téléphone",
    profileImage: "URL / Chemin de l'image de profil",
    profileImageHint: "Spécifiez un nom d'image ou une URL d'image personnalisée pour personnaliser votre avatar.",
    saveProfile: "Enregistrer le profil",
    securityPassword: "Sécurité & Mot de passe",
    securityPasswordDesc: "Mettez à jour vos identifiants pour sécuriser votre compte.",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmNewPassword: "Confirmer le nouveau mot de passe",
    updatePassword: "Modifier le mot de passe",
    systemPreferences: "Préférences système",
    systemPreferencesDesc: "Configurez les paramètres de localisation, les thèmes de l'interface et les paramètres visuels.",
    systemInterfaceTheme: "Thème de l'interface système",
    darkMode: "Mode sombre",
    darkModeDesc: "Schéma d'obsidienne chaleureux",
    lightMode: "Mode clair",
    lightModeDesc: "Propre & contraste élevé",
    cyberpunkMode: "Cyberpunk",
    cyberpunkModeDesc: "Néon cyan & fuchsia",
    localizationLanguage: "Langue de localisation",
    localizationLanguageDesc: "Modifiez le système de traduction principal pour les libellés.",
    systemNotifications: "Notifications système",
    systemNotificationsDesc: "Recevez les alertes et les avertissements de réservation sur le bureau.",
    developerLogs: "Journaux développeur",
    developerLogsDesc: "Affichez les événements d'audit et les appels d'API dans la console.",
    accessRole: "Rôle d'accès",
    department: "Département",
    status: "Statut",
    activeAccount: "Compte actif",
    inactiveAccount: "Inactif",
    profileSuccess: "Détails du profil mis à jour avec succès !",
    passwordSuccess: "Mot de passe mis à jour avec succès !",
    themeSuccess: "Thème système mis à jour avec succès !",
    languageSuccess: "Préférence de langue enregistrée !",
    notificationsEnabled: "Notifications de bureau activées",
    notificationsDisabled: "Notifications de bureau désactivées",
    devLogsEnabled: "Audit des journaux en mode développeur actif",
    devLogsDisabled: "Audit des journaux en mode développeur désactivé",
    saving: "Enregistrement...",
    updating: "Mise à jour...",
    none: "Aucun"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<Language>(() => {
    return (localStorage.getItem('system_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLang(lang);
    localStorage.setItem('system_lang', lang);
    window.dispatchEvent(new Event('languagechange'));
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('system_lang') as Language;
      if (stored && stored !== language) {
        setLang(stored);
      }
    };
    window.addEventListener('languagechange', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('languagechange', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]);

  const t = (key: keyof typeof translations['en']): string => {
    const dict = translations[language] || translations['en'];
    return dict[key] || translations['en'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
