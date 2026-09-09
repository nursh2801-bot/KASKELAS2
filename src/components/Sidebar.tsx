import { Wallet, LayoutDashboard, Users, TrendingUp, TrendingDown, FileText, Settings, LogOut, X, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type Page = 'dashboard' | 'students' | 'income' | 'expense' | 'report' | 'paymentReport' | 'settings';
const menu: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Data Siswa', icon: Users },
  { id: 'income', label: 'Pemasukan Kas', icon: TrendingUp },
  { id: 'expense', label: 'Pengeluaran Kas', icon: TrendingDown },
  { id: 'report', label: 'Laporan', icon: FileText },
{ id: 'paymentReport', label: 'Laporan Pembayaran', icon: FileText },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

export default function Sidebar({
  current,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  onLogin,
}: {
  current: Page;
  onNavigate: (p: Page) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogin: () => void;
}) {
  const { user, signOut } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden no-print" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-gradient-to-b from-primary-800 to-primary-950 text-white flex flex-col transition-transform duration-300 no-print ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Kas Kelas</h1>
              <p className="text-primary-200 text-xs">Pencatatan Kas</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden p-1 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.filter((m) => user || m.id !== 'settings').map((m) => {
            const Icon = m.icon;
            const active = current === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { onNavigate(m.id); onCloseMobile(); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white text-primary-700 shadow-lg'
                    : 'text-primary-100 hover:bg-white/10'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {m.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          {user ? (
            <>
              <div className="px-4 py-2 mb-2">
                <p className="text-xs text-primary-200 truncate">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-primary-100 hover:bg-red-500/20 transition"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Keluar
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-primary-100 hover:bg-white/10 transition"
            >
              <LogIn className="w-5 h-5 shrink-0" />
              Login Admin
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
