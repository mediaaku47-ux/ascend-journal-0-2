import React from 'react';

interface WalletIllustrationProps {
  className?: string;
  theme?: 'dark' | 'light';
}

/**
 * WalletIllustration
 * Ilustrasi asli unDraw "Wallet" (undraw_wallet_diag.png)
 * Menampilkan dompet besar, lembaran uang, dan karakter pendukung.
 * 100% transparan tanpa background putih, dengan palet warna emerald/teal identitas ASCEND.
 */
export const WalletIllustration: React.FC<WalletIllustrationProps> = ({
  className = 'w-full h-auto max-h-[160px]',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <div className={`relative inline-flex items-center justify-center select-none pointer-events-none transition-transform duration-500 ${className}`}>
      {/* Efek Ambient Glow Halus untuk Tema Gelap */}
      {!isLight && (
        <div 
          className="absolute -inset-4 rounded-full blur-2xl pointer-events-none opacity-25 z-0" 
          style={{
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.45) 0%, rgba(13, 148, 136, 0.2) 50%, transparent 70%)'
          }}
          aria-hidden="true"
        />
      )}

      {/* Gambar Ilustrasi Asli unDraw Transparan */}
      <img
        src="/undraw_wallet_diag.svg"
        alt="Ilustrasi Dompet Finansial ASCEND"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain relative z-10 drop-shadow-md transition-all duration-300"
      />
    </div>
  );
};
