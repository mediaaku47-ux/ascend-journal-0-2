import React from 'react';
import { 
  Compass, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  Crown, 
  Award
} from 'lucide-react';
import { UserLevelProgress, LEVELS } from '../utils/levelUtils';

interface LevelProgressHeaderProps {
  levelProgress: UserLevelProgress;
  onOpenRoadmap: () => void;
  theme?: 'dark' | 'light';
}

export const LevelProgressHeader: React.FC<LevelProgressHeaderProps> = ({
  levelProgress,
  onOpenRoadmap,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const { currentLevel, overallProgressPercent } = levelProgress;

  const getLevelIcon = () => {
    switch (currentLevel.iconType) {
      case 'compass':
        return <Compass className={`w-5 h-5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />;
      case 'trending-up':
        return <TrendingUp className={`w-5 h-5 ${isLight ? 'text-teal-700' : 'text-teal-300'}`} />;
      case 'flame':
        return <Flame className={`w-5 h-5 ${isLight ? 'text-sky-600 fill-sky-500/20' : 'text-sky-400 fill-sky-400/30'}`} />;
      case 'shield':
        return <ShieldCheck className={`w-5 h-5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />;
      case 'crown':
        return <Crown className={`w-5 h-5 ${isLight ? 'text-amber-600 fill-amber-500/30' : 'text-amber-400 fill-amber-400/40'}`} />;
      default:
        return <Award className={`w-5 h-5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />;
    }
  };

  return (
    <div 
      id="level-progress-header-banner"
      style={isLight ? {
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      } : undefined}
      className={`mt-4 p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-md ${
        isLight
          ? 'bg-white border-[1.5px] border-[#2DD4BF] text-slate-900 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]'
          : 'bg-[#111827] border border-[#263449] text-white'
      }`}
    >

      {/* Ambient background glow matching level color */}
      <div 
        className="absolute -top-10 -right-10 w-48 h-36 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: currentLevel.accentColor }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Level Identity Badge */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Level Icon Badge with glowing border */}
          <div 
            onClick={onOpenRoadmap}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-105 shadow-md cursor-pointer relative ${
              isLight ? 'bg-teal-50 border-teal-300' : ''
            }`}
            style={!isLight ? { 
              backgroundColor: `${currentLevel.accentColor}18`,
              borderColor: `${currentLevel.accentColor}50` 
            } : undefined}
            title="Klik untuk melihat Roadmap Level"
          >
            {getLevelIcon()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {/* Pill Level Name with high contrast in light mode */}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 border shadow-xs ${
                isLight
                  ? (currentLevel.level === 1 ? 'bg-slate-100 border-slate-300 text-slate-900'
                    : currentLevel.level === 2 ? 'bg-teal-100 border-teal-300 text-teal-950'
                    : currentLevel.level === 3 ? 'bg-sky-100 border-sky-300 text-sky-950'
                    : currentLevel.level === 4 ? 'bg-indigo-100 border-indigo-300 text-indigo-950'
                    : 'bg-amber-100 border-amber-300 text-amber-950')
                  : `${currentLevel.badgeBg} ${currentLevel.badgeBorder} ${currentLevel.badgeText}`
              }`}>
                <span>{currentLevel.title}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar & Indicator */}
      <div className={`mt-3 pt-2.5 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex items-center justify-end text-xs mb-2">
          {/* Progress Percentage */}
          <div className={`flex items-center font-mono text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
            <span className={`font-black px-2 py-0.5 rounded-md border ${
              isLight ? 'bg-teal-100 text-teal-950 border-teal-300' : 'text-sky-300 bg-sky-500/15 border-sky-500/30'
            }`}>
              {overallProgressPercent}%
            </span>
          </div>
        </div>

        {/* Animated Progress Track (Tebal & Glossy) */}
        <div 
          onClick={onOpenRoadmap}
          className={`w-full h-4 sm:h-5 rounded-full overflow-hidden p-1 border cursor-pointer transition-all shadow-inner ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/10 group-hover:border-sky-500/30'
          }`}
          title={`Progres kumulatif: ${overallProgressPercent}% (Level ${currentLevel.level}/5) • Klik untuk melihat rincian`}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${currentLevel.gradient} shadow-[0_0_14px_rgba(56,189,248,0.6)] relative overflow-hidden flex items-center justify-end pr-2`}
            style={{ width: `${Math.max(8, overallProgressPercent)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/10 pointer-events-none rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
            {overallProgressPercent >= 18 && (
              <span className="relative z-10 text-[10px] font-mono font-black text-white drop-shadow-xs select-none">
                {overallProgressPercent}%
              </span>
            )}
          </div>
        </div>

        {/* 5 Levels Mini Stepper Track */}
        <div className="grid grid-cols-5 gap-1.5 mt-2.5 pt-1 text-[10px]">
          {LEVELS.map((lvl) => {
            const isCompleted = currentLevel.level > lvl.level;
            const isCurrent = currentLevel.level === lvl.level;
            return (
              <div 
                key={lvl.level}
                onClick={onOpenRoadmap}
                className={`text-center py-1 rounded-lg border transition-all cursor-pointer ${
                  isCurrent
                    ? (isLight ? 'bg-teal-100 border-teal-400 text-teal-950 font-black shadow-xs' : 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold shadow-xs')
                    : isCompleted
                    ? (isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300/80 font-medium')
                    : (isLight ? 'bg-slate-100 border-slate-300 text-slate-800 font-bold hover:border-slate-400' : 'bg-white/[0.02] border-white/5 text-white/30 hover:border-white/15')
                }`}
                title={`Level ${lvl.level} — ${lvl.name} (${lvl.description})`}
              >
                <span className="block font-mono leading-tight font-bold">Lv.{lvl.level}</span>
                <span className="hidden sm:inline-block text-[9px] tracking-tight truncate max-w-full font-bold">
                  {lvl.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

