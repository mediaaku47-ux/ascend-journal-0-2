import React, { useState } from 'react';
import { Habit, UserProfile, Task } from '../../types';
import { HabitTrackerCard } from '../HabitTrackerCard';
import { AddHabitModal } from '../AddHabitModal';
import { TrendingUp, Plus } from 'lucide-react';

interface HabitsViewProps {
  habits: Habit[];
  tasks?: Task[];
  userProfile: UserProfile;
  streakDays: number;
  onUpdateHabits: (habits: Habit[]) => void;
  onUpdateStreak: (streak: number) => void;
  onOpenNewEntry: () => void;
  onAddHabit?: (habit: Habit) => void;
  theme?: 'dark' | 'light';
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  tasks = [],
  userProfile,
  streakDays,
  onUpdateHabits,
  onUpdateStreak,
  onOpenNewEntry,
  onAddHabit,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);

  const handleHabitCreated = (newHabit: Habit) => {
    if (onAddHabit) {
      onAddHabit(newHabit);
    } else {
      onUpdateHabits([...habits, newHabit]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${
            isLight ? 'text-slate-950' : 'text-white'
          }`}>
            <TrendingUp className="w-6 h-6 text-teal-500" />
            <span>Pelacak Kebiasaan & Rutinitas</span>
          </h2>
        </div>

        <button
          onClick={() => setIsAddHabitModalOpen(true)}
          className={`${
            isLight 
              ? 'bg-[#003B2F] hover:bg-[#002e24]' 
              : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-700 hover:to-emerald-700'
          } text-white text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-teal-500/20 hover:shadow-lg transition-all cursor-pointer tracking-wider uppercase`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Kebiasaan</span>
        </button>
      </div>

      {/* Main Habit Checklist & Progression Card */}
      <HabitTrackerCard
        habits={habits}
        streakDays={streakDays}
        onUpdateHabits={onUpdateHabits}
        onUpdateStreak={onUpdateStreak}
        onOpenNewHabitModal={() => setIsAddHabitModalOpen(true)}
        theme={theme}
      />

      {/* Modal Khusus Tambah Kebiasaan */}
      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => setIsAddHabitModalOpen(false)}
        onAddHabit={handleHabitCreated}
        theme={theme}
      />
    </div>
  );
};

