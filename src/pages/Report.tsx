import { useEffect, useState, useMemo } from 'react';
import { FileText, Printer, FileSpreadsheet, Loader2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase, formatCurrency, formatDate, type Income, type Expense } from '@/lib/supabase';

export default function Report() {
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: i }, { data: e }] = await Promise.all([
        supabase.from('income').select('*').order('date', { ascending: true }),
        supabase.from('expenses').select('*').order('date', { ascending: true }),
      ]);
      setIncome(i ?? []);
      setExpenses(e ?? []);
      setLoading(false);
    })();
  }, []);

  const filteredIncome = useMemo(() => income.filter((r) => (!fromDate || r.date >= fromDate) && (!toDate || r.date <= toDate)), [income, fromDate, toDate]);
  const filteredExpenses = useMemo(() => expenses.filter((r) => (!fromDate || r.date >= fromDate) && (!toDate || r.date <= toDate)), [expenses, fromDate, toDate]);

  const totalIncome = filteredIncome.reduce((a, b) => a + Number(b.amount), 0);
  const totalExpense = filteredExpenses.reduce((a, b) => a + Number(b.amount), 0);
  const balance = totalIncome - totalExpense;

  const allDates = useMemo(() => {
    const set = new Set<string>();
    filteredIncome.forEach((r) => set.add(r.date));
    filteredExpenses.forEach((r) => set.add(r.date));
    return Array.from(set).sort();
  }, [filteredIncome, filteredExpenses]);

  const handlePrint = () => window.print();

  const exportExcel = () => {
    const rows: string[][] = [];
    rows.push(['Laporan Kas Kelas']);
    rows.push(['Periode', `${fromDate || 'Semua'} - ${toDate || 'Semua'}`]);
    rows.push([]);
    rows.push(['No', 'Tanggal', 'Jenis', 'Nama/Keperluan', 'Keterangan', 'Pemasukan', 'Pengeluaran']);
    let no = 1;
    filteredIncome.forEach((r) => {
      rows.push([String(no++), r.date, 'Pemasukan', r.student_name ?? '-', r.note ?? '', String(r.amount), '0']);
    });
    filteredExpenses.forEach((r) => {
      rows.push([String(no++), r.date, 'Pengeluaran', r.purpose, r.note ?? '', '0', String(r.amount)]);
    });
    rows.push([]);
    rows.push(['', '', '', '', 'Total', String(totalIncome), String(totalExpense)]);
    rows.push(['', '', '', '', 'Saldo', String(balance)]);

    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_kas_kelas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan</h2>
          <p className="text-slate-500 text-sm mt-1">Laporan kas kelas - cetak PDF atau Excel</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition">
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 no-print">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); }} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">Reset</button>
          )}
        </div>
      </div>

      {/* Print area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 print-area">
        <div className="text-center mb-6 pb-4 border-b-2 border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">Laporan Kas Kelas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Periode: {fromDate ? formatDate(fromDate) : 'Awal'} s/d {toDate ? formatDate(toDate) : 'Sekarang'}
          </p>
          <p className="text-slate-400 text-xs mt-1">Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
            <div><p className="text-xs text-emerald-700 font-medium">Total Pemasukan</p><p className="font-bold text-emerald-800">{formatCurrency(totalIncome)}</p></div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center"><TrendingDown className="w-5 h-5 text-white" /></div>
            <div><p className="text-xs text-red-700 font-medium">Total Pengeluaran</p><p className="font-bold text-red-800">{formatCurrency(totalExpense)}</p></div>
          </div>
          <div className="bg-primary-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-white" /></div>
            <div><p className="text-xs text-primary-700 font-medium">Saldo Kas</p><p className="font-bold text-primary-800">{formatCurrency(balance)}</p></div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-left">
                <th className="px-3 py-2 font-semibold border-b border-slate-200">No</th>
                <th className="px-3 py-2 font-semibold border-b border-slate-200">Tanggal</th>
                <th className="px-3 py-2 font-semibold border-b border-slate-200">Jenis</th>
                <th className="px-3 py-2 font-semibold border-b border-slate-200">Nama/Keperluan</th>
                <th className="px-3 py-2 font-semibold border-b border-slate-200">Keterangan</th>
                <th className="px-3 py-2 font-semibold border-b border-slate-200 text-right">Pemasukan</th>
                <th className="px-3 py-2 font-semibold border-b border-slate-200 text-right">Pengeluaran</th>
              </tr>
            </thead>
            <tbody>
              {allDates.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Tidak ada transaksi</td></tr>
              ) : (() => {
                let no = 0;
                return allDates.flatMap((date) => {
                  const inc = filteredIncome.filter((r) => r.date === date);
                  const exp = filteredExpenses.filter((r) => r.date === date);
                  const rows: React.ReactNode[] = [];
                  inc.forEach((r) => { no++; rows.push(
                    <tr key={`i-${r.id}`} className="hover:bg-slate-50">
                      <td className="px-3 py-2 border-b border-slate-100 text-slate-400">{no}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="px-3 py-2 border-b border-slate-100"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Pemasukan</span></td>
                      <td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{r.student_name ?? '-'}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-slate-500">{r.note || '-'}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-right font-semibold text-emerald-600 whitespace-nowrap">{formatCurrency(Number(r.amount))}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-right text-slate-300">-</td>
                    </tr>
                  ); });
                  exp.forEach((r) => { no++; rows.push(
                    <tr key={`e-${r.id}`} className="hover:bg-slate-50">
                      <td className="px-3 py-2 border-b border-slate-100 text-slate-400">{no}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="px-3 py-2 border-b border-slate-100"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Pengeluaran</span></td>
                      <td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{r.purpose}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-slate-500">{r.note || '-'}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-right text-slate-300">-</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-right font-semibold text-red-600 whitespace-nowrap">{formatCurrency(Number(r.amount))}</td>
                    </tr>
                  ); });
                  return rows;
                });
              })()}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={5} className="px-3 py-3 text-slate-700">Total</td>
                <td className="px-3 py-3 text-right text-emerald-700">{formatCurrency(totalIncome)}</td>
                <td className="px-3 py-3 text-right text-red-700">{formatCurrency(totalExpense)}</td>
              </tr>
              <tr className="bg-primary-50 font-bold">
                <td colSpan={5} className="px-3 py-3 text-primary-800">Saldo Akhir</td>
                <td colSpan={2} className="px-3 py-3 text-right text-primary-800">{formatCurrency(balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
