import { useState, useCallback, useMemo } from 'react';
import type { AppData, Transaction, RecurringTransaction, Budget, Settings, SummaryStats } from '@/types';
import { loadAppData, saveAppData } from '@/lib/storage';
import { getTodayStr, getWeekStart, getMonthStart, generateId, computeNextDueDate } from '@/lib/utils';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadAppData());

  const persist = useCallback((newData: AppData) => {
    setData(newData);
    saveAppData(newData);
  }, []);

  // Transactions
  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
      const newTx: Transaction = { ...tx, id: generateId(), createdAt: new Date().toISOString() };
      persist({ ...data, transactions: [newTx, ...data.transactions] });
    },
    [data, persist],
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      const txs = data.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
      persist({ ...data, transactions: txs });
    },
    [data, persist],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      const txs = data.transactions.filter((t) => t.id !== id);
      persist({ ...data, transactions: txs });
    },
    [data, persist],
  );

  // Recurring Transactions
  const addRecurring = useCallback(
    (rec: Omit<RecurringTransaction, 'id' | 'createdAt' | 'nextDueDate'>) => {
      const nextDueDate = computeNextDueDate(rec.startDate, rec.frequency);
      const newRec: RecurringTransaction = { ...rec, id: generateId(), nextDueDate, createdAt: new Date().toISOString() };
      persist({ ...data, recurringTransactions: [newRec, ...data.recurringTransactions] });
    },
    [data, persist],
  );

  const updateRecurring = useCallback(
    (id: string, updates: Partial<RecurringTransaction>) => {
      const recs = data.recurringTransactions.map((r) => (r.id === id ? { ...r, ...updates } : r));
      persist({ ...data, recurringTransactions: recs });
    },
    [data, persist],
  );

  const deleteRecurring = useCallback(
    (id: string) => {
      const recs = data.recurringTransactions.filter((r) => r.id !== id);
      persist({ ...data, recurringTransactions: recs });
    },
    [data, persist],
  );

  const processRecurring = useCallback(
    (id: string) => {
      const rec = data.recurringTransactions.find((r) => r.id === id);
      if (!rec) return;
      const newTx: Transaction = {
        id: generateId(),
        type: rec.type,
        amount: rec.amount,
        category: rec.category,
        note: rec.note,
        date: getTodayStr(),
        createdAt: new Date().toISOString(),
        isRecurring: true,
        recurringId: rec.id,
      };
      const nextDueDate = computeNextDueDate(getTodayStr(), rec.frequency);
      const updatedRec = { ...rec, lastProcessed: getTodayStr(), nextDueDate };
      const newData: AppData = {
        ...data,
        transactions: [newTx, ...data.transactions],
        recurringTransactions: data.recurringTransactions.map((r) => (r.id === id ? updatedRec : r)),
      };
      persist(newData);
    },
    [data, persist],
  );

  // Budget
  const updateBudget = useCallback(
    (budget: Budget) => persist({ ...data, budget }),
    [data, persist],
  );

  // Settings
  const updateSettings = useCallback(
    (settings: Settings) => persist({ ...data, settings }),
    [data, persist],
  );

  // Stats
  const stats = useMemo<SummaryStats>(() => {
    const today = getTodayStr();
    const weekStart = getWeekStart();
    const monthStart = getMonthStart();

    let totalIncome = 0, totalExpense = 0, todayExpense = 0, todayIncome = 0;
    let weekExpense = 0, monthExpense = 0, monthIncome = 0;

    for (const tx of data.transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        if (tx.date === today) todayIncome += tx.amount;
        if (tx.date >= monthStart) monthIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        if (tx.date === today) todayExpense += tx.amount;
        if (tx.date >= weekStart) weekExpense += tx.amount;
        if (tx.date >= monthStart) monthExpense += tx.amount;
      }
    }

    const balance = totalIncome - totalExpense;
    const savings = monthIncome - monthExpense;
    const savingsRate = monthIncome > 0 ? (savings / monthIncome) * 100 : 0;

    return {
      totalIncome, totalExpense, balance, todayExpense, todayIncome,
      weekExpense, monthExpense, monthIncome,
      savings: Math.max(0, savings),
      savingsRate: Math.max(0, savingsRate),
    };
  }, [data.transactions]);

  return {
    data, stats,
    addTransaction, updateTransaction, deleteTransaction,
    addRecurring, updateRecurring, deleteRecurring, processRecurring,
    updateBudget, updateSettings,
  };
}
