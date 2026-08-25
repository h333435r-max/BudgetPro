import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowRight, Calendar, Zap, Target, Brain, Repeat, Flame,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import Header from '@/components/layout/Header';
import SummaryCard from '@/components/features/SummaryCard';
import BudgetProgress from '@/components/features/BudgetProgress';
import TransactionItem from '@/components/features/TransactionItem';
import TransactionForm from '@/components/features/TransactionForm';
import { formatCurrency, getMonthStart, formatShortDate, getPercentage } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CHART_COLORS } from '@/constants';
import type { Transaction } from '@/types';

interface DashboardProps {
  appData: ReturnType<typeof import('@/hooks/useAppData').useAppData>;
  onMenuToggle: () => void;
}

export default function Dashboard({ appData, onMenuToggle }: DashboardProps) {
  const { data, stats, addTransaction, deleteTransaction, updateTransaction } = appData;
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const symbol = data.settings.currencySymbol;
  const monthStart = getMonthStart();

  // Category breakdown this month
  const categoryData = useMemo(() => {
    const monthTx = data.transactions.filter(
      (t) => t.type === 'expense' && t.date >= monthStart,
    );
    const totals: Record<string, number> = {};
    for (const tx of monthTx) {
      totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
    }
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, val], i) => ({
        name: (EXPENSE_CATEGORIES as Record<string, { label: string; emoji: string }>)[cat]?.label ?? cat,
        value: val,
        color: CHART_COLORS[i % CHART_COLORS.length],
        emoji: (EXPENSE_CATEGORIES as Record<string, { emoji: string }>)[cat]?.emoji ?? '📦',
      }));
  }, [data.transactions, monthStart]);

  // Last 7 days chart
  const areaData = useMemo(() => {
    const days: { date: string; expense: number; income: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayTx = data.transactions.filter((t) => t.date === ds);
      days.push({
        date: formatShortDate(ds),
        expense: dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        income: dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      });
    }
    return days;
  }, [data.transactions]);

  const recent = data.transactions.slice(0, 5);
  const budgetPct = getPercentage(stats.monthExpense, data.budget.monthly);
  const budgetAlert = data.budget.monthly > 0 && budgetPct >= (data.settings.budgetAlertThreshold ?? 80);

  const handleEdit = (tx: Transaction) => {
    setEditTx(tx);
    setShowForm(true);
  };

  const handleFormSubmit = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editTx) {
      updateTransaction(editTx.id, txData);
    } else {
      addTransaction(txData);
    }
    setShowForm(false);
    setEditTx(null);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        onMenuToggle={onMenuToggle}
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        budgetAlert={budgetAlert}
      />

      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <SummaryCard
            title="Monthly Income"
            amount={stats.monthIncome}
            currencySymbol={symbol}
            icon={<TrendingUp className="w-5 h-5" />}
            type="income"
            subtitle="This month"
          />
          <SummaryCard
            title="Monthly Spend"
            amount={stats.monthExpense}
            currencySymbol={symbol}
            icon={<TrendingDown className="w-5 h-5" />}
            type="expense"
            subtitle="This month"
          />
          <SummaryCard
            title="Balance"
            amount={stats.balance}
            currencySymbol={symbol}
            icon={<Wallet className="w-5 h-5" />}
            type="balance"
            subtitle="Total net"
          />
          <SummaryCard
            title="Savings"
            amount={stats.savings}
            currencySymbol={symbol}
            icon={<PiggyBank className="w-5 h-5" />}
            type="savings"
            subtitle={`${stats.savingsRate.toFixed(1)}% rate`}
          />
        </div>

        {/* Today + Budget row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today quick stats */}
          <div className="glass-card p-5 col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-white text-sm">Today</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Spent</span>
                <span className="text-rose-400 font-bold">{formatCurrency(stats.todayExpense, symbol)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Earned</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(stats.todayIncome, symbol)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">This Week</span>
                <span className="text-blue-400 font-bold">{formatCurrency(stats.weekExpense, symbol)}</span>
              </div>
              {data.budget.daily > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <BudgetProgress
                    label="Daily Budget"
                    spent={stats.todayExpense}
                    limit={data.budget.daily}
                    currencySymbol={symbol}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Monthly Budget */}
          <div className="glass-card p-5 col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-400" />
                <h3 className="font-semibold text-white text-sm">Monthly Budget</h3>
              </div>
              <button onClick={() => navigate('/budget')} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {data.budget.monthly > 0 ? (
              <div className="space-y-4">
                <BudgetProgress
                  label="Total Monthly"
                  spent={stats.monthExpense}
                  limit={data.budget.monthly}
                  currencySymbol={symbol}
                />
                {data.budget.weekly > 0 && (
                  <BudgetProgress
                    label="Weekly"
                    spent={stats.weekExpense}
                    limit={data.budget.weekly}
                    currencySymbol={symbol}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Zap className="w-8 h-8 text-yellow-500/40 mb-2" />
                <p className="text-sm text-slate-500 mb-3">No budget set</p>
                <button onClick={() => navigate('/budget')} className="btn-primary text-xs px-3 py-2">
                  Set Budget
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Area chart */}
          <div className="glass-card p-5 lg:col-span-3">
            <h3 className="font-semibold text-white text-sm mb-4">7-Day Cash Flow</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={areaData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }}
                  formatter={(value: number) => [formatCurrency(value, symbol), '']}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-3 h-1.5 rounded-full bg-emerald-500" />Income
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-3 h-1.5 rounded-full bg-rose-500" />Expense
              </div>
            </div>
          </div>

          {/* Pie chart */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="font-semibold text-white text-sm mb-4">Spending by Category</h3>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }}
                      formatter={(value: number) => [formatCurrency(value, symbol), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryData.slice(0, 4).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                        <span className="text-slate-400 truncate">{c.emoji} {c.name}</span>
                      </div>
                      <span className="text-slate-300 font-medium flex-shrink-0 ml-2">{formatCurrency(c.value, symbol)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Quick navigation shortcuts */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: '/heatmap', icon: <Flame className="w-5 h-5" />, label: 'Heatmap', sub: 'Spending patterns', color: 'from-orange-600/20 to-rose-800/10 border-orange-500/20 text-orange-400' },
            { to: '/recurring', icon: <Repeat className="w-5 h-5" />, label: 'Recurring', sub: `${data.recurringTransactions.filter(r=>r.active).length} active`, color: 'from-blue-600/20 to-blue-800/10 border-blue-500/20 text-blue-400' },
            { to: '/ai-advisor', icon: <Brain className="w-5 h-5" />, label: 'AI Advisor', sub: 'Get insights', color: 'from-violet-600/20 to-violet-800/10 border-violet-500/20 text-violet-400' },
          ].map(({ to, icon, label, sub, color }) => (
            <button key={to} onClick={() => navigate(to)}
              className={`glass-card p-4 text-center hover:scale-105 active:scale-95 transition-transform bg-gradient-to-br border ${color}`}>
              <div className="flex justify-center mb-2">{icon}</div>
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">Recent Transactions</h3>
            <button onClick={() => navigate('/transactions')} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recent.length > 0 ? (
            <div className="space-y-2">
              {recent.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  currencySymbol={symbol}
                  onDelete={deleteTransaction}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-sm">
              No transactions yet. Add your first one!
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditTx(null); setShowForm(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 gold-gradient rounded-2xl shadow-2xl shadow-yellow-500/20 flex items-center justify-center text-slate-900 text-2xl font-bold hover:scale-105 active:scale-95 transition-transform lg:hidden z-20"
      >
        +
      </button>

      {/* Transaction Form */}
      {showForm && (
        <TransactionForm
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditTx(null); }}
          editData={editTx}
          currencySymbol={symbol}
        />
      )}
    </div>
  );
}
