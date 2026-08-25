import { useState, useMemo } from 'react';
import {
  Plus, Repeat, Calendar, Trash2, Edit3, CheckCircle,
  AlertTriangle, Clock, ToggleLeft, ToggleRight, X,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { formatCurrency, getDaysUntil, isOverdue, isDueToday, isDueSoon, getTodayStr, computeNextDueDate } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';
import { cn } from '@/lib/utils';
import type { RecurringTransaction, RecurringFrequency, TransactionType, Category } from '@/types';

interface RecurringProps {
  appData: ReturnType<typeof import('@/hooks/useAppData').useAppData>;
  onMenuToggle: () => void;
}

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly',
};
const FREQ_COLORS: Record<RecurringFrequency, string> = {
  daily: 'text-cyan-400 bg-cyan-500/15',
  weekly: 'text-blue-400 bg-blue-500/15',
  monthly: 'text-violet-400 bg-violet-500/15',
  yearly: 'text-yellow-400 bg-yellow-500/15',
};

interface RecurringFormState {
  type: TransactionType;
  amount: string;
  category: Category;
  note: string;
  frequency: RecurringFrequency;
  startDate: string;
}

export default function RecurringPage({ appData, onMenuToggle }: RecurringProps) {
  const { data, addRecurring, updateRecurring, deleteRecurring, processRecurring } = appData;
  const symbol = data.settings.currencySymbol;

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RecurringFormState>({
    type: 'expense', amount: '', category: 'bills', note: '', frequency: 'monthly', startDate: getTodayStr(),
  });
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const allCategories = { ...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES };

  const filtered = useMemo(() => {
    let list = data.recurringTransactions;
    if (filterType === 'active') list = list.filter((r) => r.active);
    if (filterType === 'inactive') list = list.filter((r) => !r.active);
    return [...list].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  }, [data.recurringTransactions, filterType]);

  // Upcoming calendar — next 30 days
  const upcomingEvents = useMemo(() => {
    const today = getTodayStr();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    const endStr = end.toISOString().split('T')[0];
    const events: { date: string; rec: RecurringTransaction }[] = [];
    for (const rec of data.recurringTransactions) {
      if (!rec.active) continue;
      let d = rec.nextDueDate;
      while (d <= endStr) {
        if (d >= today) events.push({ date: d, rec });
        d = computeNextDueDate(d, rec.frequency);
        if (rec.frequency === 'monthly' || rec.frequency === 'yearly') break;
      }
    }
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [data.recurringTransactions]);

  const monthlyImpact = useMemo(() => {
    let expense = 0, income = 0;
    for (const rec of data.recurringTransactions) {
      if (!rec.active) continue;
      const multiplier = rec.frequency === 'daily' ? 30 : rec.frequency === 'weekly' ? 4.33 : rec.frequency === 'yearly' ? 1/12 : 1;
      if (rec.type === 'expense') expense += rec.amount * multiplier;
      else income += rec.amount * multiplier;
    }
    return { expense, income };
  }, [data.recurringTransactions]);

  const openAdd = () => {
    setEditId(null);
    setForm({ type: 'expense', amount: '', category: 'bills', note: '', frequency: 'monthly', startDate: getTodayStr() });
    setShowForm(true);
  };

  const openEdit = (rec: RecurringTransaction) => {
    setEditId(rec.id);
    setForm({ type: rec.type, amount: rec.amount.toString(), category: rec.category, note: rec.note, frequency: rec.frequency, startDate: rec.startDate });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (editId) {
      const nextDue = computeNextDueDate(form.startDate, form.frequency);
      updateRecurring(editId, { ...form, amount: Number(form.amount), nextDueDate: nextDue });
      toast.success('Recurring transaction updated');
    } else {
      addRecurring({ ...form, amount: Number(form.amount), active: true });
      toast.success('Recurring transaction added');
    }
    setShowForm(false);
  };

  const handleProcess = (id: string, note: string) => {
    processRecurring(id);
    toast.success(`"${note}" logged for today`);
  };

  const handleDelete = (id: string) => {
    deleteRecurring(id);
    toast.success('Recurring transaction removed');
  };

  const handleToggle = (rec: RecurringTransaction) => {
    updateRecurring(rec.id, { active: !rec.active });
    toast.success(rec.active ? 'Paused' : 'Activated');
  };

  const getDueLabel = (dateStr: string, active: boolean) => {
    if (!active) return { label: 'Paused', cls: 'text-slate-500 bg-slate-700/40' };
    const days = getDaysUntil(dateStr);
    if (isOverdue(dateStr)) return { label: `${Math.abs(days)}d overdue`, cls: 'text-rose-400 bg-rose-500/15' };
    if (isDueToday(dateStr)) return { label: 'Due today', cls: 'text-yellow-400 bg-yellow-500/15' };
    if (isDueSoon(dateStr, 3)) return { label: `Due in ${days}d`, cls: 'text-orange-400 bg-orange-500/15' };
    if (isDueSoon(dateStr, 7)) return { label: `Due in ${days}d`, cls: 'text-blue-400 bg-blue-500/15' };
    return { label: `Due ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, cls: 'text-slate-400 bg-slate-700/40' };
  };

  const categories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header onMenuToggle={onMenuToggle} title="Recurring" subtitle="Automated transactions" />

      <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
        {/* Monthly impact summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">Monthly Out</div>
            <div className="text-lg font-bold text-rose-400">{formatCurrency(monthlyImpact.expense, symbol)}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">Monthly In</div>
            <div className="text-lg font-bold text-emerald-400">{formatCurrency(monthlyImpact.income, symbol)}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">Net Recurring</div>
            <div className={cn('text-lg font-bold', monthlyImpact.income - monthlyImpact.expense >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatCurrency(Math.abs(monthlyImpact.income - monthlyImpact.expense), symbol)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50">
            {(['list', 'calendar'] as const).map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                  viewMode === v ? 'bg-yellow-500 text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-200'
                )}>
                {v === 'list' ? '📋 List' : '📅 Upcoming'}
              </button>
            ))}
          </div>
          {viewMode === 'list' && (
            <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                    filterType === f ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'
                  )}>
                  {f}
                </button>
              ))}
            </div>
          )}
          <button onClick={openAdd} className="btn-primary ml-auto">
            <Plus className="w-4 h-4" /> Add Recurring
          </button>
        </div>

        {/* List view */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Repeat className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No recurring transactions</p>
                <button onClick={openAdd} className="btn-primary mt-4 mx-auto">
                  <Plus className="w-4 h-4" /> Add First One
                </button>
              </div>
            ) : filtered.map((rec) => {
              const catMeta = (allCategories as Record<string, { emoji: string; label: string; textColor: string; bgColor: string }>)[rec.category];
              const due = getDueLabel(rec.nextDueDate, rec.active);
              return (
                <div key={rec.id} className={cn(
                  'glass-card p-4 transition-all',
                  !rec.active && 'opacity-60',
                  isOverdue(rec.nextDueDate) && rec.active && 'border-rose-500/30',
                  isDueToday(rec.nextDueDate) && rec.active && 'border-yellow-500/30',
                )}>
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0', catMeta?.bgColor ?? 'bg-slate-700/40')}>
                      {catMeta?.emoji ?? '📦'}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white text-sm">{rec.note || catMeta?.label}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', FREQ_COLORS[rec.frequency])}>
                              {FREQ_LABELS[rec.frequency]}
                            </span>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', due.cls)}>
                              {due.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={cn('text-lg font-bold', rec.type === 'income' ? 'text-emerald-400' : 'text-rose-400')}>
                            {rec.type === 'income' ? '+' : '-'}{formatCurrency(rec.amount, symbol)}
                          </div>
                          <div className="text-xs text-slate-500">{catMeta?.label}</div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {rec.active && (isDueToday(rec.nextDueDate) || isOverdue(rec.nextDueDate)) && (
                          <button onClick={() => handleProcess(rec.id, rec.note)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Log Now
                          </button>
                        )}
                        <button onClick={() => handleToggle(rec)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700/40 text-slate-400 border border-slate-600/40 rounded-lg hover:bg-slate-700 transition-colors ml-auto">
                          {rec.active ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {rec.active ? 'Active' : 'Paused'}
                        </button>
                        <button onClick={() => openEdit(rec)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(rec.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Calendar/upcoming view */}
        {viewMode === 'calendar' && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <h3 className="font-semibold text-white text-sm">Upcoming 30 Days</h3>
              <span className="text-xs text-slate-500 ml-auto">{upcomingEvents.length} payments</span>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No upcoming recurring transactions</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(({ date, rec }, i) => {
                  const catMeta = (allCategories as Record<string, { emoji: string; label: string; textColor: string }>)[rec.category];
                  const days = getDaysUntil(date);
                  return (
                    <div key={`${rec.id}-${i}`} className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border',
                      days === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                      days <= 3 ? 'bg-orange-500/10 border-orange-500/20' :
                      'bg-slate-800/30 border-slate-700/40'
                    )}>
                      <div className="w-12 text-center flex-shrink-0">
                        <div className="text-xs text-slate-500">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</div>
                        <div className={cn('text-lg font-bold leading-none', days === 0 ? 'text-yellow-400' : days <= 3 ? 'text-orange-400' : 'text-white')}>
                          {new Date(date + 'T00:00:00').getDate()}
                        </div>
                      </div>
                      <div className="text-lg">{catMeta?.emoji ?? '📦'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{rec.note || catMeta?.label}</p>
                        <p className="text-xs text-slate-500">
                          {days === 0 ? 'Due today' : days < 0 ? `${Math.abs(days)}d overdue` : `In ${days} day${days === 1 ? '' : 's'}`}
                          {' · '}{FREQ_LABELS[rec.frequency]}
                        </p>
                      </div>
                      <div className={cn('font-bold text-sm', rec.type === 'income' ? 'text-emerald-400' : 'text-rose-400')}>
                        {rec.type === 'income' ? '+' : '-'}{formatCurrency(rec.amount, symbol)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-t-3xl sm:rounded-2xl p-6 mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-xl">{editId ? 'Edit' : 'Add'} Recurring</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type */}
            <div className="flex gap-2 mb-4 p-1 bg-slate-800/60 rounded-xl">
              {(['expense', 'income'] as TransactionType[]).map((t) => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: t === 'expense' ? 'bills' : 'salary' }))}
                  className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all',
                    form.type === t ? t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white' : 'text-slate-400'
                  )}>
                  {t === 'expense' ? '💸 Expense' : '💰 Income'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="form-label">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" className={cn('form-input pl-10 text-xl font-bold', form.type === 'expense' ? 'text-rose-400' : 'text-emerald-400')} />
              </div>
            </div>

            {/* Frequency */}
            <div className="mb-4">
              <label className="form-label">Frequency</label>
              <div className="grid grid-cols-4 gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map((f) => (
                  <button key={f} onClick={() => setForm(fm => ({ ...fm, frequency: f }))}
                    className={cn('py-2 rounded-xl border text-xs font-semibold capitalize transition-all',
                      form.frequency === f ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400' : 'border-slate-700/60 text-slate-400 hover:text-slate-200'
                    )}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="form-label">Category</label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {Object.entries(categories).map(([key, meta]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, category: key as Category }))}
                    className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all',
                      form.category === key ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400' : 'border-slate-700/60 bg-slate-800/40 text-slate-400'
                    )}>
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="text-center leading-tight">{meta.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="form-label">Note</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Netflix, Rent..." className="form-input" />
            </div>

            {/* Start date */}
            <div className="mb-6">
              <label className="form-label">Start / Next Due Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="form-input [color-scheme:dark]" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">
                <Repeat className="w-4 h-4" /> {editId ? 'Update' : 'Add'} Recurring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
