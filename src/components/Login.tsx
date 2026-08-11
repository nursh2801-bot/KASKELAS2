import { useState } from 'react';
import { Wallet, Mail, Lock, LogIn, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Login({ onBack }: { onBack: () => void }) {
  const { signIn } = useAuth();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState<string|null>(null); const [loading,setLoading]=useState(false);
  const handleSubmit=async(e:React.FormEvent)=>{e.preventDefault();setError(null);setLoading(true);const {error}=await signIn(email,password);setLoading(false);if(error)setError(error);};
  return <div id="admin-login" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-4">
    <div className="relative w-full max-w-md"><div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
      <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4"/>Kembali lihat kas</button>
      <div className="flex flex-col items-center mb-8"><div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4"><Wallet className="w-8 h-8 text-white"/></div><h1 className="text-2xl font-bold text-slate-800">Login Admin</h1><p className="text-slate-500 text-sm mt-1">Kelola pencatatan uang kas kelas</p></div>
      {error&&<div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertCircle className="w-4 h-4 mt-0.5"/><span>{error}</span></div>}
      <form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email Admin</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="email admin" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"/></div></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"/></div></div>
      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-60">{loading?<Loader2 className="w-5 h-5 animate-spin"/>:<><LogIn className="w-5 h-5"/>Masuk sebagai Admin</>}</button></form>
      <p className="text-center text-xs text-slate-500 mt-6">Pengunjung/siswa tidak perlu login. Mereka hanya dapat melihat data.</p>
    </div></div>
  </div>;
}
