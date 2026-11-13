import React from 'react';

interface DashboardSkeletonProps {
  theme?: 'dark' | 'light';
}

const ShimmerBox: React.FC<{
  className?: string;
  tone?: 'light' | 'dark' | 'emerald';
}> = ({ className = '', tone = 'dark' }) => {
  const toneClass =
    tone === 'light'
      ? 'bg-slate-200/85 animate-shimmer-light'
      : tone === 'emerald'
      ? 'bg-emerald-200/15 animate-shimmer'
      : 'bg-white/[0.08] animate-shimmer';

  return <div className={`rounded-xl ${toneClass} ${className}`} />;
};

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const surfaceTone = isLight ? 'light' : 'dark';

  return (
    <div
      className="w-full"
      aria-busy="true"
      aria-label="Memuat Halaman Utama"
    >
      {/* ===================================================================== */}
      {/* MOBILE DASHBOARD SKELETON (Mereplikasi MobileDashboardHero secara persis) */}
      {/* ===================================================================== */}
      <div
        className={`md:hidden w-full max-w-[1020px] mx-auto min-h-screen px-3.5 pt-0 pb-24 transition-colors duration-200 ${
          isLight ? 'bg-white' : 'bg-[#090D16]'
        }`}
      >
        {/* 1. Header Atas Full-Width (Brand + Profil Pengguna) */}
        <div
          className={`-mx-3.5 px-4 py-3 mb-3.5 flex items-center justify-between border-b ${
            isLight
              ? 'bg-[#032D22] border-teal-500/30'
              : 'bg-[#090D16] border-[#263449]'
          }`}
        >
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <ShimmerBox tone="emerald" className="w-8 h-8 rounded-lg shrink-0" />
            <div className="space-y-1">
              <ShimmerBox tone="emerald" className="h-3.5 w-24" />
              <ShimmerBox tone="emerald" className="h-2.5 w-14 opacity-75" />
            </div>
          </div>

          {/* Rolling Profile Badge Skeleton */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/10">
            <ShimmerBox tone="emerald" className="w-7 h-7 rounded-full shrink-0" />
            <ShimmerBox tone="emerald" className="h-3 w-16 rounded-md" />
          </div>
        </div>

        {/* 2. Hero Header Profil / Sapaan Pengguna */}
        <div className="w-full px-1 sm:px-2 py-2.5 sm:py-3.5 mb-3 sm:mb-4 flex items-center justify-between gap-3">
          <div className="flex-1 max-w-[60%] space-y-2">
            <ShimmerBox tone={surfaceTone} className="h-3 w-12" />
            <ShimmerBox tone={surfaceTone} className="h-7 w-40 sm:w-48 rounded-lg" />
            <div className="pl-3 border-l-[3.5px] border-teal-400/70 space-y-1.5 py-0.5">
              <ShimmerBox tone={surfaceTone} className="h-3 w-44" />
              <ShimmerBox tone={surfaceTone} className="h-3 w-28 opacity-80" />
            </div>
          </div>

          {/* Placeholder Ilustrasi Sisi Kanan */}
          <div className="shrink-0 w-[34%] flex justify-end">
            <ShimmerBox tone={surfaceTone} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl" />
          </div>
        </div>

        {/* 3. Pencarian Global */}
        <div className="w-full mb-3.5 sm:mb-4">
          <div
            className={`w-full h-11 rounded-2xl border px-3.5 flex items-center gap-2.5 ${
              isLight
                ? 'bg-slate-50 border-slate-200/90'
                : 'bg-[#111827] border-[#263449]'
            }`}
          >
            <ShimmerBox tone={surfaceTone} className="w-4 h-4 rounded-md shrink-0" />
            <ShimmerBox tone={surfaceTone} className="h-3.5 w-52 opacity-80" />
          </div>
        </div>

        {/* 4. Kartu Dompet Operasional */}
        <div
          className={`w-full rounded-[14px] sm:rounded-[16px] p-4 sm:p-5 mb-4 sm:mb-5 border ${
            isLight
              ? 'bg-gradient-to-br from-[#064E3B] via-[#043E30] to-[#022C22] border-emerald-500/40 shadow-[0_12px_28px_-6px_rgba(4,62,48,0.35)]'
              : 'bg-gradient-to-br from-[#111A29] via-[#0D1624] to-[#080E17] border-emerald-500/35 shadow-2xl'
          }`}
        >
          {/* Info Bar Atas */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShimmerBox tone="emerald" className="w-8 h-8 rounded-lg shrink-0" />
              <ShimmerBox tone="emerald" className="h-3.5 w-32" />
            </div>
            <ShimmerBox tone="emerald" className="h-5 w-20 rounded-md" />
          </div>

          {/* Baris Saldo Kas Tersedia */}
          <div className="mb-3.5 pb-3 border-b border-emerald-500/20 space-y-2">
            <ShimmerBox tone="emerald" className="h-3 w-28 opacity-80" />
            <ShimmerBox tone="emerald" className="h-9 w-48 rounded-lg" />
          </div>

          {/* Masuk & Keluar Hari Ini (Grid 2 Kolom) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {[0, 1].map((col) => (
              <div
                key={col}
                className={`rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 border ${
                  isLight
                    ? 'bg-emerald-950/70 border-emerald-500/30'
                    : 'bg-[#121B2A]/90 border-slate-700/60'
                }`}
              >
                <ShimmerBox tone="emerald" className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <ShimmerBox tone="emerald" className="h-2.5 w-16 opacity-80" />
                  <ShimmerBox tone="emerald" className="h-3.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Bagian Akses Cepat (Grid 3 Kolom) */}
        <div className="mb-4 sm:mb-5">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <ShimmerBox tone={surfaceTone} className="h-3.5 w-24" />
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className={`rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between border min-h-[118px] sm:min-h-[124px] ${
                  isLight
                    ? 'bg-white border-slate-200/90 shadow-xs'
                    : 'bg-gradient-to-b from-[#131d2e] to-[#0d1522] border-[#223147]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <ShimmerBox tone={surfaceTone} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl" />
                  <ShimmerBox tone={surfaceTone} className="w-5 h-3 rounded-md opacity-70" />
                </div>
                <div className="space-y-1.5 pt-2">
                  <ShimmerBox tone={surfaceTone} className="h-3.5 w-full" />
                  <ShimmerBox tone={surfaceTone} className="h-2.5 w-3/4 opacity-75" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Kartu Tanggal Hari Ini */}
        <div
          className={`w-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 mb-4 sm:mb-5 border ${
            isLight
              ? 'bg-teal-50/40 border-teal-500/20'
              : 'bg-[#111827] border-[#263449]'
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-3.5">
            <ShimmerBox tone={surfaceTone} className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <ShimmerBox tone={surfaceTone} className="h-2.5 w-16" />
              <ShimmerBox tone={surfaceTone} className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* 7. Daftar Menu Fitur Utama (Grid 4 Kolom, 7 Ikon) */}
        <div className="w-full mb-6 px-4 py-1">
          <div className="flex items-center gap-2 mb-3 px-0.5">
            <ShimmerBox tone={surfaceTone} className="w-5 h-5 rounded-md" />
            <ShimmerBox tone={surfaceTone} className="h-4 w-24" />
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-[56px] h-[56px] rounded-2xl border flex items-center justify-center ${
                    isLight
                      ? 'bg-white border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.03)]'
                      : 'bg-[#141F36] border-slate-700/60 shadow-[0_3px_10px_rgba(0,0,0,0.25)]'
                  }`}
                >
                  <ShimmerBox tone={surfaceTone} className="w-9 h-9 rounded-xl" />
                </div>
                <ShimmerBox tone={surfaceTone} className="h-2.5 w-12 mt-1.5 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DESKTOP DASHBOARD SKELETON (Mereplikasi AscendDesktopDashboard)       */}
      {/* ===================================================================== */}
      <div
        className={`hidden md:block w-full min-h-screen p-4 sm:p-6 lg:p-8 transition-colors ${
          isLight ? 'bg-[#EBF7F2]' : 'bg-[#090D16]'
        }`}
      >
        <div className="max-w-[1300px] mx-auto space-y-6">
          {/* 1. Hero Sapaan Pengguna & Ilustrasi */}
          <div className="py-3 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <ShimmerBox tone={surfaceTone} className="h-4 w-12" />
                <ShimmerBox tone={surfaceTone} className="h-7 w-48 rounded-full" />
              </div>
              <ShimmerBox tone={surfaceTone} className="h-11 w-64 sm:w-80 rounded-xl" />
              <div className="pl-3.5 border-l-[3.5px] border-teal-500/70 space-y-2 py-0.5">
                <ShimmerBox tone={surfaceTone} className="h-4 w-96" />
                <ShimmerBox tone={surfaceTone} className="h-4 w-64 opacity-80" />
              </div>
            </div>
            <ShimmerBox tone={surfaceTone} className="w-56 h-40 rounded-2xl shrink-0 self-center" />
          </div>

          {/* 2. Dua Kartu Sejajar: Saldo Sisa Dompet & Ringkasan Pekanan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Kartu A: Saldo Sisa Dompet */}
            <div
              className={`lg:col-span-6 rounded-[24px] p-6 sm:p-7 border flex flex-col justify-between space-y-5 ${
                isLight
                  ? 'bg-white border-slate-200/90 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06)]'
                  : 'bg-[#0F172A] border-slate-800 shadow-xl'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <ShimmerBox tone={surfaceTone} className="w-11 h-11 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <ShimmerBox tone={surfaceTone} className="h-4 w-40" />
                    <ShimmerBox tone={surfaceTone} className="h-3 w-52 opacity-75" />
                  </div>
                </div>

                <div
                  className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-3 ${
                    isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-[#131D31] border-slate-700/70'
                  }`}
                >
                  <div className="space-y-2">
                    <ShimmerBox tone={surfaceTone} className="h-3 w-32" />
                    <ShimmerBox tone={surfaceTone} className="h-9 w-48" />
                  </div>
                  <ShimmerBox tone={surfaceTone} className="h-8 w-28 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ShimmerBox tone={surfaceTone} className="h-16 rounded-2xl" />
                  <ShimmerBox tone={surfaceTone} className="h-16 rounded-2xl" />
                </div>
              </div>

              <div className="flex justify-end">
                <ShimmerBox tone={surfaceTone} className="h-9 w-44 rounded-xl" />
              </div>
            </div>

            {/* Kartu B: Ringkasan Pekanan Produktivitas */}
            <div
              className={`lg:col-span-6 rounded-[24px] p-6 sm:p-7 border flex flex-col justify-between space-y-5 ${
                isLight
                  ? 'bg-white border-slate-200/90 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06)]'
                  : 'bg-[#0F172A] border-slate-800 shadow-xl'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShimmerBox tone={surfaceTone} className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                      <ShimmerBox tone={surfaceTone} className="h-4 w-52" />
                      <ShimmerBox tone={surfaceTone} className="h-3 w-36 opacity-75" />
                    </div>
                  </div>
                  <ShimmerBox tone={surfaceTone} className="h-12 w-24 rounded-xl shrink-0" />
                </div>

                {/* 7-Bar Chart */}
                <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2 pb-1">
                  {[48, 72, 40, 88, 65, 92, 58].map((h, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-end h-full gap-1.5">
                      <div
                        className={`w-full max-w-[24px] rounded-t-md ${
                          isLight
                            ? 'bg-slate-200/85 animate-shimmer-light'
                            : 'bg-white/[0.08] animate-shimmer'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                      <ShimmerBox tone={surfaceTone} className="h-2.5 w-6 rounded-sm" />
                    </div>
                  ))}
                </div>

                {/* 3 Quick Stats */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[0, 1, 2].map((stat) => (
                    <ShimmerBox key={stat} tone={surfaceTone} className="h-16 rounded-2xl" />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                <ShimmerBox tone={surfaceTone} className="h-3.5 w-32" />
                <ShimmerBox tone={surfaceTone} className="h-3.5 w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
