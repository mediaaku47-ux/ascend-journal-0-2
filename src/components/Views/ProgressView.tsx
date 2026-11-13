import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Task, 
  Habit, 
  UserProfile, 
  TargetItem, 
  Transaction 
} from '../../types';
import { UserLevelProgress } from '../../utils/levelUtils';
import { LevelProgressHeader } from '../LevelProgressHeader';
import { TrackingStatsCard } from '../TrackingStatsCard';
import { FinancialEvaluationSummary } from '../FinancialEvaluationSummary';
import { 
  TrendingUp
} from 'lucide-react';

interface ProgressViewProps {
  tasks: Task[];
  habits: Habit[];
  userProfile: UserProfile;
  targets: TargetItem[];
  levelProgress: UserLevelProgress;
  totalBalance: number;
  savingsBalance?: number;
  incomeToday: number;
  expenseToday: number;
  currencySymbol?: string;
  transactions?: Transaction[];
  onUpdateHabits: (habits: Habit[]) => void;
  onUpdateStreak: (streak: number) => void;
  onToggleTarget: (id: string) => void;
  onUpdateTargetCount: (id: string, newCount: number) => void;
  onAddTarget: (newTarget: Omit<TargetItem, 'id' | 'createdAt'>) => void;
  onDeleteTarget: (id: string) => void;
  onOpenRoadmap: () => void;
  onOpenNewEntry: () => void;
  onExportPDF: () => void;
  onNavigateToTargets: () => void;
  theme?: 'dark' | 'light';
}

// Animated Score Counter with smooth numeric ease-out interpolation
const AnimatedScore: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    prevValueRef.current = value;
    if (startValue === value) return;

    let startTimestamp: number | null = null;
    const duration = 650; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      const current = Math.round(startValue + (value - startValue) * ease);
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value]);

  return <span>{displayValue}%</span>;
};

export const ProgressView: React.FC<ProgressViewProps> = ({
  tasks,
  habits,
  userProfile,
  targets,
  levelProgress,
  totalBalance,
  savingsBalance = 0,
  incomeToday,
  expenseToday,
  currencySymbol = 'Rp',
  transactions = [],
  onUpdateHabits,
  onUpdateStreak,
  onToggleTarget,
  onUpdateTargetCount,
  onAddTarget,
  onDeleteTarget,
  onOpenRoadmap,
  onOpenNewEntry,
  onExportPDF,
  onNavigateToTargets,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Compute overall productivity indices
  const todayDay = userProfile.selectedDay || new Date().getDate();
  const tasksToday = tasks.filter((t) => t.days[todayDay] === 'done').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((tasksToday / totalTasks) * 100) : 0;

  const completedHabitsToday = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;
  const habitCompletionRate = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;

  const completedTargets = targets.filter((t) => t.completed).length;
  const totalTargetsCount = targets.length;
  const targetCompletionRate = totalTargetsCount > 0 ? Math.round((completedTargets / totalTargetsCount) * 100) : 0;

  // Composite Growth Score (0 - 100)
  const growthScore = Math.round(
    (taskCompletionRate * 0.4) + (habitCompletionRate * 0.4) + (targetCompletionRate * 0.2)
  );

  return (
    <div className="space-y-6 pb-32 md:pb-14">
      {/* Header Banner Perkembangan */}
      <div 
        style={isLight ? {
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        } : undefined}
        className={`p-6 sm:p-7 rounded-[28px] relative overflow-hidden border ${
          isLight
            ? 'bg-white border-[1.5px] border-teal-400 text-slate-950 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]'
            : 'bg-[#111827] border border-[#263449] text-white shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Sisi Kiri: Nama Judul Fitur */}
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isLight 
                  ? 'bg-teal-100 border-teal-300 text-teal-950 font-black' 
                  : 'bg-teal-500/20 border-teal-500/40 text-teal-300'
              }`}>
                <TrendingUp className={`w-3.5 h-3.5 ${isLight ? 'text-teal-800' : 'text-teal-400'}`} />
                <span>Fitur Perkembangan</span>
              </span>
            </div>
            
            {/* Judul Fitur: Analisis Pertumbuhan Diri */}
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Analisis Pertumbuhan Diri
            </h2>
          </div>

          {/* Sisi Kanan: Kartu Skor dengan Animasi Transisi Halus (framer-motion) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
            className={`p-4 sm:p-5 rounded-2xl border min-w-[220px] sm:min-w-[260px] relative overflow-hidden transition-colors duration-300 shrink-0 ${
              isLight
                ? 'bg-gradient-to-br from-teal-50 to-white border-teal-300 shadow-sm'
                : 'bg-[#111827] border border-[#263449] text-white shadow-md'
            }`}
          >

            {/* Efek Kilau/Pulse Halus saat Data Skor Diperbarui */}
            <motion.div
              key={`pulse-${growthScore}`}
              initial={{ opacity: 0.6, scale: 0.8 }}
              animate={{ opacity: 0, scale: 1.45 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-teal-400/25 blur-xl z-0"
              aria-hidden="true"
            />

            <div className={`flex items-center justify-between text-xs font-bold mb-1.5 relative z-10 ${
              isLight ? 'text-teal-950 font-black' : 'text-teal-300'
            }`}>
              <span className="uppercase tracking-wider font-black">Kartu Skor</span>
            </div>

            <div className="flex items-baseline gap-2 relative z-10">
              <motion.div 
                key={`num-${growthScore}`}
                initial={{ scale: 1.08, y: -2 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  isLight ? 'text-teal-950' : 'text-white'
                }`}
              >
                <AnimatedScore value={growthScore} />
              </motion.div>
              <span className={`text-xs font-bold ${
                isLight ? 'text-teal-900 font-bold' : 'text-teal-300/80'
              }`}>
                Indeks Pertumbuhan
              </span>
            </div>

            {/* Bar Progres Animasi Halus */}
            <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 relative ${
              isLight ? 'bg-teal-100' : 'bg-white/10'
            }`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, growthScore))}%` }}
                transition={{ type: 'spring', damping: 24, stiffness: 140 }}
                className="h-full rounded-full bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-400"
              />
            </div>

            <p className={`text-[11px] font-semibold mt-1.5 relative z-10 ${
              isLight ? 'text-slate-700' : 'text-white/50'
            }`}>
              Skor akumulasi harian Anda.
            </p>
          </motion.div>
        </div>
      </div>

      {/* 1. Visual Level Progression Header (Level 1-5 & XP) */}
      <LevelProgressHeader
        levelProgress={levelProgress}
        onOpenRoadmap={onOpenRoadmap}
        theme={theme}
      />

      {/* 2. Statistical Tracking & Trend Chart Card */}
      <TrackingStatsCard
        tasks={tasks}
        habits={habits}
        userProfile={userProfile}
        levelProgress={levelProgress}
        onOpenNewEntry={onOpenNewEntry}
        onExportPDF={onExportPDF}
        onOpenRoadmap={onOpenRoadmap}
        theme={theme}
      />

      {/* 3. Evaluasi & Ringkasan Finansial Terpadu */}
      <FinancialEvaluationSummary
        transactions={transactions}
        totalBalance={totalBalance}
        savingsBalance={savingsBalance}
        incomeToday={incomeToday}
        expenseToday={expenseToday}
        currencySymbol={currencySymbol}
        userName={userProfile.name}
        theme={theme}
      />
    </div>
  );
};
