import { useState } from 'react';
import { toast } from 'sonner';
import {
  Moon, Sun, DollarSign, Bell, Shield, Database,
  Trash2, Download, Lock, Fingerprint, Save, RefreshCw,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { CURRENCIES } from '@/constants';
import { exportToCSV, clearAllData } from '@/lib/storage';
import { cn } from '@/lib/utils';
import type { Settings } from '@/types';

interface SettingsProps {
  appData: ReturnType<typeof import('@/hooks/useAppData').useAppData>;
  onMenuToggle: () => void;
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200',
        checked ? 'bg-yellow-500' : 'bg-slate-700',
      )}
    >
      <div
        className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5.5 left-0.5' : 'left-0.5',
        )}
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function SettingsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
        <div className="text-yellow-400">{icon}</div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage({ appData, onMenuToggle }: SettingsProps) {
  const { data, updateSettings } = appData;
  const [settings, setSettings] = useState<Settings>({ ...data.settings });
  const [dirty, setDirty] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    updateSettings(settings);
    setDirty(false);
    toast.success('Settings saved!');
  };

  const handleCurrencyChange = (code: string) => {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (cur) {
      update('currency', cur.code);
      update('currencySymbol', cur.symbol);
    }
  };

  const handleClearData = () => {
    clearAllData();
    toast.success('All data cleared. Refresh to reset.');
    setShowClearConfirm(false);
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header onMenuToggle={onMenuToggle} title="Settings" subtitle="Customize your experience" />

      <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">
        {/* Appearance */}
        <SettingsSection title="Appearance" icon={<Sun className="w-4 h-4" />}>
          <SettingsRow label="Dark Mode" description="Switch between dark and light theme">
            <ToggleSwitch checked={settings.darkMode} onChange={(v) => update('darkMode', v)} />
          </SettingsRow>
        </SettingsSection>

        {/* Currency */}
        <SettingsSection title="Currency & Format" icon={<DollarSign className="w-4 h-4" />}>
          <SettingsRow label="Currency" description="Select your preferred currency">
            <select
              value={settings.currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="form-input text-sm py-2 w-44"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </SettingsRow>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon={<Bell className="w-4 h-4" />}>
          <SettingsRow label="Budget Alerts" description="Notify when nearing spending limit">
            <ToggleSwitch checked={settings.budgetAlertEnabled} onChange={(v) => update('budgetAlertEnabled', v)} />
          </SettingsRow>
          <SettingsRow label="Daily Reminder" description="Daily reminder to log expenses">
            <ToggleSwitch checked={settings.dailyReminderEnabled} onChange={(v) => update('dailyReminderEnabled', v)} />
          </SettingsRow>
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security & Privacy" icon={<Shield className="w-4 h-4" />}>
          <SettingsRow label="PIN Lock" description="Require PIN to open the app">
            <ToggleSwitch checked={settings.pinEnabled} onChange={(v) => update('pinEnabled', v)} />
          </SettingsRow>
          {settings.pinEnabled && (
            <div className="animate-slide-up">
              <label className="form-label">Set PIN (4–6 digits)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN"
                  maxLength={6}
                  className="form-input flex-1"
                />
                <button
                  onClick={() => {
                    if (pinInput.length >= 4) {
                      update('pin', pinInput);
                      toast.success('PIN updated');
                    } else {
                      toast.error('PIN must be at least 4 digits');
                    }
                  }}
                  className="btn-secondary px-3"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <SettingsRow label="Biometric Login" description="Use fingerprint or face unlock">
            <ToggleSwitch checked={settings.biometricEnabled} onChange={(v) => update('biometricEnabled', v)} />
          </SettingsRow>
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data & Backup" icon={<Database className="w-4 h-4" />}>
          <SettingsRow label="Export CSV" description="Download all transactions as CSV">
            <button
              onClick={() => {
                exportToCSV(data.transactions, data.settings.currencySymbol);
                toast.success('Export started!');
              }}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </SettingsRow>
          <SettingsRow label="Clear All Data" description="Permanently delete all transactions and settings">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-400">Are you sure?</span>
                <button onClick={handleClearData} className="text-xs px-3 py-1.5 bg-rose-500 text-white rounded-lg font-semibold">
                  Yes, Clear
                </button>
                <button onClick={() => setShowClearConfirm(false)} className="btn-secondary text-xs px-3 py-1.5">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 text-xs px-3 py-2 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-xl font-medium hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Data
              </button>
            )}
          </SettingsRow>
          <SettingsRow label="Reset to Sample Data" description="Restore demo transactions">
            <button
              onClick={() => {
                clearAllData();
                toast.success('Reset complete! Refreshing...');
                setTimeout(() => window.location.reload(), 800);
              }}
              className="btn-secondary text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </SettingsRow>
        </SettingsSection>

        {/* App info */}
        <div className="glass-card p-5 text-center space-y-1">
          <div className="text-xl">💰</div>
          <div className="font-display font-bold text-white">BudgetPro</div>
          <div className="text-xs text-slate-500">Version 1.0.0 · Premium Finance Tracker</div>
          <div className="text-xs text-slate-600">Built with OnSpace · All data stored locally</div>
        </div>

        {/* Save */}
        {dirty && (
          <div className="sticky bottom-4 flex justify-center">
            <button onClick={handleSave} className="btn-primary shadow-2xl shadow-yellow-500/20 px-10 py-3 text-base">
              <Save className="w-5 h-5" />
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
