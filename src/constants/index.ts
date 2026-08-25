import type { CategoryMeta, ExpenseCategory, IncomeCategory } from '@/types';

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  food: {
    label: 'Food & Dining',
    emoji: '🍔',
    color: '#F97316',
    bgColor: 'bg-orange-500/15',
    textColor: 'text-orange-400',
  },
  transport: {
    label: 'Transport',
    emoji: '🚗',
    color: '#3B82F6',
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-400',
  },
  home: {
    label: 'Home & Rent',
    emoji: '🏠',
    color: '#8B5CF6',
    bgColor: 'bg-violet-500/15',
    textColor: 'text-violet-400',
  },
  bills: {
    label: 'Bills & Utilities',
    emoji: '💡',
    color: '#EAB308',
    bgColor: 'bg-yellow-500/15',
    textColor: 'text-yellow-400',
  },
  entertainment: {
    label: 'Entertainment',
    emoji: '🎮',
    color: '#EC4899',
    bgColor: 'bg-pink-500/15',
    textColor: 'text-pink-400',
  },
  shopping: {
    label: 'Shopping',
    emoji: '🛍',
    color: '#14B8A6',
    bgColor: 'bg-teal-500/15',
    textColor: 'text-teal-400',
  },
  medical: {
    label: 'Medical & Health',
    emoji: '💊',
    color: '#EF4444',
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-400',
  },
  education: {
    label: 'Education',
    emoji: '🎓',
    color: '#06B6D4',
    bgColor: 'bg-cyan-500/15',
    textColor: 'text-cyan-400',
  },
  mobile: {
    label: 'Mobile & Internet',
    emoji: '📱',
    color: '#6366F1',
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-400',
  },
  business: {
    label: 'Business',
    emoji: '💼',
    color: '#64748B',
    bgColor: 'bg-slate-500/15',
    textColor: 'text-slate-400',
  },
  travel: {
    label: 'Travel',
    emoji: '✈',
    color: '#10B981',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
  },
  other: {
    label: 'Other',
    emoji: '📦',
    color: '#94A3B8',
    bgColor: 'bg-slate-400/15',
    textColor: 'text-slate-400',
  },
};

export const INCOME_CATEGORIES: Record<IncomeCategory, CategoryMeta> = {
  salary: {
    label: 'Salary',
    emoji: '💰',
    color: '#22C55E',
    bgColor: 'bg-green-500/15',
    textColor: 'text-green-400',
  },
  freelancing: {
    label: 'Freelancing',
    emoji: '💻',
    color: '#34D399',
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
  },
  business: {
    label: 'Business',
    emoji: '🏢',
    color: '#4ADE80',
    bgColor: 'bg-green-400/15',
    textColor: 'text-green-300',
  },
  gift: {
    label: 'Gift',
    emoji: '🎁',
    color: '#F9A8D4',
    bgColor: 'bg-pink-300/15',
    textColor: 'text-pink-300',
  },
  bonus: {
    label: 'Bonus',
    emoji: '🌟',
    color: '#FCD34D',
    bgColor: 'bg-yellow-300/15',
    textColor: 'text-yellow-300',
  },
  other: {
    label: 'Other Income',
    emoji: '💵',
    color: '#86EFAC',
    bgColor: 'bg-green-300/15',
    textColor: 'text-green-300',
  },
};

export const ALL_CATEGORIES = { ...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES };

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
];

export const DEFAULT_BUDGET = {
  monthly: 0,
  weekly: 0,
  daily: 0,
  categoryBudgets: {},
};

export const DEFAULT_SETTINGS = {
  darkMode: true,
  currency: 'USD',
  currencySymbol: '$',
  language: 'English',
  pinEnabled: false,
  pin: '',
  biometricEnabled: false,
  dailyReminderEnabled: true,
  budgetAlertEnabled: true,
  budgetAlertThreshold: 80,
};

export const CHART_COLORS = [
  '#F97316', '#3B82F6', '#8B5CF6', '#EAB308',
  '#EC4899', '#14B8A6', '#EF4444', '#06B6D4',
  '#6366F1', '#64748B', '#10B981', '#94A3B8',
];
