import type { AppData, Budget, Settings, Transaction, RecurringTransaction } from '@/types';
import { DEFAULT_BUDGET, DEFAULT_SETTINGS } from '@/constants';

const STORAGE_KEY = 'budgetpro_data';

function getSampleTransactions(): Transaction[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const days = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return fmt(d);
  };

  return [
    { id: '1', type: 'income', amount: 4500, category: 'salary', note: 'Monthly Salary', date: days(1), createdAt: new Date().toISOString() },
    { id: '2', type: 'expense', amount: 85, category: 'food', note: 'Grocery shopping', date: fmt(today), createdAt: new Date().toISOString() },
    { id: '3', type: 'expense', amount: 45, category: 'transport', note: 'Gas fill-up', date: fmt(today), createdAt: new Date().toISOString() },
    { id: '4', type: 'expense', amount: 120, category: 'bills', note: 'Electricity bill', date: days(1), createdAt: new Date().toISOString() },
    { id: '5', type: 'expense', amount: 35, category: 'entertainment', note: 'Netflix & Spotify', date: days(2), createdAt: new Date().toISOString() },
    { id: '6', type: 'expense', amount: 200, category: 'shopping', note: 'New clothes', date: days(3), createdAt: new Date().toISOString() },
    { id: '7', type: 'income', amount: 350, category: 'freelancing', note: 'Logo design project', date: days(4), createdAt: new Date().toISOString() },
    { id: '8', type: 'expense', amount: 60, category: 'food', note: 'Restaurant dinner', date: days(4), createdAt: new Date().toISOString() },
    { id: '9', type: 'expense', amount: 25, category: 'mobile', note: 'Phone bill', date: days(5), createdAt: new Date().toISOString() },
    { id: '10', type: 'expense', amount: 150, category: 'medical', note: 'Doctor visit', date: days(6), createdAt: new Date().toISOString() },
    { id: '11', type: 'expense', amount: 90, category: 'food', note: 'Weekly groceries', date: days(7), createdAt: new Date().toISOString() },
    { id: '12', type: 'income', amount: 200, category: 'bonus', note: 'Performance bonus', date: days(7), createdAt: new Date().toISOString() },
    { id: '13', type: 'expense', amount: 400, category: 'home', note: 'Utility maintenance', date: days(8), createdAt: new Date().toISOString() },
    { id: '14', type: 'expense', amount: 75, category: 'entertainment', note: 'Movie night out', date: days(9), createdAt: new Date().toISOString() },
    { id: '15', type: 'expense', amount: 55, category: 'transport', note: 'Uber rides', date: days(10), createdAt: new Date().toISOString() },
    { id: '16', type: 'expense', amount: 30, category: 'education', note: 'Online course', date: days(11), createdAt: new Date().toISOString() },
    { id: '17', type: 'expense', amount: 180, category: 'shopping', note: 'Electronics accessories', date: days(12), createdAt: new Date().toISOString() },
    { id: '18', type: 'income', amount: 500, category: 'business', note: 'Side project payment', date: days(13), createdAt: new Date().toISOString() },
    { id: '19', type: 'expense', amount: 65, category: 'food', note: 'Lunch & coffee', date: days(14), createdAt: new Date().toISOString() },
    { id: '20', type: 'expense', amount: 110, category: 'bills', note: 'Internet bill', date: days(15), createdAt: new Date().toISOString() },
    // Extra months for heatmap
    { id: '21', type: 'expense', amount: 70, category: 'food', note: 'Groceries', date: days(20), createdAt: new Date().toISOString() },
    { id: '22', type: 'expense', amount: 320, category: 'shopping', note: 'Weekend shopping', date: days(22), createdAt: new Date().toISOString() },
    { id: '23', type: 'income', amount: 4500, category: 'salary', note: 'Monthly Salary', date: days(31), createdAt: new Date().toISOString() },
    { id: '24', type: 'expense', amount: 95, category: 'food', note: 'Grocery run', date: days(32), createdAt: new Date().toISOString() },
    { id: '25', type: 'expense', amount: 250, category: 'home', note: 'Home supplies', date: days(35), createdAt: new Date().toISOString() },
    { id: '26', type: 'expense', amount: 180, category: 'entertainment', note: 'Concert tickets', date: days(38), createdAt: new Date().toISOString() },
    { id: '27', type: 'expense', amount: 45, category: 'transport', note: 'Monthly transit pass', date: days(40), createdAt: new Date().toISOString() },
    { id: '28', type: 'income', amount: 4500, category: 'salary', note: 'Monthly Salary', date: days(62), createdAt: new Date().toISOString() },
    { id: '29', type: 'expense', amount: 110, category: 'bills', note: 'Water bill', date: days(60), createdAt: new Date().toISOString() },
    { id: '30', type: 'expense', amount: 600, category: 'shopping', note: 'Laptop accessories', date: days(63), createdAt: new Date().toISOString() },
  ];
}

function getSampleRecurring(): RecurringTransaction[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return [
    {
      id: 'r1', type: 'expense', amount: 15.99, category: 'entertainment', note: 'Netflix Subscription',
      frequency: 'monthly', startDate: fmt(today), nextDueDate: fmt(nextMonth),
      lastProcessed: fmt(today), active: true, createdAt: new Date().toISOString(),
    },
    {
      id: 'r2', type: 'expense', amount: 9.99, category: 'entertainment', note: 'Spotify Premium',
      frequency: 'monthly', startDate: fmt(today), nextDueDate: fmt(nextMonth),
      lastProcessed: fmt(today), active: true, createdAt: new Date().toISOString(),
    },
    {
      id: 'r3', type: 'income', amount: 4500, category: 'salary', note: 'Monthly Salary',
      frequency: 'monthly', startDate: fmt(today), nextDueDate: fmt(nextMonth),
      lastProcessed: fmt(today), active: true, createdAt: new Date().toISOString(),
    },
    {
      id: 'r4', type: 'expense', amount: 120, category: 'bills', note: 'Electricity Bill',
      frequency: 'monthly', startDate: fmt(today), nextDueDate: fmt(nextMonth),
      lastProcessed: fmt(today), active: true, createdAt: new Date().toISOString(),
    },
    {
      id: 'r5', type: 'expense', amount: 25, category: 'mobile', note: 'Phone Bill',
      frequency: 'monthly', startDate: fmt(today), nextDueDate: fmt(nextMonth),
      active: true, createdAt: new Date().toISOString(),
    },
  ];
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return {
        transactions: parsed.transactions ?? [],
        recurringTransactions: parsed.recurringTransactions ?? [],
        budget: { ...DEFAULT_BUDGET, ...(parsed.budget ?? {}) },
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      };
    }
  } catch {
    console.log('Failed to load data, using defaults');
  }
  return {
    transactions: getSampleTransactions(),
    recurringTransactions: getSampleRecurring(),
    budget: { ...DEFAULT_BUDGET, monthly: 3000, weekly: 700, daily: 100 },
    settings: DEFAULT_SETTINGS,
  };
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.log('Failed to save data');
  }
}

export function saveBudget(budget: Budget): void {
  const data = loadAppData();
  saveAppData({ ...data, budget });
}

export function saveSettings(settings: Settings): void {
  const data = loadAppData();
  saveAppData({ ...data, settings });
}

export function exportToCSV(transactions: Transaction[], currencySymbol: string): void {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category,
    `${t.type === 'income' ? '+' : '-'}${currencySymbol}${t.amount}`,
    `"${t.note}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `budgetpro_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
