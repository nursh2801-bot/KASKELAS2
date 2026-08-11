import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, TrendingUp, X, Filter } from 'lucide-react';
import { supabase, formatCurrency, formatDate, type Income, type Student } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';

export default function IncomePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Income[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), student_id: '', amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: i }, { data: s }] = await Promise.all([
      supabase.from('income').select('*').order('date', { ascending: false }),
      supabase.from('students').select('*').order('name'),
    ]);
    setRows(i ?? []);
    setStudents(s ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = (r.student_name ?? '').toLowerCase().includes(q) || (r.note ?? '').toLowerCase().includes(q);
      const matchFrom = !fromDate || r.date >= fromDate;
      const matchTo = !toDate || r.date <= toDate;
      return matchSearch && matchFrom && matchTo;
    });
  }, [rows, search, fromDate, toDate]);

  const total = useMemo(() => filtered.reduce((a, b) => a + Number(b.amount), 0), [filtered]);

  const openAdd = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), student_id: '', amount: '', note: '' });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (r: Income) => {
    setEditing(r);
    setForm({ date: r.date, student_id: r.student_id ?? '', amount: String(r.amount), note: r.note ?? '', student_name: r.student_name ?? '' } as typeof form);
    setError(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.date || !form.amount) {
      setError('Tanggal dan nominal wajib diisi');
      return;
    }
    setSaving(true);
    const student = students.find((s) => s.id === form.student_id);
    const payload = {
      date: form.date,
      student_id: form.student_id || null,
      student_name: student?.name ?? null,
      amount: Number(form.amount),
      note: form.note,
    };
    if (editing) {
      await supabase.from('income').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('income').insert(payload);
    }
    setForm({ date: new Date().toISOString().slice(0, 10), student_id: '', amount: '', note: '' });
    setEditing(null);
    setSaving(false);
    setModalOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('income').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    load();
  };

  const resetFilter = () => { setFromDate(''); setToDate(''); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pemasukan Kas</h2>
          <p className="text-slate-500 text-sm mt-1">Catat pemasukan kas kelas</p>
        </div>
        {user && (
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Tambah Pemasukan
        </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa atau keterangan..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition ${
              showFilter || fromDate || toDate ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {showFilter && (
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-end gap-3 animate-fade-in">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {(fromDate || toDate) && (
              <button onClick={resetFilter} className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <TrendingUp className="w-10 h-10 mb-2" />
            <p className="text-sm">Belum ada data pemasukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-left">
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Nama Siswa</th>
                  <th className="px-5 py-3 font-semibold text-right">Nominal</th>
                  <th className="px-5 py-3 font-semibold">Keterangan</th>
                  {user && <th className="px-5 py-3 font-semibold text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{r.student_name ?? '-'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600 whitespace-nowrap">{formatCurrency(Number(r.amount))}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">{r.note || '-'}</td>
                    {user && <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(r)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary-50">
                  <td colSpan={2} className="px-5 py-3 font-semibold text-slate-700">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700">{formatCurrency(total)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {user && <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Pemasukan' : 'Tambah Pemasukan'}>
        <form onSubmit={save} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Siswa</label>
            <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">- Pilih Siswa (opsional) -</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.absen})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nominal</label>
            <input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Rp" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Batal</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>}

      {user && <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Hapus Pemasukan" message="Yakin ingin menghapus data pemasukan ini?" loading={deleting} />}
    </div>
  );
}
