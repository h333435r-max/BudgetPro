import { useState, useEffect } from 'react';
import { X, DollarSign, FileText, Calendar, Tag } from 'lucide-react';
import { cn, getTodayStr } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';
import type { Transaction, TransactionType, Category } from '@/types';

interface TransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  editData?: Transaction | null;
  currencySymbol: string;
}

export default function TransactionForm({
  onSubmit,
  onClose,
  editData,
  currencySymbol,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(editData?.type ?? 'expense');
  const [amount, setAmount] = useState(editData?.amount?.toString() ?? '');
  const [category, setCategory] = useState<Category>(editData?.category ?? 'food');
  const [note, setNote] = useState(editData?.note ?? '');
  const [date, setDate] = useState(editData?.date ?? getTodayStr());
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setAmount(editData.amount.toString());
      setCategory(editData.category);
      setNote(editData.note);
      setDate(editData.date);
    }
  }, [editData]);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    setCategory(t === 'expense' ? 'food' : 'salary');
  };

  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }
    setError('');
    onSubmit({ type, amount: Number(amount), category, note, date });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up sm:animate-scale-in mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-white text-xl">
            {editData ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-800/60 rounded-xl">
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-150',
                type === t
                  ? t === 'expense'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {t === 'expense' ? '💸 Expense' : '💰 Income'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="form-label">Amount</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
              {currencySymbol}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={cn(
                'form-input pl-10 text-xl font-bold',
                type === 'expense' ? 'text-rose-400' : 'text-emerald-400',
              )}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="form-label">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(categories).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCategory(key as Category)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all duration-150',
                  category === key
                    ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                    : 'border-slate-700/60 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-slate-200',
                )}
              >
                <span className="text-lg">{meta.emoji}</span>
                <span className="text-center leading-tight">{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-4">
          <label className="form-label">Note (optional)</label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="form-input pl-10"
            />
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <label className="form-label">Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input pl-10 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">
            <DollarSign className="w-4 h-4" />
            {editData ? 'Update' : 'Add'} Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
