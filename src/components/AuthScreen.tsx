import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  X,
  KeyRound, 
  Check, 
  ShieldCheck,
  User as UserIcon,
  HelpCircle,
  Mail,
  Lock,
  ArrowLeft,
  Leaf
} from 'lucide-react';
import { authService, getReadableAuthError, dbService } from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { SecurityAuditModal } from './SecurityAuditModal';

interface AuthScreenProps {
  onAuthSuccess: (user: SupabaseUser, initialProfile?: UserProfile) => void;
  showToast: (msg: string) => void;
  initialMode?: 'welcome' | 'login' | 'register';
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  showToast,
  initialMode = 'welcome',
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('journalstream_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(() => isSupabaseConfigured());

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  const validateForm = (): boolean => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage('Email atau username wajib diisi.');
      return false;
    }

    if (mode === 'register' && !emailTrimmed.includes('@')) {
      setErrorMessage('Format email tidak valid (contoh: nama@domain.com).');
      return false;
    }

    if (!password) {
      setErrorMessage('Kata sandi wajib diisi.');
      return false;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return false;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Nama lengkap wajib diisi untuk pendaftaran.');
        return false;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (rememberMe && email.trim()) {
        localStorage.setItem('journalstream_remembered_email', email.trim());
      } else if (!rememberMe) {
        localStorage.removeItem('journalstream_remembered_email');
      }

      if (mode === 'login') {
        const res = await authService.signIn(email, password);
        if (res.user) {
          const profile = await dbService.ensureUserProfileInitialized(
            res.user.id, 
            res.user.email, 
            res.user.user_metadata?.full_name
          );
          onAuthSuccess(res.user, profile);
        } else {
          setErrorMessage('Gagal memverifikasi akun. Silakan periksa kembali email dan kata sandi Anda.');
        }
      } else if (mode === 'register') {
        const res = await authService.signUp(email, password, fullName);
        if (res.user) {
          const registeredTime = new Date().toISOString();
          try {
            localStorage.setItem('ascend_account_created_at', registeredTime);
            localStorage.setItem('ascend_theme', 'light');
          } catch {}
          const profile = await dbService.ensureUserProfileInitialized(
            res.user.id,
            res.user.email,
            fullName
          );
          if (profile) {
            profile.accountCreatedAt = registeredTime;
          }

          if (res.session) {
            showToast(`Akun berhasil dibuat! Selamat datang, ${fullName || res.user.email}.`);
            onAuthSuccess(res.user, profile);
          } else {
            setSuccessMessage('Pendaftaran berhasil! Silakan masuk dengan email dan kata sandi Anda.');
            showToast('Pendaftaran akun berhasil! Silakan masuk.');
            setMode('login');
          }
        }
      }
    } catch (err: any) {
      console.warn('Auth Notice:', err?.message || err);
      let friendlyMsg = getReadableAuthError(err);
      friendlyMsg = friendlyMsg
        .replace(/supabase\s*auth/gi, 'sistem akun')
        .replace(/supabase\s*dashboard/gi, 'sistem')
        .replace(/supabase/gi, 'server pusat');
      setErrorMessage(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      showToast('Masukkan alamat email yang valid.');
      return;
    }
    setForgotSuccess(true);
    showToast('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2800);
  };

  const handleGuestEntry = () => {
    const guestCreatedAt = new Date().toISOString();
    try {
      localStorage.setItem('ascend_account_created_at', guestCreatedAt);
      if (!localStorage.getItem('ascend_theme')) {
        localStorage.setItem('ascend_theme', 'light');
      }
    } catch {}
    if (onContinueAsGuest) {
      onContinueAsGuest();
    } else {
      const guestUser: SupabaseUser = {
        id: 'guest-' + Date.now(),
        app_metadata: {},
        user_metadata: { full_name: 'Tamu Ascend' },
        aud: 'authenticated',
        created_at: guestCreatedAt,
      } as SupabaseUser;
      onAuthSuccess(guestUser);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#00271E] text-white flex flex-col justify-between selection:bg-[#2DD4BF] selection:text-[#00271E] relative overflow-x-hidden font-sans">
      
      {/* ========================================================================= */}
      {/* 1. HALAMAN SAMBUTAN / PEMBUKA (SPLASH / WELCOME SCREEN)                   */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        {mode === 'welcome' && (
          <motion.div
            key="welcome-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex-1 flex flex-col justify-between min-h-screen relative w-full overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 50% 25%, #054D3D 0%, #003629 45%, #00221A 85%, #001812 100%)',
            }}
          >
            {/* Subtle Organic Leaf Silhouettes Vector Accent */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
              <svg 
                className="absolute -top-12 -right-12 w-96 h-96 text-emerald-400/20 fill-current" 
                viewBox="0 0 200 200"
              >
                <path d="M45,-76.4C58.3,-69.3,69,-56.9,76.6,-42.6C84.2,-28.3,88.7,-12.1,86.5,3.3C84.3,18.7,75.4,33.3,64.8,45.8C54.2,58.3,41.9,68.7,27.7,74.7C13.5,80.7,-2.6,82.3,-18.2,78.7C-33.8,75.1,-48.9,66.3,-60.7,54.2C-72.5,42.1,-81,26.7,-83.4,10.2C-85.8,-6.3,-82.1,-23.9,-73.2,-38.3C-64.3,-52.7,-50.2,-63.9,-35.6,-70.3C-21,-76.7,-5.9,-78.3,9,-79.8C23.9,-81.3,31.7,-83.5,45,-76.4Z" transform="translate(100 100)" />
              </svg>
              <svg 
                className="absolute -bottom-20 -left-20 w-80 h-80 text-teal-300/15 fill-current" 
                viewBox="0 0 200 200"
              >
                <path d="M41.7,-70.9C53.1,-64.7,60.9,-51.7,67.8,-38.4C74.7,-25.1,80.7,-11.5,80.2,1.8C79.7,15.1,72.7,28.1,64,39.7C55.3,51.3,44.9,61.5,32.7,68.2C20.5,74.9,6.5,78.1,-7.2,77.2C-20.9,76.3,-34.3,71.3,-45.7,63.1C-57.1,54.9,-66.5,43.5,-72.6,30.3C-78.7,17.1,-81.5,2.1,-79.4,-12.1C-77.3,-26.3,-70.3,-39.7,-60,-48.7C-49.7,-57.7,-36.1,-62.3,-23.4,-67.7C-10.7,-73.1,1.1,-79.3,15.2,-79.7C29.3,-80.1,30.3,-77.1,41.7,-70.9Z" transform="translate(100 100)" />
              </svg>
              {/* Natural botanical leaf branch silhouette */}
              <svg 
                className="absolute top-1/4 -left-10 w-48 h-48 text-emerald-300/10 pointer-events-none rotate-45"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.2"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <svg 
                className="absolute bottom-1/3 -right-8 w-44 h-44 text-teal-300/10 pointer-events-none -rotate-12"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.2"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>

            {/* Center Hero Content (Aesthetic & Minimalist per user reference) */}
            <main className="relative z-20 w-full max-w-xl mx-auto px-6 py-8 flex-1 flex flex-col items-center justify-center text-center">
              {/* App Emblem Icon with Smooth Rounded Corners */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-[26px] sm:rounded-[30px] p-1.5 bg-gradient-to-tr from-[#054D3D] via-[#023E30] to-[#0D6853] border border-emerald-400/40 shadow-[0_16px_45px_rgba(0,0,0,0.5),0_0_30px_rgba(45,212,191,0.25)] flex items-center justify-center mb-6 overflow-hidden"
              >
                <img
                  src="/logo.png"
                  alt="Ascend Emblem"
                  className="w-full h-full object-cover rounded-[20px] sm:rounded-[24px] overflow-hidden filter brightness-105"
                />
              </motion.div>

              {/* Aesthetic Title with Playfair Serif Feeling */}
              <motion.h1
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-[1.2] max-w-lg"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Jurnal terbaik untuk produktivitas &amp; refleksi Anda
              </motion.h1>
            </main>

            {/* Bottom Action: Compact Sleek Button */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="relative z-20 w-full flex justify-center pb-10 sm:pb-14 px-6"
            >
              <button
                type="button"
                id="btn-welcome-signin"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide uppercase transition-all shadow-[0_10px_25px_rgba(16,185,129,0.35),0_0_15px_rgba(16,185,129,0.2)] border border-emerald-400/40 flex items-center justify-center gap-2 cursor-pointer select-none font-['Plus_Jakarta_Sans',sans-serif]"
              >
                <span>Masuk ke Akun</span>
                <span className="text-base font-bold">→</span>
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 2. HALAMAN MASUK (LOGIN) & HALAMAN DAFTAR (REGISTER)                      */}
        {/* ========================================================================= */}
        {(mode === 'login' || mode === 'register') && (
          <motion.div
            key="auth-form-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col justify-between min-h-screen relative w-full bg-[#F7FAF9] text-slate-800"
          >
            {/* Top Organic Wave Banner in Rich Emerald Green */}
            <div 
              className="w-full relative text-white pt-8 sm:pt-10 px-6 pb-20 sm:pb-24 overflow-hidden border-none"
              style={{
                background: 'linear-gradient(135deg, #002D23 0%, #004435 45%, #055C48 85%, #0A725B 100%)',
              }}
            >
              {/* Organic Botanical Leaf Elements Accenting Top Wave */}
              <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                <svg 
                  className="absolute -top-10 right-4 w-72 h-72 text-emerald-200 fill-current" 
                  viewBox="0 0 200 200"
                >
                  <path d="M45,-76.4C58.3,-69.3,69,-56.9,76.6,-42.6C84.2,-28.3,88.7,-12.1,86.5,3.3C84.3,18.7,75.4,33.3,64.8,45.8C54.2,58.3,41.9,68.7,27.7,74.7C13.5,80.7,-2.6,82.3,-18.2,78.7C-33.8,75.1,-48.9,66.3,-60.7,54.2C-72.5,42.1,-81,26.7,-83.4,10.2C-85.8,-6.3,-82.1,-23.9,-73.2,-38.3C-64.3,-52.7,-50.2,-63.9,-35.6,-70.3C-21,-76.7,-5.9,-78.3,9,-79.8C23.9,-81.3,31.7,-83.5,45,-76.4Z" transform="translate(100 100)" />
                </svg>
              </div>

              {/* Natural Leaf Icon Stems floating subtly */}
              <div className="absolute top-5 right-20 pointer-events-none opacity-30 text-emerald-200">
                <Leaf className="w-16 h-16 rotate-12" />
              </div>
              <div className="absolute top-12 left-10 pointer-events-none opacity-20 text-teal-200">
                <Leaf className="w-10 h-10 -rotate-45" />
              </div>

              <div className="max-w-md mx-auto w-full relative z-10">
                {/* Back button to Welcome Screen */}
                <div className="flex items-center justify-start mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setMode('welcome');
                    }}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                </div>

                {/* Header Title with Organic Warmth */}
                <h2 
                  className="text-2xl sm:text-3xl font-semibold text-white tracking-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {mode === 'login' ? 'Selamat Datang Kembali' : 'Mulai Perjalanan Anda'}
                </h2>
              </div>

              {/* Organic Curve Divider SVG at Bottom of Emerald Banner */}
              <div className="absolute -bottom-[2px] left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
                <svg 
                  className="relative block w-full h-14 sm:h-20 text-[#F7FAF9] fill-current" 
                  viewBox="0 0 1440 180" 
                  preserveAspectRatio="none"
                >
                  <path d="M 0,40 C 380,140 860,10 1440,70 L 1440,180 L 0,180 Z" />
                </svg>
              </div>
            </div>

            {/* Main Clean White Form Canvas with Soft Rounded Corners */}
            <div className="w-full max-w-md mx-auto px-5 -mt-8 sm:-mt-12 relative z-20 flex-1 flex flex-col justify-center items-center my-auto pb-10 sm:pb-16">
              <div className="w-full bg-white rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,43,32,0.09)] border border-slate-200/90 ring-1 ring-slate-900/[0.04]">
                
                {/* Form Mode Title inside Card */}
                <div className="mb-6 text-center pb-4 border-b border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                    {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
                  </h3>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="flex-1 leading-snug">{errorMessage}</span>
                      <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="text-red-400 hover:text-red-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 0 }}
                      className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="flex-1 leading-snug">{successMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Register: Nama Lengkap */}
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                        Nama Lengkap
                      </label>
                      <div className="bg-[#F2F7F5] border border-slate-200/80 focus-within:border-[#003B2F] focus-within:ring-2 focus-within:ring-[#003B2F]/20 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 transition-all">
                        <UserIcon className="w-4 h-4 text-[#003B2F] shrink-0" />
                        <input
                          type="text"
                          required
                          id="input-fullname"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nama Pengguna"
                          className="w-full bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 outline-none font-['Plus_Jakarta_Sans',sans-serif]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email atau Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                      Alamat Email
                    </label>
                    <div className="bg-[#F2F7F5] border border-slate-200/80 focus-within:border-[#003B2F] focus-within:ring-2 focus-within:ring-[#003B2F]/20 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 transition-all">
                      <Mail className="w-4 h-4 text-[#003B2F] shrink-0" />
                      <input
                        type="email"
                        required
                        id="input-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@domain.com"
                        autoComplete="email"
                        className="w-full bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 outline-none font-['Plus_Jakarta_Sans',sans-serif]"
                      />
                    </div>
                  </div>

                  {/* Kata Sandi */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                      Kata Sandi
                    </label>
                    <div className="bg-[#F2F7F5] border border-slate-200/80 focus-within:border-[#003B2F] focus-within:ring-2 focus-within:ring-[#003B2F]/20 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 transition-all">
                      <Lock className="w-4 h-4 text-[#003B2F] shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        id="input-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        className="w-full bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 outline-none tracking-wider font-['Plus_Jakarta_Sans',sans-serif]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-0.5"
                        title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-[#003B2F]" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Register: Konfirmasi Kata Sandi */}
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                        Konfirmasi Kata Sandi
                      </label>
                      <div className="bg-[#F2F7F5] border border-slate-200/80 focus-within:border-[#003B2F] focus-within:ring-2 focus-within:ring-[#003B2F]/20 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 transition-all">
                        <Lock className="w-4 h-4 text-[#003B2F] shrink-0" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          id="input-confirm-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          autoComplete="new-password"
                          className="w-full bg-transparent text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 outline-none tracking-wider font-['Plus_Jakarta_Sans',sans-serif]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Primary Solid Emerald CTA Button with Soft Shadow */}
                  <button
                    type="submit"
                    id="btn-auth-submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#003B2F] hover:bg-[#004D3D] active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all cursor-pointer mt-5 shadow-[0_8px_24px_rgba(0,59,47,0.28)] hover:shadow-[0_12px_28px_rgba(0,59,47,0.38)] disabled:opacity-60 disabled:cursor-not-allowed select-none"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span className="font-['Plus_Jakarta_Sans',sans-serif]">MEMPROSES...</span>
                      </>
                    ) : (
                      <>
                        <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-wider">{mode === 'login' ? 'MASUK SEKARANG' : 'DAFTAR AKUN BARU'}</span>
                        <span className="text-base font-bold">→</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Dedicated Switcher Button for the Div */}
                <div className="pt-3">
                  <button
                    type="button"
                    id="btn-switch-auth-mode"
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-3 px-5 rounded-2xl border border-slate-200/90 hover:border-[#003B2F]/40 bg-slate-50/90 hover:bg-slate-100/90 text-slate-700 hover:text-[#003B2F] font-semibold text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 select-none shadow-xs active:scale-[0.99]"
                  >
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-tight">{mode === 'login' ? 'Belum punya akun? Buat Akun Baru' : 'Sudah punya akun? Masuk ke Akun'}</span>
                    <span className="font-bold">→</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODALS: BANTUAN & PEMULIHAN KATA SANDI                                    */}
      {/* ========================================================================= */}
      {/* Modal Bantuan */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] max-w-md w-full p-6 text-slate-800 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto border border-slate-100"
            >
              <button
                onClick={() => setIsHelpOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 text-[#003B2F] font-bold text-base">
                <div className="w-8 h-8 rounded-full bg-[#E8F5F1] flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-[#003B2F]" />
                </div>
                <span>Bantuan &amp; Panduan Akun</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-[#003B2F]">Masuk &amp; Pendaftaran</div>
                  <p className="text-slate-600">
                    Gunakan alamat email aktif dan kata sandi minimal 6 karakter. Jika belum memiliki akun, klik <strong>Buat Akun Baru</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F0FAF7] border border-emerald-100 space-y-1">
                  <div className="font-semibold text-emerald-800">Mode Tamu (Offline)</div>
                  <p className="text-slate-600">
                    Anda juga dapat langsung menggunakan aplikasi dalam Mode Tamu tanpa registrasi. Data Anda tetap tersimpan di peramban ini.
                  </p>
                  <button
                    type="button"
                    onClick={handleGuestEntry}
                    className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline block cursor-pointer"
                  >
                    Lanjutkan Sebagai Tamu &rarr;
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsHelpOpen(false);
                    setShowSecurityModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#003B2F]" />
                  <span>Audit Keamanan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-[#003B2F] text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Lupa Kata Sandi */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] max-w-sm w-full p-6 text-slate-800 space-y-4 shadow-2xl relative border border-slate-100"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 text-[#003B2F] font-bold text-base">
                <div className="w-8 h-8 rounded-full bg-[#E8F5F1] flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-[#003B2F]" />
                </div>
                <span>Pemulihan Kata Sandi</span>
              </div>

              <p className="text-xs text-slate-600">
                Masukkan alamat email akun Anda untuk menerima tautan pemulihan kata sandi.
              </p>

              {forgotSuccess ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tautan pemulihan telah dikirim ke email Anda!</span>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 pt-1">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nama@domain.com"
                    className="w-full rounded-2xl bg-[#F2F7F5] border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#003B2F]"
                  />

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-full bg-[#003B2F] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md hover:bg-[#004D3D]"
                    >
                      Kirim Tautan
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Audit & Pusat Keamanan Akun */}
      <SecurityAuditModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        isSupabaseConfigured={isConfigured}
        userEmail={email}
        userName={fullName}
      />
    </div>
  );
};
