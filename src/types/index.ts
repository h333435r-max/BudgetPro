export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'home'
  | 'bills'
  | 'entertainment'
  | 'shopping'
  | 'medical'
  | 'education'
  | 'mobile'
  | 'business'
  | 'travel'
  | 'other';

export type IncomeCategory =
  | 'salary'
  | 'freelancing'
  | 'business'
  | 'gift'
  | 'bonus'
  | 'other';

export type Category = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note: string;
  date: string; // ISO date string
  createdAt: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringId?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  lastProcessed?: string;
  active: boolean;
  createdAt: string;
}

export interface Budget {
  monthly: number;
  weekly: number;
  daily: number;
  categoryBudgets: Partial<Record<ExpenseCategory, number>>;
}

export interface Settings {
  darkMode: boolean;
  currency: string;
  currencySymbol: string;
  language: string;
  pinEnabled: boolean;
  pin: string;
  biometricEnabled: boolean;
  dailyReminderEnabled: boolean;
  budgetAlertEnabled: boolean;
  budgetAlertThreshold: number; // percentage 0-100
}

export interface AppData {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  budget: Budget;
  settings: Settings;
}

export interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  todayExpense: number;
  todayIncome: number;
  weekExpense: number;
  monthExpense: number;
  monthIncome: number;
  savings: number;
  savingsRate: number;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ChartType = 'pie' | 'bar' | 'line';

export interface AIInsight {
  type: 'tip' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

export interface AIAdvisorResult {
  healthScore: number;
  summary: string;
  insights: AIInsight[];
  recommendations: string[];
  generatedAt: string;
}
