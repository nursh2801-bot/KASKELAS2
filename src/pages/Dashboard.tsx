import { useEffect, useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Users, Loader2 } from 'lucide-react';
import { supabase, formatCurrency, type Student, type Income, type Expense } from '@/lib/supabase';

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: i }, { data: e }] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('income').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
      ]);
      setStudents(s ?? []);
      setIncome(i ?? []);
      setExpenses(e ?? []);
      setLoading(false);
    })();
  }, []);

  const totalIncome = useMemo(() => income.reduce((a, b) => a + Number(b.amount), 0), [income]);
  const totalExpense = useMemo(() => expenses.reduce((a, b) => a + Number(b.amount), 0), [expenses]);
  const balance = totalIncome - totalExpense;

  const chartData = useMemo(() => {
    const months: { name: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        income: 0,
        expense: 0,
      });
    }
    const idx = (d: Date) => {
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      return months.findIndex((m) => m.name === key);
    };
    income.forEach((it) => {
      const i = idx(new Date(it.date + 'T00:00:00'));
      if (i >= 0) months[i].income += Number(it.amount);
    });
    expenses.forEach((it) => {
      const i = idx(new Date(it.date + 'T00:00:00'));
      if (i >= 0) months[i].expense += Number(it.amount);
    });
    return months;
  }, [income, expenses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Saldo Kas', value: formatCurrency(balance), icon: Wallet, color: 'from-primary-500 to-primary-700' },
    { label: 'Total Pemasukan', value: formatCurrency(totalIncome), icon: TrendingUp, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Total Pengeluaran', value: formatCurrency(totalExpense), icon: TrendingDown, color: 'from-red-500 to-red-700' },
    { label: 'Jumlah Siswa', value: String(students.length), icon: Users, color: 'from-amber-500 to-amber-700' },
  ];

  const maxVal = Math.max(1, ...chartData.flatMap((d) => [d.income, d.expense]));
  const yTicks = 5;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal * i) / yTicks);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Ringkasan kas kelas Anda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-slate-500 text-xs font-medium">{s.label}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-slate-800">Grafik Kas 6 Bulan Terakhir</h3>
            <p className="text-slate-500 text-xs mt-0.5">Perbandingan pemasukan dan pengeluaran</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary-500" /> Pemasukan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-400" /> Pengeluaran
            </span>
          </div>
        </div>
        <div className="h-72 w-full">
          <svg viewBox="0 0 600 280" className="w-full h-full" preserveAspectRatio="none">
            {tickVals.map((tv, i) => {
              const y = 5 + 270 - (tv / maxVal) * 270;
              return (
                <g key={i}>
                  <line x1={30} y1={y} x2={595} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <text x={26} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
                    {tv >= 1000 ? `${Math.round(tv / 1000)}k` : Math.round(tv)}
                  </text>
                </g>
              );
            })}
            {chartData.map((d, gi) => {
              const gx = 30 + (gi * 565) / chartData.length;
              const groupW = 565 / chartData.length;
              const barW = Math.min(26, groupW * 0.28);
              return (
                <g key={gi}>
                  {(['income', 'expense'] as const).map((k, ki) => {
                    const v = d[k];
                    const bh = (v / maxVal) * 270;
                    const bx = gx + groupW / 2 - barW - 2 + ki * (barW + 4);
                    const by = 5 + 270 - bh;
                    const color = k === 'income' ? '#3b82f6' : '#f87171';
                    return (
                      <rect key={k} x={bx} y={by} width={barW} height={Math.max(bh, 0)} rx={4} fill={color}>
                        <title>{formatCurrency(v)}</title>
                      </rect>
                    );
                  })}
                  <text x={gx + groupW / 2} y={282} textAnchor="middle" fontSize="10" fill="#64748b">
                    {d.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
