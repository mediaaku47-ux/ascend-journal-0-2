import React from 'react';
import { AppLogo } from './AppLogo';

interface AscendBrandProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showDot?: boolean;
}

export const AscendBrand: React.FC<AscendBrandProps> = ({
  size = 'md',
  className = '',
  onClick,
  showDot = false,
}) => {
  return (
    <div 
      onClick={onClick} 
      className={`flex items-center gap-2.5 sm:gap-3 select-none cursor-pointer group min-w-0 ${className}`}
      title="Ascend Journal"
    >
      <div className="relative shrink-0">
        <AppLogo size={size} showBadgeDot={false} className="group-hover:scale-105 transition-transform" />
      </div>

      <div className="min-w-0 leading-tight">
        {/* Baris 1: ASCEND */}
        <div className="flex items-center gap-1.5">
          <span className="font-['Montserrat',sans-serif] font-bold text-[15.5px] sm:text-[16.5px] tracking-[0.14em] uppercase text-[#F59E0B] leading-none drop-shadow-xs">
            ASCEND
          </span>
          {showDot && (
            <span 
              className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B] inline-block shrink-0 animate-pulse" 
              title="Aktif"
            />
          )}
        </div>
        {/* Baris 2: JOURNAL */}
        <span className="font-['Montserrat',sans-serif] font-medium text-[9.5px] sm:text-[10.5px] tracking-[0.3em] text-[#5EEAD4] uppercase block mt-1">
          JOURNAL
        </span>
      </div>
    </div>
  );
};
