/*
# Create Class Cash (Kas Kelas) tables

1. New Tables
- `students` — daftar siswa kelas
  - `id` (uuid, primary key)
  - `nis` (text, nomor induk siswa)
  - `name` (text, nama siswa)
  - `absen` (int, nomor absen)
  - `user_id` (uuid, pemilik data, default auth.uid())
  - `created_at` (timestamptz)
- `income` — pemasukan kas
  - `id` (uuid, primary key)
  - `date` (date, tanggal pemasukan)
  - `student_id` (uuid, fk ke students, nullable untuk pemasukan non-siswa)
  - `student_name` (text, nama siswa snapshot)
  - `amount` (numeric, nominal)
  - `note` (text, keterangan)
  - `user_id` (uuid, pemilik data, default auth.uid())
  - `created_at` (timestamptz)
- `expenses` — pengeluaran kas
  - `id` (uuid, primary key)
  - `date` (date, tanggal pengeluaran)
  - `purpose` (text, keperluan)
  - `amount` (numeric, nominal)
  - `note` (text, keterangan)
  - `user_id` (uuid, pemilik data, default auth.uid())
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Owner-scoped CRUD: tiap user hanya bisa akses data miliknya (auth.uid() = user_id).
- 4 policy per table (select/insert/update/delete).
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nis text NOT NULL,
  name text NOT NULL,
  absen int NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_students" ON students;
CREATE POLICY "select_own_students" ON students FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_students" ON students;
CREATE POLICY "insert_own_students" ON students FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_students" ON students;
CREATE POLICY "update_own_students" ON students FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_students" ON students;
CREATE POLICY "delete_own_students" ON students FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  student_name text,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  note text DEFAULT '',
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_income" ON income;
CREATE POLICY "select_own_income" ON income FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_income" ON income;
CREATE POLICY "insert_own_income" ON income FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_income" ON income;
CREATE POLICY "update_own_income" ON income FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_income" ON income;
CREATE POLICY "delete_own_income" ON income FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  purpose text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  note text DEFAULT '',
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);