import React from 'react';

interface PdfDocumentIconProps {
  className?: string;
  size?: number | string;
}

export const PdfDocumentIcon: React.FC<PdfDocumentIconProps> = ({
  className = 'w-11 h-11',
}) => {
  return (
    <svg
      viewBox="60 60 390 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 select-none drop-shadow-sm`}
      aria-hidden="true"
    >
      <defs>
        <filter id="pdf-doc-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.18" />
        </filter>
        <filter id="pdf-card-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="3" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.12" />
        </filter>
        <linearGradient id="red-front-header" x1="188" y1="90" x2="422" y2="176" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EF4444" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* Bayangan diagonal panjang (Long Shadow) */}
      <path
        d="M 370 140 L 450 220 L 450 430 L 260 430 L 148 420 Z"
        fill="#000000"
        opacity="0.08"
      />

      {/* 1. KERTAS MERAH BELAKANG (Miring ke kiri -9 derajat) */}
      <g transform="rotate(-9 235 270)">
        <rect
          x="105"
          y="105"
          width="225"
          height="295"
          rx="16"
          fill="#B91C1C"
        />
        {/* Detail aksen garis tipis pada kertas belakang */}
        <rect x="130" y="140" width="80" height="8" rx="4" fill="#DC2626" opacity="0.6" />
      </g>

      {/* 2. KERTAS DEPAN DENGAN LIPATAN (DOG-EAR) DI SUDUT KANAN ATAS */}
      <g filter="url(#pdf-card-shadow)">
        {/* Badan kertas putih */}
        <path
          d="
            M 200 88 
            L 366 88 
            L 420 142 
            L 420 388 
            A 14 14 0 0 1 406 402 
            L 200 402 
            A 14 14 0 0 1 186 388 
            L 186 102 
            A 14 14 0 0 1 200 88 
            Z"
          fill="#F1F5F9"
        />

        {/* Header merah atas dengan tulisan PDF */}
        <path
          d="
            M 200 88 
            L 366 88 
            L 420 142 
            L 420 178 
            L 186 178 
            L 186 102 
            A 14 14 0 0 1 200 88 
            Z"
          fill="url(#red-front-header)"
        />

        {/* Lipatan sudut kanan atas (segitiga flap) */}
        <path
          d="
            M 366 88 
            L 420 142 
            L 374 142 
            A 8 8 0 0 1 366 134 
            Z"
          fill="#991B1B"
        />

        {/* Teks PDF tebal putih */}
        <text
          x="295"
          y="157"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="56"
          fontWeight="900"
          letterSpacing="2"
          textAnchor="middle"
        >
          PDF
        </text>
      </g>

      {/* 3. MAP FOLDER DAN LEMBARAN DOKUMEN DI TENGAH */}
      <g transform="translate(186, 178)">
        {/* Kertas dokumen merah muda / putih di dalam saku folder */}
        <g transform="translate(48, 26)">
          <rect x="0" y="0" width="138" height="130" rx="8" fill="#F87171" />
          {/* Garis isi dokumen */}
          <rect x="18" y="20" width="102" height="10" rx="5" fill="#FEE2E2" />
          <rect x="18" y="40" width="84" height="10" rx="5" fill="#FEE2E2" />
          <rect x="18" y="60" width="94" height="10" rx="5" fill="#FEE2E2" />
        </g>

        {/* Map / Saku Merah Tua di bagian depan */}
        <g transform="translate(32, 78)">
          <path
            d="
              M 10 0 
              L 68 0 
              L 90 24 
              L 160 24 
              A 10 10 0 0 1 170 34 
              L 170 98 
              A 10 10 0 0 1 160 108 
              L 10 108 
              A 10 10 0 0 1 0 98 
              L 0 10 
              A 10 10 0 0 1 10 0 
              Z"
            fill="#DC2626"
          />
          {/* Aksen bayangan / bibir kantong folder */}
          <path
            d="
              M 0 88 
              L 170 88 
              L 170 98 
              A 10 10 0 0 1 160 108 
              L 10 108 
              A 10 10 0 0 1 0 98 
              Z"
            fill="#991B1B"
            opacity="0.4"
          />
        </g>
      </g>
    </svg>
  );
};
