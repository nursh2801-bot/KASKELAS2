import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Student = {
  id: string;
  nis: string;
  name: string;
  absen: number;
  created_at?: string;
};

export type Income = {
  id: string;
  date: string;
  student_id: string | null;
  student_name: string | null;
  amount: number;
  note: string;
  created_at?: string;
};

export type Expense = {
  id: string;
  date: string;
  purpose: string;
  amount: number;
  note: string;
  created_at?: string;
};

export const formatCurrency = (n: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n || 0);

export const formatDate = (d: string): string =>
  new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
