import React from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionSectionProps {
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  iconColorClass?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  isLight?: boolean;
  className?: string;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  id,
  isOpen,
  onToggle,
  icon,
  iconColorClass,
  title,
  subtitle,
  badge,
  children,
  isLight = false,
  className = '',
}) => {
  return (
    <div
      id={`accordion-${id}`}
      className={`rounded-xl transition-all duration-300 overflow-hidden ${
        isOpen
          ? isLight
            ? 'bg-white border border-emerald-400 shadow-md ring-1 ring-emerald-500/20'
            : 'bg-[#141F3B] border border-cyan-400/30 shadow-xl ring-1 ring-cyan-400/20'
          : isLight
            ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100/80 text-slate-700 shadow-xs'
            : 'bg-[#141F3B] hover:bg-[#1A284D] border border-white/5 text-slate-200 shadow-xs'
      } ${className}`}
    >
      {/* Accordion Header Button (Trimmed & Compact) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full py-3 px-3.5 sm:px-4 flex items-center justify-between gap-3 text-left cursor-pointer select-none transition-colors duration-200 group"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {icon && (
            <div
              className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                iconColorClass || (isLight ? 'bg-emerald-100/80 text-emerald-900' : 'bg-cyan-500/10 text-cyan-400')
              }`}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-xs sm:text-sm font-semibold tracking-tight truncate ${
                  isLight ? 'text-slate-800' : 'text-slate-100'
                }`}
              >
                {title}
              </h3>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {subtitle && (
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Chevron Indicator */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
            isOpen
              ? isLight
                ? 'bg-emerald-100 text-emerald-900 rotate-180'
                : 'bg-cyan-500/20 text-cyan-300 rotate-180'
              : isLight
                ? 'text-slate-400 group-hover:bg-emerald-100/50 group-hover:text-emerald-900'
                : 'text-slate-400 group-hover:bg-white/10 group-hover:text-white'
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300" />
        </div>
      </button>

      {/* Accordion Collapsible Body */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isOpen
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`p-3.5 sm:p-4 border-t ${
              isLight ? 'border-emerald-100/70 bg-white/70' : 'border-white/5 bg-[#0e162b]/80'
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
