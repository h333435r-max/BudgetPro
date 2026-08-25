import { cn, formatCurrency, getPercentage } from '@/lib/utils';

interface BudgetProgressProps {
  label: string;
  spent: number;
  limit: number;
  currencySymbol: string;
  showNumbers?: boolean;
}

export default function BudgetProgress({
  label,
  spent,
  limit,
  currencySymbol,
  showNumbers = true,
}: BudgetProgressProps) {
  const pct = getPercentage(spent, limit);
  const isWarning = pct >= 80 && pct < 100;
  const isDanger = pct >= 100;

  const fillColor = isDanger
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-yellow-500'
    : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          {isDanger && (
            <span className="text-xs font-semibold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full">
              Exceeded
            </span>
          )}
          {isWarning && !isDanger && (
            <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full">
              {pct}%
            </span>
          )}
          {!isDanger && !isWarning && (
            <span className="text-xs text-slate-500">{pct}%</span>
          )}
        </div>
      </div>
      <div className="progress-bar">
        <div
          className={cn('progress-fill', fillColor)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {showNumbers && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Spent: <span className={cn('font-semibold', isDanger ? 'text-rose-400' : 'text-slate-300')}>{formatCurrency(spent, currencySymbol)}</span>
          </span>
          <span>
            Limit: <span className="font-semibold text-slate-300">{formatCurrency(limit, currencySymbol)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
