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

const MONTHS = [
  { key: 'july', label: 'Juli' },
  { key: 'august', label: 'Agustus' },
  { key: 'september', label: 'September' },
  { key: 'october', label: 'Oktober' },
  { key: 'november', label: 'November' },
  { key: 'december', label: 'Desember' },
];

const STORAGE_KEY = 'kas-kelas-payment-months';

export default function PaymentReport() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [months, setMonths] = useState(MONTHS);
  const [tempMonths, setTempMonths] = useState(MONTHS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingMonths, setEditingMonths] = useState(false);

  useEffect(() => {
    loadMonths();
    loadData();
  }, []);

  const loadMonths = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

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
      const studentsResult = await supabase
        .from('students')
        .select('id, name')
        .order('name', { ascending: true });

      if (studentsResult.error) {
        console.error(
          'Gagal mengambil siswa:',
          studentsResult.error
        );
      }

      const paymentsResult = await supabase
        .from('payments')
        .select('id, student_id, month, paid');

      if (paymentsResult.error) {
        console.error(
          'Gagal mengambil pembayaran:',
          paymentsResult.error
        );
      }

      setStudents(studentsResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (error) {
      console.error('Gagal memuat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaid = (
    studentId: string,
    month: string
  ) => {
    return payments.some(
      (payment) =>
        payment.student_id === studentId &&
        payment.month === month &&
        payment.paid === true
    );
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
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error:', authError);
        alert('Gagal mengecek login.');
        return;
      }

      const user = authData.user;

      if (!user) {
        alert('Silakan login terlebih dahulu.');
        return;
      }

      /*
       * Cari data pembayaran berdasarkan
       * siswa + bulan.
       */
      const {
        data: existingPayment,
        error: findError,
      } = await supabase
        .from('payments')
        .select('id, student_id, month, paid')
        .eq('student_id', studentId)
        .eq('month', month)
        .maybeSingle();

      if (findError) {
        console.error(
          'Gagal mencari pembayaran:',
          findError
        );

        alert(
          `Gagal mencari pembayaran:\n${findError.message}`
        );

        return;
      }

      /*
       * Kalau data sudah ada,
       * ubah status paid.
       */
      if (existingPayment) {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            paid: newPaid,
          })
          .eq('id', existingPayment.id);

        if (updateError) {
          console.error(
            'Gagal update pembayaran:',
            updateError
          );

          alert(
            `Gagal menyimpan ceklis:\n${updateError.message}`
          );

          return;
        }
      }

      /*
       * Kalau belum ada,
       * buat data pembayaran baru.
       */
      else {
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            student_id: studentId,
            user_id: user.id,
            month: month,
            paid: newPaid,
          });

        if (insertError) {
          console.error(
            'Gagal insert pembayaran:',
            insertError
          );

          alert(
            `Gagal menyimpan ceklis:\n${insertError.message}`
          );

          return;
        }
      }

      /*
       * Ambil ulang data setelah berhasil.
       */
      const {
        data: freshPayments,
        error: reloadError,
      } = await supabase
        .from('payments')
        .select('id, student_id, month, paid');

      if (reloadError) {
        console.error(
          'Gagal memuat ulang pembayaran:',
          reloadError
        );

        return;
      }

      setPayments(freshPayments || []);
    } catch (error) {
      console.error(
        'Error pembayaran:',
        error
      );

      if (error instanceof Error) {
        alert(
          `Terjadi kesalahan:\n${error.message}`
        );
      } else {
        alert(
          'Terjadi kesalahan saat menyimpan pembayaran.'
        );
      }
    } finally {
      setSaving(null);
    }
  };

  const startEditMonths = () => {
    setTempMonths(months);
    setEditingMonths(true);
  };

  const updateMonth = (
    key: string,
    value: string
  ) => {
    setTempMonths((current) =>
      current.map((month) =>
        month.key === key
          ? {
              ...month,
              label: value,
            }
          : month
      )
    );
  };

  const saveMonths = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tempMonths)
    );

    setMonths(tempMonths);
    setEditingMonths(false);
  };

  const cancelEditMonths = () => {
    setTempMonths(months);
    setEditingMonths(false);
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
          }

          .payment-check.paid {
            background: #10b981 !important;
            color: white !important;
            border-color: #10b981 !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          .payment-check {
            width: 24px !important;
            height: 24px !important;
          }

          @page {
            size: landscape;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="payment-report space-y-5">
        {/* HEADER */}
        <div className="no-print flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Laporan Pembayaran
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Ceklis pembayaran siswa
            </p>
          </div>

          <div className="flex gap-2">
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
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white"
                >
                  <Save className="h-4 w-4" />
                  Simpan
                </button>

                <button
                  type="button"
                  onClick={cancelEditMonths}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </>
            )}
          </div>
        </div>

        {/* PRINT TITLE */}
        <div className="mb-4 hidden print:block">
          <h1 className="text-xl font-bold">
            Laporan Pembayaran
          </h1>

          <p className="text-sm">
            Ceklis pembayaran siswa
          </p>
        </div>

        {/* PAYMENT TABLE */}
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="payment-table w-full min-w-[800px] border-collapse">
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
                          updateMonth(
                            month.key,
                            e.target.value
                          )
                        }
                        className="w-full min-w-[80px] rounded border bg-white px-2 py-1 text-center"
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
                    colSpan={8}
                    className="border px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Belum ada data siswa.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.id}>
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

                      const savingKey =
                        `${student.id}-${month.key}`;

                      return (
                        <td
                          key={month.key}
                          className="border px-2 py-3 text-center"
                        >
                          <button
                            type="button"
                            disabled={
                              editingMonths ||
                              saving === savingKey
                            }
                            onClick={() =>
                              togglePayment(
                                student.id,
                                month.key
                              )
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
                              ${
                                paid
                                  ? 'paid bg-emerald-500 text-white border-emerald-500'
                                  : 'border-gray-300 bg-white text-transparent hover:bg-gray-50'
                              }
                            `}
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
