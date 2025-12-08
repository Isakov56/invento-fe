import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsService } from '../services/settings.service';
import type { BusinessSettings, UserPreferences } from '../services/settings.service';

interface SettingsState {
  // Business settings (OWNER only)
  businessSettings: BusinessSettings | null;

  // User preferences (all users)
  userPreferences: UserPreferences | null;

  // Loading states
  isLoadingBusiness: boolean;
  isLoadingUser: boolean;

  // Error states
  businessError: string | null;
  userError: string | null;

  // Actions
  fetchBusinessSettings: () => Promise<void>;
  updateBusinessSettings: (data: Partial<Omit<BusinessSettings, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  fetchUserPreferences: () => Promise<void>;
  updateUserPreferences: (data: Partial<Omit<UserPreferences, 'id'>>) => Promise<void>;
  clearErrors: () => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      businessSettings: null,
      userPreferences: null,
      isLoadingBusiness: false,
      isLoadingUser: false,
      businessError: null,
      userError: null,

      fetchBusinessSettings: async () => {
        set({ isLoadingBusiness: true, businessError: null });
        try {
          const settings = await settingsService.getBusinessSettings();
          set({
            businessSettings: settings,
            isLoadingBusiness: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to load business settings';
          set({
            businessError: errorMessage,
            isLoadingBusiness: false,
          });
          console.error('Failed to fetch business settings:', error);
        }
      },

      updateBusinessSettings: async (data) => {
        set({ isLoadingBusiness: true, businessError: null });
        try {
          const settings = await settingsService.updateBusinessSettings(data);
          set({
            businessSettings: settings,
            isLoadingBusiness: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to update business settings';
          set({
            businessError: errorMessage,
            isLoadingBusiness: false,
          });
          throw error;
        }
      },

      fetchUserPreferences: async () => {
        set({ isLoadingUser: true, userError: null });
        try {
          const preferences = await settingsService.getUserPreferences();
          set({
            userPreferences: preferences,
            isLoadingUser: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to load user preferences';
          set({
            userError: errorMessage,
            isLoadingUser: false,
          });
          console.error('Failed to fetch user preferences:', error);
        }
      },

      updateUserPreferences: async (data) => {
        set({ isLoadingUser: true, userError: null });
        try {
          const preferences = await settingsService.updateUserPreferences(data);
          set({
            userPreferences: preferences,
            isLoadingUser: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to update user preferences';
          set({
            userError: errorMessage,
            isLoadingUser: false,
          });
          throw error;
        }
      },

      clearErrors: () => {
        set({ businessError: null, userError: null });
      },

      reset: () => {
        set({
          businessSettings: null,
          userPreferences: null,
          isLoadingBusiness: false,
          isLoadingUser: false,
          businessError: null,
          userError: null,
        });
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        businessSettings: state.businessSettings,
        userPreferences: state.userPreferences,
      }),
    }
  )
);
