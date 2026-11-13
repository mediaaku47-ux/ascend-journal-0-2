import React, { useState } from 'react';

interface TargetIllustrationProps {
  className?: string;
  theme?: 'dark' | 'light';
}

export const TargetIllustration: React.FC<TargetIllustrationProps> = ({
  className = 'w-32 h-32 sm:w-36 sm:h-36',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [imgError, setImgError] = useState(false);

  // Palette matching unDraw target illustration
  const skinFair = '#FFD2C9';
  const skinWarm = '#8D5B4C';
  const darkHair = '#1E293B';
  const darkClothes = isLight ? '#1E293B' : '#0F172A';
  const darkPants = isLight ? '#334155' : '#1E293B';
  const vibrantBlue = isLight ? '#4F46E5' : '#6366F1';
  const dartPurple = '#7C3AED';
  const wheelOuter = isLight ? '#E2E8F0' : '#334155';
  const wheelInner = isLight ? '#F8FAFC' : '#1E293B';
  const wheelLines = isLight ? '#CBD5E1' : '#475569';
  const bullseye = isLight ? '#0F172A' : '#38BDF8';
  const groundShadow = isLight ? '#E2E8F0' : '#1E293B';

  if (!imgError) {
    return (
      <div className={`relative pointer-events-none select-none flex items-center justify-center ${className}`}>
        {/* Ambient Glow halus di belakang objek untuk mode gelap */}
        {!isLight && (
          <div 
            className="absolute -inset-2 rounded-full blur-2xl pointer-events-none opacity-25 z-0"
            style={{
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(45, 212, 191, 0.15) 50%, transparent 70%)'
            }}
            aria-hidden="true"
          />
        )}
        <img
          src="/target-illustration-clean.png"
          alt="Ilustrasi Target & Gol"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain relative z-10 transition-transform duration-300 drop-shadow-[0_8px_18px_rgba(0,0,0,0.22)]"
        />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Ground lines (subtle unDraw style floor shadows) */}
      <line x1="60" y1="335" x2="220" y2="335" stroke={groundShadow} strokeWidth="3" strokeLinecap="round" />
      <line x1="280" y1="455" x2="450" y2="455" stroke={groundShadow} strokeWidth="3" strokeLinecap="round" />

      {/* ======================================================== */}
      {/* 1. TARGET WHEEL (CENTER-LEFT)                            */}
      {/* ======================================================== */}
      <g id="target-wheel">
        {/* Outer Wheel Rim */}
        <circle cx="230" cy="180" r="105" fill={wheelInner} stroke={wheelOuter} strokeWidth="16" />
        <circle cx="230" cy="180" r="75" fill="none" stroke={wheelLines} strokeWidth="1.5" />
        <circle cx="230" cy="180" r="45" fill="none" stroke={wheelLines} strokeWidth="1.5" />

        {/* Radial Spokes / Wheel Grid Lines */}
        <line x1="230" y1="75" x2="230" y2="285" stroke={wheelLines} strokeWidth="1.5" />
        <line x1="125" y1="180" x2="335" y2="180" stroke={wheelLines} strokeWidth="1.5" />
        <line x1="155" y1="105" x2="305" y2="255" stroke={wheelLines} strokeWidth="1.5" />
        <line x1="155" y1="255" x2="305" y2="105" stroke={wheelLines} strokeWidth="1.5" />
        <line x1="135" y1="140" x2="325" y2="220" stroke={wheelLines} strokeWidth="1.5" />
        <line x1="135" y1="220" x2="325" y2="140" stroke={wheelLines} strokeWidth="1.5" />
        <line x1="190" y1="85" x2="270" y2="275" stroke={wheelLines} strokeWidth="1.5" />
        <line x1="270" y1="85" x2="190" y2="275" stroke={wheelLines} strokeWidth="1.5" />

        {/* Center Bullseye */}
        <circle cx="230" cy="180" r="12" fill={bullseye} />
      </g>

      {/* ======================================================== */}
      {/* 2. PERSON ON LEFT (HOLDING TARGET WHEEL)                 */}
      {/* ======================================================== */}
      <g id="person-left">
        {/* Left Foot & Shoe */}
        <path d="M100 315 L125 335 L90 335 Z" fill={darkClothes} />
        {/* Right Foot & Shoe */}
        <path d="M150 322 L175 335 L145 335 Z" fill={darkClothes} />

        {/* Legs / Dark Pants */}
        <path d="M110 190 L98 315 L120 315 L135 220 L150 322 L172 322 L165 190 Z" fill={darkPants} />

        {/* Torso / Dark T-Shirt */}
        <path d="M115 90 L185 90 L180 195 L115 195 Z" fill={darkClothes} rx="4" />

        {/* Left Arm Resting Along Torso */}
        <path d="M115 95 L102 180 L114 180 L125 105 Z" fill={darkClothes} />
        {/* Left Hand */}
        <circle cx="108" cy="185" r="7" fill={skinFair} />

        {/* Right Arm Reaching onto the Target Wheel */}
        <path d="M175 92 L235 92 L235 104 L180 110 Z" fill={darkClothes} />
        {/* Right Hand Resting on Target Wheel Rim */}
        <ellipse cx="235" cy="98" rx="9" ry="6" fill={skinFair} />

        {/* Neck */}
        <rect x="142" y="78" width="14" height="15" fill={skinFair} />

        {/* Head */}
        <ellipse cx="149" cy="68" rx="16" ry="19" fill={skinFair} />

        {/* Hair */}
        <path d="M133 65 C133 48 145 44 162 48 C168 50 170 56 166 65 C162 62 158 64 154 60 C146 62 140 60 133 65 Z" fill={darkHair} />
      </g>

      {/* ======================================================== */}
      {/* 3. DART / ARROW IN BULLSEYE                             */}
      {/* ======================================================== */}
      <g id="dart-arrow">
        {/* Dart Shaft Pointing into Bullseye */}
        <path d="M230 180 L270 162 L273 170 Z" fill={vibrantBlue} opacity="0.9" />
        <line x1="230" y1="180" x2="278" y2="162" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        {/* Dart Flights / Feathers */}
        <polygon points="268,154 286,146 278,164" fill={dartPurple} />
        <polygon points="274,166 288,180 270,172" fill={dartPurple} />
      </g>

      {/* ======================================================== */}
      {/* 4. PERSON ON RIGHT (AIMING / PLACING DART)               */}
      {/* ======================================================== */}
      <g id="person-right">
        {/* Back Leg / Right Leg & Shoe */}
        <path d="M380 430 L402 455 L372 455 Z" fill={darkClothes} />
        {/* Front Leg / Left Leg & Shoe */}
        <path d="M320 440 L345 455 L315 455 Z" fill={darkClothes} />

        {/* Pants */}
        <path d="M320 300 L322 440 L345 440 L365 340 L385 430 L405 430 L385 300 Z" fill={darkPants} />

        {/* Blue Shirt / Torso */}
        <path d="M315 195 L375 195 L382 315 L318 315 Z" fill={vibrantBlue} />

        {/* Right Arm Reaching Forward to the Dart */}
        <path d="M340 195 L276 170 L272 184 L335 215 Z" fill={vibrantBlue} />
        {/* Right Hand Holding Dart */}
        <circle cx="272" cy="173" r="9" fill={skinWarm} />

        {/* Left Arm Resting at Side */}
        <path d="M375 200 L395 290 L385 292 L368 215 Z" fill={vibrantBlue} />
        {/* Left Hand */}
        <circle cx="395" cy="296" r="8" fill={skinWarm} />

        {/* Neck */}
        <rect x="338" y="180" width="16" height="18" fill={skinWarm} />

        {/* Head */}
        <ellipse cx="347" cy="168" rx="17" ry="20" fill={skinWarm} />

        {/* Hair */}
        <path d="M333 162 C330 148 342 144 360 146 C368 148 372 154 366 166 C362 160 355 160 348 162 C342 164 338 160 333 162 Z" fill={darkHair} />
      </g>
    </svg>
  );
};
