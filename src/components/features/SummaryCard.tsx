import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  currencySymbol: string;
  icon: ReactNode;
  type: 'income' | 'expense' | 'balance' | 'savings';
  subtitle?: string;
  trend?: number;
  className?: string;
}

const GRADIENT_MAP = {
  income: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20',
  expense: 'from-rose-600/20 to-rose-800/10 border-rose-500/20',
  balance: 'from-blue-600/20 to-blue-800/10 border-blue-500/20',
  savings: 'from-violet-600/20 to-violet-800/10 border-violet-500/20',
};

const TEXT_MAP = {
  income: 'text-emerald-400',
  expense: 'text-rose-400',
  balance: 'text-blue-400',
  savings: 'text-violet-400',
};

const ICON_BG_MAP = {
  income: 'bg-emerald-500/15',
  expense: 'bg-rose-500/15',
  balance: 'bg-blue-500/15',
  savings: 'bg-violet-500/15',
};

export default function SummaryCard({
  title,
  amount,
  currencySymbol,
  icon,
  type,
  subtitle,
  trend,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 bg-gradient-to-br',
        GRADIENT_MAP[type],
        'bg-slate-800/60 backdrop-blur-sm',
        'animate-slide-up',
        className,
      )}
    >
      {/* Decorative glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl"
        style={{ background: type === 'income' ? '#10b981' : type === 'expense' ? '#ef4444' : type === 'balance' ? '#3b82f6' : '#8b5cf6' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', ICON_BG_MAP[type])}>
            <div className={TEXT_MAP[type]}>{icon}</div>
          </div>
          {trend !== undefined && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-1 rounded-lg',
                trend >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400',
              )}
            >
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          )}
        </div>
        <div className={cn('text-2xl font-display font-bold mb-1', TEXT_MAP[type])}>
          {formatCurrency(amount, currencySymbol)}
        </div>
        <div className="text-sm font-medium text-slate-400">{title}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
