import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { supabase, type Student } from '@/lib/supabase';

const MONTHS = [
  { key: 'july', label: 'Jul' },
  { key: 'august', label: 'Agu' },
  { key: 'september', label: 'Sep' },
  { key: 'october', label: 'Okt' },
  { key: 'november', label: 'Nov' },
  { key: 'december', label: 'Des' },
] as const;

type MonthKey = (typeof MONTHS)[number]['key'];

type Payment = {
  id: string;
  student_id: string;
  month: MonthKey;
  paid: boolean;
};

export default function PaymentReport() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, nis, name, absen, created_at')
      .order('absen', { ascending: true });

    if (studentsError) {
      setError(studentsError.message);
      setLoading(false);
      return;
    }

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('id, student_id, month, paid');

    if (paymentsError) {
      setError(paymentsError.message);
      setLoading(false);
      return;
    }

    setStudents(studentsData || []);
    setPayments(paymentsData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPaid = (studentId: string, month: MonthKey) => {
    return payments.some(
      (p) =>
        p.student_id === studentId &&
        p.month === month &&
        p.paid
    );
  };

  const togglePayment = async (
    studentId: string,
    month: MonthKey
  ) => {
    const key = `${studentId}-${month}`;
    setSaving(key);
    setError('');

    const currentPaid = getPaid(studentId, month);
    const newPaid = !currentPaid;

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setError('Silakan login terlebih dahulu.');
      setSaving(null);
      return;
    }

    const { error: saveError } = await supabase
      .from('payments')
      .upsert(
        {
          student_id: studentId,
          month,
          paid: newPaid,
          user_id: userData.user.id,
        },
        {
          onConflict: 'student_id,month',
        }
      );

    if (saveError) {
      setError(saveError.message);
      setSaving(null);
      return;
    }

    setPayments((current) => {
      const existing = current.find(
        (p) =>
          p.student_id === studentId &&
          p.month === month
      );

      if (existing) {
        return current.map((p) =>
          p.id === existing.id
            ? { ...p, paid: newPaid }
            : p
        );
      }

      return [
        ...current,
        {
          id: `${studentId}-${month}`,
          student_id: studentId,
          month,
          paid: newPaid,
        },
      ];
    });

    setSaving(null);
  };

  const getStudentPaidCount = (studentId: string) =>
    MONTHS.filter((month) =>
      getPaid(studentId, month.key)
    ).length;

  const totalPaid = students.reduce(
    (total, student) =>
      total + getStudentPaidCount(student.id),
    0
  );

  const totalPossible = students.length * MONTHS.length;
  const totalUnpaid = totalPossible - totalPaid;

  const monthlyRecap = MONTHS.map((month) => ({
    ...month,
    paid: students.filter((student) =>
      getPaid(student.id, month.key)
    ).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Laporan Pembayaran
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Rekap pembayaran iuran siswa Semester 1
          (Juli–Desember)
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">
            Jumlah Siswa
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {students.length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">
            Sudah Bayar
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {totalPaid}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">
            Belum Bayar
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {totalUnpaid}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">
            Total Tagihan
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {totalPossible}
          </p>
          <p className="text-xs text-slate-400">
            bulan pembayaran
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">
            Pembayaran Semester 1
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-3 text-left">
                  No
                </th>
                <th className="px-3 py-3 text-left min-w-[180px]">
                  Nama Siswa
                </th>

                {MONTHS.map((month) => (
                  <th
                    key={month.key}
                    className="px-3 py-3 text-center"
                  >
                    {month.label}
                  </th>
                ))}

                <th className="px-3 py-3 text-center min-w-[90px]">
                  Terbayar
                </th>
                <th className="px-3 py-3 text-center min-w-[90px]">
                  Tunggakan
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((student, index) => {
                const paidCount =
                  getStudentPaidCount(student.id);
                const unpaidCount =
                  MONTHS.length - paidCount;

                return (
                  <tr
                    key={student.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-3">
                      {index + 1}
                    </td>

                    <td className="px-3 py-3 font-medium text-slate-700">
                      {student.name}
                    </td>

                    {MONTHS.map((month) => {
                      const paid = getPaid(
                        student.id,
                        month.key
                      );

                      const savingKey = `${student.id}-${month.key}`;

                      return (
                        <td
                          key={month.key}
                          className="px-3 py-3 text-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              togglePayment(
                                student.id,
                                month.key
                              )
                            }
                            disabled={
                              saving === savingKey
                            }
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto transition ${
                              paid
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-slate-300 text-transparent hover:border-emerald-400'
                            }`}
                          >
                            {saving === savingKey ? (
                              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    <td className="px-3 py-3 text-center font-semibold text-emerald-600">
                      {paidCount}
                    </td>

                    <td className="px-3 py-3 text-center font-semibold text-red-600">
                      {unpaidCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            Belum ada data siswa.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-4">
          Rekap Pembayaran Per Bulan
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {monthlyRecap.map((month) => (
            <div
              key={month.key}
              className="rounded-lg bg-slate-50 p-3 text-center"
            >
              <p className="font-medium text-slate-700">
                {month.label}
              </p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {month.paid}
              </p>
              <p className="text-xs text-slate-500">
                dari {students.length} siswa
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-4">
          Siswa yang Masih Menunggak
        </h2>

        <div className="space-y-2">
          {students
            .filter(
              (student) =>
                getStudentPaidCount(student.id) <
                MONTHS.length
            )
            .map((student) => {
              const unpaid =
                MONTHS.length -
                getStudentPaidCount(student.id);

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between border-b border-slate-100 py-2"
                >
                  <span className="text-slate-700">
                    {student.name}
                  </span>

                  <span className="text-sm font-semibold text-red-600">
                    {unpaid} bulan
                  </span>
                </div>
              );
            })}

          {students.every(
            (student) =>
              getStudentPaidCount(student.id) ===
              MONTHS.length
          ) && (
            <p className="text-sm text-emerald-600">
              Semua siswa sudah lunas Semester 1.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
