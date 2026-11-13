import React from 'react';

interface NexAlignHeroIllustrationProps {
  isLight?: boolean;
  className?: string;
}

/**
 * ASCEND Dashboard Hero Illustration
 * Menggunakan objek ilustrasi asli Manajemen Waktu (Time Management Illustration)
 * tanpa background putih, mempertahankan bentuk, karakter, warna, dan proporsi asli.
 */
export const NexAlignHeroIllustration: React.FC<NexAlignHeroIllustrationProps> = ({
  className = '',
}) => {
  return (
    <div className={`relative pointer-events-none select-none flex items-center justify-center shrink-0 ${className}`}>
      {/* Objek Asli Bersih Tanpa Background Putih */}
      <img
        src="/time-management-hero-clean.png"
        alt="Ilustrasi Manajemen Waktu & Produktivitas ASCEND"
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        className="w-full h-auto max-h-full object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300"
      />
    </div>
  );
};

// Alias export for clarity
export const TimeManagementHeroIllustration = NexAlignHeroIllustration;
