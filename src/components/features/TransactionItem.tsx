import { useState } from 'react';
import { Trash2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import CategoryBadge from './CategoryBadge';
import type { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  currencySymbol: string;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
}

export default function TransactionItem({
  transaction,
  currencySymbol,
  onDelete,
  onEdit,
}: TransactionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isIncome = transaction.type === 'income';

  return (
    <div className="glass-card-hover p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        {/* Category icon */}
        <CategoryBadge category={transaction.category} size="sm" showLabel={false} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-100 truncate">
              {transaction.note || transaction.category}
            </span>
            <CategoryBadge category={transaction.category} size="sm" showLabel={true} />
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{formatDate(transaction.date)}</div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <div
            className={cn(
              'text-base font-bold font-display',
              isIncome ? 'text-emerald-400' : 'text-rose-400',
            )}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, currencySymbol)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onEdit(transaction)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 animate-fade-in">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Type: </span>
              <span className={cn('font-semibold capitalize', isIncome ? 'text-emerald-400' : 'text-rose-400')}>
                {transaction.type}
              </span>
            </div>
            <div>
              <span className="text-slate-500">ID: </span>
              <span className="text-slate-400 font-mono">{transaction.id.slice(0, 8)}…</span>
            </div>
            {transaction.note && (
              <div className="col-span-2">
                <span className="text-slate-500">Note: </span>
                <span className="text-slate-300">{transaction.note}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
