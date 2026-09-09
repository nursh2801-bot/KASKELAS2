import { useEffect, useState } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/components/Login';
import Sidebar, { type Page } from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Students from '@/pages/Students';
import IncomePage from '@/pages/Income';
import ExpensePage from '@/pages/Expense';
import Report from '@/pages/Report';
import Settings from '@/pages/Settings';
import PaymentReport from '@/components/PaymentReport';

const titles: Record<Page, string> = {
  dashboard: 'Dashboard',
  students: 'Data Siswa',
  income: 'Pemasukan Kas',
  expense: 'Pengeluaran Kas',
  report: 'Laporan',
  paymentReport: 'Laporan Pembayaran',
  settings: 'Pengaturan',
};

function Shell() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (user) setShowLogin(false);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        current={page}
        onNavigate={setPage}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogin={() => setShowLogin(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 no-print">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="font-bold text-slate-800">
            {titles[page]}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {page === 'dashboard' && <Dashboard />}
          {page === 'students' && <Students />}
          {page === 'income' && <IncomePage />}
          {page === 'expense' && <ExpensePage />}
          {page === 'report' && <Report />}
          {page === 'paymentReport' && <PaymentReport />}
          {page === 'settings' && user && <Settings />}
        </main>
      </div>

      {showLogin && !user && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full relative">
            <button
              onClick={() => setShowLogin(false)}
              className="fixed top-4 right-4 z-[110] bg-white rounded-full px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg hover:bg-slate-100"
            >
              Tutup
            </button>

            <Login />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
