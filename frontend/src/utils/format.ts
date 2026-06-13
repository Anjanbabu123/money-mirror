export const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-IN').format(Math.round(n));

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining':   '#f97316',
  'Groceries':       '#22c55e',
  'Shopping':        '#a855f7',
  'Travel':          '#3b82f6',
  'Utilities':       '#64748b',
  'Entertainment':   '#ec4899',
  'EMI':             '#ef4444',
  'Rent':            '#dc2626',
  'Investments':     '#10b981',
  'Insurance':       '#6366f1',
  'Healthcare':      '#14b8a6',
  'Education':       '#f59e0b',
  'Fuel':            '#78716c',
  'Transfers':       '#94a3b8',
  'Cash Withdrawal': '#475569',
  'Taxes':           '#7c3aed',
  'Salary':          '#16a34a',
  'Business Income': '#0891b2',
  'Miscellaneous':   '#9ca3af',
};
