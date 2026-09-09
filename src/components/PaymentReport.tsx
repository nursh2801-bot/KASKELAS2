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

    // Ubah tampilan langsung seperti versi awal
    const oldPayments = payments;

    const existingLocal = payments.find(
      (payment) =>
        payment.student_id === studentId &&
        payment.month === month
    );

    if (existingLocal) {
      setPayments((current) =>
        current.map((payment) =>
          payment.id === existingLocal.id
            ? {
                ...payment,
                paid: newPaid,
              }
            : payment
        )
      );
    } else {
      const temporaryPayment: Payment = {
        id: `temp-${studentId}-${month}`,
        student_id: studentId,
        month,
        paid: newPaid,
      };

      setPayments((current) => [
        ...current,
        temporaryPayment,
      ]);
    }

    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        setPayments(oldPayments);
        alert('Silakan login terlebih dahulu.');
        return;
      }

      const user = authData.user;

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
        setPayments(oldPayments);
        alert(`Gagal menyimpan ceklis:\n${findError.message}`);
        return;
      }

      if (existingPayment) {
        const { data, error: updateError } = await supabase
          .from('payments')
          .update({
            paid: newPaid,
          })
          .eq('id', existingPayment.id)
          .select('id, student_id, month, paid')
          .single();

        if (updateError) {
          console.error(
            'Gagal update pembayaran:',
            updateError
          );

          setPayments(oldPayments);

          alert(
            `Gagal menyimpan ceklis:\n${updateError.message}`
          );

          return;
        }

        setPayments((current) =>
          current.map((payment) =>
            payment.student_id === studentId &&
            payment.month === month
              ? data
              : payment
          )
        );
      } else {
        const { data, error: insertError } =
          await supabase
            .from('payments')
            .insert({
              student_id: studentId,
              user_id: user.id,
              month: month,
              paid: newPaid,
            })
            .select('id, student_id, month, paid')
            .single();

        if (insertError) {
          console.error(
            'Gagal insert pembayaran:',
            insertError
          );

          setPayments(oldPayments);

          alert(
            `Gagal menyimpan ceklis:\n${insertError.message}`
          );

          return;
        }

        setPayments((current) =>
          current.map((payment) =>
            payment.id ===
            `temp-${studentId}-${month}`
              ? data
              : payment
          )
        );
      }
    } catch (error) {
      console.error('Error pembayaran:', error);

      setPayments(oldPayments);

      if (error instanceof Error) {
        alert(`Terjadi kesalahan:\n${error.message}`);
      } else {
        alert(
          'Terjadi kesalahan saat menyimpan pembayaran.'
        );
      }
    } finally {
      setSaving(null);
    }
  };
```
