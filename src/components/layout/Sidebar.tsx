import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, BarChart2, Target,
  Settings, TrendingUp, X, Repeat, Flame, Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { path: '/reports', label: 'Reports', icon: BarChart2 },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/heatmap', label: 'Heatmap', icon: Flame },
      { path: '/recurring', label: 'Recurring', icon: Repeat },
      { path: '/ai-advisor', label: 'AI Advisor', icon: Brain, badge: 'AI' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { path: '/budget', label: 'Budget', icon: Target },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 z-50 flex flex-col',
        'bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">BudgetPro</div>
              <div className="text-xs text-slate-500 font-medium">Finance Manager</div>
            </div>
          </div>
          <button onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-widest">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ path, label, icon: Icon, badge }) => {
                  const active = location.pathname === path;
                  return (
                    <Link key={path} to={path} onClick={onClose}
                      className={active ? 'nav-item-active' : 'nav-item'}>
                      <Icon style={{ width: 18, height: 18 }} className="flex-shrink-0" />
                      <span className="flex-1">{label}</span>
                      {badge && (
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                          active ? 'bg-slate-900/30 text-slate-900' : 'bg-violet-500/20 text-violet-400'
                        )}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-5 py-4 border-t border-slate-700/50">
          <div className="glass-card p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-sm font-bold text-slate-900">
              U
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">My Account</div>
              <div className="text-xs text-slate-500">Personal Finance</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
