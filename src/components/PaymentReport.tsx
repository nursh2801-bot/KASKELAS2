```tsx
import { useEffect, useState } from 'react';
import { Loader2, Pencil, Save, X, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Student = {
  id: string;
  name: string;
};

type Payment = {
  id: string;
  student_id: string;
  month: string;
  paid: boolean;
};

const DEFAULT_MONTHS = [
  { key: 'july', label: 'Juli' },
  { key: 'august', label: 'Agustus' },
  { key: 'september', label: 'September' },
  { key: 'october', label: 'Oktober' },
  { key: 'november', label: 'November' },
  { key: 'december', label: 'Desember' },
];

const MONTH_STORAGE_KEY = 'kas-kelas-payment-months';

export default function PaymentReport() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const [editingMonths, setEditingMonths] = useState(false);
  const [tempMonths, setTempMonths] = useState(DEFAULT_MONTHS);

  useEffect(() => {
    loadMonthNames();
    loadData();
  }, []);

  const loadMonthNames = () => {
    try {
      const saved = localStorage.getItem(MONTH_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length === 6) {
          setMonths(parsed);
          setTempMonths(parsed);
        }
      }
    } catch (error) {
      console.error('Gagal membaca nama bulan:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const [studentsResult, paymentsResult] = await Promise.all([
        supabase
          .from('students')
          .select('id, name')
          .order('name', { ascending: true }),

        supabase
          .from('payments')
          .select('id, student_id, month, paid'),
      ]);

      if (studentsResult.error) {
        console.error('Gagal mengambil siswa:', studentsResult.error);
      }

      if (paymentsResult.error) {
        console.error('Gagal mengambil pembayaran:', paymentsResult.error);
      }

      setStudents(studentsResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (error) {
      console.error('Gagal memuat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaid = (studentId: string, month: string) => {
    const payment = payments.find(
      (item) =>
        item.student_id === studentId &&
        item.month === month
    );

    return payment?.paid === true;
  };

  const togglePayment = async (
    studentId: string,
    month: string
  ) => {
    const savingKey = `${studentId}-${month}`;

    if (saving) return;

    const currentPaid = getPaid(studentId, month);
    const newPaid = !currentPaid;

    setSaving(savingKey);

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        alert('Silakan login terlebih dahulu.');
        return;
      }

      const { data, error } = await supabase
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

      if (error) {
        console.error('Gagal menyimpan pembayaran:', error);
        alert('Gagal menyimpan ceklis pembayaran.');
        return;
      }

      if (data) {
        setPayments((current) => {
          const existingIndex = current.findIndex(
            (item) =>
              item.student_id === studentId &&
              item.month === month
          );

          if (existingIndex >= 0) {
            const updated = [...current];
            updated[existingIndex] = data;
            return updated;
          }

          return [...current, data];
        });
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(null);
    }
  };

  const startEditMonths = () => {
    setTempMonths(months);
    setEditingMonths(true);
  };

  const cancelEditMonths = () => {
    setTempMonths(months);
    setEditingMonths(false);
  };

  const saveMonths = () => {
    try {
      localStorage.setItem(
        MONTH_STORAGE_KEY,
        JSON.stringify(tempMonths)
      );

      setMonths(tempMonths);
      setEditingMonths(false);
    } catch (error) {
      console.error('Gagal menyimpan nama bulan:', error);
    }
  };

  const updateMonthLabel = (
    key: string,
    value: string
  ) => {
    setTempMonths((current) =>
      current.map((month) =>
        month.key === key
          ? { ...month, label: value }
          : month
      )
    );
  };

  const downloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
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

          .payment-report {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .payment-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .payment-table th,
          .payment-table td {
            border: 1px solid #000 !important;
            padding: 8px !important;
          }

          .payment-check.paid {
            background: #10b981 !important;
            border-color: #10b981 !important;
            color: white !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          .payment-check {
            width: 22px !important;
            height: 22px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: 1px solid #999 !important;
            border-radius: 4px !important;
          }

          @page {
            size: landscape;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="payment-report space-y-5">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 no-print">
          <div>
            <h1 className="text-2xl font-bold">
              Laporan Pembayaran
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Ceklis pembayaran siswa per bulan
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!editingMonths ? (
              <>
                <button
                  type="button"
                  onClick={startEditMonths}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Bulan
                </button>

                <button
                  type="button"
                  onClick={downloadPDF}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={saveMonths}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <Save className="h-4 w-4" />
                  Simpan
                </button>

                <button
                  type="button"
                  onClick={cancelEditMonths}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </>
            )}
          </div>
        </div>

        {/* JUDUL SAAT PRINT */}
        <div className="hidden print:block mb-5">
          <h1 className="text-xl font-bold">
            Laporan Pembayaran
          </h1>

          <p className="text-sm">
            Laporan ceklis pembayaran siswa
          </p>
        </div>

        {/* TABEL */}
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="payment-table min-w-[800px] w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-3 text-center text-sm font-semibold">
                  No
                </th>

                <th className="border px-3 py-3 text-left text-sm font-semibold">
                  Nama Siswa
                </th>

                {(editingMonths
                  ? tempMonths
                  : months
                ).map((month) => (
                  <th
                    key={month.key}
                    className="border px-2 py-3 text-center text-sm font-semibold"
                  >
                    {editingMonths ? (
                      <input
                        type="text"
                        value={month.label}
                        onChange={(e) =>
                          updateMonthLabel(
                            month.key,
                            e.target.value
                          )
                        }
                        className="w-full min-w-[90px] rounded border bg-white px-2 py-1 text-center text-sm font-normal"
                      />
                    ) : (
                      month.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + months.length}
                    className="border px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Belum ada data siswa.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="border px-3 py-3 text-center text-sm">
                      {index + 1}
                    </td>

                    <td className="border px-3 py-3 text-sm font-medium">
                      {student.name}
                    </td>

                    {(editingMonths
                      ? tempMonths
                      : months
                    ).map((month) => {
                      const paid = getPaid(
                        student.id,
                        month.key
                      );

                      const savingKey = `${student.id}-${month.key}`;

                      return (
                        <td
                          key={month.key}
                          className="border px-2 py-3 text-center"
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
                              editingMonths ||
                              saving === savingKey
                            }
                            className={`
                              payment-check
                              inline-flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              rounded-md
                              border
                              text-sm
                              font-bold
                              transition
                              ${
                                paid
                                  ? 'paid'
                                  : 'border-gray-300 bg-white text-transparent hover:bg-gray-50'
                              }
                              ${
                                editingMonths
                                  ? 'cursor-not-allowed opacity-50'
                                  : ''
                              }
                            `}
                            title={
                              paid
                                ? 'Sudah bayar'
                                : 'Belum bayar'
                            }
                          >
                            {saving === savingKey ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : paid ? (
                              <span>✓</span>
                            ) : (
                              <span>&nbsp;</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
```
