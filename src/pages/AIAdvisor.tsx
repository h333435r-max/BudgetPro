import { useState, useMemo } from 'react';
import {
  Brain, RefreshCw, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Info, Lightbulb, Zap, Shield, Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { FunctionsHttpError } from '@supabase/supabase-js';
import Header from '@/components/layout/Header';
import { formatCurrency, getMonthStart } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/constants';
import { cn } from '@/lib/utils';
import type { AIAdvisorResult, AIInsight } from '@/types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

interface AIAdvisorProps {
  appData: ReturnType<typeof import('@/hooks/useAppData').useAppData>;
  onMenuToggle: () => void;
}

const INSIGHT_ICONS = {
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />,
  success: <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
  tip: <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />,
};

const INSIGHT_STYLES = {
  warning: 'bg-yellow-500/10 border-yellow-500/25',
  success: 'bg-emerald-500/10 border-emerald-500/25',
  tip: 'bg-blue-500/10 border-blue-500/25',
  info: 'bg-slate-700/40 border-slate-600/40',
};

function HealthScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={circ - fill}
          strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

export default function AIAdvisorPage({ appData, onMenuToggle }: AIAdvisorProps) {
  const { data, stats } = appData;
  const symbol = data.settings.currencySymbol;
  const [result, setResult] = useState<AIAdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthStart = getMonthStart();

  const spendingContext = useMemo(() => {
    // Category breakdown this month
    const catTotals: Record<string, number> = {};
    for (const tx of data.transactions) {
      if (tx.type === 'expense' && tx.date >= monthStart) {
        catTotals[tx.category] = (catTotals[tx.category] ?? 0) + tx.amount;
      }
    }
    const topCategories = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => ({
        name: (EXPENSE_CATEGORIES as Record<string, { label: string }>)[cat]?.label ?? cat,
        amount,
        percentage: stats.monthExpense > 0 ? (amount / stats.monthExpense) * 100 : 0,
      }));

    // Weekly avg
    const weekTxCount = data.transactions.filter((t) => t.type === 'expense').length;
    const weeklyAvgExpense = weekTxCount > 0 ? (stats.totalExpense / Math.max(1, weekTxCount / 7)) * 7 : 0;

    return {
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      monthIncome: stats.monthIncome,
      monthExpense: stats.monthExpense,
      savingsRate: stats.savingsRate,
      topCategories,
      weeklyAvgExpense,
      budgetUsage: data.budget.monthly > 0 ? (stats.monthExpense / data.budget.monthly) * 100 : 0,
      currency: symbol,
    };
  }, [data, stats, monthStart, symbol]);

  const analyze = async () => {
    if (spendingContext.monthExpense === 0 && spendingContext.monthIncome === 0) {
      toast.error('Add some transactions first to get AI analysis');
      return;
    }
    setLoading(true);
    setError('');

    const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-expense-advisor', {
      body: spendingContext,
    });

    if (fnError) {
      let msg = fnError.message;
      if (fnError instanceof FunctionsHttpError) {
        try {
          const text = await fnError.context?.text();
          msg = `[${fnError.context?.status}] ${text || msg}`;
        } catch { /* ignore */ }
      }
      console.error('AI Advisor error:', msg);
      setError(msg);
      toast.error('AI analysis failed. Please try again.');
    } else if (fnData) {
      setResult(fnData as AIAdvisorResult);
      toast.success('AI analysis complete!');
    }

    setLoading(false);
  };

  const healthLabel = (score: number) =>
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  const healthColor = (score: number) =>
    score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-yellow-400' : 'text-rose-400';

  return (
    <div className="flex-1 overflow-y-auto">
      <Header onMenuToggle={onMenuToggle} title="AI Advisor" subtitle="Powered by Gemini 3 Flash" />

      <div className="p-4 lg:p-6 space-y-5 max-w-3xl mx-auto">
        {/* Hero card */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-blue-600/5 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Brain className="w-8 h-8 text-violet-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white mb-1">AI Expense Advisor</h2>
              <p className="text-sm text-slate-400 mb-4">
                Analyzes your spending patterns and provides personalized budget recommendations, savings tips, and financial health score.
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                {[
                  { icon: <Target className="w-3.5 h-3.5" />, label: 'Budget Analysis' },
                  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Savings Tips' },
                  { icon: <Shield className="w-3.5 h-3.5" />, label: 'Health Score' },
                  { icon: <Zap className="w-3.5 h-3.5" />, label: 'Smart Insights' },
                ].map(({ icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-500/15 px-2.5 py-1 rounded-full border border-violet-500/20">
                    {icon} {label}
                  </span>
                ))}
              </div>
              <button
                onClick={analyze}
                disabled={loading}
                className={cn(
                  'btn-primary',
                  loading && 'opacity-70 cursor-not-allowed',
                  !loading && 'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700'
                )}
                style={loading ? {} : { background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Brain className="w-4 h-4" /> {result ? 'Re-analyze' : 'Analyze My Finances'}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick stats that will be sent */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            Data to be analyzed
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-800/40 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">This Month</div>
              <div className="text-sm font-bold text-emerald-400">+{formatCurrency(spendingContext.monthIncome, symbol)}</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">Month Spend</div>
              <div className="text-sm font-bold text-rose-400">-{formatCurrency(spendingContext.monthExpense, symbol)}</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">Savings Rate</div>
              <div className="text-sm font-bold text-violet-400">{spendingContext.savingsRate.toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">Budget Used</div>
              <div className={cn('text-sm font-bold', spendingContext.budgetUsage >= 90 ? 'text-rose-400' : spendingContext.budgetUsage >= 70 ? 'text-yellow-400' : 'text-blue-400')}>
                {spendingContext.budgetUsage.toFixed(0)}%
              </div>
            </div>
          </div>
          {spendingContext.topCategories.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2">Top spending categories this month:</p>
              <div className="flex flex-wrap gap-1.5">
                {spendingContext.topCategories.map((c) => (
                  <span key={c.name} className="text-xs bg-slate-700/60 text-slate-300 px-2 py-1 rounded-lg">
                    {c.name} · {formatCurrency(c.amount, symbol)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-4 border-rose-500/30 bg-rose-500/5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-400">Analysis failed</p>
                <p className="text-xs text-slate-500 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="glass-card p-6">
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 rounded-full bg-slate-700/60 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-700/60 rounded-full w-1/2" />
                  <div className="h-3 bg-slate-700/40 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-700/40 rounded-full w-2/3" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[1, 2, 3].map((i) => <div key={i} className="glass-card h-16 bg-slate-700/40 rounded-xl" />)}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-5 animate-slide-up">
            {/* Health Score */}
            <div className="glass-card p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 to-transparent pointer-events-none" />
              <h3 className="font-semibold text-white mb-4">Financial Health Score</h3>
              <HealthScoreRing score={result.healthScore} />
              <div className={cn('text-xl font-bold mt-3', healthColor(result.healthScore))}>
                {healthLabel(result.healthScore)}
              </div>
              <p className="text-sm text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">
                {result.summary}
              </p>
              <p className="text-xs text-slate-600 mt-3">
                Generated {new Date(result.generatedAt).toLocaleString()}
              </p>
            </div>

            {/* Insights */}
            <div>
              <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Smart Insights
              </h3>
              <div className="space-y-2.5">
                {result.insights.map((insight: AIInsight, i: number) => (
                  <div key={i} className={cn('flex items-start gap-3 p-4 rounded-xl border', INSIGHT_STYLES[insight.type])}>
                    {INSIGHT_ICONS[insight.type]}
                    <div>
                      <p className="text-sm font-semibold text-white">{insight.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Personalized Recommendations
              </h3>
              <div className="glass-card p-5 space-y-3">
                {result.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Re-analyze CTA */}
            <div className="flex justify-center pb-2">
              <button onClick={analyze} disabled={loading}
                className="btn-secondary">
                <RefreshCw className="w-4 h-4" /> Refresh Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
