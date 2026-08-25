import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { formatCurrency, getMonthStart, getYearStart } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CHART_COLORS } from '@/constants';
import { exportToCSV } from '@/lib/storage';
import type { ReportPeriod } from '@/types';
import { cn } from '@/lib/utils';

interface ReportsProps {
  appData: ReturnType<typeof import('@/hooks/useAppData').useAppData>;
  onMenuToggle: () => void;
}

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export default function Reports({ appData, onMenuToggle }: ReportsProps) {
  const { data } = appData;
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const symbol = data.settings.currencySymbol;

  const now = new Date();

  // Bar chart data (income vs expense by period)
  const barData = useMemo(() => {
    if (period === 'monthly') {
      const months: { name: string; income: number; expense: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthTx = data.transactions.filter((t) => t.date.startsWith(monthStr));
        months.push({
          name: d.toLocaleDateString('en-US', { month: 'short' }),
          income: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return months;
    }
    if (period === 'weekly') {
      const weeks: { name: string; income: number; expense: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - i * 7 - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        const weekTx = data.transactions.filter((t) => t.date >= startStr && t.date <= endStr);
        weeks.push({
          name: `W${8 - i}`,
          income: weekTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: weekTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return weeks;
    }
    if (period === 'daily') {
      const days: { name: string; income: number; expense: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const dayTx = data.transactions.filter((t) => t.date === ds);
        days.push({
          name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          income: dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return days;
    }
    // Yearly - by month of current year
    const months: { name: string; income: number; expense: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthStr = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
      const monthTx = data.transactions.filter((t) => t.date.startsWith(monthStr));
      months.push({
        name: new Date(now.getFullYear(), m, 1).toLocaleDateString('en-US', { month: 'short' }),
        income: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [data.transactions, period]);

  // Category pie data
  const categoryPieData = useMemo(() => {
    const startDate = period === 'monthly'
      ? getMonthStart()
      : period === 'yearly'
      ? getYearStart()
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() - (period === 'weekly' ? 7 : 14));
          return d.toISOString().split('T')[0];
        })();
    const txs = data.transactions.filter((t) => t.type === 'expense' && t.date >= startDate);
    const totals: Record<string, number> = {};
    for (const tx of txs) totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val], i) => ({
        name: (EXPENSE_CATEGORIES as Record<string, { label: string; emoji: string }>)[cat]?.label ?? cat,
        emoji: (EXPENSE_CATEGORIES as Record<string, { emoji: string }>)[cat]?.emoji ?? '',
        value: val,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [data.transactions, period]);

  // Income category pie
  const incomePieData = useMemo(() => {
    const monthStart = getMonthStart();
    const txs = data.transactions.filter((t) => t.type === 'income' && t.date >= monthStart);
    const totals: Record<string, number> = {};
    for (const tx of txs) totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
    return Object.entries(totals).map(([cat, val], i) => ({
      name: (INCOME_CATEGORIES as Record<string, { label: string; emoji: string }>)[cat]?.label ?? cat,
      value: val,
      color: ['#22c55e', '#34d399', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'][i % 6],
    }));
  }, [data.transactions]);

  // Line chart (savings trend)
  const savingsTrend = useMemo(() => {
    return barData.map((d) => ({
      name: d.name,
      savings: Math.max(0, d.income - d.expense),
      netFlow: d.income - d.expense,
    }));
  }, [barData]);

  const totalIncome = barData.reduce((s, d) => s + d.income, 0);
  const totalExpense = barData.reduce((s, d) => s + d.expense, 0);
  const totalSavings = Math.max(0, totalIncome - totalExpense);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header onMenuToggle={onMenuToggle} title="Reports" subtitle="Financial analysis" />

      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Period selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  period === key
                    ? 'bg-yellow-500 text-slate-900 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportToCSV(data.transactions, symbol)}
            className="btn-secondary ml-auto"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Income', value: totalIncome, color: 'text-emerald-400', icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Total Expense', value: totalExpense, color: 'text-rose-400', icon: <TrendingDown className="w-4 h-4" /> },
            { label: 'Net Savings', value: totalSavings, color: 'text-violet-400', icon: <BarChart2 className="w-4 h-4" /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className={cn('flex items-center justify-center gap-1 text-xs text-slate-500 mb-1', color)}>
                {icon} {label}
              </div>
              <div className={cn('text-xl font-display font-bold', color)}>
                {formatCurrency(value, symbol)}
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v, symbol), '']}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expense pie */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Expense by Category</h3>
            {categoryPieData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={categoryPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                      {categoryPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }}
                      formatter={(v: number) => [formatCurrency(v, symbol), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryPieData.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-slate-400">{c.emoji} {c.name}</span>
                      </div>
                      <span className="text-slate-300 font-semibold">{formatCurrency(c.value, symbol)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No expense data</div>
            )}
          </div>

          {/* Income pie */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Income Sources</h3>
            {incomePieData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={incomePieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                      {incomePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }}
                      formatter={(v: number) => [formatCurrency(v, symbol), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {incomePieData.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-slate-400">{c.name}</span>
                      </div>
                      <span className="text-slate-300 font-semibold">{formatCurrency(c.value, symbol)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No income data</div>
            )}
          </div>
        </div>

        {/* Savings trend */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Savings & Net Flow Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={savingsTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v, symbol), '']}
              />
              <Line type="monotone" dataKey="savings" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} name="Savings" />
              <Line type="monotone" dataKey="netFlow" stroke="#eab308" strokeWidth={2} strokeDasharray="4 2" dot={false} name="Net Flow" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-1.5 rounded-full bg-violet-500" />Savings</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-0.5 bg-yellow-500" />Net Flow</div>
          </div>
        </div>
      </div>
    </div>
  );
}
