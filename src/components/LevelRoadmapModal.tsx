import React from 'react';
import { 
  X, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Compass, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  Crown,
  Check,
  Target
} from 'lucide-react';
import { LEVELS, UserLevelProgress } from '../utils/levelUtils';

interface LevelRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelProgress: UserLevelProgress;
  theme?: 'dark' | 'light';
}

export const LevelRoadmapModal: React.FC<LevelRoadmapModalProps> = ({
  isOpen,
  onClose,
  levelProgress,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  if (!isOpen) return null;

  const { 
    currentLevel, 
    nextLevel, 
    totalPoints, 
    overallProgressPercent,
    tasksPoints, 
    habitsPoints, 
    streakPoints, 
    targetsPoints,
    doneTasksCount, 
    doneHabitsCount,
    completedTargetsCount 
  } = levelProgress;

  const getLevelIcon = (iconType: string, isCurrent: boolean) => {
    const iconClass = `w-5 h-5 ${isCurrent ? 'text-white' : 'text-white/70'}`;
    switch (iconType) {
      case 'compass':
        return <Compass className={iconClass} />;
      case 'flame':
        return <Flame className={iconClass} />;
      case 'shield':
        return <ShieldCheck className={iconClass} />;
      case 'trending-up':
        return <TrendingUp className={iconClass} />;
      case 'crown':
        return <Crown className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-2xl ${
          isLight
            ? 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-[#111827] border border-[#263449] text-white shadow-2xl'
        } rounded-3xl p-6 sm:p-7 overflow-hidden max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background ambient lighting */}
        <div 
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: currentLevel.accentColor }}
        />

        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'} shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${isLight ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-sky-500/20 border-sky-500/30 text-sky-400'} border flex items-center justify-center`}>
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-950' : 'text-white'} tracking-tight flex items-center gap-2`}>
                <span>Roadmap Level Perkembangan</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${isLight ? 'bg-teal-100 text-teal-900 border-teal-300' : 'bg-sky-500/20 text-sky-300 border-sky-500/30'} border font-mono`}>
                  Level 1–5
                </span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/60'} mt-0.5`}>
                Kenaikan level berdasarkan penyelesaian tugas &amp; kebiasaan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup peta level pencapaian"
            className={`p-2 rounded-xl ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'} transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-6 py-4 pr-1 scrollbar-thin scrollbar-thumb-white/10">
          {/* Current Status Highlights */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                  Status Level Saat Ini
                </span>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-base font-bold px-3 py-1 rounded-xl border ${currentLevel.badgeBg} ${currentLevel.badgeBorder} ${currentLevel.badgeText}`}>
                    {currentLevel.title}
                  </span>
                  <span className="font-mono text-sm font-bold text-white bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                    {totalPoints} Poin
                  </span>
                  <span className="font-mono text-sm font-bold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/20">
                    {levelProgress.effectiveConsistency}% Konsistensi
                  </span>
                </div>
              </div>

              {nextLevel ? (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 max-w-xs">
                  <span className="text-[11px] text-sky-300 font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Target Naik ke {nextLevel.title}</span>
                  </span>
                  <p className="text-xs text-white/80 mt-1 leading-snug">
                    {levelProgress.requirementReason}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 max-w-xs">
                  <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Puncak Keunggulan</span>
                  </span>
                  <p className="text-xs text-white/80 mt-1">
                    Anda telah mencapai level tertinggi! Pertahankan konsistensi harian Anda.
                  </p>
                </div>
              )}
            </div>

            {/* Overall Journey Bar */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-white/70">Perjalanan Level Keseluruhan (1–5)</span>
                <span className="font-mono font-bold text-sky-300">{overallProgressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div 
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${currentLevel.gradient}`}
                  style={{ width: `${Math.max(10, overallProgressPercent)}%` }}
                />
              </div>
            </div>

            {/* Poin breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-white/50 block">Poin Agenda Tuntas</span>
                <span className="text-xs font-mono font-bold text-sky-300">
                  +{tasksPoints} pts <span className="text-[10px] text-white/40">({doneTasksCount})</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-white/50 block">Poin Kebiasaan</span>
                <span className="text-xs font-mono font-bold text-teal-300">
                  +{habitsPoints} pts <span className="text-[10px] text-white/40">({doneHabitsCount})</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-white/50 block">Bonus Momentum</span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  +{streakPoints} pts
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-white/50 block">Target Tercapai</span>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  +{targetsPoints} pts <span className="text-[10px] text-white/40">({completedTargetsCount})</span>
                </span>
              </div>
            </div>
          </div>

          {/* 5 Levels Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Daftar Tingkatan Level (Level 1–5)</span>
            </h4>

            <div className="space-y-3">
              {LEVELS.map((lvl) => {
                const isCurrent = currentLevel.level === lvl.level;
                const isPassed = currentLevel.level > lvl.level;
                const isLocked = currentLevel.level < lvl.level;

                return (
                  <div
                    key={lvl.level}
                    className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                      isCurrent
                        ? 'bg-white/[0.07] border-sky-400 shadow-md shadow-sky-500/10'
                        : isPassed
                        ? 'bg-white/[0.02] border-emerald-500/30 opacity-80'
                        : 'bg-white/[0.01] border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                      <div className="flex items-center space-x-3">
                        {/* Level Icon */}
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{ 
                            backgroundColor: `${lvl.accentColor}25`,
                            borderColor: `${lvl.accentColor}50` 
                          }}
                        >
                          {getLevelIcon(lvl.iconType, isCurrent)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {lvl.title}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white shadow-xs">
                                LEVEL SAAT INI ✨
                              </span>
                            )}
                            {isPassed && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>Tercapai</span>
                              </span>
                            )}
                            {isLocked && (
                              <span className="text-[10px] text-white/40 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Terkunci</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-white/50 block">
                            Syarat: Konsistensi ≥{lvl.minConsistency}% • Min. {lvl.minDoneTasks} tugas • {lvl.minPoints}{lvl.maxPoints < 999999 ? ` - ${lvl.maxPoints} poin` : '+ poin'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-white/70 font-medium">
                          {lvl.description}
                        </span>
                      </div>
                    </div>

                    {/* Perks list */}
                    <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-1.5">
                      {lvl.perks.map((perk, pIdx) => (
                        <span 
                          key={pIdx}
                          className="text-[10px] text-white/60 bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-sky-400" />
                          <span>{perk}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'} flex justify-end shrink-0`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl ${
              isLight 
                ? 'bg-[#003B2F] hover:bg-[#002e24]' 
                : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600'
            } text-white text-xs font-semibold shadow-md cursor-pointer transition-all`}
          >
            Tutup Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};
