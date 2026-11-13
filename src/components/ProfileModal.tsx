import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  Check, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  User as UserIcon, 
  Mail, 
  RefreshCw,
  CheckCircle2,
  Star,
  MessageSquareHeart,
  ThumbsUp,
  ArrowRight,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { UserProfile, AppFeedback } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { authService } from '../lib/supabaseService';
import { triggerConfetti } from '../utils/confetti';
import { AvatarUploader } from './AvatarUploader';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  currentUser?: SupabaseUser | null;
  onOpenSupabaseModal?: () => void;
  onShowToast?: (msg: string) => void;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  currentUser = null,
  onOpenSupabaseModal,
  onShowToast,
  onLogout,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'feedback'>('profile');

  // Cek apakah akun sudah dibuat selama minimal 24 jam atau pengguna sudah pernah mengisi ulasan
  const accountCreatedTime = 
    userProfile.accountCreatedAt || 
    (currentUser?.created_at && currentUser.created_at !== '2026-01-01T00:00:00.000Z' ? currentUser.created_at : null) ||
    localStorage.getItem('ascend_account_created_at');

  const is24HoursPassed = Boolean(
    accountCreatedTime && 
    accountCreatedTime !== '2026-01-01T00:00:00.000Z' && 
    (Date.now() - new Date(accountCreatedTime).getTime()) >= 24 * 60 * 60 * 1000
  );

  const hasSubmittedFeedback = Boolean(userProfile.feedback?.submittedAt);
  const canAccessFeedback = is24HoursPassed || hasSubmittedFeedback;

  useEffect(() => {
    if (!canAccessFeedback && activeTab === 'feedback') {
      setActiveTab('profile');
    }
  }, [canAccessFeedback, activeTab]);

  // --- Feedback & Star Rating state (2-step: Berikan ini dulu lalu berikan saran) ---
  const [feedbackStep, setFeedbackStep] = useState<1 | 2>(1);
  const [feedbackRating, setFeedbackRating] = useState<number>(userProfile.feedback?.rating || 5);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState<number | null>(null);
  const [feedbackSuggestions, setFeedbackSuggestions] = useState<string>(userProfile.feedback?.suggestions || '');
  const [feedbackTags, setFeedbackTags] = useState<string[]>(userProfile.feedback?.tags || []);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // --- Profile state ---
  const [fullName, setFullName] = useState(userProfile.name || '');
  const [greetingSubtitle, setGreetingSubtitle] = useState(userProfile.greetingSubtitle || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);

  // --- Password state ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(userProfile.name || '');
      setGreetingSubtitle(userProfile.greetingSubtitle || '');
      setAvatarUrl(userProfile.avatarUrl || '');
      setPhotoError(null);
      setPhotoSuccess(null);
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  // ============================================================================
  // 1. FOTO PROFIL LOGIC (Dikelola oleh AvatarUploader)
  // ============================================================================

  const handleSaveProfileInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim() || 'Pengguna';
    const updated: UserProfile = {
      ...userProfile,
      name: cleanName,
      greetingTitle: `Selamat Datang, ${cleanName}`,
      greetingSubtitle: greetingSubtitle.trim() || 'Kelola agenda, kebiasaan, dan keuangan Anda hari ini.',
      avatarUrl: avatarUrl || undefined,
    };
    onUpdateProfile(updated);
    setPhotoSuccess('Informasi profil berhasil disimpan!');
  };

  // ============================================================================
  // 2. GANTI KATA SANDI (PASSWORD) LOGIC & VALIDASI
  // ============================================================================

  // Petunjuk & Syarat Kata Sandi Aman
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const calculatePasswordStrength = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpper && hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    return score; // 0 sampai 4
  };

  const passwordStrengthScore = calculatePasswordStrength();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validasi syarat kata sandi
    if (!hasMinLength) {
      setPasswordError('Kata sandi baru harus memiliki minimal 8 karakter.');
      return;
    }

    if (!hasUpper || !hasLower) {
      setPasswordError('Kata sandi harus mengandung kombinasi huruf besar (A-Z) dan huruf kecil (a-z).');
      return;
    }

    if (!hasNumber) {
      setPasswordError('Kata sandi harus mengandung minimal 1 angka (0-9).');
      return;
    }

    if (!hasSpecial) {
      setPasswordError('Kata sandi harus mengandung minimal 1 simbol khusus (!@#$%^&* dsb.).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // Gunakan supabase.auth.updateUser({ password: newPassword }) via authService
      await authService.updatePassword(newPassword);

      setPasswordSuccess('Kata sandi akun Anda berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Update password error:', err);
      setPasswordError(
        err?.message || 'Gagal memperbarui kata sandi. Pastikan Anda sedang login dengan sesi Supabase yang aktif.'
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };



  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="modal-profil-pengguna"
        onClick={(e) => e.stopPropagation()}
        className={`${
          isLight
            ? 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-[#111827] border border-[#263449] text-white shadow-2xl'
        } rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header Modal */}
        <div className={`flex justify-between items-center px-6 py-4 border-b ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-white/[0.02]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${isLight ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-gradient-to-tr from-teal-500/30 to-sky-500/30 border-teal-400/30 text-teal-300'} border flex items-center justify-center`}>
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-slate-950' : 'text-white'} tracking-tight`}>Profil &amp; Pengaturan Akun</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Kelola profil dan keamanan akun Anda</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white transition-all cursor-pointer text-xs font-bold active:scale-95 shadow-xs"
                title="Keluar / Log Out dari Akun"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Keluar</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup modal profil"
              className={`${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'} p-2 rounded-xl transition-colors cursor-pointer`}
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center gap-1 px-4 sm:px-6 pt-3 border-b ${isLight ? 'border-slate-200 bg-slate-50/30' : 'border-white/10 bg-white/[0.01]'} overflow-x-auto custom-scrollbar shrink-0`}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'profile'
                ? 'text-teal-300 border-teal-400 bg-teal-500/10 rounded-t-xl'
                : 'text-white/60 border-transparent hover:text-white hover:bg-white/5 rounded-t-xl'
            }`}
          >
            <UserIcon className="w-4 h-4 shrink-0" />
            <span>Foto & Profil</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'text-amber-300 border-amber-400 bg-amber-500/10 rounded-t-xl'
                : 'text-white/60 border-transparent hover:text-white hover:bg-white/5 rounded-t-xl'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Ganti Kata Sandi</span>
          </button>

          {canAccessFeedback && (
            <button
              onClick={() => setActiveTab('feedback')}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'feedback'
                  ? 'text-amber-300 border-amber-400 bg-amber-500/10 rounded-t-xl'
                  : 'text-white/60 border-transparent hover:text-white hover:bg-white/5 rounded-t-xl'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span>Bintang &amp; Saran</span>
              {userProfile.feedback?.rating ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shrink-0">
                  {userProfile.feedback.rating}★
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm custom-scrollbar">

          {/* ================================================================= */}
          {/* TAB 1: FOTO & PROFIL PENGGUNA */}
          {/* ================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Foto Profil Box via AvatarUploader */}
              <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/[0.03] border-white/10 text-white'
              }`}>
                <AvatarUploader
                  userId={currentUser?.id}
                  currentAvatarUrl={avatarUrl || userProfile.avatarUrl}
                  userName={fullName || userProfile.name}
                  size="lg"
                  showControls={true}
                  showRemoveButton={true}
                  theme={theme}
                  onAvatarUpdated={(newUrl) => {
                    setAvatarUrl(newUrl);
                    const updated: UserProfile = {
                      ...userProfile,
                      avatarUrl: newUrl,
                    };
                    onUpdateProfile(updated);
                    setPhotoSuccess('Foto profil berhasil diperbarui!');
                  }}
                  onAvatarRemoved={() => {
                    setAvatarUrl('');
                    const updated: UserProfile = {
                      ...userProfile,
                      avatarUrl: undefined,
                    };
                    onUpdateProfile(updated);
                    setPhotoSuccess('Foto profil telah dihapus.');
                  }}
                />

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Foto Profil Pengguna</h3>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                    Unggah foto avatar Anda. File otomatis disimpan secara aman ke Supabase Storage (Private Bucket <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10">profiles</code>) dan kolom <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10">avatar_url</code> tabel database.
                  </p>
                </div>
              </div>

              {/* Feedback Notifikasi Foto */}
              {photoSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{photoSuccess}</span>
                </div>
              )}

              {photoError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Form Data Profil */}
              <form onSubmit={handleSaveProfileInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Email Akun Terdaftar
                  </label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-white/60 text-sm">
                    <Mail className="w-4 h-4 text-white/40" />
                    <span>{currentUser?.email || 'kamalizudin36@gmail.com'}</span>
                    <span className="ml-auto text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Terverifikasi
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Teks Motivasi / Sambutan
                  </label>
                  <input
                    type="text"
                    value={greetingSubtitle}
                    onChange={(e) => setGreetingSubtitle(e.target.value)}
                    placeholder="Contoh: Ayo lebih produktif lagi hari ini."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal-400 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className={`w-full py-2.5 px-4 rounded-xl ${
                      isLight 
                        ? 'bg-[#003B2F] hover:bg-[#002e24] text-white' 
                        : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                    } font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Perubahan Profil</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: GANTI KATA SANDI (PASSWORD) */}
          {/* ================================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Petunjuk Pembuatan Kata Sandi yang Aman */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Petunjuk Kata Sandi Aman & Kuat</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Untuk melindungi akun Supabase Anda, pastikan kata sandi baru memenuhi standar keamanan berikut:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    hasMinLength ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-white/[0.03] border-white/10 text-white/60'
                  }`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-white/30 ml-0.5"></div>}
                    <span>Minimal 8 karakter</span>
                  </div>

                  <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    hasUpper && hasLower ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-white/[0.03] border-white/10 text-white/60'
                  }`}>
                    {hasUpper && hasLower ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-white/30 ml-0.5"></div>}
                    <span>Huruf Besar & Kecil (A-z)</span>
                  </div>

                  <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    hasNumber ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-white/[0.03] border-white/10 text-white/60'
                  }`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-white/30 ml-0.5"></div>}
                    <span>Minimal 1 Angka (0-9)</span>
                  </div>

                  <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    hasSpecial ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-white/[0.03] border-white/10 text-white/60'
                  }`}>
                    {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-white/30 ml-0.5"></div>}
                    <span>Simbol Khusus (!@#$%^&*)</span>
                  </div>
                </div>
              </div>

              {/* Form Ganti Password */}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Input Kata Sandi Baru */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru yang kuat"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Meter Kekuatan Sandi */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-white/50">Kekuatan Kata Sandi:</span>
                        <span className={`font-semibold ${
                          passwordStrengthScore >= 4 ? 'text-emerald-400' :
                          passwordStrengthScore >= 3 ? 'text-teal-400' :
                          passwordStrengthScore >= 2 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {passwordStrengthScore >= 4 ? 'Sangat Kuat' :
                           passwordStrengthScore >= 3 ? 'Kuat' :
                           passwordStrengthScore >= 2 ? 'Sedang' : 'Lemah'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 rounded-full transition-all ${
                          passwordStrengthScore >= 1 ? (passwordStrengthScore >= 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-transparent'
                        }`} />
                        <div className={`h-full flex-1 rounded-full transition-all ${
                          passwordStrengthScore >= 2 ? (passwordStrengthScore >= 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-transparent'
                        }`} />
                        <div className={`h-full flex-1 rounded-full transition-all ${
                          passwordStrengthScore >= 3 ? 'bg-emerald-500' : 'bg-transparent'
                        }`} />
                        <div className={`h-full flex-1 rounded-full transition-all ${
                          passwordStrengthScore >= 4 ? 'bg-emerald-400' : 'bg-transparent'
                        }`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className={`w-full bg-white/5 border rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors ${
                        confirmPassword && confirmPassword !== newPassword 
                          ? 'border-rose-500/50 focus:border-rose-400' 
                          : confirmPassword && confirmPassword === newPassword
                          ? 'border-emerald-500/50 focus:border-emerald-400'
                          : 'border-white/10 focus:border-amber-400'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="mt-1 text-[11px]">
                      {passwordsMatch ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Kata sandi cocok
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Konfirmasi kata sandi belum cocok
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Feedback Alerts */}
                {passwordSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !passwordsMatch || passwordStrengthScore < 3}
                    className={`w-full py-2.5 px-4 rounded-xl ${
                      isLight 
                        ? 'bg-[#003B2F] hover:bg-[#002e24] text-white' 
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    } disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2`}
                  >
                    {isUpdatingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memproses Perubahan Sandi...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Perbarui Kata Sandi Akun</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: BINTANG & SARAN PENGGUNA (2-STEP: BINTANG DULU LALU SARAN) */}
          {/* ================================================================= */}
          {canAccessFeedback && activeTab === 'feedback' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Bintang &amp; Saran Pengalaman</h3>
                    <p className="text-xs text-white/50">Berikan penilaian bintang terlebih dahulu, lalu sampaikan saran Anda</p>
                  </div>
                </div>

                {userProfile.feedback?.submittedAt && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Sudah Mengisi Ulasan
                  </span>
                )}
              </div>

              {feedbackSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{feedbackSuccess}</span>
                </div>
              )}

              {/* 2-Step Progress Indicator */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFeedbackStep(1)}
                  className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    feedbackStep === 1
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Berikan Bintang Dulu</span>
                </button>

                <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />

                <button
                  type="button"
                  onClick={() => setFeedbackStep(2)}
                  className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    feedbackStep === 2
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Lalu Berikan Saran</span>
                </button>
              </div>

              {/* STEP 1: BERIKAN BINTANG DULU */}
              {feedbackStep === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-xs text-white/70">
                      Bagaimana penilaian kepuasan Anda selama menggunakan aplikasi ini?
                    </p>

                    <div className="flex items-center gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const activeStar = feedbackHoverRating || feedbackRating;
                        const isFilled = starNum <= activeStar;
                        return (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setFeedbackRating(starNum)}
                            onMouseEnter={() => setFeedbackHoverRating(starNum)}
                            onMouseLeave={() => setFeedbackHoverRating(null)}
                            className="p-1 sm:p-2 rounded-xl transition-all transform hover:scale-125 active:scale-95 cursor-pointer"
                            title={`Beri ${starNum} Bintang`}
                          >
                            <Star
                              className={`w-8 h-8 sm:w-10 sm:h-10 transition-all ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                  : 'text-white/20 hover:text-amber-400/40'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                      <span>{feedbackHoverRating || feedbackRating} dari 5 Bintang</span>
                      <span>•</span>
                      <span>
                        {(feedbackHoverRating || feedbackRating) === 5 ? '🤩 Luar Biasa & Sangat Suka!' :
                         (feedbackHoverRating || feedbackRating) === 4 ? '😊 Sangat Bagus & Membantu' :
                         (feedbackHoverRating || feedbackRating) === 3 ? '🙂 Baik & Bermanfaat' :
                         (feedbackHoverRating || feedbackRating) === 2 ? '😐 Cukup' : '😞 Perlu Banyak Perbaikan'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFeedbackStep(2)}
                      className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500 hover:from-amber-400 hover:to-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <span>Lalu Berikan Saran</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: LALU BERIKAN SARAN */}
              {feedbackStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= feedbackRating ? 'fill-amber-400 text-amber-400' : 'text-white/20'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-white">{feedbackRating} / 5 Bintang</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFeedbackStep(1)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline"
                    >
                      Ubah Bintang
                    </button>
                  </div>

                  {/* Quick Tags */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-sky-400" />
                      <span>Masukan Cepat (Klik untuk menambah):</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '✨ Tampilan Bersih & Rapi',
                        '⚡ Ringan & Responsif',
                        '📅 Agenda Sangat Praktis',
                        '🔥 Habit Tracker Membantu',
                        '💰 Keuangan Tercatat Rapi',
                        '💡 Tambahkan Widget Ringkasan',
                        '🔒 Sinkronisasi Cloud Bagus'
                      ].map((tag) => {
                        const isSelected = feedbackTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setFeedbackTags((prev) => {
                                const exists = prev.includes(tag);
                                const next = exists ? prev.filter((t) => t !== tag) : [...prev, tag];
                                if (!exists) {
                                  setFeedbackSuggestions((curr) => {
                                    const cleanTag = tag.replace(/^[^\w\s]+/, '').trim();
                                    return curr.trim() ? `${curr.trim()}\n• ${cleanTag}` : cleanTag;
                                  });
                                }
                                return next;
                              });
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {tag} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageSquareHeart className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tuliskan Saran &amp; Kritik Membangun:</span>
                      </span>
                      <span className="text-[11px] text-white/40">{feedbackSuggestions.length} karakter</span>
                    </label>
                    <textarea
                      value={feedbackSuggestions}
                      onChange={(e) => setFeedbackSuggestions(e.target.value)}
                      placeholder="Apa fitur yang paling Anda sukai atau hal apa yang ingin Anda tambahkan di aplikasi ini?..."
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs sm:text-sm placeholder-white/30 focus:outline-none focus:border-sky-400 transition-colors resize-none leading-relaxed custom-scrollbar"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackStep(1)}
                      className="px-3 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Bintang</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSavingFeedback}
                      onClick={() => {
                        setIsSavingFeedback(true);
                        const newFeedback: AppFeedback = {
                          rating: feedbackRating,
                          suggestions: feedbackSuggestions.trim(),
                          tags: feedbackTags,
                          submittedAt: userProfile.feedback?.submittedAt || new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };

                        triggerConfetti({
                          particleCount: 40,
                          spread: 60,
                          colors: ['#f59e0b', '#38bdf8', '#10b981'],
                        });

                        setTimeout(() => {
                          const updatedProfile = {
                            ...userProfile,
                            feedback: newFeedback,
                          };
                          onUpdateProfile(updatedProfile);
                          localStorage.setItem('journalstream_user_profile', JSON.stringify(updatedProfile));
                          localStorage.setItem('journalstream_app_feedback', JSON.stringify(newFeedback));
                          setFeedbackSuccess('Bintang dan saran Anda berhasil disimpan! Terima kasih.');
                          setIsSavingFeedback(false);
                          if (onShowToast) {
                            onShowToast('Bintang dan saran berhasil disimpan di profil Anda! ⭐');
                          }
                        }, 250);
                      }}
                      className={`py-2.5 px-5 rounded-xl ${
                        isLight 
                          ? 'bg-[#003B2F] hover:bg-[#002e24] text-white' 
                          : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950'
                      } font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSavingFeedback ? 'Menyimpan...' : 'Simpan Bintang & Saran'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className={`p-4 border-t ${isLight ? 'border-slate-200 bg-slate-50/50 text-slate-500' : 'border-white/10 bg-white/[0.02] text-white/50'} flex items-center justify-between text-xs`}>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Tersinkronisasi Aman dengan Supabase Auth & Cloud</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/10 hover:bg-white/15 text-white'} font-semibold transition-colors cursor-pointer`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
