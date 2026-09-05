export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_CURRENCY_SYMBOL = '₹';

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) - Singapore Dollar' },
  { code: 'AED', symbol: 'AED', label: 'AED (د.إ) - UAE Dirham' },
];

/**
 * Formats numeric amount with currency symbol and appropriate locale numbering.
 * Defaults to Indian Rupee (INR / ₹) with Indian numbering (en-IN: Lakhs, Crores).
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const normalized = (currency || 'INR').trim().toUpperCase();
  const isINR = normalized === 'INR' || currency === '₹';

  if (isINR) {
    // Format with Indian Rupee symbol and Indian numbering system (e.g. ₹2,45,000)
    const formattedNum = Number(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
    return `₹${formattedNum}`;
  }

  const option = SUPPORTED_CURRENCIES.find(c => c.code === normalized);
  const symbol = option ? option.symbol : `${currency} `;
  const formattedNum = Number(amount).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });

  return symbol === '$' || symbol === '€' || symbol === '£' 
    ? `${symbol}${formattedNum}` 
    : `${symbol} ${formattedNum}`;
}

/**
 * Returns Indian denomination shorthand (e.g. ₹2.45 Lakhs, ₹1.2 Cr)
 */
export function formatIndianDenomination(amount: number): string {
  if (!amount || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  if (amount >= 100000) {
    const lakh = (amount / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lakh} Lakhs`;
  }
  return formatCurrency(amount, 'INR');
}
