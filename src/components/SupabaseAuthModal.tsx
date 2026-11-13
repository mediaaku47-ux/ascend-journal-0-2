import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  Lock, 
  Mail, 
  User, 
  Key, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Smartphone, 
  Laptop,
  Radio,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Play,
  Download,
  Terminal,
  FileCode
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { authService, dbService, CloudFullData } from '../lib/supabaseService';
import { 
  getSupabaseConfig, 
  saveCustomSupabaseConfig, 
  clearCustomSupabaseConfig, 
  isSupabaseConfigured,
  getLastConfigError 
} from '../lib/supabase';
import { SCHEMA_SQL_CONTENT } from '../lib/schemaSqlText';
import { UserProfile, Task, Habit, Transaction, QuickNote, TargetItem } from '../types';

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SupabaseUser | null;
  onUserChange: (user: SupabaseUser | null) => void;
  userProfile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  quickNotes: QuickNote[];
  targets: TargetItem[];
  totalBalance: number;
  onApplyCloudData: (data: CloudFullData) => void;
  showToast: (msg: string) => void;
  realtimeStatus?: string;
  initialTab?: 'login' | 'register' | 'account' | 'config' | 'migration';
}

export const SupabaseAuthModal: React.FC<SupabaseAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  userProfile,
  tasks,
  habits,
  transactions,
  quickNotes,
  targets,
  totalBalance,
  onApplyCloudData,
  showToast,
  realtimeStatus = 'SUBSCRIBED',
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'account' | 'config' | 'migration'>(initialTab || 'login');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(userProfile.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Config Form State
  const [configUrl, setConfigUrl] = useState('');
  const [configAnonKey, setConfigAnonKey] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Migration & Tables State
  const [tablesCheck, setTablesCheck] = useState<Record<string, { exists: boolean; label: string; error?: string }> | null>(null);
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [dbPassword, setDbPassword] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showRawSql, setShowRawSql] = useState(false);

  const loadTablesStatus = async () => {
    setIsCheckingTables(true);
    try {
      const res = await dbService.checkTablesStatus();
      setTablesCheck(res.tables);
    } catch (err: any) {
      console.warn('Gagal cek status tabel:', err);
    } finally {
      setIsCheckingTables(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setMigrationResult(null);
      const cfg = getSupabaseConfig();
      setConfigUrl(cfg.url || '');
      setConfigAnonKey(cfg.anonKey || '');

      if (initialTab) {
        setActiveTab(initialTab);
      } else if (currentUser) {
        setActiveTab('account');
      } else if (!isSupabaseConfigured()) {
        setActiveTab('config');
      } else {
        setActiveTab('login');
      }

      loadTablesStatus();
    }
  }, [isOpen, currentUser, initialTab]);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setErrorMessage('Konfigurasi Supabase URL & Anon Key belum diatur. Silakan isi di tab Konfigurasi terlebih dahulu.');
      setActiveTab('config');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await authService.signIn(email, password);
      onUserChange(data.user);
      showToast(`Selamat datang kembali, ${data.user.user_metadata?.full_name || data.user.email}!`);
      
      // Auto-fetch data from cloud upon login
      try {
        const cloudData = await dbService.fetchAllUserData(data.user.id);
        if (cloudData && (cloudData.tasks?.length || cloudData.quickNotes?.length || cloudData.transactions?.length)) {
          onApplyCloudData(cloudData);
          showToast('Data akun dari Supabase berhasil disinkronkan ke perangkat ini!');
        } else {
          // If cloud has no data yet, offer/auto-upload current local data
          await dbService.uploadAllLocalData(data.user.id, {
            userProfile,
            tasks,
            habits,
            transactions,
            quickNotes,
            targets,
            totalBalance,
          });
          showToast('Data lokal Anda telah diamankan & diunggah ke Supabase Cloud!');
        }
      } catch (fetchErr) {
        console.warn('Initial cloud sync notice:', fetchErr);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal login. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setErrorMessage('Konfigurasi Supabase URL & Anon Key belum diatur. Silakan isi di tab Konfigurasi terlebih dahulu.');
      setActiveTab('config');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await authService.signUp(email, password, fullName || userProfile.name);
      if (data.user) {
        onUserChange(data.user);
        showToast('Pendaftaran akun berhasil!');

        // Upload local data to the newly created account
        try {
          await dbService.uploadAllLocalData(data.user.id, {
            userProfile: {
              ...userProfile,
              name: fullName || userProfile.name,
              greetingTitle: `Selamat Datang, ${fullName || userProfile.name}`,
            },
            tasks,
            habits,
            transactions,
            quickNotes,
            targets,
            totalBalance,
          });
          showToast('Data lokal berhasil ditautkan ke akun Supabase baru Anda!');
        } catch (uploadErr) {
          console.warn('Upload after register error:', uploadErr);
        }

        onClose();
      } else {
        setSuccessMessage('Pendaftaran berhasil! Silakan periksa email Anda jika konfirmasi email diaktifkan.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mendaftar. Pastikan email valid dan kata sandi minimal 6 karakter.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      onUserChange(null);
      showToast('Anda telah keluar dari akun Supabase.');
      setActiveTab('login');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal logout.');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload local to cloud
  const handleManualUpload = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await dbService.uploadAllLocalData(currentUser.id, {
        userProfile,
        tasks,
        habits,
        transactions,
        quickNotes,
        targets,
        totalBalance,
      });
      showToast('Semua data (Agenda, Jurnal, Kebiasaan, Dompet, Target) berhasil diunggah ke Supabase Cloud!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengunggah data ke Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download from cloud
  const handleManualFetch = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const cloudData = await dbService.fetchAllUserData(currentUser.id);
      if (cloudData) {
        onApplyCloudData(cloudData);
        showToast('Data terbaru dari Supabase Cloud berhasil ditarik ke perangkat ini!');
      } else {
        showToast('Belum ada data tersimpan di cloud untuk akun ini.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengambil data dari Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Supabase Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl || !configAnonKey) {
      setErrorMessage('Harap isi Supabase Project URL dan Anon Key.');
      return;
    }

    const ok = saveCustomSupabaseConfig(configUrl, configAnonKey);
    if (ok) {
      showToast('Konfigurasi Supabase berhasil disimpan!');
      setSuccessMessage('Supabase siap digunakan.');
      setTimeout(() => {
        setActiveTab(currentUser ? 'account' : 'login');
      }, 800);
    } else {
      setErrorMessage(getLastConfigError() || 'URL atau Anon Key tidak valid.');
    }
  };

  // Copy schema SQL
  const handleCopySchemaSql = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(SCHEMA_SQL_CONTENT);
      }
      setCopiedSql(true);
      showToast('Skrip schema.sql berhasil disalin ke clipboard! Jalankan di SQL Editor Supabase Anda.');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      showToast('Gagal menyalin otomatis, silakan unduh file schema.sql.');
    }
  };

  // Download schema.sql file
  const handleDownloadSchemaSql = () => {
    try {
      const blob = new Blob([SCHEMA_SQL_CONTENT], { type: 'text/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'schema.sql');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('File schema.sql berhasil diunduh.');
    } catch (e) {
      showToast('Gagal mengunduh file.');
    }
  };

  // Run automated migration via Vite backend
  const handleRunMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbPassword.trim()) {
      showToast('Masukkan password database PostgreSQL Supabase Anda.');
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await dbService.triggerServerMigration(dbPassword.trim());
      setMigrationResult(res);
      if (res.success) {
        showToast('Skrip migrasi berhasil dijalankan! Seluruh tabel aktif.');
        await loadTablesStatus();
      } else {
        showToast(res.message || 'Gagal menjalankan migrasi.');
      }
    } catch (err: any) {
      setMigrationResult({ success: false, message: err?.message || 'Terjadi kesalahan sistem saat migrasi.' });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        id="modal-supabase-auth"
        className="bg-[#0e111a]/95 backdrop-blur-3xl rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(45,212,191,0.12)] w-full max-w-lg p-6 sm:p-7 border border-teal-500/30 relative text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Header Modal */}
        <div className="flex justify-between items-start pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400/20 via-sky-500/20 to-emerald-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {currentUser ? 'Akun & Sinkronisasi Supabase' : 'Masuk / Daftar Supabase'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Sinkronisasi otomatis HP ↔ Laptop dengan Row Level Security (RLS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal autentikasi Supabase"
            className="text-white/40 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-white/[0.04] rounded-2xl border border-white/10 my-4 gap-1 text-xs">
          {currentUser ? (
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'account'
                  ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Akun Saya</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Daftar Akun</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 px-3 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-white/20 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Koneksi</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('migration');
              loadTablesStatus();
            }}
            className={`py-2 px-3 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'migration'
                ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Tabel & Migrasi</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-snug">{successMessage}</span>
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && !currentUser && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10 outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-[11px] text-white/70">
                Setelah masuk, data Anda di Laptop dan HP akan otomatis saling tersinkronisasi dalam hitungan milidetik secara aman (RLS).
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 hover:from-teal-600 hover:via-sky-600 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-teal-500/25 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun Supabase</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-white/50 pt-2">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-teal-300 hover:text-teal-200 font-semibold underline cursor-pointer"
              >
                Daftar sekarang
              </button>
            </p>
          </form>
        )}

        {/* TAB 2: REGISTER FORM */}
        {activeTab === 'register' && !currentUser && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Nama Lengkap Anda
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Nama Pengguna"
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Kata Sandi Baru (Min. 6 Karakter)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10 outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="text-[11px] text-white/70">
                Data lokal Anda yang ada saat ini akan langsung dimigrasi & diunggah secara aman ke database Supabase Anda.
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 hover:from-teal-600 hover:via-sky-600 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-teal-500/25 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                <>
                  <span>Daftar & Hubungkan Cloud</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-white/50 pt-2">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-teal-300 hover:text-teal-200 font-semibold underline cursor-pointer"
              >
                Masuk di sini
              </button>
            </p>
          </form>
        )}

        {/* TAB 3: LOGGED IN / ACCOUNT STATUS */}
        {activeTab === 'account' && currentUser && (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/15 via-sky-500/10 to-transparent border border-teal-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/25 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold text-lg">
                  {(currentUser.user_metadata?.full_name || currentUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentUser.user_metadata?.full_name || userProfile.name || 'Pengguna'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </h4>
                  <p className="text-xs text-white/60 font-mono mt-0.5">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5"
                title="Keluar dari Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>

            {/* Realtime Live Status Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">
                    Supabase Realtime Channel Aktif
                  </span>
                  <span className="text-[11px] text-white/60">
                    Status: {realtimeStatus === 'SUBSCRIBED' ? 'Terhubung (Sinkron Instan HP ↔ Laptop)' : realtimeStatus}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-teal-300 bg-teal-500/20 px-2.5 py-1 rounded-xl border border-teal-400/30">
                <Smartphone className="w-3.5 h-3.5" />
                <span>⇄</span>
                <Laptop className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Data Stats */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block">Agenda</span>
                <span className="text-sm font-bold text-white font-mono">{tasks.length} item</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block">Jurnal</span>
                <span className="text-sm font-bold text-white font-mono">{quickNotes.length} entri</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] text-white/50 uppercase block">Target</span>
                <span className="text-sm font-bold text-white font-mono">{targets.length} target</span>
              </div>
            </div>

            {/* Manual Sync Trigger Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleManualUpload}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Cloud className="w-4 h-4 text-sky-400" />
                <span>Paksa Unggah Seluruh Data Lokal ke Cloud</span>
              </button>

              <button
                onClick={handleManualFetch}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-200 text-xs font-semibold border border-teal-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-4 h-4 text-teal-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Tarik & Sinkronkan Ulang dari Cloud</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SUPABASE CONFIGURATION (URL & KEY & SCHEMA.SQL) */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-white/80">Status Konfigurasi Saat Ini:</span>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Belum Dikonfigurasi
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50">
                Nilai diambil dari <code className="text-teal-300">VITE_SUPABASE_URL</code> & <code className="text-teal-300">VITE_SUPABASE_ANON_KEY</code> atau dapat Anda isi langsung di bawah ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="text"
                required
                value={configUrl}
                onChange={(e) => setConfigUrl(e.target.value)}
                placeholder="https://abcdefghijklmn.supabase.co"
                className="w-full text-xs font-mono px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Supabase Anon / Public API Key
              </label>
              <textarea
                rows={2}
                required
                value={configAnonKey}
                onChange={(e) => setConfigAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full text-xs font-mono px-3.5 py-2 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10 outline-hidden transition-all resize-none"
              />
            </div>

            {/* Quick Schema Copy Button */}
            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-bold text-teal-300 block">File Skema Database (schema.sql)</span>
                <span className="text-[11px] text-white/60 block truncate">
                  Tabel PostgreSQL, Index, RLS Policy & Realtime sudah disiapkan.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopySchemaSql}
                className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Tersalin' : 'Salin SQL'}</span>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              {getSupabaseConfig().anonKey && (
                <button
                  type="button"
                  onClick={() => {
                    clearCustomSupabaseConfig();
                    setConfigUrl('');
                    setConfigAnonKey('');
                    showToast('Pengaturan Supabase kustom dihapus.');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 rounded-xl cursor-pointer transition-colors"
                >
                  Reset
                </button>
              )}

              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
              >
                Simpan Konfigurasi Supabase
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Migration & Database Tables */}
        {activeTab === 'migration' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Status Summary Banner */}
            {(() => {
              const allReady = tablesCheck && Object.values(tablesCheck).every((t) => t.exists);
              const totalCount = tablesCheck ? Object.keys(tablesCheck).length : 6;
              const readyCount = tablesCheck ? Object.values(tablesCheck).filter((t) => t.exists).length : 0;

              return (
                <div
                  className={`p-4 rounded-2xl border ${
                    allReady
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {allReady ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold text-sm">
                        {allReady
                          ? 'Semua Tabel Supabase Siap & Aktif!'
                          : `Status Skema Database (${readyCount}/${totalCount} Tabel Terdaftar)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={loadTablesStatus}
                      disabled={isCheckingTables}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Periksa Ulang Status Tabel"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingTables ? 'animate-spin' : ''}`} />
                      <span>{isCheckingTables ? 'Memeriksa...' : 'Cek Status'}</span>
                    </button>
                  </div>
                  <p className="text-xs opacity-85 leading-relaxed">
                    {allReady
                      ? 'Tabel journals, user_profiles, agendas, wallets, targets, dan habits sudah terdaftar di Supabase PostgreSQL. Data Anda otomatis tersimpan di cloud.'
                      : 'Tabel database Supabase belum terdaftar di proyek Anda. Jalankan skrip pendaftaran tabel di bawah ini agar catatan jurnal dan data lainnya dapat disimpan secara permanen di Supabase.'}
                  </p>
                </div>
              );
            })()}

            {/* Live Table Badges */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-xs font-bold text-white/90 block mb-2.5">
                Daftar Tabel Database Supabase:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'journals', name: 'public.journals', desc: 'Catatan Jurnal Harian' },
                  { key: 'user_profiles', name: 'public.user_profiles', desc: 'Profil & Streak' },
                  { key: 'agendas', name: 'public.agendas', desc: 'Agenda & Kalender' },
                  { key: 'wallets', name: 'public.wallets', desc: 'Dompet & Transaksi' },
                  { key: 'targets', name: 'public.targets', desc: 'Target & Sasaran' },
                  { key: 'habits', name: 'public.habits', desc: 'Pelacak Kebiasaan' },
                ].map((item) => {
                  const status = tablesCheck?.[item.key];
                  const isReady = status?.exists === true;

                  return (
                    <div
                      key={item.key}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono font-bold text-teal-300 truncate">
                            {item.name}
                          </code>
                        </div>
                        <span className="text-[11px] text-white/50 block truncate">
                          {item.desc}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border flex items-center gap-1 ${
                          isReady
                            ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                            : 'bg-rose-500/15 border-rose-400/30 text-rose-300'
                        }`}
                      >
                        {isReady ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Belum Ada</span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metode 1: 1-Klik Supabase Dashboard (Paling Mudah) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-sky-500/10 to-transparent border border-teal-500/30 space-y-3">
              <div className="flex items-center gap-2 text-teal-300">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Cara Termudah (1 Klik di Dashboard Supabase)
                </span>
              </div>

              <ol className="text-xs text-white/80 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Klik tombol <strong>"Salin Skrip SQL"</strong> di bawah.
                </li>
                <li>
                  Klik tombol <strong>"Buka SQL Editor Supabase"</strong>.
                </li>
                <li>
                  Tempelkan (Paste) skrip di editor Supabase, lalu klik tombol hijau <strong>"Run"</strong>. Selesai!
                </li>
              </ol>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopySchemaSql}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-bold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Skrip SQL Tersalin!' : 'Salin Skrip SQL (schema.sql)'}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard/project/nbfnspscgwktzfzagzxt/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Buka Supabase SQL Editor</span>
                </a>

                <button
                  type="button"
                  onClick={handleDownloadSchemaSql}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Unduh file schema.sql"
                >
                  <Download className="w-3.5 h-3.5 text-teal-300" />
                  <span>Unduh .SQL</span>
                </button>
              </div>
            </div>

            {/* Metode 2: Eksekusi Otomatis dari Aplikasi */}
            <form onSubmit={handleRunMigration} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Opsi: Jalankan Migrasi Otomatis dari Aplikasi
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Masukkan password database PostgreSQL Supabase Anda (password yang dibuat saat membuat project) untuk mengeksekusi migrasi langsung.
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    placeholder="Password database Supabase..."
                    className="w-full text-xs px-3.5 pl-8 py-2 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-emerald-400 focus:bg-white/10 outline-hidden transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isMigrating || !dbPassword.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
                >
                  <Play className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span>{isMigrating ? 'Menjalankan...' : 'Jalankan Migrasi'}</span>
                </button>
              </div>

              {migrationResult && (
                <div
                  className={`p-3 rounded-xl text-xs border ${
                    migrationResult.success
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <p className="font-semibold">{migrationResult.message}</p>
                </div>
              )}
            </form>

            {/* Metode 3: CLI Terminal */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-white/90 block truncate">Perintah Terminal / CLI:</span>
                  <code className="text-[11px] font-mono text-teal-300 block truncate">
                    npm run db:migrate
                  </code>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText('npm run db:migrate');
                    showToast('Perintah terminal disalin!');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors cursor-pointer shrink-0"
              >
                Salin Perintah
              </button>
            </div>

            {/* Accordion Lihat Skrip SQL */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowRawSql(!showRawSql)}
                className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-teal-400" />
                <span>{showRawSql ? 'Sembunyikan Cuplikan SQL' : 'Lihat Isi Skrip SQL Lengkap'}</span>
              </button>

              {showRawSql && (
                <div className="mt-2 p-3 bg-black/60 rounded-xl border border-white/10">
                  <textarea
                    readOnly
                    rows={8}
                    value={SCHEMA_SQL_CONTENT}
                    className="w-full text-[10px] font-mono text-teal-200 bg-transparent outline-hidden resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Close */}
        <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
