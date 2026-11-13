import React from 'react';
import { NavTab } from '../types';
import { DashboardSkeleton } from './DashboardSkeleton';

interface PageTransitionSkeletonProps {
  tab: NavTab;
  theme?: 'dark' | 'light';
}

const ShimmerBlock: React.FC<{
  className?: string;
  isLight: boolean;
  tone?: 'auto' | 'emerald' | 'banner';
}> = ({ className = '', isLight, tone = 'auto' }) => {
  const toneClasses =
    tone === 'emerald'
      ? 'bg-emerald-200/20 animate-shimmer'
      : tone === 'banner'
      ? 'bg-white/20 animate-shimmer'
      : isLight
      ? 'bg-slate-200/85 animate-shimmer-light'
      : 'bg-white/[0.08] animate-shimmer';

  return <div className={`rounded-xl ${toneClasses} ${className}`} />;
};

const SkeletonCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  isLight: boolean;
}> = ({ children, className = '', isLight }) => (
  <div
    className={`rounded-[24px] border p-4 sm:p-5 transition-colors ${
      isLight
        ? 'bg-white border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]'
        : 'bg-[#111827] border-[#263449] shadow-md'
    } ${className}`}
  >
    {children}
  </div>
);

export const PageTransitionSkeleton: React.FC<PageTransitionSkeletonProps> = ({
  tab,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  /* ========================================================================= */
  /* 1. BERANDA (DASHBOARD)                                                    */
  /* ========================================================================= */
  if (tab === 'dashboard') {
    return <DashboardSkeleton theme={theme} />;
  }

  /* ========================================================================= */
  /* 2. AGENDA & MATRIKS HARIAN (AgendaView + AgendaTable)                     */
  /* ========================================================================= */
  if (tab === 'agenda') {
    return (
      <div className="space-y-6 pb-32 md:pb-14" aria-busy="true" aria-label="Memuat Agenda">
        {/* Header: Judul + Subtitle di kiri, 1 tombol aksi di kanan */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <ShimmerBlock isLight={isLight} className="w-6 h-6 rounded-lg shrink-0" />
              <ShimmerBlock isLight={isLight} className="h-7 w-56 sm:w-64" />
            </div>
            <ShimmerBlock isLight={isLight} className="h-4 w-64 sm:w-80 opacity-80" />
          </div>
          <ShimmerBlock isLight={isLight} className="h-10 w-44 rounded-2xl shrink-0" />
        </div>

        {/* Filter & Search Bar */}
        <div
          className={`flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]'
              : 'bg-[#111827] border-[#263449] shadow-md'
          }`}
        >
          <ShimmerBlock isLight={isLight} className="h-9 flex-1 rounded-xl" />
          <div className="flex items-center space-x-2 shrink-0">
            <ShimmerBlock isLight={isLight} className="h-8 w-24 rounded-xl" />
            <ShimmerBlock isLight={isLight} className="h-8 w-28 rounded-xl" />
          </div>
        </div>

        {/* Main Agenda Harian Card (#agenda-harian-card) */}
        <div
          className={`rounded-[28px] p-4 sm:p-5 md:p-6 border space-y-4 ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06)]'
              : 'bg-[#111827] border-[#263449] shadow-md'
          }`}
        >
          {/* Card Header: Judul + Badge + Bulan | Toggle Ceklis Harian vs Matriks 31 Hari */}
          <div
            className={`flex justify-between items-start md:items-center border-b pb-4 flex-col sm:flex-row gap-3 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShimmerBlock isLight={isLight} className="h-6 w-36" />
                <ShimmerBlock isLight={isLight} className="h-5 w-20 rounded-full" />
              </div>
              <ShimmerBlock isLight={isLight} className="h-3.5 w-28 opacity-80" />
            </div>
            <ShimmerBlock isLight={isLight} className="h-9 w-56 rounded-xl shrink-0" />
          </div>

          {/* Day Navigator Bar */}
          <div
            className={`p-3 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
            }`}
          >
            {/* Prev | Tanggal | Next */}
            <div className="flex items-center justify-between gap-2">
              <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
              <div className="flex flex-col items-center space-y-1.5">
                <ShimmerBlock isLight={isLight} className="h-4 w-44" />
                <ShimmerBlock isLight={isLight} className="h-3 w-32 opacity-75" />
              </div>
              <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
            </div>

            {/* Day Scroller Strip */}
            <div className="flex items-center gap-1.5 overflow-hidden">
              {Array.from({ length: 12 }).map((_, d) => (
                <ShimmerBlock
                  key={d}
                  isLight={isLight}
                  className="h-12 w-[38px] rounded-xl shrink-0"
                />
              ))}
            </div>

            {/* Daily Progress Bar & Batch Actions */}
            <div className="space-y-2 pt-1">
              <ShimmerBlock isLight={isLight} className="h-2 w-full rounded-full" />
              <div className="flex items-center justify-between">
                <ShimmerBlock isLight={isLight} className="h-3.5 w-36" />
                <ShimmerBlock isLight={isLight} className="h-3.5 w-24 opacity-70" />
              </div>
            </div>
          </div>

          {/* Quick Add Input Bar */}
          <div
            className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-white/[0.04] border-sky-500/30'
            }`}
          >
            <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
            <ShimmerBlock isLight={isLight} className="h-5 flex-1 rounded-lg" />
            <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
            <ShimmerBlock isLight={isLight} className="h-8 w-16 rounded-xl shrink-0" />
          </div>

          {/* Checklist Task Rows */}
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <ShimmerBlock isLight={isLight} className="h-4 w-48 sm:w-64" />
                    <ShimmerBlock isLight={isLight} className="h-4 w-14 rounded-md opacity-75" />
                  </div>
                  <ShimmerBlock isLight={isLight} className="h-3 w-40 opacity-75" />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <ShimmerBlock isLight={isLight} className="h-8 w-20 rounded-xl" />
                    <ShimmerBlock isLight={isLight} className="h-8 w-24 rounded-xl" />
                  </div>
                  <div className="flex items-center gap-1">
                    <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl" />
                    <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Save Bar (#agenda-save-bar) */}
          <div className="pt-2 flex justify-end">
            <ShimmerBlock isLight={isLight} className="h-10 w-full sm:w-52 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 3. PELACAK KEBIASAAN (HabitsView + HabitTrackerCard)                      */
  /* ========================================================================= */
  if (tab === 'habits') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Memuat Kebiasaan">
        {/* Header: Hanya Judul berikon + Tombol Tambah Kebiasaan (Tanpa subtitle) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <ShimmerBlock isLight={isLight} className="w-6 h-6 rounded-lg shrink-0" />
            <ShimmerBlock isLight={isLight} className="h-7 w-64 sm:w-72" />
          </div>
          <ShimmerBlock isLight={isLight} className="h-10 w-44 rounded-2xl shrink-0" />
        </div>

        {/* Kartu Kebiasaan Vertikal Full-Width (#pelacak-kebiasaan-card) */}
        <div className="space-y-5">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className={`rounded-[30px] p-5 sm:p-7 border space-y-4 ${
                isLight
                  ? 'bg-white border-slate-200/90 shadow-[0_10px_32px_rgba(0,0,0,0.05)]'
                  : 'bg-[#151B26] border-slate-800 shadow-xl'
              }`}
            >
              {/* 1. Nama Kebiasaan + Countdown Timer + Notif Badge + Hapus */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <ShimmerBlock isLight={isLight} className="h-6 w-44 sm:w-56" />
                    <ShimmerBlock isLight={isLight} className="h-8 w-28 rounded-full" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ShimmerBlock isLight={isLight} className="h-6 w-56 rounded-full opacity-80" />
                    <ShimmerBlock isLight={isLight} className="h-6 w-24 rounded-full opacity-80" />
                  </div>
                </div>
                <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
              </div>

              {/* 2. Target Harian & Bilah Progres Tebal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <ShimmerBlock isLight={isLight} className="h-4 w-36" />
                  <ShimmerBlock isLight={isLight} className="h-5 w-14 rounded-full" />
                </div>
                <ShimmerBlock isLight={isLight} className="h-4 sm:h-5 w-full rounded-full" />
              </div>

              {/* 3. Ceklis Mingguan: 7 Lingkaran Hari */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <ShimmerBlock isLight={isLight} className="h-3.5 w-28" />
                  <ShimmerBlock isLight={isLight} className="h-5 w-24 rounded-full" />
                </div>
                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                      <ShimmerBlock
                        isLight={isLight}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full"
                      />
                      <ShimmerBlock isLight={isLight} className="h-2.5 w-7 rounded-sm" />
                      <ShimmerBlock isLight={isLight} className="h-2 w-4 rounded-sm opacity-75" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 4. KEUANGAN & TABUNGAN (FinanceView)                                      */
  /* ========================================================================= */
  if (tab === 'finance') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Memuat Keuangan">
        {/* Header: Judul + Subtitle di kiri, 1 Tombol Foto Struk (AI) di kanan */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <ShimmerBlock isLight={isLight} className="h-7 w-52 sm:w-60" />
            <ShimmerBlock isLight={isLight} className="h-4 w-64 sm:w-72 opacity-80" />
          </div>
          <ShimmerBlock
            isLight={isLight}
            className="h-10 w-full sm:w-40 rounded-xl shrink-0"
          />
        </div>

        {/* Sub-Navigation Switcher: 3 Tab Sejajar Full-Width */}
        <div
          className={`flex items-center p-1 sm:p-1.5 border rounded-2xl gap-1 sm:gap-1.5 w-full ${
            isLight
              ? 'bg-slate-100/95 border-slate-300 shadow-xs'
              : 'bg-[#111827] border-[#263449] shadow-md'
          }`}
        >
          {[0, 1, 2].map((t) => (
            <ShimmerBlock key={t} isLight={isLight} className="h-9 sm:h-10 flex-1 rounded-xl" />
          ))}
        </div>

        {/* Card Hero Dana Tabungan (Sesuai default activeSubTab === 'savings') */}
        <div
          className={`border rounded-[20px] p-5 sm:p-6 ${
            isLight
              ? 'bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 border-slate-200/90 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06)]'
              : 'bg-gradient-to-br from-[#0F172A] via-[#111A2E] to-[#0D1524] border-slate-800 shadow-xl'
          }`}
        >
          {/* Header Card Tabungan */}
          <div
            className={`flex justify-between items-center mb-4 pb-3 border-b ${
              isLight ? 'border-slate-200/70' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
              <ShimmerBlock isLight={isLight} className="h-4 w-32" />
            </div>
            <ShimmerBlock isLight={isLight} className="w-7 h-7 rounded-lg shrink-0" />
          </div>

          {/* Total Balance Display + Ilustrasi di kanan (sm:flex) */}
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <ShimmerBlock isLight={isLight} className="h-3.5 w-36 opacity-80" />
              <ShimmerBlock isLight={isLight} className="h-10 w-52 sm:w-64 rounded-xl" />
            </div>
            <ShimmerBlock
              isLight={isLight}
              className="hidden sm:block w-[135px] md:w-[155px] h-[82px] rounded-2xl shrink-0"
            />
          </div>

          {/* Sub-stats: Grid 2 Kolom (Total Dana Masuk & Total Penarikan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[0, 1].map((col) => (
              <div
                key={col}
                className={`rounded-xl p-3 border flex items-center justify-between ${
                  isLight
                    ? 'bg-slate-50/80 border-slate-200/80'
                    : 'bg-[#131D31] border-slate-700/60'
                }`}
              >
                <div className="space-y-1.5">
                  <ShimmerBlock isLight={isLight} className="h-3 w-28" />
                  <ShimmerBlock isLight={isLight} className="h-5 w-32" />
                </div>
                <ShimmerBlock isLight={isLight} className="h-8 w-16 rounded-lg shrink-0" />
              </div>
            ))}
          </div>

          {/* Quick Action Bar: Pindah ke Kas Belanja */}
          <div
            className={`pt-3 border-t flex items-center justify-end ${
              isLight ? 'border-slate-200/70' : 'border-slate-800'
            }`}
          >
            <ShimmerBlock isLight={isLight} className="h-9 w-44 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 5. TARGET & GOL PRODUKTIVITAS (TargetsView)                               */
  /* ========================================================================= */
  if (tab === 'targets') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Memuat Target">
        {/* Header: Judul + Subtitle (Tanpa tombol kanan) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShimmerBlock isLight={isLight} className="w-6 h-6 rounded-lg shrink-0" />
            <ShimmerBlock isLight={isLight} className="h-7 w-60 sm:w-72" />
          </div>
          <ShimmerBlock isLight={isLight} className="h-4 w-56 opacity-80" />
        </div>

        {/* Summary Highlights: Grid 3 Kolom (Harian, Bulanan, Mingguan) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className={`p-4 rounded-2xl border space-y-2.5 ${
                isLight
                  ? 'bg-white border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.04)]'
                  : 'bg-[#111827] border-[#263449] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl" />
                <ShimmerBlock isLight={isLight} className="h-5 w-12 rounded-lg" />
              </div>
              <ShimmerBlock isLight={isLight} className="h-4 w-32" />
              <ShimmerBlock isLight={isLight} className="h-3 w-48 opacity-75" />
              <ShimmerBlock isLight={isLight} className="h-1.5 w-full rounded-full mt-1" />
            </div>
          ))}
        </div>

        {/* Target Items List (Daftar Vertikal, BUKAN grid 2 kolom) */}
        <div className="space-y-3.5">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                isLight
                  ? 'bg-white border-slate-200/90 shadow-xs'
                  : 'bg-[#111827] border-[#263449] shadow-md'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <ShimmerBlock isLight={isLight} className="h-4 w-48 sm:w-64" />
                    <ShimmerBlock isLight={isLight} className="h-3 w-32 opacity-75" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ShimmerBlock isLight={isLight} className="h-8 w-20 rounded-xl" />
                  <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl" />
                </div>
              </div>
              <ShimmerBlock isLight={isLight} className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 6. CATATAN & REFLEKSI (NotesView)                                         */
  /* ========================================================================= */
  if (tab === 'notes') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Memuat Catatan">
        {/* Header Utama Fitur Catatan: Ikon w-11 h-11 + Judul + Badge | Tombol Suara */}
        <div
          className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShimmerBlock isLight={isLight} className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="flex items-center gap-2.5">
              <ShimmerBlock isLight={isLight} className="h-7 w-24" />
              <ShimmerBlock isLight={isLight} className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <ShimmerBlock isLight={isLight} className="h-10 w-48 rounded-xl shrink-0" />
        </div>

        {/* 1. Form Input Catatan Baru (#form-tambah-catatan) */}
        <div
          className={`rounded-[28px] p-5 md:p-6 border space-y-4 ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]'
              : 'bg-[#0D1525] border-slate-700/80 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.65)]'
          }`}
        >
          <div
            className={`pb-3 border-b flex items-center gap-2 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}
          >
            <ShimmerBlock isLight={isLight} className="w-2.5 h-2.5 rounded-full" />
            <ShimmerBlock isLight={isLight} className="h-4 w-28" />
          </div>

          {/* Grid 12 Kolom: Judul (8) + Kategori (4) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 space-y-1.5">
              <ShimmerBlock isLight={isLight} className="h-3.5 w-24" />
              <ShimmerBlock isLight={isLight} className="h-10 w-full rounded-xl" />
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <ShimmerBlock isLight={isLight} className="h-3.5 w-20" />
              <ShimmerBlock isLight={isLight} className="h-10 w-full rounded-xl" />
            </div>
          </div>

          {/* Isi Catatan Textarea */}
          <div className="space-y-1.5">
            <ShimmerBlock isLight={isLight} className="h-3.5 w-20" />
            <ShimmerBlock isLight={isLight} className="h-[110px] w-full rounded-2xl" />
          </div>

          {/* Footer Form: Tanggal di kiri, Tombol Simpan di kanan */}
          <div className="flex justify-between items-center pt-1">
            <ShimmerBlock isLight={isLight} className="h-4 w-28" />
            <ShimmerBlock isLight={isLight} className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* 2. Daftar Riwayat Catatan */}
        <div className="space-y-4">
          {/* Header Riwayat + Search Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-1">
            <ShimmerBlock isLight={isLight} className="h-6 w-40" />
            <ShimmerBlock isLight={isLight} className="h-9 w-full md:w-64 rounded-xl" />
          </div>

          {/* Filter Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((chip) => (
              <ShimmerBlock
                key={chip}
                isLight={isLight}
                className="h-7 w-20 rounded-xl shrink-0"
              />
            ))}
          </div>

          {/* Grid 2 Kolom Kartu Catatan (md:grid-cols-2, BUKAN 3 kolom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((n) => (
              <div
                key={n}
                className={`rounded-[22px] p-5 border space-y-3 ${
                  isLight
                    ? 'bg-white border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]'
                    : 'bg-[#0F172A] border-slate-800 shadow-xl'
                }`}
              >
                <div
                  className={`flex items-center justify-between pb-3 border-b ${
                    isLight ? 'border-slate-100' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShimmerBlock isLight={isLight} className="h-5 w-20 rounded-lg" />
                    <ShimmerBlock isLight={isLight} className="h-4 w-16 rounded-md" />
                  </div>
                  <ShimmerBlock isLight={isLight} className="h-3.5 w-24 opacity-75" />
                </div>
                <ShimmerBlock isLight={isLight} className="h-5 w-3/4" />
                <ShimmerBlock isLight={isLight} className="h-3.5 w-full opacity-80" />
                <ShimmerBlock isLight={isLight} className="h-3.5 w-5/6 opacity-75" />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <ShimmerBlock isLight={isLight} className="h-7 w-7 rounded-lg" />
                  <ShimmerBlock isLight={isLight} className="h-7 w-7 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 7. NOTIFIKASI & PEMBERITAHUAN (NotificationsView)                         */
  /* ========================================================================= */
  if (tab === 'notifications') {
    return (
      <div className="w-full pb-32 sm:pb-24" aria-busy="true" aria-label="Memuat Notifikasi">
        {/* NotificationsView tidak memiliki Header atas; langsung daftar max-w-4xl mx-auto */}
        <div className="max-w-4xl mx-auto space-y-3.5 pt-1 sm:pt-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${
                isLight
                  ? 'bg-white border-slate-200/90'
                  : 'bg-[#111827] border-white/10'
              }`}
            >
              <div className="flex items-start gap-3.5 sm:gap-4">
                <ShimmerBlock
                  isLight={isLight}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <ShimmerBlock isLight={isLight} className="h-5 w-24 rounded-full" />
                    <ShimmerBlock isLight={isLight} className="h-3.5 w-28 opacity-75" />
                  </div>
                  <ShimmerBlock isLight={isLight} className="h-5 w-56 sm:w-72" />
                  <ShimmerBlock isLight={isLight} className="h-3.5 w-full opacity-80" />
                  <ShimmerBlock isLight={isLight} className="h-3.5 w-4/5 opacity-75" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 8. PROFIL PENGGUNA (ProfileView - main padding p-0)                      */
  /* ========================================================================= */
  if (tab === 'profile') {
    return (
      <div
        className={`w-full min-h-[calc(100vh-80px)] pb-24 md:pb-16 ${
          isLight ? 'bg-slate-50/60' : 'bg-[#080E21]'
        }`}
        aria-busy="true"
        aria-label="Memuat Profil"
      >
        {/* 1. Full-Width Banner Header (Persis ProfileView) */}
        <div
          className={`w-full ${
            isLight
              ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900'
              : 'bg-gradient-to-br from-[#0c1427] via-[#111C38] to-[#0A1020] border-b border-white/5'
          }`}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col items-center text-center">
            <ShimmerBlock tone="banner" isLight={isLight} className="w-16 h-16 rounded-full mb-2.5" />
            <div className="flex items-center gap-2 mb-1.5">
              <ShimmerBlock tone="banner" isLight={isLight} className="h-5 w-36" />
              <ShimmerBlock tone="banner" isLight={isLight} className="h-4 w-16 rounded-full" />
            </div>
            <ShimmerBlock tone="banner" isLight={isLight} className="h-3.5 w-48 opacity-80" />
          </div>
        </div>

        {/* 2. Daftar Accordion Menu Profil (max-w-2xl mx-auto, TANPA 3-card stats) */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-6 space-y-3">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className={`rounded-2xl py-3.5 px-4 border flex items-center justify-between gap-3 ${
                isLight
                  ? 'bg-emerald-50/70 border-emerald-100/80 shadow-xs'
                  : 'bg-[#141F3B] border-white/5 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <ShimmerBlock isLight={isLight} className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <ShimmerBlock isLight={isLight} className="h-4 w-40" />
                  <ShimmerBlock isLight={isLight} className="h-3 w-52 opacity-75" />
                </div>
              </div>
              <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
            </div>
          ))}

          {/* Footer email ringkas */}
          <div className="pt-3 flex justify-center">
            <ShimmerBlock isLight={isLight} className="h-3.5 w-56 opacity-70" />
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 9. PENGATURAN APLIKASI (SettingsView - main padding p-0)                  */
  /* ========================================================================= */
  if (tab === 'settings') {
    return (
      <div
        className={`w-full min-h-[calc(100vh-80px)] pb-24 md:pb-16 ${
          isLight ? 'bg-slate-50/60' : 'bg-[#080E21]'
        }`}
        aria-busy="true"
        aria-label="Memuat Pengaturan"
      >
        {/* 1. Full-Width Compact Banner Title Bar */}
        <div
          className={`w-full py-3.5 sm:py-4 px-4 sm:px-6 ${
            isLight
              ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 shadow-xs'
              : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500'
          }`}
        >
          <div className="max-w-2xl mx-auto flex justify-center">
            <ShimmerBlock tone="banner" isLight={isLight} className="h-5 sm:h-6 w-48" />
          </div>
        </div>

        {/* 2. Daftar Accordion Pengaturan (max-w-2xl mx-auto space-y-2.5 sm:space-y-3) */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3.5 pb-6 space-y-2.5 sm:space-y-3">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className={`rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-3 ${
                isLight
                  ? 'bg-white border-slate-200/90 shadow-xs'
                  : 'bg-[#111827] border-[#263449] shadow-sm'
              }`}
            >
              <ShimmerBlock isLight={isLight} className="h-4 w-44 sm:w-52" />
              <div className="flex items-center gap-2 shrink-0">
                {row === 0 && (
                  <ShimmerBlock isLight={isLight} className="h-5 w-24 rounded-full" />
                )}
                <ShimmerBlock isLight={isLight} className="w-6 h-6 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 10. PERKEMBANGAN & STATISTIK (ProgressView)                               */
  /* ========================================================================= */
  if (tab === 'progress') {
    return (
      <div className="space-y-6 pb-32 md:pb-14" aria-busy="true" aria-label="Memuat Perkembangan">
        {/* Hero Banner Perkembangan + Kartu Skor di Sisi Kanan */}
        <div
          className={`p-6 sm:p-7 rounded-[28px] border ${
            isLight
              ? 'bg-white border-[1.5px] border-teal-400 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]'
              : 'bg-[#111827] border-[#263449] shadow-md'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <ShimmerBlock isLight={isLight} className="h-7 w-40 rounded-full" />
              <ShimmerBlock isLight={isLight} className="h-9 w-72 sm:w-80 rounded-xl" />
            </div>

            {/* Kartu Skor di kanan */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border min-w-[220px] sm:min-w-[260px] space-y-2.5 shrink-0 ${
                isLight
                  ? 'bg-gradient-to-br from-teal-50 to-white border-teal-300 shadow-sm'
                  : 'bg-[#111827] border-[#263449] shadow-md'
              }`}
            >
              <ShimmerBlock isLight={isLight} className="h-3.5 w-24" />
              <div className="flex items-baseline gap-2">
                <ShimmerBlock isLight={isLight} className="h-9 w-20" />
                <ShimmerBlock isLight={isLight} className="h-3.5 w-28 opacity-80" />
              </div>
              <ShimmerBlock isLight={isLight} className="h-1.5 w-full rounded-full" />
              <ShimmerBlock isLight={isLight} className="h-3 w-36 opacity-70" />
            </div>
          </div>
        </div>

        {/* 1. Level Progress Header Card */}
        <SkeletonCard isLight={isLight} className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShimmerBlock isLight={isLight} className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-1.5">
                <ShimmerBlock isLight={isLight} className="h-5 w-44" />
                <ShimmerBlock isLight={isLight} className="h-3.5 w-32 opacity-75" />
              </div>
            </div>
            <ShimmerBlock isLight={isLight} className="h-9 w-32 rounded-xl shrink-0" />
          </div>
          <ShimmerBlock isLight={isLight} className="h-3 w-full rounded-full" />
        </SkeletonCard>

        {/* 2. Tracking Stats Card */}
        <SkeletonCard isLight={isLight} className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <ShimmerBlock isLight={isLight} className="h-5 w-48" />
            <ShimmerBlock isLight={isLight} className="h-8 w-32 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <ShimmerBlock key={i} isLight={isLight} className="h-20 rounded-2xl" />
            ))}
          </div>
          <ShimmerBlock isLight={isLight} className="h-40 w-full rounded-2xl" />
        </SkeletonCard>

        {/* 3. Financial Evaluation Summary Card */}
        <SkeletonCard isLight={isLight} className="p-5 sm:p-6 space-y-4">
          <ShimmerBlock isLight={isLight} className="h-5 w-52" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ShimmerBlock isLight={isLight} className="h-24 rounded-2xl" />
            <ShimmerBlock isLight={isLight} className="h-24 rounded-2xl" />
          </div>
        </SkeletonCard>
      </div>
    );
  }

  /* ========================================================================= */
  /* 11. ARSIP LAPORAN PDF (ArchiveView + PdfArchiveView)                      */
  /* ========================================================================= */
  if (tab === 'archive') {
    return (
      <div className="space-y-6 pb-28 md:pb-12" aria-busy="true" aria-label="Memuat Arsip">
        {/* Header Arsip dengan border-b */}
        <div className={`pb-4 border-b space-y-1.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-2">
            <ShimmerBlock isLight={isLight} className="w-6 h-6 rounded-lg shrink-0" />
            <ShimmerBlock isLight={isLight} className="h-7 w-56 sm:w-64" />
          </div>
          <ShimmerBlock isLight={isLight} className="h-4 w-64 sm:w-72 opacity-80" />
        </div>

        {/* Banner Utama Arsip PDF */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-5 ${
            isLight
              ? 'bg-gradient-to-br from-teal-50 via-white to-emerald-50/50 border-teal-200/80 shadow-sm'
              : 'bg-gradient-to-br from-[#0c1427] via-[#111C38] to-[#0A1020] border-[#263449] shadow-xl'
          }`}
        >
          <ShimmerBlock isLight={isLight} className="h-6 w-64" />
          <div className="flex items-center gap-3 shrink-0">
            <ShimmerBlock isLight={isLight} className="w-10 h-10 rounded-2xl" />
            <ShimmerBlock isLight={isLight} className="h-10 w-52 rounded-2xl" />
          </div>
        </div>

        {/* Filter & Pencarian */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <ShimmerBlock isLight={isLight} className="h-10 flex-1 max-w-md rounded-2xl" />
          <ShimmerBlock isLight={isLight} className="h-9 w-36 rounded-xl shrink-0" />
        </div>

        {/* Grid 2 Kolom Kartu Laporan PDF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((card) => (
            <div
              key={card}
              className={`p-4.5 sm:p-5 rounded-3xl border space-y-3.5 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#111827] border-[#263449] shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShimmerBlock isLight={isLight} className="w-11 h-11 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <ShimmerBlock isLight={isLight} className="h-4 w-32" />
                    <ShimmerBlock isLight={isLight} className="h-4 w-20 rounded-full" />
                  </div>
                </div>
                <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl shrink-0" />
              </div>
              <ShimmerBlock isLight={isLight} className="h-3.5 w-48 opacity-80" />
              <div className="flex items-center justify-between pt-2">
                <ShimmerBlock isLight={isLight} className="h-3.5 w-24" />
                <ShimmerBlock isLight={isLight} className="h-9 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* 12. ADMIN PORTAL & ADMIN FEEDBACK (AdminFeedbackView / AdminPortalView)   */
  /* ========================================================================= */
  return (
    <div className="space-y-6 pb-32 md:pb-14" aria-busy="true" aria-label="Memuat Portal Admin">
      {/* Header Banner */}
      <SkeletonCard isLight={isLight} className="p-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <ShimmerBlock isLight={isLight} className="h-5 w-40 rounded-full" />
            <ShimmerBlock isLight={isLight} className="h-8 w-64 sm:w-80" />
            <ShimmerBlock isLight={isLight} className="h-4 w-72 sm:w-96 opacity-80" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ShimmerBlock isLight={isLight} className="h-10 w-28 rounded-2xl" />
            <ShimmerBlock isLight={isLight} className="h-10 w-28 rounded-2xl" />
          </div>
        </div>
      </SkeletonCard>

      {/* Grid 4 Kolom Metrik Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} isLight={isLight} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <ShimmerBlock isLight={isLight} className="h-3.5 w-28" />
              <ShimmerBlock isLight={isLight} className="w-8 h-8 rounded-xl" />
            </div>
            <ShimmerBlock isLight={isLight} className="h-8 w-20" />
            <ShimmerBlock isLight={isLight} className="h-3 w-36 opacity-75" />
          </SkeletonCard>
        ))}
      </div>

      {/* Konten Utama */}
      <SkeletonCard isLight={isLight} className="p-5 space-y-3">
        {[0, 1, 2].map((row) => (
          <ShimmerBlock key={row} isLight={isLight} className="h-16 w-full rounded-2xl" />
        ))}
      </SkeletonCard>
    </div>
  );
};
