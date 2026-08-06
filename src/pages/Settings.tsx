import { useState } from 'react';
import { User, Mail, Lock, LogOut, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password berhasil diubah' });
      setNewPassword('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
        <p className="text-slate-500 text-sm mt-1">Kelola akun dan aplikasi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-bold text-slate-800">Profil Akun</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-800">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800">Ubah Password</h3>
          </div>
          <form onSubmit={changePassword} className="space-y-4">
            {message && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                {message.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
              <input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-bold text-slate-800">Keluar dari Akun</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Klik tombol di bawah untuk keluar dari akun Anda.</p>
        <button onClick={signOut} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition">
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>

      <div className="bg-primary-50 rounded-2xl border border-primary-100 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Info className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-primary-800">Tentang Aplikasi</h3>
        </div>
        <p className="text-sm text-primary-700">
          Aplikasi Pencatatan Uang Kas Kelas digunakan untuk mengelola pemasukan dan pengeluaran kas kelas dengan mudah.
          Data tersimpan secara online dan aman. Saldo kas dihitung otomatis dari selisih pemasukan dan pengeluaran.
        </p>
      </div>
    </div>
  );
}
