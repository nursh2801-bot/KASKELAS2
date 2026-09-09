```tsx
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
    // Pastikan user sudah login
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Auth error:', userError);
      alert('Gagal mengecek login.');
      return;
    }

    const user = userData.user;

    if (!user) {
      alert('Silakan login terlebih dahulu.');
      return;
    }

    // Cek apakah pembayaran siswa + bulan ini sudah ada
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
      console.error('Gagal mencari pembayaran:', findError);
      alert(`Gagal mencari data pembayaran: ${findError.message}`);
      return;
    }

    let saveError = null;

    // Kalau sudah ada → UPDATE
    if (existingPayment) {
      const { error } = await supabase
        .from('payments')
        .update({
          paid: newPaid,
        })
        .eq('id', existingPayment.id);

      saveError = error;
    }

    // Kalau belum ada → INSERT
    else {
      const { error } = await supabase
        .from('payments')
        .insert({
          student_id: studentId,
          user_id: user.id,
          month: month,
          paid: newPaid,
        });

      saveError = error;
    }

    if (saveError) {
      console.error('Gagal menyimpan pembayaran:', saveError);

      alert(
        `Gagal menyimpan ceklis:\n${saveError.message}`
      );

      return;
    }

    // Setelah berhasil, ambil ulang semua pembayaran
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
    console.error('Error pembayaran:', error);

    if (error instanceof Error) {
      alert(`Terjadi kesalahan:\n${error.message}`);
    } else {
      alert('Terjadi kesalahan saat menyimpan pembayaran.');
    }
  } finally {
    setSaving(null);
  }
};
```
