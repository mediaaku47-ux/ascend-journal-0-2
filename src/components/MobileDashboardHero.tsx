import React, { useState, useEffect } from 'react';
import { getAvatarSignedUrl } from '../lib/avatarService';
import { 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  Check, 
  Calendar, 
  Landmark,
  LayoutList
} from 'lucide-react';
import { 
  UserProfile, 
  Transaction, 
  Task, 
  NavTab, 
  Habit, 
  TargetItem, 
  QuickNote, 
  AppAnnouncement 
} from '../types';
import { GlobalSearchBar } from './GlobalSearchBar';
import { AscendBrand } from './AscendBrand';
import { formatCurrency } from '../utils/formatters';
import { getRealToday } from '../utils/dateUtils';
import { UserLevelProgress } from '../utils/levelUtils';
import { NexAlignHeroIllustration } from './NexAlignHeroIllustration';
import { QuickAccessSection } from './QuickAccessSection';
import { RollingProfileBadge } from './RollingProfileBadge';

interface MobileDashboardHeroProps {
  userProfile: UserProfile;
  totalBalance: number;
  savingsBalance?: number;
  incomeToday: number;
  expenseToday: number;
  currencySymbol?: string;
  transactions: Transaction[];
  tasks: Task[];
  habits?: Habit[];
  targets?: TargetItem[];
  notes?: QuickNote[];
  levelProgress?: UserLevelProgress;
  onOpenNewEntry: (type?: 'task' | 'habit' | 'transaction' | 'note') => void;
  onAddTransaction?: (tx: Transaction) => void;
  onNavigateToTab: (tab: NavTab) => void;
  onUpdateTasks?: (tasks: Task[]) => void;
  onUpdateHabits?: (habits: Habit[]) => void;
  onToggleTarget?: (id: string) => void;
  onSaveNote?: (note: QuickNote) => void;
  onDeleteNote?: (id: string) => void;
  onOpenRoadmap?: () => void;
  onExportPDF?: () => void;
  onExportData?: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenHelp?: () => void;
  onOpenFeedback?: () => void;
  onOpenSync?: () => void;
  onOpenAnnouncementsAdmin?: () => void;
  announcements?: AppAnnouncement[];
  isAdmin?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLogout?: () => void;
}

