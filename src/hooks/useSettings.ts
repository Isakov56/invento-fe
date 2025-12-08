import { useSettingsStore } from '../store/settingsStore';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

/**
 * Custom hook to easily access and use settings throughout the app
 */
export const useSettings = () => {
  const { businessSettings, userPreferences } = useSettingsStore();

  // Currency helpers
  const currency = businessSettings?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);
  const formatPrice = (amount: number) => formatCurrency(amount, currency);

  // Tax helpers
  const taxRate = businessSettings?.taxRate || 0;
  const calculateTax = (subtotal: number) => (subtotal * taxRate) / 100;
  const calculateTotal = (subtotal: number) => subtotal + calculateTax(subtotal);

  // POS settings
  const autoPrintReceipt = businessSettings?.autoPrintReceipt || false;
  const defaultPaymentMethod = businessSettings?.defaultPaymentMethod || 'cash';

  // Inventory settings
  const lowStockThreshold = businessSettings?.lowStockThreshold || 10;

  // User preferences
  const language = userPreferences?.language || 'en';
  const theme = userPreferences?.theme || 'light';
  const notificationsEnabled = userPreferences?.notificationsEnabled ?? true;

  return {
    // Business settings
    businessSettings,
    businessName: businessSettings?.businessName || '',

    // Currency
    currency,
    currencySymbol,
    formatPrice,

    // Tax
    taxRate,
    calculateTax,
    calculateTotal,

    // POS
    autoPrintReceipt,
    defaultPaymentMethod,

    // Inventory
    lowStockThreshold,

    // Receipts
    receiptHeader: businessSettings?.receiptHeader || '',
    receiptFooter: businessSettings?.receiptFooter || '',

    // User preferences
    userPreferences,
    language,
    theme,
    notificationsEnabled,
  };
};
