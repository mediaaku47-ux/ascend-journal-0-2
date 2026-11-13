/**
 * Formatting utility for currency, numbers, and dates in JournalStream
 */

export const formatCurrency = (amount: number, currencySymbol: string = 'Rp'): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (currencySymbol === 'Rp') {
    // Indonesian Rupiah: format with dot separators (e.g. Rp 12.450.000)
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(absAmount);
    return `${isNegative ? '-' : ''}Rp ${formatted}`;
  }

  // Fallback for other standard currencies like $, €, etc.
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);
  return `${isNegative ? '-' : ''}${currencySymbol}${formatted}`;
};
