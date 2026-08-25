import { useState } from 'react';
import { Save, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import BudgetProgress from '@/components/features/BudgetProgress';
import { formatCurrency, getMonthStart, getWeekStart, getTodayStr } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/constants';
import type { Budget, ExpenseCategory } from '@/types';
import { cn } from '@/lib/utils';

interface BudgetProps {
  appData: ReturnType<typeof import('@/hooks/useAppData').useAppData>;
  onMenuToggle: () => void;
}

export default function BudgetPage({ appData, onMenuToggle }: BudgetProps) {
  const { data, updateBudget, stats } = appData;
  const symbol = data.settings.currencySymbol;

  const [form, setForm] = useState<Budget>({ ...data.budget });
  const [dirty, setDirty] = useState(false);

  const monthStart = getMonthStart();
  const weekStart = getWeekStart();
  const today = getTodayStr();

  const categoryExpenses: Record<string, number> = {};
  for (const tx of data.transactions) {
    if (tx.type === 'expense' && tx.date >= monthStart) {
      categoryExpenses[tx.category] = (categoryExpenses[tx.category] ?? 0) + tx.amount;
    }
  }

  const handleSave = () => {
    updateBudget(form);
    setDirty(false);
    toast.success('Budget saved successfully!');
  };

  const updateField = (field: keyof Pick<Budget, 'monthly' | 'weekly' | 'daily'>, val: string) => {
    setForm((f) => ({ ...f, [field]: Number(val) || 0 }));
    setDirty(true);
  };

  const updateCategoryBudget = (cat: ExpenseCategory, val: string) => {
    setForm((f) => ({
      ...f,
      categoryBudgets: { ...f.categoryBudgets, [cat]: Number(val) || 0 },
    }));
    setDirty(true);
  };

  const budgetStatus = (spent: number, limit: number) => {
    if (limit === 0) return null;
    const pct = (spent / limit) * 100;
    if (pct >= 100) return 'exceeded';
    if (pct >= 80) return 'warning';
    return 'ok';
  };

  const monthStatus = budgetStatus(stats.monthExpense, form.monthly);
  const weekStatus = budgetStatus(stats.weekExpense, form.weekly);
  const dayStatus = budgetStatus(stats.todayExpense, form.daily);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header onMenuToggle={onMenuToggle} title="Budget" subtitle="Set spending limits" />

      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Main budget limits */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-white">Spending Limits</h3>
            </div>
            {dirty && (
              <button onClick={handleSave} className="btn-primary">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'daily' as const, label: 'Daily Budget', spent: stats.todayExpense, status: dayStatus },
              { key: 'weekly' as const, label: 'Weekly Budget', spent: stats.weekExpense, status: weekStatus },
              { key: 'monthly' as const, label: 'Monthly Budget', spent: stats.monthExpense, status: monthStatus },
            ].map(({ key, label, spent, status }) => (
              <div key={key} className={cn(
                'p-4 rounded-xl border',
                status === 'exceeded' ? 'bg-rose-500/10 border-rose-500/30' :
                status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-slate-800/40 border-slate-700/50'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                  {status === 'exceeded' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {status === 'ok' && form[key] > 0 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-slate-400 font-bold">{symbol}</span>
                  <input
                    type="number"
                    value={form[key] || ''}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent border-b border-slate-600 text-white font-bold text-lg focus:outline-none focus:border-yellow-500 pb-1"
                    min="0"
                  />
                </div>
                {form[key] > 0 && (
                  <BudgetProgress
                    label=""
                    spent={spent}
                    limit={form[key]}
                    currencySymbol={symbol}
                    showNumbers={false}
                  />
                )}
                <div className="text-xs text-slate-500 mt-1">
                  Spent: <span className="text-slate-300">{formatCurrency(spent, symbol)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert threshold */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold text-white">Budget Alert Threshold</h3>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={data.settings.budgetAlertThreshold ?? 80}
              onChange={(e) => {
                appData.updateSettings({
                  ...data.settings,
                  budgetAlertThreshold: Number(e.target.value),
                });
              }}
              className="flex-1 accent-yellow-500"
            />
            <span className="text-yellow-400 font-bold text-lg w-12 text-right">
              {data.settings.budgetAlertThreshold ?? 80}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Alert notification fires when spending reaches this percentage of budget
          </p>
        </div>

        {/* Category budgets */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-semibold text-white">Category Budgets (Monthly)</h3>
            <span className="text-xs text-slate-500 ml-auto">Optional per-category limits</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(EXPENSE_CATEGORIES).map(([key, meta]) => {
              const catKey = key as ExpenseCategory;
              const spent = categoryExpenses[catKey] ?? 0;
              const limit = form.categoryBudgets[catKey] ?? 0;
              const status = budgetStatus(spent, limit);
              return (
                <div
                  key={key}
                  className={cn(
                    'p-3 rounded-xl border transition-colors',
                    status === 'exceeded' ? 'border-rose-500/30 bg-rose-500/5' :
                    status === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-slate-700/50 bg-slate-800/30',
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{meta.emoji}</span>
                    <span className="text-sm font-medium text-slate-300 flex-1">{meta.label}</span>
                    <span className="text-xs text-slate-500">
                      {formatCurrency(spent, symbol)} spent
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm">{symbol}</span>
                    <input
                      type="number"
                      value={form.categoryBudgets[catKey] || ''}
                      onChange={(e) => updateCategoryBudget(catKey, e.target.value)}
                      placeholder="No limit"
                      className="flex-1 bg-transparent border-b border-slate-700 text-white text-sm focus:outline-none focus:border-yellow-500 pb-1"
                      min="0"
                    />
                  </div>
                  {limit > 0 && (
                    <div className="mt-2">
                      <BudgetProgress label="" spent={spent} limit={limit} currencySymbol={symbol} showNumbers={false} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button (bottom) */}
        {dirty && (
          <div className="sticky bottom-4 flex justify-end">
            <button onClick={handleSave} className="btn-primary shadow-2xl shadow-yellow-500/20 px-8 py-3 text-base">
              <Save className="w-5 h-5" />
              Save All Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
