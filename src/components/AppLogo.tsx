import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  showBadgeDot?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showBorder = true,
  showBadgeDot = false,
}) => {
  // Dimension mapping
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-14 h-14 rounded-3xl',
  };

  const innerRadius = {
    sm: 'rounded-[10px]',
    md: 'rounded-[14px]',
    lg: 'rounded-[14px]',
    xl: 'rounded-[20px]',
  };

  return (
    <div
      className={`relative select-none shrink-0 ${sizeClasses[size]} ${
        showBorder
          ? 'bg-gradient-to-tr from-[#0C6478] via-[#15919B] to-[#084857] p-[1.5px] shadow-lg shadow-black/30'
          : ''
      } ${className}`}
    >
      <div
        className={`w-full h-full bg-[#080e14] ${innerRadius[size]} flex items-center justify-center overflow-hidden relative`}
      >
        <img
          src="/logo.png"
          alt="Ascend Journal"
          loading="eager"
          decoding="sync"
          className={`w-full h-full object-contain filter brightness-90 contrast-105 ${innerRadius[size]}`}
        />
      </div>

      {showBadgeDot && (
        <span 
          aria-hidden="true"
          className="absolute -top-1 -right-1 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-400 ring-2 ring-[#080e14] shadow-[0_0_8px_#F59E0B] z-10 pointer-events-none" 
        />
      )}
    </div>
  );
};
