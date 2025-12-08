import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from 'react-i18next';

/**
 * Component to initialize settings on app load
 * This component loads user preferences and business settings from the backend
 * and applies them to the app (theme, language, etc.)
 */
export default function SettingsInitializer() {
  const { user, isAuthenticated } = useAuthStore();
  const { fetchUserPreferences, fetchBusinessSettings, userPreferences } = useSettingsStore();
  const { setTheme } = useThemeStore();
  const { i18n } = useTranslation();

  // Load settings when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Load user preferences
      fetchUserPreferences();

      // Load business settings if user is an owner
      if (user.role === 'OWNER') {
        fetchBusinessSettings();
      }
    }
  }, [isAuthenticated, user?.id, user?.role]);

  // Apply theme when user preferences are loaded
  useEffect(() => {
    if (userPreferences?.theme) {
      setTheme(userPreferences.theme as 'light' | 'dark');
    }
  }, [userPreferences?.theme]);

  // Apply language when user preferences are loaded
  useEffect(() => {
    if (userPreferences?.language && userPreferences.language !== i18n.language) {
      i18n.changeLanguage(userPreferences.language);
    }
  }, [userPreferences?.language]);

  // This component doesn't render anything
  return null;
}
