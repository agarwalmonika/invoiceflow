import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2 }).format(amount || 0);
};

export const formatDate = (date, fmt = 'MMM dd, yyyy') => {
  if (!date) return '—';
  try { return format(new Date(date), fmt); } catch { return '—'; }
};

export const formatDateShort = (date) => formatDate(date, 'MM/dd/yyyy');
export const timeAgo = (date) => date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '';

export const isOverdue = (dueDate, status) => {
  if (status === 'paid' || status === 'cancelled') return false;
  return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
};

export const getStatusClass = (status) => {
  const map = { paid: 'badge-paid', draft: 'badge-draft', sent: 'badge-sent', overdue: 'badge-overdue', cancelled: 'badge-cancelled' };
  return map[status] || 'badge-draft';
};

export const getPlanColor = (plan) => {
  const map = { free: 'text-gray-500 bg-gray-100', pro: 'text-blue-600 bg-blue-100', enterprise: 'text-purple-600 bg-purple-100' };
  return map[plan] || map.free;
};

export const getPlanLimits = (plan) => {
  const limits = { free: { invoices: 5, clients: 10, label: 'Free' }, pro: { invoices: 100, clients: 'Unlimited', label: 'Pro' }, enterprise: { invoices: 'Unlimited', clients: 'Unlimited', label: 'Enterprise' } };
  return limits[plan] || limits.free;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  window.URL.revokeObjectURL(url); document.body.removeChild(a);
};

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' }, { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' }, { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }, { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }, { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

export const PAYMENT_TERMS = [
  { value: 7, label: 'Net 7 (Due in 7 days)' }, { value: 15, label: 'Net 15' },
  { value: 30, label: 'Net 30 (Due in 30 days)' }, { value: 45, label: 'Net 45' },
  { value: 60, label: 'Net 60' }, { value: 0, label: 'Due on receipt' },
];

export const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};
