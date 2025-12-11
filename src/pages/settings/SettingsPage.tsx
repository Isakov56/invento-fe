import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building2, ShoppingCart, Package, Save, Loader2, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useThemeStore } from '../../store/themeStore';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'preferences' | 'business' | 'pos' | 'inventory'>('preferences');
  const [showTabFade, setShowTabFade] = useState(true);

  const { user } = useAuthStore();
  const {
    businessSettings,
    userPreferences,
    isLoadingBusiness,
    isLoadingUser,
    businessError,
    userError,
    fetchBusinessSettings,
    updateBusinessSettings,
    fetchUserPreferences,
    updateUserPreferences,
  } = useSettingsStore();
  const { success: showSuccess, error: showError } = useToastStore();
  const { setTheme } = useThemeStore();

  const isOwner = user?.role === 'OWNER';

  // Local state for form inputs
  const [formData, setFormData] = useState({
    // Business settings
    businessName: '',
    taxRate: 0,
    currency: 'USD',
    receiptHeader: '',
    receiptFooter: '',
    autoPrintReceipt: false,
    defaultPaymentMethod: 'cash',
    lowStockThreshold: 10,

    // User preferences
    language: 'en',
    theme: 'light',
    notificationsEnabled: true,
    defaultStoreId: '',
  });

  // Load settings on mount
  useEffect(() => {
    fetchUserPreferences();
    if (isOwner) {
      fetchBusinessSettings();
    }
  }, [isOwner]);

  // Detect if tabs are scrolled to the end
  useEffect(() => {
    const tabsContainer = document.querySelector('.tabs-scroll-container') as HTMLElement;
    if (!tabsContainer) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;
      // Check if scrolled to the end (with 5px tolerance)
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;
      setShowTabFade(!isAtEnd);
    };

    tabsContainer.addEventListener('scroll', handleScroll);
    // Check initial state
    handleScroll();

    return () => {
      tabsContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Update form data when settings are loaded
  useEffect(() => {
    if (businessSettings) {
      setFormData((prev) => ({
        ...prev,
        businessName: businessSettings.businessName || '',
        taxRate: businessSettings.taxRate || 0,
        currency: businessSettings.currency || 'USD',
        receiptHeader: businessSettings.receiptHeader || '',
        receiptFooter: businessSettings.receiptFooter || '',
        autoPrintReceipt: businessSettings.autoPrintReceipt || false,
        defaultPaymentMethod: businessSettings.defaultPaymentMethod || 'cash',
        lowStockThreshold: businessSettings.lowStockThreshold || 10,
      }));
    }
  }, [businessSettings]);

  useEffect(() => {
    if (userPreferences) {
      setFormData((prev) => ({
        ...prev,
        language: userPreferences.language || 'en',
        theme: userPreferences.theme || 'light',
        notificationsEnabled: userPreferences.notificationsEnabled ?? true,
        defaultStoreId: userPreferences.defaultStoreId || '',
      }));
    }
  }, [userPreferences]);

  const handleSave = async () => {
    try {
      // Save user preferences
      await updateUserPreferences({
        language: formData.language,
        theme: formData.theme,
        notificationsEnabled: formData.notificationsEnabled,
        defaultStoreId: formData.defaultStoreId || null,
      });

      // Apply theme immediately
      if (formData.theme === 'light' || formData.theme === 'dark') {
        setTheme(formData.theme);
      }

      // Update language immediately
      if (formData.language !== i18n.language) {
        i18n.changeLanguage(formData.language);
      }

      // Save business settings (only for owners)
      if (isOwner && (activeTab === 'business' || activeTab === 'pos' || activeTab === 'inventory')) {
        await updateBusinessSettings({
          businessName: formData.businessName || null,
          taxRate: formData.taxRate,
          currency: formData.currency,
          receiptHeader: formData.receiptHeader || null,
          receiptFooter: formData.receiptFooter || null,
          autoPrintReceipt: formData.autoPrintReceipt,
          defaultPaymentMethod: formData.defaultPaymentMethod,
          lowStockThreshold: formData.lowStockThreshold,
        });
      }

      showSuccess(t('settings.changesSaved'));
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      showError(error.response?.data?.error || t('errors.saveFailed'));
    }
  };

  const allTabs = [
    { key: 'preferences' as const, label: t('settings.preferences'), icon: User, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
    { key: 'business' as const, label: t('settings.business'), icon: Building2, roles: ['OWNER'] },
    { key: 'pos' as const, label: t('settings.pos'), icon: ShoppingCart, roles: ['OWNER'] },
    { key: 'inventory' as const, label: t('settings.inventory'), icon: Package, roles: ['OWNER'] },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => tab.roles.includes(user?.role || ''));

  const isLoading = isLoadingBusiness || isLoadingUser;

  return (
    <div>
      {/* Error Display */}
      {(businessError || userError) && (
        <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {businessError || userError}
            </p>
          </div>
        </div>
      )}

      {/* Tabs with fade effect */}
      <div className="border-b border-gray-200 dark:border-gray-700 relative">
        <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide tabs-scroll-container">
          <nav className="-mb-px flex space-x-8 whitespace-nowrap" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Right fade effect - stays fixed at right edge, hides when scrolled to end */}
        {showTabFade && (
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none z-10 transition-opacity duration-300" />
        )}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="card">
            {/* User Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('settings.preferences')}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.language')}
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="input"
                    disabled={isLoading}
                  >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="uz">O'zbekcha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.theme')}
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="input"
                    disabled={isLoading}
                  >
                    <option value="light">{t('settings.light')}</option>
                    <option value="dark">{t('settings.dark')}</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={formData.notificationsEnabled}
                    onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  <label htmlFor="notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settings.notifications')}
                  </label>
                </div>
              </div>
            )}

            {/* Business Settings */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('settings.business')}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.businessName')}
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="input"
                    placeholder={t('settings.businessName')}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.taxRate')} (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="input"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.currency')}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input"
                    disabled={isLoading}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="RUB">RUB - Russian Ruble</option>
                    <option value="UZS">UZS - Uzbek Som</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.receiptHeader')}
                  </label>
                  <textarea
                    value={formData.receiptHeader}
                    onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Thank you for shopping with us!"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.receiptFooter')}
                  </label>
                  <textarea
                    value={formData.receiptFooter}
                    onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Visit us again!"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* POS Settings */}
            {activeTab === 'pos' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('settings.pos')}
                </h2>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoPrintReceipt"
                    checked={formData.autoPrintReceipt}
                    onChange={(e) => setFormData({ ...formData, autoPrintReceipt: e.target.checked })}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  <label htmlFor="autoPrintReceipt" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settings.autoPrintReceipt')}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.defaultPaymentMethod')}
                  </label>
                  <select
                    value={formData.defaultPaymentMethod}
                    onChange={(e) => setFormData({ ...formData, defaultPaymentMethod: e.target.value })}
                    className="input"
                    disabled={isLoading}
                  >
                    <option value="cash">{t('pos.cash')}</option>
                    <option value="card">{t('pos.card')}</option>
                    <option value="mobile">{t('pos.mobile')}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Inventory Settings */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {t('settings.inventory')}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.lowStockThreshold')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="input"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Products with stock below this value will be marked as low stock
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.processing')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('settings.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
