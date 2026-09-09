import { useEffect, useState } from 'react';
import { Loader2, Pencil, Printer, Save, X } from 'lucide-react';
import { supabase, type Student } from '@/lib/supabase';

const DEFAULT_MONTHS = [
  { key: 'july', label: 'Juli' },
  { key: 'august', label: 'Agustus' },
  { key: 'september', label: 'September' },
  { key: 'october', label: 'Oktober' },
  { key: 'november', label: 'November' },
  { key: 'december', label: 'Desember' },
] as const;

type MonthKey = (typeof DEFAULT_MONTHS)[number]['key'];

type Month = {
  key: MonthKey;
  label: string;
};

type Payment = {
  id: string;
  student_id: string;
  month: MonthKey;
  paid: boolean;
};

const MONTH_STORAGE_KEY = 'kas-kelas-payment-months';

export default function PaymentReport() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [months, setMonths] = useState<Month[]>([
    ...DEFAULT_MONTHS,
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [editingMonths, setEditingMonths] = useState(false);
  const [editingValues, setEditingValues] = useState<string[]>(
    DEFAULT_MONTHS.map((month) => month.label)
  );

  useEffect(() => {
    const savedMonths = localStorage.getItem(MONTH_STORAGE_KEY);

    if (savedMonths) {
      try {
        const parsed = JSON.parse(savedMonths);

        if (
          Array.isArray(parsed) &&
          parsed.length === DEFAULT_MONTHS.length
        ) {
          setMonths(parsed);
          setEditingValues(
            parsed.map((month: Month) => month.label)
          );
        }
      } catch {
        // Gunakan bulan default
      }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    const { data: studentsData, error: studentsError } =
      await supabase
        .from('students')
        .select('id, nis, name, absen, created_at')
        .order('absen', { ascending: true });

    if (studentsError) {
      setError(studentsError.message);
      setLoading(false);
      return;
    }

    const { data: paymentsData, error: paymentsError } =
      await supabase
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

  const getPaid = (
    studentId: string,
    month: MonthKey
  ) => {
    return payments.some(
      (payment) =>
        payment.student_id === studentId &&
        payment.month === month &&
        payment.paid
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

    const { data: userData } =
      await supabase.auth.getUser();

    if (!userData.user) {
      setError('Silakan login terlebih dahulu.');
      setSaving(null);
      return;
    }

    const { data: savedPayment, error: saveError } =
      await supabase
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
        )
        .select('id, student_id, month, paid')
        .single();

    if (saveError) {
      setError(saveError.message);
      setSaving(null);
      return;
    }

    setPayments((current) => {
      const existing = current.find(
        (payment) =>
          payment.student_id === studentId &&
          payment.month === month
      );

      if (existing) {
        return current.map((payment) =>
          payment.id === existing.id
            ? { ...payment, paid: newPaid }
            : payment
        );
      }

      return [
        ...current,
        savedPayment || {
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
    months.filter((month) =>
      getPaid(studentId, month.key)
    ).length;

  const totalPaid = students.reduce(
    (total, student) =>
      total + getStudentPaidCount(student.id),
    0
  );

  const totalPossible =
    students.length * months.length;

  const totalUnpaid =
    totalPossible - totalPaid;

  const monthlyRecap = months.map((month) => ({
    ...month,
    paid: students.filter((student) =>
      getPaid(student.id, month.key)
    ).length,
  }));

  const startEditingMonths = () => {
    setEditingValues(
      months.map((month) => month.label)
    );
    setEditingMonths(true);
  };

  const cancelEditingMonths = () => {
    setEditingValues(
      months.map((month) => month.label)
    );
    setEditingMonths(false);
  };

  const saveMonths = () => {
    const updatedMonths = months.map(
      (month, index) => ({
        ...month,
        label:
          editingValues[index].trim() ||
          DEFAULT_MONTHS[index].label,
      })
    );

    setMonths(updatedMonths);

    localStorage.setItem(
      MONTH_STORAGE_KEY,
      JSON.stringify(updatedMonths)
    );

    setEditingMonths(false);
  };

  const downloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            aside,
            nav,
            header,
            .no-print {
              display: none !important;
            }

            .print-area {
              display: block !important;
              width: 100% !important;
            }

            .payment-check {
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 26px !important;
              height: 26px !important;
              border: 1px solid #94a3b8 !important;
              border-radius: 5px !important;
              font-family: Arial, sans-serif !important;
              font-size: 18px !important;
              font-weight: bold !important;
            }

            .payment-check.paid {
              background: #10b981 !important;
              color: white !important;
              border-color: #10b981 !important;
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
            }

            .payment-check.unpaid {
              background: white !important;
              color: transparent !important;
            }

            table {
              width: 100% !important;
              font-size: 10px !important;
            }

            th,
            td {
              padding: 6px !important;
            }

            @page {
              size: landscape;
              margin: 10mm;
            }
          }
        `}
      </style>

      <div className="print-area space-y-6">

        {/* JUDUL */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Laporan Pembayaran
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Rekap pembayaran iuran siswa Semester 1
            </p>
          </div>

          <div className="no-print flex flex-wrap gap-2">
            {!editingMonths ? (
              <button
                type="button"
                onClick={startEditingMonths}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit Bulan
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={saveMonths}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  Simpan
                </button>

                <button
                  type="button"
                  onClick={cancelEditingMonths}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </>
            )}

            <button
              type="button"
              onClick={downloadPDF}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              <Printer className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* EDIT BULAN */}
        {editingMonths && (
          <div className="no-print rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-3 text-sm font-medium text-blue-800">
              Edit nama bulan untuk periode pembayaran.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {editingValues.map(
                (value, index) => (
                  <div key={index}>
                    <label className="mb-1 block text-xs text-blue-700">
                      Bulan {index + 1}
                    </label>

                    <input
                      type="text"
                      value={value}
                      onChange={(event) => {
                        const updated = [
                          ...editingValues,
                        ];

                        updated[index] =
                          event.target.value;

                        setEditingValues(updated);
                      }}
                      className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* RINGKASAN */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Jumlah Siswa
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {students.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Sudah Bayar
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {totalPaid}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Belum Bayar
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {totalUnpaid}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Total Tagihan
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {totalPossible}
            </p>
            <p className="text-xs text-slate-400">
              bulan pembayaran
            </p>
          </div>
        </div>

        {/* TABEL PEMBAYARAN */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="font-semibold text-slate-800">
              Pembayaran Semester 1
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-3 text-left">
                    No
                  </th>

                  <th className="min-w-[180px] px-3 py-3 text-left">
                    Nama Siswa
                  </th>

                  {months.map((month) => (
                    <th
                      key={month.key}
                      className="px-3 py-3 text-center"
                    >
                      {month.label}
                    </th>
                  ))}

                  <th className="px-3 py-3 text-center">
                    Terbayar
                  </th>

                  <th className="px-3 py-3 text-center">
                    Tunggakan
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.map(
                  (student, index) => {
                    const paidCount =
                      getStudentPaidCount(
                        student.id
                      );

                    const unpaidCount =
                      months.length -
                      paidCount;

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-3">
                          {index + 1}
                        </td>

                        <td className="px-3 py-3 font-medium text-slate-700">
                          {student.name}
                        </td>

                        {months.map(
                          (month) => {
                            const paid =
                              getPaid(
                                student.id,
                                month.key
                              );

                            const savingKey =
                              `${student.id}-${month.key}`;

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
                                    saving ===
                                    savingKey
                                  }
                                  className={`payment-check ${
                                    paid
                                      ? 'paid'
                                      : 'unpaid'
                                  } flex h-8 w-8 items-center justify-center rounded-lg border mx-auto`}
                                >
                                  {saving ===
                                  savingKey ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : paid ? (
                                    <span aria-label="Sudah bayar">
                                      ✓
                                    </span>
                                  ) : (
                                    <span>
                                      &nbsp;
                                    </span>
                                  )}
                                </button>
                              </td>
                            );
                          }
                        )}

                        <td className="px-3 py-3 text-center font-semibold text-emerald-600">
                          {paidCount}
                        </td>

                        <td className="px-3 py-3 text-center font-semibold text-red-600">
                          {unpaidCount}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Belum ada data siswa.
            </div>
          )}
        </div>

        {/* REKAP BULANAN */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-semibold text-slate-800">
            Rekap Pembayaran Per Bulan
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {monthlyRecap.map((month) => (
              <div
                key={month.key}
                className="rounded-lg bg-slate-50 p-3 text-center"
              >
                <p className="font-medium text-slate-700">
                  {month.label}
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-600">
                  {month.paid}
                </p>

                <p className="text-xs text-slate-500">
                  dari {students.length} siswa
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TUNGGAKAN */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 font-semibold text-slate-800">
            Siswa yang Masih Menunggak
          </h2>

          <div className="space-y-2">
            {students
              .filter(
                (student) =>
                  getStudentPaidCount(
                    student.id
                  ) < months.length
              )
              .map((student) => {
                const unpaid =
                  months.length -
                  getStudentPaidCount(
                    student.id
                  );

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

            {students.length > 0 &&
              students.every(
                (student) =>
                  getStudentPaidCount(
                    student.id
                  ) === months.length
              ) && (
                <p className="text-sm text-emerald-600">
                  Semua siswa sudah lunas.
                </p>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
