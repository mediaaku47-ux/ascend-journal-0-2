import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronRight } from 'lucide-react';

interface RollingProfileBadgeProps {
  avatarUrl?: string;
  displayName: string;
  theme?: 'dark' | 'light';
  onClick: () => void;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export const RollingProfileBadge: React.FC<RollingProfileBadgeProps> = ({
  avatarUrl,
  displayName = 'Pengguna',
  theme = 'dark',
  onClick,
  variant = 'mobile',
  className = '',
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpenManual, setIsOpenManual] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Status terbuka: baik saat disorot kursor (hover / hendak diklik di desktop)
  // maupun saat disentuh/diklik buka gulungan di mobile
  const isOpen = isHovered || isOpenManual;

  // Tutup otomatis gulungan jika pengguna menyentuh/mengeklik di luar tombol
  useEffect(() => {
    if (!isOpenManual) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpenManual(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    // Auto collapse kembali ke bentuk tergulung setelah 6 detik jika tidak ada klik lanjutan
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpenManual(false);
    }, 6000);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isOpenManual]);

  // Reset status error avatar jika URL berganti
  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  // Penanganan klik:
  // - Jika kondisi sedang tergulung: buka gulungan nama terlebih dahulu ("terbuka seperti gulung")
  // - Jika sudah terbuka atau sedang di-hover: eksekusi navigasi ke profil pengguna
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Jika sedang di desktop (hover aktif) -> langsung buka profil
    if (isHovered && !isOpenManual) {
      onClick();
      return;
    }

    // Jika sedang tergulung (khususnya sentuhan pertama di mobile/touch) -> buka gulungannya
    if (!isOpenManual) {
      setIsOpenManual(true);
      return;
    }

    // Jika sudah terbuka dan diklik lagi -> buka profil
    setIsOpenManual(false);
    onClick();
  };

  const isLight = theme === 'light';

  // Tampilan inisial
  const initial = displayName && displayName !== 'Pengguna' ? displayName.charAt(0).toUpperCase() : null;

  // Skema warna berdasarkan tema & status terbuka/tergulung
  const containerThemeClasses =
    variant === 'mobile'
      ? isLight
        ? isOpen
          ? 'bg-white/25 border-teal-300/60 text-white shadow-md backdrop-blur-md'
          : 'bg-white/15 hover:bg-white/25 border-teal-300/40 text-white shadow-xs backdrop-blur-md'
        : isOpen
        ? 'bg-[#142035] border-teal-400/60 text-teal-200 shadow-lg backdrop-blur-md'
        : 'bg-[#121B2C]/90 hover:bg-[#182337] border-slate-700/80 text-slate-100 shadow-md backdrop-blur-md'
      : isLight
      ? isOpen
        ? 'bg-white border-teal-400 text-teal-900 shadow-md'
        : 'bg-white/90 hover:bg-white border-teal-200/90 text-slate-800 shadow-xs'
      : isOpen
      ? 'bg-[#111A2D] border-emerald-400/60 text-emerald-200 shadow-lg'
      : 'bg-[#0B101D]/90 hover:bg-[#111726] border-slate-700/80 text-slate-200 shadow-md';

  const avatarRingClasses = isLight
    ? 'border-teal-400 ring-2 ring-teal-500/25'
    : 'border-teal-400/80 ring-2 ring-emerald-500/30';

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={
        isOpen
          ? `Buka Halaman Profil: ${displayName}`
          : `Profil Pengguna: ${displayName} (Sentuh / Arahkan kursor untuk membuka gulungan)`
      }
      aria-label={`Profil Pengguna: ${displayName}`}
      className={`group/avatar relative flex items-center rounded-full border cursor-pointer shrink-0 select-none transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 ${
        isOpen ? 'pl-1 pr-3 py-1 shadow-md' : 'p-0.5 shadow-sm'
      } ${containerThemeClasses} ${className}`}
      style={{ perspective: '1000px' }}
    >
      {/* 1. Lingkaran Foto Profil / Avatar (Selalu tampil sebagai jangkar gulungan) */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 border transition-all duration-500 ${avatarRingClasses} ${
          isOpen ? 'scale-105 ring-teal-400/40 shadow-xs' : 'scale-100'
        } ${
          isLight
            ? 'bg-teal-500/15 text-teal-800 dark:text-teal-200'
            : 'bg-teal-500/10 text-teal-300'
        }`}
      >
        {avatarUrl && !avatarError ? (
          <img
            src={avatarUrl}
            alt={displayName}
            onError={() => {
              console.warn('[RollingProfileBadge] Foto avatar gagal dimuat:', avatarUrl);
              setAvatarError(true);
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : initial ? (
          <span className="font-bold text-sm tracking-tight">{initial}</span>
        ) : (
          <User className="w-5 h-5 transition-transform duration-500 group-hover/avatar:scale-110" />
        )}
      </div>

      {/* 2. Wadah Nama Pengguna dengan Efek Membuka Gulungan Perlahan (Slow Smooth Unroll Effect) */}
      <div
        className="overflow-hidden transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center"
        style={{
          maxWidth: isOpen ? '180px' : '0px',
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? 'scaleX(1) rotateY(0deg) translateX(0px)'
            : 'scaleX(0.1) rotateY(-45deg) translateX(-10px)',
          transformOrigin: 'left center',
          paddingLeft: isOpen ? '9px' : '0px',
          paddingRight: isOpen ? '4px' : '0px',
          filter: isOpen ? 'blur(0px)' : 'blur(1px)',
        }}
      >
        {/* Teks Nama & Indikator Aksi yang Terbuka Perlahan dan Bersih Tanpa Ikon Cahaya */}
        <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0 pr-1">
          <div className="flex flex-col justify-center min-w-0">
            <span
              className={`text-xs sm:text-[13px] font-semibold tracking-tight truncate max-w-[105px] sm:max-w-[135px] block transition-colors ${
                isOpen
                  ? isLight
                    ? 'text-teal-950 font-bold'
                    : 'text-teal-200 font-bold'
                  : ''
              }`}
            >
              {displayName}
            </span>
            {isOpen && (
              <span className="text-[10px] leading-tight text-teal-400/90 font-medium tracking-wide flex items-center gap-0.5">
                <span>Buka Profil</span>
                <ChevronRight className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
