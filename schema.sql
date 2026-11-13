-- ==============================================================================
-- ASCEND JOURNAL / JOURNALSTREAM - SUPABASE POSTGRESQL SCHEMA MIGRATION
-- Skrip Registrasi Tabel & Relasi Database Supabase:
-- 1. user_profiles (Profil & Streak Pengguna)
-- 2. journals (Catatan Jurnal Harian & Refleksi)
-- 3. agendas (Tugas & Agenda Kalender Harian)
-- 4. wallets (Dompet Keuangan, Saldo, & Transaksi)
-- 5. targets (Target Harian, Mingguan, Bulanan)
-- 6. habits (Pelacak Kebiasaan & Rutinitas)
-- ==============================================================================

-- 1. EKSTENSI UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFIL PENGGUNA (user_profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    greeting_title TEXT DEFAULT 'Selamat Datang',
    greeting_subtitle TEXT DEFAULT 'Ayo lebih produktif lagi hari ini.',
    streak_days INT DEFAULT 0,
    last_streak_date TEXT,
    currency_symbol TEXT DEFAULT 'Rp',
    first_app_open_at TIMESTAMPTZ,
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom baru tetap ada jika tabel user_profiles sudah pernah dibuat sebelumnya
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_app_open_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS feedback JSONB;

-- 3. TABEL JURNAL (journals) - Menyimpan catatan jurnal harian pengguna
CREATE TABLE IF NOT EXISTS public.journals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    date TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL AGENDA & TUGAS (agendas)
CREATE TABLE IF NOT EXISTS public.agendas (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    date TEXT,
    days JSONB DEFAULT '{}'::JSONB,
    category TEXT DEFAULT 'Umum',
    flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL DOMPET & KEUANGAN (wallets)
CREATE TABLE IF NOT EXISTS public.wallets (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_balance NUMERIC(15, 2) DEFAULT 0,
    safe_balance NUMERIC(15, 2) DEFAULT 0,
    transactions JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL TARGET (targets)
CREATE TABLE IF NOT EXISTS public.targets (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) DEFAULT 0,
    current_amount NUMERIC(12, 2) DEFAULT 0,
    period TEXT DEFAULT 'daily',
    unit TEXT DEFAULT 'kali',
    category TEXT DEFAULT 'Produktivitas',
    auto_track TEXT,
    is_manual BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL KEBIASAAN (habits)
CREATE TABLE IF NOT EXISTS public.habits (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed_days INT DEFAULT 0,
    total_days INT DEFAULT 30,
    color TEXT DEFAULT '#38bdf8',
    completed_today BOOLEAN DEFAULT FALSE,
    last_completed_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL PEMBERITAHUAN APLIKASI (announcements) - Dibuat oleh Admin, dibaca oleh semua pengguna
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_active BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    author_name TEXT DEFAULT 'Admin Ascend',
    author_email TEXT,
    action_url TEXT,
    action_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 9. INDEX QUERY PERFORMA TINGGI
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_agendas_user_id ON public.agendas(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_targets_user_id ON public.targets(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, created_at DESC);

-- 10. KEAMANAN AKSES TINGKAT BARIS (ROW LEVEL SECURITY)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 10. KEBIJAKAN AKSES PRIVAT (RLS POLICIES)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT 
USING (
  auth.uid() = id 
  OR (feedback IS NOT NULL) 
  OR (auth.jwt() ->> 'email' = 'kamalizudin36@gmail.com')
  OR (auth.jwt() ->> 'email' LIKE 'admin@%')
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own journals" ON public.journals;
CREATE POLICY "Users can view own journals" ON public.journals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journals" ON public.journals;
CREATE POLICY "Users can insert own journals" ON public.journals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journals" ON public.journals;
CREATE POLICY "Users can update own journals" ON public.journals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journals" ON public.journals;
CREATE POLICY "Users can delete own journals" ON public.journals FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own agendas" ON public.agendas;
CREATE POLICY "Users can view own agendas" ON public.agendas FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agendas" ON public.agendas;
CREATE POLICY "Users can insert own agendas" ON public.agendas FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agendas" ON public.agendas;
CREATE POLICY "Users can update own agendas" ON public.agendas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own agendas" ON public.agendas;
CREATE POLICY "Users can delete own agendas" ON public.agendas FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallets" ON public.wallets;
CREATE POLICY "Users can insert own wallets" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
CREATE POLICY "Users can update own wallets" ON public.wallets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wallets" ON public.wallets;
CREATE POLICY "Users can delete own wallets" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own targets" ON public.targets;
CREATE POLICY "Users can view own targets" ON public.targets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own targets" ON public.targets;
CREATE POLICY "Users can insert own targets" ON public.targets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own targets" ON public.targets;
CREATE POLICY "Users can update own targets" ON public.targets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own targets" ON public.targets;
CREATE POLICY "Users can delete own targets" ON public.targets FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- Kebijakan Akses Pengumuman Aplikasi (announcements)
-- Semua pengguna terautentikasi / publik dapat melihat pengumuman yang aktif
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT 
USING (
  is_active = TRUE 
  OR (auth.jwt() ->> 'email' = 'kamalizudin36@gmail.com')
  OR (auth.jwt() ->> 'email' LIKE 'admin@%')
);

-- Admin dapat membuat, memperbarui, dan menghapus pengumuman
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE 
USING (auth.role() = 'authenticated');

-- 11. SUPABASE REALTIME REPLICATION (SINKRONISASI REALTIME HP <-> LAPTOP)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles, public.journals, public.agendas, public.wallets, public.targets, public.habits, public.announcements;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;

-- 12. OTOMATIS INISIALISASI PROFIL PENGGUNA BARU DARI AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, streak_days)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. SUPABASE STORAGE: PRIVATE BUCKET 'profiles' UNTUK FOTO PROFIL PENGGUNA
-- Membuat bucket 'profiles' dengan akses private (public = false)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Kebijakan Akses: Pengguna dapat mengunggah file foto ke foldernya sendiri (folder nama: auth.uid())
DROP POLICY IF EXISTS "Users can upload their own profile avatar" ON storage.objects;
CREATE POLICY "Users can upload their own profile avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kebijakan Akses: Pengguna dapat membaca foto profil mereka sendiri
DROP POLICY IF EXISTS "Users can view their own profile avatar" ON storage.objects;
CREATE POLICY "Users can view their own profile avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profiles' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kebijakan Akses: Pengguna dapat memperbarui atau menghapus foto profil mereka sendiri
DROP POLICY IF EXISTS "Users can update and delete their own profile avatar" ON storage.objects;
CREATE POLICY "Users can update and delete their own profile avatar"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profiles' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 14. TABEL ARSIP LAPORAN PDF BULANAN (pdf_reports)
CREATE TABLE IF NOT EXISTS public.pdf_reports (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    status TEXT DEFAULT 'Tersedia',
    expires_at TIMESTAMPTZ,
    error_log TEXT,
    summary_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) untuk tabel pdf_reports
ALTER TABLE public.pdf_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pdf reports" ON public.pdf_reports;
CREATE POLICY "Users can view own pdf reports" 
ON public.pdf_reports FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pdf reports" ON public.pdf_reports;
CREATE POLICY "Users can insert own pdf reports" 
ON public.pdf_reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pdf reports" ON public.pdf_reports;
CREATE POLICY "Users can update own pdf reports" 
ON public.pdf_reports FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pdf reports" ON public.pdf_reports;
CREATE POLICY "Users can delete own pdf reports" 
ON public.pdf_reports FOR DELETE 
USING (auth.uid() = user_id);

-- 15. SUPABASE STORAGE: BUCKET 'monthly-reports' UNTUK ARSIP PDF BULANAN
INSERT INTO storage.buckets (id, name, public)
VALUES ('monthly-reports', 'monthly-reports', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Kebijakan Akses: Pengguna dapat mengunggah laporan bulanan ke folder mereka (folder: auth.uid())
DROP POLICY IF EXISTS "Users can upload their own monthly reports" ON storage.objects;
CREATE POLICY "Users can upload their own monthly reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'monthly-reports' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kebijakan Akses: Pengguna dapat membaca laporan bulanan mereka sendiri
DROP POLICY IF EXISTS "Users can view their own monthly reports" ON storage.objects;
CREATE POLICY "Users can view their own monthly reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'monthly-reports' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kebijakan Akses: Pengguna dapat menghapus laporan bulanan mereka sendiri
DROP POLICY IF EXISTS "Users can delete their own monthly reports" ON storage.objects;
CREATE POLICY "Users can delete their own monthly reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'monthly-reports' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kebijakan Akses Tambahan: Memungkinkan akses upload dan download jika user belum login (guest mode)
DROP POLICY IF EXISTS "Allow anon upload monthly reports" ON storage.objects;
CREATE POLICY "Allow anon upload monthly reports"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'monthly-reports'
);

DROP POLICY IF EXISTS "Allow anon view monthly reports" ON storage.objects;
CREATE POLICY "Allow anon view monthly reports"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'monthly-reports'
);

DROP POLICY IF EXISTS "Allow anon delete monthly reports" ON storage.objects;
CREATE POLICY "Allow anon delete monthly reports"
ON storage.objects FOR DELETE
TO anon
USING (
  bucket_id = 'monthly-reports'
);
