import React, { useState, useRef, useEffect } from 'react';
import { 
  X,
  Upload, 
  KeyRound, 
  Check, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  User as UserIcon, 
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Megaphone,
  MessageSquare,
  Database,
  Radio,
  Sparkles,
  Lock,
  ChevronRight,
  ChevronDown,
  Settings as SettingsIcon,
  HelpCircle,
  Shield
} from 'lucide-react';
import { UserProfile, NavTab } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { authService, dbService } from '../lib/supabaseService';
import { checkIsAdminUser } from '../utils/admin';
import { AvatarUploader } from './AvatarUploader';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  currentUser?: SupabaseUser | null;
  totalBalance?: number;
  onOpenSupabaseModal?: () => void;
  onOpenFeedbackModal?: () => void;
  onOpenAnnouncementsAdmin?: () => void;
  onNavigateToTab?: (tab: NavTab) => void;
  onOpenSync?: () => void;
  onOpenHelp?: () => void;
  onOpenSettings?: () => void;
  onShowToast?: (msg: string) => void;
  onNavigateToDashboard?: () => void;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
}

type ActiveProfileModal = 'account' | 'password' | 'feedback' | null;

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onUpdateProfile,
  currentUser = null,
  totalBalance = 0,
  onOpenSupabaseModal,
  onOpenFeedbackModal,
  onOpenAnnouncementsAdmin,
  onNavigateToTab,
  onOpenSync,
  onOpenHelp,
  onOpenSettings,
  onShowToast,
  onNavigateToDashboard,
  onLogout,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const isAdmin = checkIsAdminUser(currentUser, userProfile);

  // Modal / Drawer state for sub-menus
  const [activeModal, setActiveModal] = useState<ActiveProfileModal>(null);
  const [isAdminPanelOpen] = useState<boolean>(false);
  const [isPortalEntering, setIsPortalEntering] = useState<boolean>(false);

  const handleEnterAdminPortal = () => {
    setIsPortalEntering(true);
    setTimeout(() => {
      setIsPortalEntering(false);
      onNavigateToTab?.('admin-portal');
    }, 1200);
  };

  // Accordion State: Fitur lipat kartu profil yang terbuka halus ke bawah
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

  // Form states
  const [fullName, setFullName] = useState(userProfile.name || '');
  const [greetingSubtitle, setGreetingSubtitle] = useState(userProfile.greetingSubtitle || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [currencySymbol, setCurrencySymbol] = useState(userProfile.currencySymbol || 'Rp');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(userProfile.name || '');
    setGreetingSubtitle(userProfile.greetingSubtitle || '');
    setAvatarUrl(userProfile.avatarUrl || '');
    setCurrencySymbol(userProfile.currencySymbol || 'Rp');
  }, [userProfile]);

  // ============================================================================
  // FOTO PROFIL LOGIC
  // ============================================================================

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(readerEvent.target?.result as string);
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Format file tidak didukung. Silakan gunakan file gambar JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Ukuran gambar melebihi batas 5 MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError(null);
    setPhotoSuccess(null);

    try {
      const compressedDataUrl = await compressImage(file);
      setAvatarUrl(compressedDataUrl);

      let finalAvatarUrl = compressedDataUrl;
      if (currentUser?.id) {
        try {
          finalAvatarUrl = await dbService.uploadAvatar(currentUser.id, file);
          setAvatarUrl(finalAvatarUrl);
        } catch (dbErr) {
          console.warn('Fallback to local optimized dataUrl:', dbErr);
        }
      }

      const updatedProfile: UserProfile = {
        ...userProfile,
        avatarUrl: finalAvatarUrl,
      };
      onUpdateProfile(updatedProfile);
      setPhotoSuccess('Foto profil berhasil diperbarui!');
      onShowToast?.('Foto profil berhasil diperbarui!');
    } catch (err: any) {
      setPhotoError(err?.message || 'Gagal mengunggah foto profil.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfileInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim() || 'Pengguna';
    const updated: UserProfile = {
      ...userProfile,
      name: cleanName,
      greetingTitle: `Selamat Datang, ${cleanName}`,
      greetingSubtitle: greetingSubtitle.trim() || 'Kelola agenda, kebiasaan, dan keuangan Anda hari ini.',
      avatarUrl: avatarUrl || undefined,
      currencySymbol,
    };
    onUpdateProfile(updated);
    setPhotoSuccess('Perubahan profil berhasil disimpan!');
    onShowToast?.('Informasi akun berhasil disimpan!');
    setTimeout(() => {
      setActiveModal(null);
      setPhotoSuccess(null);
    }, 700);
  };

  // ============================================================================
  // GANTI KATA SANDI LOGIC
  // ============================================================================

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
    return score;
  };

  const passwordStrengthScore = calculatePasswordStrength();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!hasMinLength) {
      setPasswordError('Kata sandi baru minimal 8 karakter.');
      return;
    }

    if (!hasUpper || !hasLower) {
      setPasswordError('Gunakan kombinasi huruf besar (A-Z) dan huruf kecil (a-z).');
      return;
    }

    if (!hasNumber) {
      setPasswordError('Kata sandi harus memiliki minimal 1 angka.');
      return;
    }

    if (!hasSpecial) {
      setPasswordError('Kata sandi harus memiliki minimal 1 simbol khusus (!@#$%^&* dll).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak sama.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await authService.updatePassword(newPassword);
      setPasswordSuccess('Kata sandi akun Anda berhasil diganti!');
      setNewPassword('');
      setConfirmPassword('');
      onShowToast?.('Kata sandi berhasil diperbarui!');
      setTimeout(() => {
        setActiveModal(null);
        setPasswordSuccess(null);
      }, 900);
    } catch (err: any) {
      setPasswordError(
        err?.message || 'Gagal mengubah kata sandi. Pastikan akun Supabase Anda terhubung.'
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };


  return (
    <div className={`w-full min-h-[calc(100vh-80px)] pb-24 md:pb-16 animate-in fade-in duration-200 ${
      isLight ? 'bg-slate-50/60 text-slate-800' : 'bg-[#080E21] text-slate-100'
    }`}>
      {/* Input File Foto Profil Tersembunyi */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* ============================================================================ */}
      {/* 1. HEADER PENUH (FULL-WIDTH MODERN BANNER TANPA KARTU & TANPA GELOMBANG)     */}
      {/* ============================================================================ */}
      <div className={`relative overflow-hidden w-full transition-colors ${
        isLight 
          ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white' 
          : 'bg-gradient-to-br from-[#0c1427] via-[#111C38] to-[#0A1020] text-slate-100 border-b border-white/5'
      }`}>
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5 relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Avatar with Camera Overlay via AvatarUploader */}
            <div className="mb-2.5">
              <AvatarUploader
                userId={currentUser?.id}
                currentAvatarUrl={userProfile.avatarUrl}
                userName={userProfile.name}
                size="md"
                showControls={true}
                showRemoveButton={false}
                theme={theme}
                onAvatarUpdated={(newUrl) => {
                  setAvatarUrl(newUrl);
                  const updated: UserProfile = {
                    ...userProfile,
                    avatarUrl: newUrl,
                  };
                  onUpdateProfile(updated);
                  onShowToast?.('Foto profil berhasil diperbarui!');
                }}
                onAvatarRemoved={() => {
                  setAvatarUrl('');
                  const updated: UserProfile = {
                    ...userProfile,
                    avatarUrl: undefined,
                  };
                  onUpdateProfile(updated);
                  onShowToast?.('Foto profil telah dihapus.');
                }}
              />
            </div>

            {/* Profile Info: Name on top, Email below */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                {userProfile.name}
              </h1>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isAdmin
                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/30'
                  : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
              }`}>
                {isAdmin ? 'Admin' : 'Pengguna'}
              </span>
            </div>

            {/* Email */}
            <p className="text-xs text-emerald-100/80 mt-1 max-w-xs truncate">
              {currentUser?.email || 'ascend.member@journal.app'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. DAFTAR MENU PROFIL DENGAN FITUR LIPAT HALUS KE BAWAH (ACCORDION CARDS) */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-6 space-y-3">

          {/* Menu 1: Informasi Akun (Fitur Lipat Halus) */}
          <div
            id="accordion-profile-account"
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${
              openSection === 'account'
                ? isLight
                  ? 'bg-white border border-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-[#141F3B] border border-cyan-400/30 shadow-xl ring-1 ring-cyan-400/20'
                : isLight
                  ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100/80 text-slate-700 shadow-xs'
                  : 'bg-[#141F3B] hover:bg-[#1A284D] border border-white/5 text-slate-200 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('account')}
              aria-expanded={openSection === 'account'}
              className="w-full py-3.5 px-4 flex items-center justify-between transition-colors duration-200 cursor-pointer text-left group select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isLight ? 'text-emerald-900 group-hover:text-emerald-950' : 'text-cyan-400 group-hover:text-cyan-300'
                }`}>
                  <UserIcon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold tracking-normal block truncate">
                    Informasi Akun
                  </span>
                  <span className={`text-[11px] truncate block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Perbarui nama profil akun
                  </span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                openSection === 'account'
                  ? isLight ? 'bg-emerald-100 text-emerald-900 rotate-180' : 'bg-cyan-500/20 text-cyan-300 rotate-180'
                  : isLight ? 'text-slate-400 group-hover:bg-emerald-100/50 group-hover:text-emerald-900' : 'text-slate-400 group-hover:bg-white/10 group-hover:text-white'
              }`}>
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              </div>
            </button>

            {/* Panel Terlipat Halus ke Bawah */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                openSection === 'account'
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                <div className={`p-4 sm:p-5 border-t ${
                  isLight ? 'border-emerald-100/70 bg-white/70' : 'border-white/5 bg-[#0e162b]/80'
                }`}>
                  <form onSubmit={handleSaveProfileInfo} className="space-y-4">
                    {photoSuccess && (
                      <div className="p-2.5 rounded-xl text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{photoSuccess}</span>
                      </div>
                    )}
                    {photoError && (
                      <div className="p-2.5 rounded-xl text-xs bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{photoError}</span>
                      </div>
                    )}

                    {/* Input Nama Lengkap */}
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Nama Lengkap / Panggilan
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama Anda"
                        className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border outline-hidden transition-all ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-700 focus:bg-white'
                            : 'bg-black/25 border-white/10 text-white focus:border-cyan-400 focus:bg-black/40'
                        }`}
                      />
                    </div>

                    {/* Tombol Simpan Profil */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                          isLight
                            ? 'bg-emerald-950 text-white hover:bg-emerald-900 active:scale-98'
                            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold active:scale-98'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Simpan Perubahan Profil</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Menu 2: Keamanan dan Kata Sandi (Fitur Lipat Halus) */}
          <div
            id="accordion-profile-password"
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${
              openSection === 'password'
                ? isLight
                  ? 'bg-white border border-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-[#141F3B] border border-cyan-400/30 shadow-xl ring-1 ring-cyan-400/20'
                : isLight
                  ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100/80 text-slate-700 shadow-xs'
                  : 'bg-[#141F3B] hover:bg-[#1A284D] border border-white/5 text-slate-200 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('password')}
              aria-expanded={openSection === 'password'}
              className="w-full py-3.5 px-4 flex items-center justify-between transition-colors duration-200 cursor-pointer text-left group select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isLight ? 'text-emerald-900 group-hover:text-emerald-950' : 'text-cyan-400 group-hover:text-cyan-300'
                }`}>
                  <Lock className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold tracking-normal block truncate">
                    Keamanan dan Kata Sandi
                  </span>
                  <span className={`text-[11px] truncate block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Perbarui kata sandi akun
                  </span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                openSection === 'password'
                  ? isLight ? 'bg-emerald-100 text-emerald-900 rotate-180' : 'bg-cyan-500/20 text-cyan-300 rotate-180'
                  : isLight ? 'text-slate-400 group-hover:bg-emerald-100/50 group-hover:text-emerald-900' : 'text-slate-400 group-hover:bg-white/10 group-hover:text-white'
              }`}>
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              </div>
            </button>

            {/* Panel Terlipat Halus ke Bawah */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                openSection === 'password'
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                <div className={`p-4 sm:p-5 border-t ${
                  isLight ? 'border-emerald-100/70 bg-white/70' : 'border-white/5 bg-[#0e162b]/80'
                }`}>
                  <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-cyan-400" />
                      <span>Akun: <strong className="text-slate-700 dark:text-slate-200">{currentUser?.email || 'kamalizudin36@gmail.com'}</strong></span>
                    </div>

                    {passwordSuccess && (
                      <div className="p-2.5 rounded-xl text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}
                    {passwordError && (
                      <div className="p-2.5 rounded-xl text-xs bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {/* Input Kata Sandi Baru */}
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 8 karakter unik"
                          className={`w-full text-xs sm:text-sm pl-3.5 pr-10 py-2.5 rounded-xl border outline-hidden transition-all ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-700 focus:bg-white'
                              : 'bg-black/25 border-white/10 text-white focus:border-cyan-400 focus:bg-black/40'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Input Konfirmasi Kata Sandi */}
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className={`w-full text-xs sm:text-sm pl-3.5 pr-10 py-2.5 rounded-xl border outline-hidden transition-all ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-700 focus:bg-white'
                              : 'bg-black/25 border-white/10 text-white focus:border-cyan-400 focus:bg-black/40'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Tombol Simpan Sandi */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdatingPassword || !newPassword}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                          isLight
                            ? 'bg-emerald-950 text-white hover:bg-emerald-900 active:scale-98'
                            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold active:scale-98'
                        }`}
                      >
                        {isUpdatingPassword ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Perbarui Kata Sandi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Menu 3: Pengaturan (Fitur Lipat Halus) */}
          <div
            id="accordion-profile-settings"
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${
              openSection === 'settings'
                ? isLight
                  ? 'bg-white border border-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-[#141F3B] border border-cyan-400/30 shadow-xl ring-1 ring-cyan-400/20'
                : isLight
                  ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100/80 text-slate-700 shadow-xs'
                  : 'bg-[#141F3B] hover:bg-[#1A284D] border border-white/5 text-slate-200 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('settings')}
              aria-expanded={openSection === 'settings'}
              className="w-full py-3.5 px-4 flex items-center justify-between transition-colors duration-200 cursor-pointer text-left group select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isLight ? 'text-emerald-900 group-hover:text-emerald-950' : 'text-cyan-400 group-hover:text-cyan-300'
                }`}>
                  <SettingsIcon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold tracking-normal block truncate">
                    Pengaturan
                  </span>
                  <span className={`text-[11px] truncate block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tema, preferensi, &amp; sistem aplikasi
                  </span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                openSection === 'settings'
                  ? isLight ? 'bg-emerald-100 text-emerald-900 rotate-180' : 'bg-cyan-500/20 text-cyan-300 rotate-180'
                  : isLight ? 'text-slate-400 group-hover:bg-emerald-100/50 group-hover:text-emerald-900' : 'text-slate-400 group-hover:bg-white/10 group-hover:text-white'
              }`}>
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              </div>
            </button>

            {/* Panel Terlipat Halus ke Bawah */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                openSection === 'settings'
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                <div className={`p-4 sm:p-5 border-t space-y-3.5 ${
                  isLight ? 'border-emerald-100/70 bg-white/70' : 'border-white/5 bg-[#0e162b]/80'
                }`}>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold">Tema Tampilan Saat Ini</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isLight ? 'Mode Terang (Aksen Hijau Gelap)' : 'Mode Gelap (Cyan / Midnight)'}
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      isLight
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                    }`}>
                      {isLight ? 'Terang' : 'Gelap'}
                    </span>
                  </div>

                  {/* Tombol Menuju Halaman Pengaturan Lengkap */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSettings) {
                        onOpenSettings();
                      } else if (onNavigateToTab) {
                        onNavigateToTab('settings');
                      }
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                      isLight
                        ? 'bg-emerald-950 text-white hover:bg-emerald-900 active:scale-98'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold active:scale-98'
                    }`}
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Buka Halaman Pengaturan Lengkap</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Menu 4: Bantuan & Masukan (Fitur Lipat Halus) */}
          <div
            id="accordion-profile-help"
            className={`rounded-2xl transition-all duration-300 overflow-hidden ${
              openSection === 'help'
                ? isLight
                  ? 'bg-white border border-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-[#141F3B] border border-cyan-400/30 shadow-xl ring-1 ring-cyan-400/20'
                : isLight
                  ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100/80 text-slate-700 shadow-xs'
                  : 'bg-[#141F3B] hover:bg-[#1A284D] border border-white/5 text-slate-200 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection('help')}
              aria-expanded={openSection === 'help'}
              className="w-full py-3.5 px-4 flex items-center justify-between transition-colors duration-200 cursor-pointer text-left group select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isLight ? 'text-emerald-900 group-hover:text-emerald-950' : 'text-cyan-400 group-hover:text-cyan-300'
                }`}>
                  <HelpCircle className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold tracking-normal block truncate">
                    Bantuan &amp; Panduan
                  </span>
                  <span className={`text-[11px] truncate block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Panduan aplikasi &amp; tanya jawab
                  </span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                openSection === 'help'
                  ? isLight ? 'bg-emerald-100 text-emerald-900 rotate-180' : 'bg-cyan-500/20 text-cyan-300 rotate-180'
                  : isLight ? 'text-slate-400 group-hover:bg-emerald-100/50 group-hover:text-emerald-900' : 'text-slate-400 group-hover:bg-white/10 group-hover:text-white'
              }`}>
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              </div>
            </button>

            {/* Panel Terlipat Halus ke Bawah */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                openSection === 'help'
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                <div className={`p-4 sm:p-5 border-t space-y-3.5 ${
                  isLight ? 'border-emerald-100/70 bg-white/70' : 'border-white/5 bg-[#0e162b]/80'
                }`}>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">📖 Mencatat Jurnal &amp; Keuangan</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Gunakan tombol (+) di dashboard untuk mencatat transaksi harian, agenda baru, atau kebiasaan produktif Anda.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">🎯 Melacak Streak &amp; Target</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Buka tab Target atau Kebiasaan untuk menandai capaian harian dan pertahankan streak Anda setiap hari.
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2 justify-end">
                    {onOpenFeedbackModal && (
                      <button
                        type="button"
                        onClick={onOpenFeedbackModal}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isLight
                            ? 'border-emerald-300 text-emerald-900 hover:bg-emerald-100/70'
                            : 'border-white/15 text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim Masukan</span>
                      </button>
                    )}
                    {onOpenHelp && (
                      <button
                        type="button"
                        onClick={onOpenHelp}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                          isLight
                            ? 'bg-emerald-950 text-white hover:bg-emerald-900'
                            : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Buka Panduan Lengkap</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu 6: Keluar (Log out) */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer text-left group ${
                isLight
                  ? 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-600'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-500">
                  <LogOut className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-sm font-bold tracking-normal text-rose-500">
                  Keluar
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400/60 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {/* Pusat Kontrol Admin Eksklusif (Hanya untuk Akun Kamal Ahmad) */}
          {isAdmin && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleEnterAdminPortal()}
                className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer border shadow-md group ${
                  isLight
                    ? 'bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-amber-500/15 hover:from-amber-500/25 hover:to-teal-500/20 border-amber-300 text-amber-950'
                    : 'bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-amber-500/15 hover:from-amber-500/25 hover:to-teal-500/20 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 text-amber-400 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold tracking-wide block">
                      Pusat Kontrol Administrator
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400/80 block">
                      Dashboard, kelola fitur, notifikasi, sistem &amp; feedback
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-transform">
                  <span>Masuk Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {isAdminPanelOpen && (
                <div className={`mt-2 p-3.5 rounded-2xl border space-y-2.5 animate-in fade-in duration-200 ${
                  isLight
                    ? 'bg-white border-amber-200 text-slate-800'
                    : 'bg-[#0E172E] border-amber-500/30 text-slate-200'
                }`}>
                  <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pb-1 border-b border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fitur Administratif (Akun Kamal Ahmad)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {onOpenAnnouncementsAdmin && (
                      <button
                        type="button"
                        onClick={onOpenAnnouncementsAdmin}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                          isLight ? 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-900' : 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-300'
                        }`}
                      >
                        <Megaphone className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="font-semibold text-xs">Kelola Pengumuman</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.('admin-feedback')}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                        isLight ? 'bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-900' : 'bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="font-semibold text-xs">Penilaian Pengguna</span>
                    </button>

                    {onOpenSupabaseModal && (
                      <button
                        type="button"
                        onClick={onOpenSupabaseModal}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                          isLight ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        <Database className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-semibold text-xs">Cloud Database</span>
                      </button>
                    )}

                    {onOpenSync && (
                      <button
                        type="button"
                        onClick={onOpenSync}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                          isLight ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-900' : 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        <Radio className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-xs">Sinkronisasi Laptop ⇄ HP</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

      </div>

      {/* Footer ringkas: info email & status identitas */}
      <footer className={`max-w-2xl mx-auto px-6 py-4 text-center text-xs ${
        isLight ? 'text-slate-600' : 'text-slate-300'
      }`}>
        <div>
          <span>{currentUser?.email || 'kamalizudin36@gmail.com'}</span>
          <span className="mx-2">&bull;</span>
          <span>ASCEND Journal</span>
        </div>
      </footer>

      {/* ============================================================================ */}
      {/* MODAL 1: INFORMASI AKUN (EDIT NAMA, SUBTITLE, MATA UANG, DAN FOTO)          */}
      {/* ============================================================================ */}
      {activeModal === 'account' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border max-h-[90vh] overflow-y-auto space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E172E] border-cyan-900/40 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isLight ? 'bg-emerald-100 text-emerald-900' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  <UserIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold">Informasi Akun</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-white/70'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Foto Profil Actions */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-dashed border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400 shrink-0 flex items-center justify-center bg-slate-800">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Foto Profil</div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Maksimal 5 MB (JPG/PNG)</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isLight ? 'bg-emerald-900 hover:bg-emerald-950' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah</span>
                </button>
              </div>
            </div>

            {photoSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{photoSuccess}</span>
              </div>
            )}

            {photoError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfileInfo} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Nama Lengkap / Tampilan
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-800 focus:bg-white'
                      : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Teks Motivasi / Sambutan
                </label>
                <input
                  type="text"
                  value={greetingSubtitle}
                  onChange={(e) => setGreetingSubtitle(e.target.value)}
                  placeholder="Kelola agenda, kebiasaan, dan keuangan Anda hari ini."
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-800 focus:bg-white'
                      : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Simbol Mata Uang Keuangan
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="Rp"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-800 focus:bg-white'
                      : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400'
                  }`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isLight ? 'bg-emerald-900 hover:bg-emerald-950' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Informasi Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* MODAL 2: KEAMANAN DAN KATA SANDI (UPDATE PASSWORD)                           */}
      {/* ============================================================================ */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border max-h-[90vh] overflow-y-auto space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0E172E] border-cyan-900/40 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold">Keamanan &amp; Kata Sandi</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-white/70'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Indikator Kekuatan Sandi */}
            <div className={`rounded-2xl p-3.5 space-y-2 border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
            }`}>
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Kriteria Kata Sandi Aman:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {hasMinLength ? <Check className="w-3 h-3" /> : <span>&bull;</span>} Min. 8 karakter
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {hasUpper && hasLower ? <Check className="w-3 h-3" /> : <span>&bull;</span>} Huruf Besar &amp; Kecil
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {hasNumber ? <Check className="w-3 h-3" /> : <span>&bull;</span>} Minimal 1 Angka
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {hasSpecial ? <Check className="w-3 h-3" /> : <span>&bull;</span>} Simbol Khusus
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan sandi baru"
                    className={`w-full border rounded-xl pl-3.5 pr-10 py-2.5 text-sm transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white'
                        : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className={`w-full border rounded-xl pl-3.5 pr-10 py-2.5 text-sm transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white'
                        : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !passwordsMatch || passwordStrengthScore < 3}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memperbarui...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Perbarui Kata Sandi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Masuk Portal Administrator (Transisi Masuk Pusat Kontrol) */}
      {isPortalEntering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-b from-[#18150f] to-[#0d1424] border border-amber-500/40 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/50 relative">
              <ShieldCheck className="w-9 h-9" />
              <div className="absolute inset-0 rounded-2xl bg-amber-400/20 animate-ping pointer-events-none" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white tracking-tight">
                Memverifikasi Otoritas Admin...
              </h3>
              <p className="text-xs text-amber-300 font-medium">
                Anda memasuki Pusat Kontrol Administrator ASCEND Journal.
              </p>
            </div>

            <div className="w-48 mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-amber-500 via-teal-400 to-amber-500 rounded-full animate-pulse w-full" />
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              Memuat data pengguna, kontrol fitur, &amp; status sistem...
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
