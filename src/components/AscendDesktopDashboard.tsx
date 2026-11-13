import React, { useMemo } from 'react';
import { 
  Calendar,
  Landmark, 
  Check, 
  TrendingUp,
  Activity
} from 'lucide-react';
import { NavTab, UserProfile, Task, Transaction, Habit, QuickNote, TargetItem, AppAnnouncement } from '../types';
import { NexAlignHeroIllustration } from './NexAlignHeroIllustration';

interface AscendDesktopDashboardProps {
  userProfile?: UserProfile;
  userEmail?: string;
  totalBalance: number;
  savingsBalance?: number;
  incomeToday: number;
  expenseToday: number;
  tasks?: Task[];
  habits?: Habit[];
  notes?: QuickNote[];
  transactions?: Transaction[];
  targets?: TargetItem[];
  announcements?: AppAnnouncement[];
  activeTab?: NavTab;
  onNavigateToTab: (tab: NavTab) => void;
  onOpenNewEntry?: (type?: 'task' | 'habit' | 'transaction' | 'note') => void;
  theme?: 'dark' | 'light';
}

export const AscendDesktopDashboard: React.FC<AscendDesktopDashboardProps> = ({
  userProfile,
  userEmail,
  totalBalance,
  incomeToday,
  expenseToday,
  tasks = [],
  transactions = [],
  targets = [],
  notes = [],
  habits = [],
  announcements = [],
  onNavigateToTab,
  onOpenNewEntry,
  theme = 'light',
}) => {
  const isLight = theme === 'light';

  const now = new Date();

  // Format nama pengguna
  const displayName = (() => {
    let raw = userProfile?.name?.trim() || '';
    if (!raw || raw.toLowerCase() === 'pengguna' || raw.includes('@')) {
      raw = (raw || userEmail || userProfile?.email || '').split('@')[0];
    }
    return raw || 'Pengguna';
  })();

  // Format tanggal Indonesia
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  // Format rupiah
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID').format(Math.max(0, Math.round(val)));
  };

  // Saldo riil dari tabel wallets di Supabase
  const formattedBalance = formatRupiah(totalBalance);
  const formattedIncomeToday = formatRupiah(incomeToday);
  const formattedExpenseToday = formatRupiah(expenseToday);

  // Perhitungan agenda riil dari tabel agendas di Supabase
  const activeHabitsCount = habits.length;
  const activeTargetsCount = targets.length;

  // Ringkasan Pekanan Produktivitas (7 Hari Terakhir / Minggu Berjalan)
  const weeklyProductivity = useMemo(() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const daysData: Array<{
      dayNum: number;
      label: string;
      doneCount: number;
      totalCount: number;
      percentage: number;
      isToday: boolean;
    }> = [];

    let totalDoneWeek = 0;
    let totalScheduledWeek = 0;

    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date();
      d.setDate(now.getDate() - offset);
      const dayNum = d.getDate();
      const dayOfWeek = d.getDay();
      const isToday = offset === 0;

      const doneForDay = tasks.filter(t => t.days && t.days[dayNum] === 'done').length;
      const totalForDay = tasks.length;
      const pct = totalForDay > 0 ? Math.round((doneForDay / totalForDay) * 100) : 0;

      totalDoneWeek += doneForDay;
      totalScheduledWeek += totalForDay;

      daysData.push({
        dayNum,
        label: dayNames[dayOfWeek],
        doneCount: doneForDay,
        totalCount: totalForDay,
        percentage: pct,
        isToday,
      });
    }

    const weeklyScore = totalScheduledWeek > 0 
      ? Math.round((totalDoneWeek / totalScheduledWeek) * 100) 
      : (totalDoneWeek > 0 ? 100 : 0);

    return {
      daysData,
      totalDoneWeek,
      weeklyScore,
    };
  }, [tasks, now]);

  return (
    <div className={`w-full min-h-screen p-4 sm:p-6 lg:p-8 font-sans transition-colors ${
      isLight ? 'bg-[#EBF7F2] text-slate-900' : 'bg-[#090D16] text-white'
    }`}>
      <div className="max-w-[1300px] mx-auto space-y-6">

        {/* 1. SEKSI UTAMA DASHBOARD LANGSUNG PADA HALAMAN (HERO VIEW TANPA DIBUNGKUS KARTU KOTAK SEMPIT) */}
        <div className="relative py-3 sm:py-4 transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Sisi Kiri: Sapaan, Tanggal, Nama Pengguna & Teks Motivasi */}
            <div className="max-w-2xl">
              {/* Sapaan Halo & Tanggal */}
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className={`text-xs sm:text-sm font-black tracking-widest uppercase ${
                  isLight ? 'text-teal-700' : 'text-teal-400'
                }`}>
                  Halo,
                </span>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
                  isLight 
                    ? 'bg-white/90 border-teal-200/90 text-teal-800' 
                    : 'bg-[#111726]/90 border-slate-700/80 text-teal-300'
                }`}>
                  <Calendar className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Nama Pengguna */}
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-3 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {displayName}
              </h1>

              {/* Teks Motivasi Produktivitas */}
              <p className={`text-sm sm:text-base font-medium leading-relaxed pl-3.5 border-l-[3.5px] border-teal-500 rounded-l-xs max-w-xl ${
                isLight ? 'text-slate-600' : 'text-slate-300/90'
              }`}>
                Bangun kebiasaan positif dan capai tujuan hidupmu setiap hari dengan penuh kesadaran.
              </p>
            </div>

            {/* Sisi Kanan: Ilustrasi Manajemen Waktu & Produktivitas */}
            <div className="relative shrink-0 flex items-center justify-end select-none pointer-events-none max-w-[200px] sm:max-w-[240px] lg:max-w-[270px] self-center">
              {!isLight && (
                <div 
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-25"
                  style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(45, 212, 191, 0.15) 50%, transparent 70%)' }}
                />
              )}
              <NexAlignHeroIllustration 
                isLight={isLight}
                className="w-full h-auto max-h-[140px] sm:max-h-[160px] lg:max-h-[175px] object-contain transition-transform duration-700"
              />
            </div>
          </div>
        </div>

        {/* 2. DUA KARTU SEJAJAR BERSAMPINGAN: SALDO SISA DOMPET & RINGKASAN PEKANAN PRODUKTIVITAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* KARTU A: SALDO SISA DOMPET */}
          <div className={`lg:col-span-6 rounded-[24px] p-6 sm:p-7 border relative overflow-hidden group flex flex-col justify-between transition-all duration-300 ${
            isLight 
              ? 'bg-white border border-slate-200/90 text-slate-900 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06)] hover:shadow-lg' 
              : 'bg-[#0F172A] border border-slate-800 text-white shadow-xl hover:border-slate-700/80'
          }`}>
            <div>
              {/* Header Kartu Saldo */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  isLight 
                    ? 'bg-teal-50 border-teal-200/80 text-teal-800' 
                    : 'bg-[#131D31] border-slate-700/70 text-teal-400'
                }`}>
                  <Landmark className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold tracking-wider text-xs sm:text-sm uppercase ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      SALDO SISA DOMPET
                    </h3>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isLight 
                        ? 'bg-emerald-500' 
                        : 'bg-teal-400'
                    }`} />
                  </div>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Total dana kas yang tersedia saat ini
                  </p>
                </div>
              </div>

              {/* Kotak Utama Jumlah Saldo */}
              <div className={`p-4 sm:p-5 rounded-2xl border mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#131D31] border-slate-700/70'
              }`}>
                <div>
                  <span className={`text-[10px] sm:text-[11px] font-bold tracking-widest font-mono uppercase block mb-1 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    SISA SALDO TERSEDIA
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-bold text-xl sm:text-2xl ${
                      isLight ? 'text-teal-700' : 'text-teal-400'
                    }`}>
                      Rp
                    </span>
                    <span className={`text-3xl sm:text-4xl font-black tracking-tight font-sans ${
                      isLight ? 'text-slate-950' : 'text-white'
                    }`}>
                      {formattedBalance}
                    </span>
                  </div>
                </div>

                <div className="self-start sm:self-center">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
                    isLight 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    Saldo Aman
                  </span>
                </div>
              </div>

              {/* Grid 2 Kolom Ringkasan Masuk / Keluar */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Masuk Hari Ini */}
                <div className={`p-3 sm:p-3.5 rounded-2xl border ${
                  isLight 
                    ? 'bg-emerald-50/70 border-emerald-200/90 text-slate-900' 
                    : 'bg-[#131D31] border-slate-700/60 text-white'
                }`}>
                  <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider font-mono block mb-1 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    ↓ MASUK HARI INI
                  </span>
                  <span className={`text-xs sm:text-sm font-black font-mono ${
                    isLight ? 'text-emerald-900' : 'text-emerald-400'
                  }`}>
                    +Rp {formattedIncomeToday}
                  </span>
                </div>

                {/* Keluar Hari Ini */}
                <div className={`p-3 sm:p-3.5 rounded-2xl border ${
                  isLight 
                    ? 'bg-rose-50/70 border-rose-200/90 text-slate-900' 
                    : 'bg-[#131D31] border-slate-700/60 text-white'
                }`}>
                  <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider font-mono block mb-1 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    ↑ KELUAR HARI INI
                  </span>
                  <span className={`text-xs sm:text-sm font-black font-mono ${
                    isLight ? 'text-rose-900' : 'text-rose-400'
                  }`}>
                    -Rp {formattedExpenseToday}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Kelola Kas */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('finance')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-95 ${
                  isLight 
                    ? 'border-[#003B2F] text-white bg-[#003B2F] hover:bg-[#002e24]' 
                    : 'border-slate-700 text-teal-300 bg-[#131D31] hover:bg-[#1A2640]'
                }`}
              >
                Kelola Kas &amp; Riwayat →
              </button>
            </div>
          </div>

          {/* KARTU B: RINGKASAN PEKANAN PRODUKTIVITAS (SEBELAH SALDO) */}
          <div className={`lg:col-span-6 rounded-[24px] p-6 sm:p-7 border relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
            isLight 
              ? 'bg-white border border-slate-200/90 text-slate-900 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06)] hover:shadow-lg' 
              : 'bg-[#0F172A] border border-slate-800 text-white shadow-xl hover:border-slate-700/80'
          }`}>
            <div>
              {/* Header Ringkasan Pekanan */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    isLight 
                      ? 'bg-teal-50 border-teal-200 text-teal-700' 
                      : 'bg-[#111726] border-slate-700/80 text-teal-400'
                  }`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      Ringkasan Pekanan Produktivitas
                    </h3>
                    <span className={`text-xs font-medium block ${
                      isLight ? 'text-teal-700' : 'text-teal-400'
                    }`}>
                      Performa 7 Hari Terakhir
                    </span>
                  </div>
                </div>

                {/* Skor Mingguan Badge */}
                <div className={`px-3 py-1.5 rounded-xl border text-right ${
                  isLight 
                    ? 'bg-teal-50 border-teal-200/90' 
                    : 'bg-[#111726] border-slate-800'
                }`}>
                  <span className="text-[10px] text-slate-400 block font-medium">Skor Pekan Ini</span>
                  <span className={`text-sm font-black ${
                    isLight ? 'text-teal-800' : 'text-teal-300'
                  }`}>
                    {weeklyProductivity.weeklyScore}%
                  </span>
                </div>
              </div>

              {/* Bar Chart 7 Hari Produktivitas */}
              <div className="mb-4">
                <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2 pb-1">
                  {weeklyProductivity.daysData.map((day) => (
                    <div key={`week-day-${day.dayNum}`} className="flex flex-col items-center justify-end h-full group">
                      <div className="text-[9px] font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                        {day.doneCount}
                      </div>
                      <div className="w-full max-w-[24px] bg-slate-100 dark:bg-slate-800 rounded-t-md h-14 relative overflow-hidden flex items-end">
                        <div 
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            day.isToday 
                              ? 'bg-teal-500 ring-1 ring-teal-400' 
                              : isLight ? 'bg-teal-300 hover:bg-teal-400' : 'bg-teal-700/80 hover:bg-teal-600'
                          }`}
                          style={{ height: `${Math.max(14, day.percentage)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] sm:text-[11px] font-bold mt-1.5 ${
                        day.isToday 
                          ? isLight ? 'text-teal-800 font-extrabold' : 'text-teal-300 font-extrabold'
                          : isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistik Cepat Pekan Ini */}
              <div className="grid grid-cols-3 gap-2.5">
                <div 
                  className={`p-3 rounded-2xl border text-center ${
                    isLight ? 'bg-teal-50/50 border-teal-100 text-black' : 'bg-[#111726] border-slate-800'
                  }`}
                  style={isLight ? { color: '#000000' } : undefined}
                >
                  <span 
                    className={`text-[10px] sm:text-[11px] block font-bold ${isLight ? 'text-black' : 'text-slate-400'}`}
                    style={isLight ? { color: '#000000' } : undefined}
                  >
                    Agenda Selesai
                  </span>
                  <span 
                    className={`text-sm sm:text-base font-black ${isLight ? 'text-black' : 'text-teal-300'}`}
                    style={isLight ? { color: '#000000' } : undefined}
                  >
                    {weeklyProductivity.totalDoneWeek} Item
                  </span>
                </div>
                <div 
                  className={`p-3 rounded-2xl border text-center ${
                    isLight ? 'bg-emerald-50/50 border-emerald-100 text-black' : 'bg-[#111726] border-slate-800'
                  }`}
                  style={isLight ? { color: '#000000' } : undefined}
                >
                  <span 
                    className={`text-[10px] sm:text-[11px] block font-bold ${isLight ? 'text-black' : 'text-slate-400'}`}
                    style={isLight ? { color: '#000000' } : undefined}
                  >
                    Habit Aktif
                  </span>
                  <span 
                    className={`text-sm sm:text-base font-black ${isLight ? 'text-black' : 'text-emerald-300'}`}
                    style={isLight ? { color: '#000000' } : undefined}
                  >
                    {activeHabitsCount} Kebiasaan
                  </span>
                </div>
                <div 
                  className={`p-3 rounded-2xl border text-center ${
                    isLight ? 'bg-cyan-50/50 border-cyan-100 text-black' : 'bg-[#111726] border-slate-800'
                  }`}
                  style={isLight ? { color: '#000000' } : undefined}
                >
                  <span 
                    className={`text-[10px] sm:text-[11px] block font-bold ${isLight ? 'text-black' : 'text-slate-400'}`}
                    style={isLight ? { color: '#000000' } : undefined}
                  >
                    Target Aktif
                  </span>
                  <span 
                    className={`text-sm sm:text-base font-black ${isLight ? 'text-black' : 'text-cyan-300'}`}
                    style={isLight ? { color: '#000000' } : undefined}
                  >
                    {activeTargetsCount} Sasaran
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Tautan ke Laporan Lengkap */}
            <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
              isLight ? 'border-teal-100 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5 text-xs">
                <Activity className="w-4 h-4 text-teal-500" />
                <span>Konsistensi terukur</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('progress')}
                className={`font-semibold hover:underline cursor-pointer flex items-center gap-1 ${
                  isLight ? 'text-teal-700' : 'text-teal-400'
                }`}
              >
                Lihat Evaluasi Pekanan →
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
