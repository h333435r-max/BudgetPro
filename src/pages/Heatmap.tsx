import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import TransactionItem from '@/components/features/TransactionItem';
import { formatCurrency, getDaysInMonth } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types';

interface HeatmapProps {
  appData: ReturnType<typeof import('@/hooks/useAppData').useAppData>;
  onMenuToggle: () => void;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function getHeatColor(amount: number, max: number): string {
  if (amount === 0 || max === 0) return '';
  const ratio = amount / max;
  if (ratio < 0.1) return 'bg-emerald-900/60 border-emerald-700/40';
  if (ratio < 0.25) return 'bg-emerald-700/70 border-emerald-500/50';
  if (ratio < 0.45) return 'bg-yellow-700/70 border-yellow-500/50';
  if (ratio < 0.65) return 'bg-orange-600/70 border-orange-400/60';
  if (ratio < 0.85) return 'bg-rose-600/70 border-rose-400/60';
  return 'bg-rose-500 border-rose-300/70';
}

function getCellTextColor(amount: number, max: number): string {
  if (amount === 0 || max === 0) return 'text-slate-600';
  const ratio = amount / max;
  if (ratio < 0.1) return 'text-emerald-300';
  if (ratio < 0.45) return 'text-yellow-200';
  return 'text-white';
}

export default function HeatmapPage({ appData, onMenuToggle }: HeatmapProps) {
  const { data, deleteTransaction, updateTransaction } = appData;
  const symbol = data.settings.currencySymbol;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // Build daily expense map
  const dailyExpense = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of data.transactions) {
      if (tx.type === 'expense') {
        map[tx.date] = (map[tx.date] ?? 0) + tx.amount;
      }
    }
    return map;
  }, [data.transactions]);

  // Month view: build calendar grid
  const monthGrid = useMemo(() => {
    const year = viewYear;
    const month = viewMonth;
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = getDaysInMonth(year, month);
    // Convert to Mon-first: Sun(0)->6, Mon(1)->0, ...
    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);

    const cells: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push(ds);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthMax = useMemo(() => {
    return Math.max(...monthGrid.filter(Boolean).map((d) => dailyExpense[d!] ?? 0), 1);
  }, [monthGrid, dailyExpense]);

  const monthTotal = useMemo(() => {
    return monthGrid.filter(Boolean).reduce((s, d) => s + (dailyExpense[d!] ?? 0), 0);
  }, [monthGrid, dailyExpense]);

  // Year view: 12-month overview grid (each cell = one month)
  const yearGrid = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const monthStr = `${viewYear}-${String(m + 1).padStart(2, '0')}`;
      const total = Object.entries(dailyExpense)
        .filter(([d]) => d.startsWith(monthStr))
        .reduce((s, [, v]) => s + v, 0);
      return { month: m, label: MONTH_NAMES[m], total };
    });
  }, [viewYear, dailyExpense]);

  const yearMax = useMemo(() => Math.max(...yearGrid.map((m) => m.total), 1), [yearGrid]);
  const yearTotal = useMemo(() => yearGrid.reduce((s, m) => s + m.total, 0), [yearGrid]);

  const selectedDayTxs: Transaction[] = selectedDay
    ? data.transactions.filter((t) => t.date === selectedDay)
    : [];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header onMenuToggle={onMenuToggle} title="Spending Heatmap" subtitle="Visualize your spending patterns" />

      <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
        {/* View toggle */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50">
            {(['month', 'year'] as const).map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                  viewMode === v ? 'bg-yellow-500 text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-200'
                )}>
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          {viewMode === 'month' ? (
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="btn-secondary p-2">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white min-w-[120px] text-center">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} className="btn-secondary p-2">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setViewYear((y) => y - 1)} className="btn-secondary p-2">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white min-w-[60px] text-center">{viewYear}</span>
              <button onClick={() => setViewYear((y) => y + 1)} className="btn-secondary p-2">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Low</span>
          <div className="flex gap-1">
            {['bg-slate-700/40','bg-emerald-800/60','bg-emerald-600/70','bg-yellow-700/70','bg-orange-600/70','bg-rose-600/70','bg-rose-500'].map((c, i) => (
              <div key={i} className={cn('w-5 h-3 rounded-sm', c)} />
            ))}
          </div>
          <span>High</span>
          <span className="ml-auto font-semibold text-slate-300">
            Total: {formatCurrency(viewMode === 'month' ? monthTotal : yearTotal, symbol)}
          </span>
        </div>

        {/* Month heatmap */}
        {viewMode === 'month' && (
          <div className="glass-card p-5">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-500">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthGrid.map((dateStr, i) => {
                if (!dateStr) return <div key={`empty-${i}`} />;
                const amt = dailyExpense[dateStr] ?? 0;
                const day = parseInt(dateStr.split('-')[2]);
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const isSelected = selectedDay === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    title={amt > 0 ? `${formatCurrency(amt, symbol)}` : 'No spending'}
                    className={cn(
                      'aspect-square rounded-lg border text-xs font-semibold transition-all duration-150 flex flex-col items-center justify-center gap-0.5',
                      'hover:scale-105 hover:shadow-lg active:scale-95',
                      amt > 0 ? getHeatColor(amt, monthMax) : 'bg-slate-800/40 border-slate-700/30',
                      amt > 0 ? getCellTextColor(amt, monthMax) : 'text-slate-600',
                      isToday && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900',
                      isSelected && 'ring-2 ring-white ring-offset-1 ring-offset-slate-900',
                    )}
                  >
                    <span className="text-[10px] leading-none opacity-70">{day}</span>
                    {amt > 0 && (
                      <span className="text-[9px] leading-none font-bold">
                        {symbol}{amt >= 1000 ? `${(amt/1000).toFixed(1)}k` : amt.toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Year heatmap: 12 month blocks */}
        {viewMode === 'year' && (
          <div className="glass-card p-5">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {yearGrid.map(({ month, label, total }) => {
                const isCurrentMonth = viewYear === today.getFullYear() && month === today.getMonth();
                return (
                  <button
                    key={month}
                    onClick={() => { setViewMonth(month); setViewMode('month'); }}
                    className={cn(
                      'p-4 rounded-xl border text-center transition-all hover:scale-105 active:scale-95',
                      total > 0 ? getHeatColor(total, yearMax) : 'bg-slate-800/40 border-slate-700/30',
                      isCurrentMonth && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900',
                    )}
                  >
                    <div className={cn('text-sm font-semibold mb-1', total > 0 ? getCellTextColor(total, yearMax) : 'text-slate-500')}>
                      {label}
                    </div>
                    <div className={cn('text-xs font-bold', total > 0 ? getCellTextColor(total, yearMax) : 'text-slate-600')}>
                      {total > 0 ? formatCurrency(total, symbol) : 'No data'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected day panel */}
        {selectedDay && (
          <div className="glass-card p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedDayTxs.length} transaction{selectedDayTxs.length !== 1 ? 's' : ''} &bull;
                  Total: {formatCurrency(dailyExpense[selectedDay] ?? 0, symbol)}
                </p>
              </div>
              <button onClick={() => setSelectedDay(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedDayTxs.length > 0 ? (
              <div className="space-y-2">
                {selectedDayTxs.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} currencySymbol={symbol}
                    onDelete={deleteTransaction} onEdit={() => {}} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">No transactions on this day</p>
            )}
          </div>
        )}

        {/* Stats row */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Highest Day', value: Math.max(...monthGrid.filter(Boolean).map((d) => dailyExpense[d!] ?? 0), 0) },
              { label: 'Average/Day', value: monthTotal / Math.max(monthGrid.filter(d => d && (dailyExpense[d] ?? 0) > 0).length, 1) },
              { label: 'Active Days', value: null, count: monthGrid.filter(d => d && (dailyExpense[d] ?? 0) > 0).length },
              { label: 'Month Total', value: monthTotal },
            ].map(({ label, value, count }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="text-lg font-bold text-yellow-400">
                  {count !== undefined ? count : formatCurrency(value!, symbol)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
