/**
 * Currency formatting utilities
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
  UZS: 'soʻm',
};

export const CURRENCY_DECIMALS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  RUB: 2,
  UZS: 0, // Uzbek Som typically doesn't use decimals
};

/**
 * Format amount with currency symbol and proper decimals
 */
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  const decimals = CURRENCY_DECIMALS[currencyCode] ?? 2;

  const formattedAmount = amount.toFixed(decimals);

  // For UZS, put symbol after the number
  if (currencyCode === 'UZS') {
    return `${formattedAmount} ${symbol}`;
  }

  // For others, put symbol before
  return `${symbol}${formattedAmount}`;
};

/**
 * Get currency symbol only
 */
export const getCurrencySymbol = (currencyCode: string = 'USD'): string => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (currencyString: string): number => {
  // Remove all non-numeric characters except decimal point and minus
  const cleanedString = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(cleanedString) || 0;
};
