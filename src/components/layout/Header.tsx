import { Menu, Bell, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
  subtitle?: string;
  budgetAlert?: boolean;
}

export default function Header({ onMenuToggle, title, subtitle, budgetAlert }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-white text-lg leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/transactions')}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
        >
          <Search className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors">
          <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          {budgetAlert && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => navigate('/transactions?add=true')}
          className="btn-primary ml-1"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </header>
  );
}
