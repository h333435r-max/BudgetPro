import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Reports from '@/pages/Reports';
import Budget from '@/pages/Budget';
import SettingsPage from '@/pages/Settings';
import HeatmapPage from '@/pages/Heatmap';
import RecurringPage from '@/pages/Recurring';
import AIAdvisorPage from '@/pages/AIAdvisor';
import NotFound from '@/pages/NotFound';
import { useAppData } from '@/hooks/useAppData';
import { useTheme } from '@/hooks/useTheme';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const appData = useAppData();
  useTheme(appData.data.settings);

  const pageProps = {
    appData,
    onMenuToggle: () => setSidebarOpen((o) => !o),
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-surface-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard {...pageProps} />} />
            <Route path="/transactions" element={<Transactions {...pageProps} />} />
            <Route path="/reports" element={<Reports {...pageProps} />} />
            <Route path="/heatmap" element={<HeatmapPage {...pageProps} />} />
            <Route path="/recurring" element={<RecurringPage {...pageProps} />} />
            <Route path="/ai-advisor" element={<AIAdvisorPage {...pageProps} />} />
            <Route path="/budget" element={<Budget {...pageProps} />} />
            <Route path="/settings" element={<SettingsPage {...pageProps} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
              borderRadius: '12px',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}
