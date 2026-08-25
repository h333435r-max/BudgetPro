import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Plus, Download, SlidersHorizontal, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import TransactionItem from '@/components/features/TransactionItem';
import TransactionForm from '@/components/features/TransactionForm';
import { cn, formatDate } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';
import { exportToCSV } from '@/lib/storage';
import type { Transaction, TransactionType, Category } from '@/types';

interface TransactionsProps {
  appData: ReturnType<typeof import('@/hooks/useAppData').useAppData>;
  onMenuToggle: () => void;
}

type SortKey = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

export default function Transactions({ appData, onMenuToggle }: TransactionsProps) {
  const { data, addTransaction, deleteTransaction, updateTransaction } = appData;
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(searchParams.get('add') === 'true');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const symbol = data.settings.currencySymbol;

  const filtered = useMemo(() => {
    let txs = [...data.transactions];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.note.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.amount.toString().includes(q),
      );
    }

    // Type filter
    if (filterType !== 'all') txs = txs.filter((t) => t.type === filterType);

    // Category filter
    if (filterCategory !== 'all') txs = txs.filter((t) => t.category === filterCategory);

    // Date range
    if (dateFrom) txs = txs.filter((t) => t.date >= dateFrom);
    if (dateTo) txs = txs.filter((t) => t.date <= dateTo);

    // Sort
    txs.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'amount') cmp = a.amount - b.amount;
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return txs;
  }, [data.transactions, search, filterType, filterCategory, sortKey, sortDir, dateFrom, dateTo]);

  // Group by date
  const grouped = useMemo(() => {
    const g: Record<string, Transaction[]> = {};
    for (const tx of filtered) {
      if (!g[tx.date]) g[tx.date] = [];
      g[tx.date].push(tx);
    }
    return Object.entries(g).sort((a, b) => (sortDir === 'desc' ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])));
  }, [filtered, sortDir]);

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleEdit = (tx: Transaction) => {
    setEditTx(tx);
    setShowForm(true);
  };

  const handleSubmit = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editTx) updateTransaction(editTx.id, txData);
    else addTransaction(txData);
    setShowForm(false);
    setEditTx(null);
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  const allCategories = { ...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES };
  const hasActiveFilters = filterType !== 'all' || filterCategory !== 'all' || dateFrom || dateTo;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header onMenuToggle={onMenuToggle} title="Transactions" subtitle={`${filtered.length} records`} />

      <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
        {/* Search + Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="form-input pl-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-secondary relative', hasActiveFilters && 'border-yellow-500/50 text-yellow-400')}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => exportToCSV(filtered, symbol)}
            className="btn-secondary"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditTx(null); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="glass-card p-4 space-y-4 animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="form-label">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
                  className="form-input"
                >
                  <option value="all">All Types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="form-label">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
                  className="form-input"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(allCategories).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">From Date</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input [color-scheme:dark]" />
              </div>
              <div>
                <label className="form-label">To Date</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input [color-scheme:dark]" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sort by:</span>
                {(['date', 'amount', 'category'] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else setSortKey(k); }}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-lg font-medium capitalize transition-colors',
                      sortKey === k ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-slate-500 hover:text-slate-300',
                    )}
                  >
                    {k} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Summary strip */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-3 glass-card text-sm">
            <span className="text-slate-400">{filtered.length} transactions</span>
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-emerald-400 font-semibold">+{symbol}{totalIncome.toLocaleString()}</span>
            <span className="text-rose-400 font-semibold">-{symbol}{totalExpense.toLocaleString()}</span>
          </div>
        )}

        {/* Grouped list */}
        {grouped.length > 0 ? (
          grouped.map(([date, txs]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{formatDate(date)}</span>
                <div className="flex-1 h-px bg-slate-700/30" />
                <span className="text-xs text-slate-600">
                  {symbol}{txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toFixed(0)}
                </span>
              </div>
              {txs.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  currencySymbol={symbol}
                  onDelete={deleteTransaction}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="py-16 text-center">
            <Filter className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No transactions found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-yellow-400 hover:text-yellow-300">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditTx(null); setShowForm(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 gold-gradient rounded-2xl shadow-2xl shadow-yellow-500/20 flex items-center justify-center text-slate-900 text-2xl font-bold hover:scale-105 active:scale-95 transition-transform lg:hidden z-20"
      >
        +
      </button>

      {showForm && (
        <TransactionForm
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditTx(null); }}
          editData={editTx}
          currencySymbol={symbol}
        />
      )}
    </div>
  );
}