export const MobileDashboardHero: React.FC<MobileDashboardHeroProps> = ({
  userProfile,
  totalBalance,
  savingsBalance = 275000,
  incomeToday,
  expenseToday,
  currencySymbol = 'Rp',
  transactions,
  tasks,
  habits = [],
  targets = [],
  notes = [],
  levelProgress,
  onOpenNewEntry,
  onAddTransaction,
  onSaveNote,
  onNavigateToTab,
  onUpdateTasks,
  onOpenRoadmap,
  onOpenProfile,
  onOpenHelp,
  onExportPDF,
  onOpenAnnouncementsAdmin,
  announcements = [],
  isAdmin = false,
  theme = 'light',
  onToggleTheme,
  onLogout,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const realToday = getRealToday();
  const currentDay = userProfile.selectedDay || realToday.day;
  const isLight = theme === 'light';

  // Nilai nominal saldo dan transaksi riil dari Supabase (tanpa angka dummy / fallback)
  const displayTotalBalance = totalBalance;
  const displayIncomeToday = incomeToday;
  const displayExpenseToday = expenseToday;

  const userEmail = userProfile.email || '';
  
  // Format nama asli pengguna secara bersih dari data Supabase
  const getCleanDisplayName = (name?: string, email?: string): string => {
    let raw = name?.trim() || '';
    if (!raw || raw.toLowerCase() === 'pengguna' || raw.includes('@')) {
      raw = (raw || email || '').split('@')[0];
    }
    const cleaned = raw.replace(/[._-]+/g, ' ').replace(/\d+$/, '').trim();
    if (!cleaned) return 'Pengguna';
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };
  const displayName = getCleanDisplayName(userProfile.name, userEmail);

  // Resolusi Foto Profil Pengguna untuk Header Mobile
  const [mobileAvatarUrl, setMobileAvatarUrl] = useState<string>(() => userProfile?.avatarUrl || '');

  useEffect(() => {
    let active = true;

    async function resolveAvatar() {
      const raw = userProfile?.avatarUrl;
      if (!raw) {
        setMobileAvatarUrl('');
        return;
      }
      if (raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('http')) {
        setMobileAvatarUrl(raw);
        return;
      }
      try {
        const signed = await getAvatarSignedUrl(raw, 86400);
        if (active && signed) {
          setMobileAvatarUrl(signed);
        } else if (active) {
          setMobileAvatarUrl('');
        }
      } catch {
        if (active) setMobileAvatarUrl('');
      }
    }

    resolveAvatar();
    return () => {
      active = false;
    };
  }, [userProfile?.avatarUrl]);

  return (
    <div 
      className={`w-full max-w-[1020px] mx-auto ${isLight ? 'bg-white text-slate-900' : 'bg-[#090D16] text-white'} min-h-screen px-3.5 md:px-0 pt-0 pb-24 font-sans selection:bg-[#2DD4BF]/30 transition-colors duration-200`}
      style={isLight ? {
        backgroundColor: '#FFFFFF',
      } : undefined}
    >
      
      {/* 1. HEADER ATAS (KHUSUS LAYAR HP - FULL WIDTH EDGE-TO-EDGE) */}
      <header className={`md:hidden -mx-3.5 px-4 py-3 mb-3.5 flex items-center justify-between border-b transition-colors ${
        isLight 
          ? 'bg-[#032D22] border-teal-500/30 text-white shadow-xs' 
          : 'bg-[#090D16] border-[#263449] text-white'
      }`}>
        {/* Sisi Kiri: Logo & Nama Aplikasi Premium ASCEND JOURNAL */}
        <div className="flex items-center min-w-0">
          <AscendBrand 
            size="md" 
            onClick={() => onNavigateToTab('dashboard')} 
            showDot={false} 
          />
        </div>

        {/* Sisi Kanan: Foto Profil Pengguna & Nama dengan Efek Transisi Menggulung */}
        <div className="flex items-center">
          <RollingProfileBadge
            avatarUrl={mobileAvatarUrl}
            displayName={displayName}
            theme={theme}
            onClick={onOpenProfile}
            variant="mobile"
          />
        </div>
      </header>

      {/* 1. HERO HEADER UTAMA / SAPAAN PENGGUNA (Halaman Terbuka, Tanpa Kartu) */}
      <div 
        className={`w-full ${!announcements || announcements.length === 0 ? 'mt-0' : 'mt-1'} px-1 sm:px-2 py-2.5 sm:py-3.5 mb-3 sm:mb-4 relative flex items-center justify-between transition-all duration-300`}
        style={{ fontFamily: "'Poppins', 'Inter', -apple-system, sans-serif" }}
      >
        {/* Tipografi & Teks: Susunan Vertikal Rapi di Sisi Kiri */}
        <div className="relative z-10 max-w-[60%] sm:max-w-[58%] pr-2">
          {/* Sapaan Halo di atas Nama Pengguna */}
          <span className={`block text-[11px] sm:text-xs font-bold tracking-wider uppercase mb-0.5 ${
            isLight ? 'text-teal-700' : 'text-teal-400'
          }`}>
            Halo,
          </span>

          {/* Langsung Tampil Nama Pengguna Sebagai Heading Utama (Tanpa "Selamat Datang,"): Ukuran Besar, Tebal, Fokus Utama */}
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-1.5">
            <span className={`block font-black tracking-tight ${
              isLight 
                ? 'text-slate-900' 
                : 'text-white'
            }`}>
              {displayName}
            </span>
          </h2>

          {/* Teks Motivasi: Garis di sebelah kiri yang sedikit lebih tebal */}
          <p className={`text-xs sm:text-[13px] font-medium leading-relaxed pl-3 border-l-[3.5px] border-teal-400 dark:border-teal-400 rounded-l-xs ${
            isLight ? 'text-slate-600' : 'text-slate-300/90'
          }`}>
            Bangun kebiasaan dan capai tujuan.
          </p>
        </div>

        {/* Ilustrasi di Sisi Kanan: Menyatu Proporsional dengan Halaman */}
        <div className="relative shrink-0 max-w-[38%] sm:max-w-[40%] flex items-center justify-end select-none pointer-events-none">
          {!isLight && (
            <div 
              className="absolute right-0 top-1/2 -translate-y-1/2 w-36 h-36 rounded-full pointer-events-none blur-3xl opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(45, 212, 191, 0.12) 50%, transparent 70%)' }}
            />
          )}
          <NexAlignHeroIllustration 
            isLight={isLight}
            className="w-full h-auto max-h-[110px] sm:max-h-[125px] object-contain transition-transform duration-700"
          />
        </div>
      </div>

      {/* 2. PENCARIAN GLOBAL REAL-TIME DI ATAS KARTU DOMPET OPERASIONAL */}
      <div className="w-full mb-3.5 sm:mb-4 relative z-30">
        <GlobalSearchBar
          tasks={tasks}
          habits={habits}
          notes={notes}
          transactions={transactions}
          targets={targets}
          onNavigateToTab={onNavigateToTab}
          theme={theme}
          placeholder="Cari agenda, kebiasaan, catatan, transaksi..."
        />
      </div>

      {/* 2.5. KARTU SALDO KAS & TRANSAKSI (DOMPET OPERASIONAL) */}
      {/* 2.5. KARTU SALDO KAS & TRANSAKSI (DOMPET OPERASIONAL) */}
      <section 
        className={`w-full rounded-[14px] sm:rounded-[16px] relative z-10 transition-all duration-300 ${
          isLight 
            ? 'bg-gradient-to-br from-[#064E3B] via-[#043E30] to-[#022C22] border border-emerald-500/40 text-white shadow-[0_12px_28px_-6px_rgba(4,62,48,0.35)]' 
            : 'bg-gradient-to-br from-[#111A29] via-[#0D1624] to-[#080E17] border border-emerald-500/35 text-white shadow-2xl'
        } p-4 sm:p-5 relative overflow-hidden mb-4 sm:mb-5`}
      >
        {/* Top subtle highlight line for sleek tech look */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-80" />

        {/* Subtle decorative radial emerald light */}
        <div className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl" />

        {/* Info Bar Atas: Label & Status Dompet */}
        <div className="flex items-center justify-between relative z-10 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
              isLight ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}>
              <Landmark className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block text-emerald-200/90">
                Dompet Operasional
              </span>
            </div>
          </div>

          <span 
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              isLight ? 'text-emerald-200 bg-emerald-500/20 border-emerald-400/30' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
            }`}
          >
            {transactions.length > 0 ? `${transactions.length} Transaksi` : 'Kas Aktif'}
          </span>
        </div>

        {/* Baris Saldo: "Saldo Dompet Anda" + Mata & Angka Saldo */}
        <div className="relative z-10 mb-3.5 pb-3 border-b border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
            <span className="text-emerald-200/80">
              Saldo Kas Tersedia
            </span>
            <button 
              type="button"
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="p-1 rounded-md transition-colors cursor-pointer text-emerald-300/80 hover:text-white hover:bg-white/10"
              title={isBalanceHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
            >
              {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-white">
              {isBalanceHidden ? (
                <span className="tracking-widest text-2xl text-emerald-300/60">
                  ••••••••••
                </span>
              ) : (
                formatCurrency(displayTotalBalance, currencySymbol)
              )}
            </span>
          </div>
        </div>

        {/* Baris Transaksi Ringkas: Masuk Hari Ini & Keluar Hari Ini */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 relative z-10">
          {/* Kartu Masuk Hari Ini */}
          <div className={`rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 transition-all border ${
            isLight
              ? 'bg-emerald-950/70 border-emerald-500/30 text-white'
              : 'bg-[#121B2A]/90 border-slate-700/60 text-white shadow-sm'
          } backdrop-blur-xs`}>
            <div className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 bg-emerald-500/20 border-emerald-400/40 text-emerald-300">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[10.5px] block leading-tight font-semibold tracking-tight text-emerald-200/80">
                Masuk Hari Ini
              </span>
              <span className="text-xs sm:text-sm font-black block leading-tight truncate font-mono mt-0.5 text-emerald-300">
                +{formatCurrency(displayIncomeToday, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Kartu Keluar Hari Ini */}
          <div className={`rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 transition-all border ${
            isLight
              ? 'bg-emerald-950/70 border-emerald-500/30 text-white'
              : 'bg-[#121B2A]/90 border-slate-700/60 text-white shadow-sm'
          } backdrop-blur-xs`}>
            <div className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 bg-rose-500/20 border-rose-400/40 text-rose-300">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[10.5px] block leading-tight font-semibold tracking-tight text-emerald-200/80">
                Keluar Hari Ini
              </span>
              <span className="text-xs sm:text-sm font-black block leading-tight truncate font-mono mt-0.5 text-rose-300">
                -{formatCurrency(displayExpenseToday, currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KARTU AKSES CEPAT (Aksi Harian Mandiri) */}
      <div className="mb-4 sm:mb-5">
        <QuickAccessSection
          onNavigateToTab={onNavigateToTab}
          tasks={tasks}
          targets={targets}
          notes={notes}
          currentDay={currentDay}
          theme={theme}
          onSaveNote={onSaveNote}
          onAddTransaction={onAddTransaction}
          onOpenNewEntry={onOpenNewEntry}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* 4. KARTU TANGGAL HARI INI (Elegan Tipis, Tanpa Hijau Gelap Mencolok) */}
      <div className="w-full mb-4 sm:mb-5 relative z-10">
        <div 
          onClick={() => onNavigateToTab('agenda')}
          className={`w-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 cursor-pointer active:scale-[0.99] border backdrop-blur-xl group ${
            isLight
              ? 'bg-gradient-to-r from-teal-500/[0.08] via-emerald-500/[0.05] to-teal-500/[0.06] border-teal-500/25 text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:border-teal-400/50 hover:bg-teal-500/[0.12]'
              : 'bg-[#111827] border border-[#263449] text-white shadow-md hover:border-cyan-400/40'
          }`}
          style={{ fontFamily: "'Poppins', 'Inter', -apple-system, sans-serif" }}
        >
          {/* Top accent light bar - halus dan tipis */}
          <div className={`absolute top-0 inset-x-0 h-[2px] opacity-70 ${
            isLight 
              ? 'bg-gradient-to-r from-teal-400/60 via-emerald-400/50 to-teal-400/60' 
              : 'bg-gradient-to-r from-cyan-400/60 via-teal-300/40 to-blue-400/60'
          }`} />

          {/* Sci-Fi HUD Corner Brackets */}
          <div className={`absolute top-2 left-2 text-[10px] font-mono font-bold pointer-events-none select-none ${
            isLight ? 'text-teal-600/35' : 'text-cyan-400/40'
          }`}>┌</div>
          <div className={`absolute bottom-2 right-2 text-[10px] font-mono font-bold pointer-events-none select-none ${
            isLight ? 'text-teal-600/35' : 'text-cyan-400/40'
          }`}>┘</div>

          {/* Ambient Glow Halus Tipis */}
          <div 
            className="absolute -right-8 -top-8 w-36 h-36 rounded-full pointer-events-none blur-2xl opacity-10"
            style={{ 
              background: isLight 
                ? 'radial-gradient(circle, rgba(45, 212, 191, 0.4) 0%, transparent 70%)' 
                : 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)' 
            }}
          />

          <div className="flex items-center gap-3 sm:gap-3.5 relative z-10 py-0.5 px-1">
            {/* Ikon Kalender Modern */}
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
              isLight 
                ? 'bg-white border-teal-200/90 text-teal-700' 
                : 'bg-[#1e293b] border-[#263449] text-cyan-300'
            }`}>
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            {/* Teks Tanggal Lengkap */}
            <div className="min-w-0 flex-1">
              <span 
                className={`text-[10.5px] sm:text-[11px] font-bold tracking-wider uppercase block mb-0.5 ${
                  isLight ? 'text-teal-700' : 'text-teal-300'
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Hari Ini
              </span>
              <h3 
                className={`text-sm sm:text-base font-bold tracking-tight truncate leading-snug ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {realToday.fullFormattedDate}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECTION FITUR UTAMA (Halaman Terbuka, Tanpa Menggunakan Kartu) */}
      <section 
        className="w-full mb-6 sm:mb-8 px-4 py-1 relative transition-all duration-300"
      >
        {/* Header Fitur Utama */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-indigo-500" />
            <h2 
              className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
            >
              Fitur Utama
            </h2>
          </div>
        </div>

        {/* Grid Modul Fitur Utama: Grid 4 Kolom, Jarak Horizontal & Vertikal 16px (gap-4) */}
        <div className="grid grid-cols-4 gap-4 relative z-10">
          
          {/* 1. Agenda Harian */}
          <button
            type="button"
            onClick={() => onNavigateToTab('agenda')}
            className="flex flex-col items-center justify-start w-full cursor-pointer group active:scale-95 transition-transform"
            title="Buka Agenda Harian"
          >
            {/* Wadah Ikon: Ukuran lebih ringkas & rounded halus (56 × 56 px, rounded-2xl) */}
            <div 
              style={{ width: '56px', height: '56px' }}
              className={`w-[56px] h-[56px] rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                isLight 
                  ? 'bg-white border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.03)] group-hover:border-slate-300 group-hover:shadow-md' 
                  : 'bg-[#141F36] border-slate-700/60 shadow-[0_3px_10px_rgba(0,0,0,0.25)] group-hover:border-slate-600 group-hover:shadow-lg'
              }`}
            >
              {/* Area Ikon: 44 × 44 px proporsional di tengah wadah */}
              <div 
                style={{ width: '44px', height: '44px' }}
                className="w-[44px] h-[44px] flex items-center justify-center relative overflow-hidden rounded-xl"
              >
                <img
                  src="/icons/agenda.svg"
                  alt="Agenda"
                  style={{ objectFit: 'contain', width: '44px', height: '44px' }}
                  className="w-[44px] h-[44px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = '/icons/agenda.jpg'; }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Nama Fitur */}
            <span 
              className={`mt-1.5 text-center text-[11px] leading-tight font-semibold tracking-tight line-clamp-2 max-w-[68px] break-words transition-colors ${
                isLight ? 'text-slate-800 group-hover:text-slate-950' : 'text-slate-200 group-hover:text-white'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
            >
              Agenda
            </span>
          </button>

          {/* 2. Pelacakan Kebiasaan */}
          <button
            type="button"
            onClick={() => onNavigateToTab('habits')}
            className="flex flex-col items-center justify-start w-full cursor-pointer group active:scale-95 transition-transform"
            title="Buka Pelacak Kebiasaan"
          >
            {/* Wadah Ikon */}
            <div 
              style={{ width: '56px', height: '56px' }}
              className={`w-[56px] h-[56px] rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                isLight 
                  ? 'bg-white border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.03)] group-hover:border-slate-300 group-hover:shadow-md' 
                  : 'bg-[#141F36] border-slate-700/60 shadow-[0_3px_10px_rgba(0,0,0,0.25)] group-hover:border-slate-600 group-hover:shadow-lg'
              }`}
            >
              {/* Area Ikon */}
              <div 
                style={{ width: '44px', height: '44px' }}
                className="w-[44px] h-[44px] flex items-center justify-center relative overflow-hidden rounded-xl"
              >
                <img
                  src="/icons/habits.svg"
                  alt="Kebiasaan"
                  style={{ objectFit: 'contain', width: '44px', height: '44px' }}
                  className="w-[44px] h-[44px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = '/icons/habits.jpg'; }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Nama Fitur */}
            <span 
              className={`mt-1.5 text-center text-[11px] leading-tight font-semibold tracking-tight line-clamp-2 max-w-[68px] break-words transition-colors ${
                isLight ? 'text-slate-800 group-hover:text-slate-950' : 'text-slate-200 group-hover:text-white'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
            >
              Kebiasaan
            </span>
          </button>

          {/* 3. Keuangan */}
          <button
            type="button"
            onClick={() => onNavigateToTab('finance')}
            className="flex flex-col items-center justify-start w-full cursor-pointer group active:scale-95 transition-transform"
            title="Buka Keuangan"
          >
            {/* Wadah Ikon */}
            <div 
              style={{ width: '56px', height: '56px' }}
              className={`w-[56px] h-[56px] rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                isLight 
                  ? 'bg-white border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.03)] group-hover:border-slate-300 group-hover:shadow-md' 
                  : 'bg-[#141F36] border-slate-700/60 shadow-[0_3px_10px_rgba(0,0,0,0.25)] group-hover:border-slate-600 group-hover:shadow-lg'
              }`}
            >
              {/* Area Ikon */}
              <div 
                style={{ width: '44px', height: '44px' }}
                className="w-[44px] h-[44px] flex items-center justify-center relative overflow-hidden rounded-xl"
              >
                <img
                  src="/icons/finance.svg"
                  alt="Keuangan"
                  style={{ objectFit: 'contain', width: '44px', height: '44px' }}
                  className="w-[44px] h-[44px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = '/icons/finance.jpg'; }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Nama Fitur */}
            <span 
              className={`mt-1.5 text-center text-[11px] leading-tight font-semibold tracking-tight line-clamp-2 max-w-[68px] break-words transition-colors ${
                isLight ? 'text-slate-800 group-hover:text-slate-950' : 'text-slate-200 group-hover:text-white'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
            >
              Keuangan
            </span>
          </button>

          {/* 4. Perkembangan / Analytics */}
          <button
            type="button"
            onClick={() => onNavigateToTab('progress')}
            className="flex flex-col items-center justify-start w-full cursor-pointer group active:scale-95 transition-transform"
            title="Buka Analisis Perkembangan"
          >
            {/* Wadah Ikon */}
            <div 
              style={{ width: '56px', height: '56px' }}
              className={`w-[56px] h-[56px] rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                isLight 
                  ? 'bg-white border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.03)] group-hover:border-slate-300 group-hover:shadow-md' 
                  : 'bg-[#141F36] border-slate-700/60 shadow-[0_3px_10px_rgba(0,0,0,0.25)] group-hover:border-slate-600 group-hover:shadow-lg'
              }`}
            >
              {/* Area Ikon */}
              <div 
                style={{ width: '44px', height: '44px' }}
                className="w-[44px] h-[44px] flex items-center justify-center relative overflow-hidden rounded-xl"
              >
                <img
                  src="/icons/progress.svg"
                  alt="Perkembangan"
                  style={{ objectFit: 'contain', width: '44px', height: '44px' }}
                  className="w-[44px] h-[44px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = '/icons/progress.jpg'; }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Nama Fitur */}
            <span 
              className={`mt-1.5 text-center text-[11px] leading-tight font-semibold tracking-tight line-clamp-2 max-w-[68px] break-words transition-colors ${
                isLight ? 'text-slate-800 group-hover:text-slate-950' : 'text-slate-200 group-hover:text-white'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
            >
              Perkembangan
            </span>
          </button>

          {/* 5. Target & Gol */}
          <button
            type="button"
            onClick={() => onNavigateToTab('targets')}
            className="flex flex-col items-center justify-start w-full cursor-pointer group active:scale-95 transition-transform"
            title="Buka Target & Gol"
          >
            {/* Wadah Ikon */}
            <div 
              style={{ width: '56px', height: '56px' }}
              className={`w-[56px] h-[56px] rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                isLight 
                  ? 'bg-white border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.03)] group-hover:border-slate-300 group-hover:shadow-md' 
                  : 'bg-[#141F36] border-slate-700/60 shadow-[0_3px_10px_rgba(0,0,0,0.25)] group-hover:border-slate-600 group-hover:shadow-lg'
              }`}
            >
              {/* Area Ikon */}
              <div 
                style={{ width: '44px', height: '44px' }}
                className="w-[44px] h-[44px] flex items-center justify-center relative overflow-hidden rounded-xl"
              >
                <img
                  src="/icons/target.svg"
                  alt="Target"
                  style={{ objectFit: 'contain', width: '44px', height: '44px' }}
                  className="w-[44px] h-[44px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = '/icons/target.jpg'; }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Nama Fitur */}
            <span 
              className={`mt-1.5 text-center text-[11px] leading-tight font-semibold tracking-tight line-clamp-2 max-w-[68px] break-words transition-colors ${
                isLight ? 'text-slate-800 group-hover:text-slate-950' : 'text-slate-200 group-hover:text-white'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
            >
              Target
            </span>
          </button>

          {/* 6. Catatan & Memo */}
          <button
            type="button"
            onClick={() => onNavigateToTab('notes')}
            className="flex flex-col items-center justify-start w-full cursor-pointer group active:scale-95 transition-transform"
            title="Buka Catatan"
          >
            {/* Wadah Ikon */}
            <div 
              style={{ width: '56px', height: '56px' }}
              className={`w-[56px] h-[56px] rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                isLight 
                  ? 'bg-white border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.03)] group-hover:border-slate-300 group-hover:shadow-md' 
                  : 'bg-[#141F36] border-slate-700/60 shadow-[0_3px_10px_rgba(0,0,0,0.25)] group-hover:border-slate-600 group-hover:shadow-lg'
              }`}
            >
              {/* Area Ikon */}
              <div 
                style={{ width: '44px', height: '44px' }}
                className="w-[44px] h-[44px] flex items-center justify-center relative overflow-hidden rounded-xl"
              >
                <img
                  src="/icons/notes.svg"
                  alt="Catatan"
                  style={{ objectFit: 'contain', width: '44px', height: '44px' }}
                  className="w-[44px] h-[44px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = '/icons/notes.jpg'; }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Nama Fitur */}
            <span 
              className={`mt-1.5 text-center text-[11px] leading-tight font-semibold tracking-tight line-clamp-2 max-w-[68px] break-words transition-colors ${
                isLight ? 'text-slate-800 group-hover:text-slate-950' : 'text-slate-200 group-hover:text-white'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
            >
              Catatan
            </span>
          </button>

          {/* 7. Arsip & Riwayat */}
          <button
            type="button"
            onClick={() => onNavigateToTab('archive')}
            className="flex flex-col items-center justify-start w-full cursor-pointer group active:scale-95 transition-transform"
            title="Buka Arsip & Riwayat"
          >
            {/* Wadah Ikon */}
            <div 
              style={{ width: '56px', height: '56px' }}
              className={`w-[56px] h-[56px] rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                isLight 
                  ? 'bg-white border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.03)] group-hover:border-slate-300 group-hover:shadow-md' 
                  : 'bg-[#141F36] border-slate-700/60 shadow-[0_3px_10px_rgba(0,0,0,0.25)] group-hover:border-slate-600 group-hover:shadow-lg'
              }`}
            >
              {/* Area Ikon */}
              <div 
                style={{ width: '44px', height: '44px' }}
                className="w-[44px] h-[44px] flex items-center justify-center relative overflow-hidden rounded-xl"
              >
                <img
                  src="/icons/archive.svg"
                  alt="Arsip"
                  style={{ objectFit: 'contain', width: '44px', height: '44px' }}
                  className="w-[44px] h-[44px] object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = '/icons/archive.jpg'; }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Nama Fitur */}
            <span 
              className={`mt-1.5 text-center text-[11px] leading-tight font-semibold tracking-tight line-clamp-2 max-w-[68px] break-words transition-colors ${
                isLight ? 'text-slate-800 group-hover:text-slate-950' : 'text-slate-200 group-hover:text-white'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
            >
              Arsip
            </span>
          </button>

        </div>
      </section>
    </div>
  );
};
