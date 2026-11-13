import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Minus,
  Calendar, 
  CalendarRange, 
  CalendarDays, 
  Check, 
  Trash2, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { TargetItem, TargetPeriod } from '../../types';
import { TargetIllustration } from '../TargetIllustration';

interface TargetsViewProps {
  targets: TargetItem[];
  onToggleTarget: (id: string) => void;
  onUpdateTargetCount: (id: string, newCount: number) => void;
  onAddTarget: (newTarget: Omit<TargetItem, 'id' | 'createdAt'>) => void;
  onDeleteTarget: (id: string) => void;
  onOpenRoadmap: () => void;
  theme?: 'dark' | 'light';
}

export const TargetsView: React.FC<TargetsViewProps> = ({
  targets,
  onToggleTarget,
  onUpdateTargetCount,
  onAddTarget,
  onDeleteTarget,
  onOpenRoadmap,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [filterPeriod, setFilterPeriod] = useState<TargetPeriod | 'all'>('daily');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCountVal, setEditCountVal] = useState<number>(0);

  // New Target Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState<TargetPeriod>('daily');
  const [newTargetCount, setNewTargetCount] = useState(1);
  const [newCurrentCount, setNewCurrentCount] = useState(0);
  const [newUnit, setNewUnit] = useState('tugas');
  const [newCategory, setNewCategory] = useState('Produktif');

  const filteredTargets = filterPeriod === 'all' 
    ? targets 
    : targets.filter((t) => t.period === filterPeriod);

  const dailyTargets = targets.filter((t) => t.period === 'daily');
  const monthlyTargets = targets.filter((t) => t.period === 'monthly');
  const weeklyTargets = targets.filter((t) => t.period === 'weekly');

  const dailyDone = dailyTargets.filter((t) => t.completed || t.currentCount >= t.targetCount).length;
  const monthlyDone = monthlyTargets.filter((t) => t.completed || t.currentCount >= t.targetCount).length;
  const weeklyDone = weeklyTargets.filter((t) => t.completed || t.currentCount >= t.targetCount).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTarget({
      title: newTitle.trim(),
      period: newPeriod,
      targetCount: Math.max(1, newTargetCount),
      currentCount: Math.max(0, newCurrentCount),
      unit: newUnit.trim() || 'tugas',
      category: newCategory,
      completed: newCurrentCount >= newTargetCount,
      isManual: true,
      autoTrack: 'custom',
    });

    setNewTitle('');
    setNewTargetCount(1);
    setNewCurrentCount(0);
    setIsAdding(false);
  };

  const handleStartEditCount = (target: TargetItem) => {
    setEditingId(target.id);
    setEditCountVal(target.currentCount);
  };

  const handleSaveEditCount = (id: string) => {
    onUpdateTargetCount(id, editCountVal);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${
            isLight ? 'text-slate-950' : 'text-white'
          }`}>
            <Target className={`w-6 h-6 ${isLight ? 'text-teal-600' : 'text-sky-400'}`} />
            <span>Target & Gol Produktivitas</span>
          </h2>
          <p className={`text-sm mt-0.5 font-medium ${
            isLight ? 'text-slate-600' : 'text-white/60'
          }`}>
            Kelola target harian dan bulanan.
          </p>
        </div>
      </div>

      {/* Summary Highlights: Focus on Harian & Bulanan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Target Harian */}
        <div 
          style={!isLight ? undefined : undefined}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            isLight
              ? filterPeriod === 'daily'
                ? 'bg-sky-50 border-[2px] border-sky-400 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] text-slate-950'
                : 'bg-white border-slate-200 hover:border-sky-300 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-slate-950'
              : filterPeriod === 'daily' 
              ? 'bg-[#111827] border border-sky-400/80 shadow-md text-white' 
              : 'bg-[#111827] border border-[#263449] hover:border-sky-400/40 text-white shadow-sm'
          }`}
        >
          {!isLight && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-sky-500/20 via-sky-500/5 to-transparent rounded-b-2xl z-0" />
          )}
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-sky-100 text-sky-800' : 'bg-sky-500/20 text-sky-400'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${
              isLight ? 'bg-sky-100 text-sky-900 border border-sky-200' : 'text-sky-300 bg-sky-500/10'
            }`}>
              {dailyTargets.length > 0 ? Math.round((dailyDone / dailyTargets.length) * 100) : 0}%
            </span>
          </div>
          <h4 className={`text-sm font-black relative z-10 ${isLight ? 'text-slate-950' : 'text-white'}`}>Target Harian</h4>
          <p className={`text-xs mt-0.5 relative z-10 font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
            {dailyDone} dari {dailyTargets.length} target hari ini tercapai
          </p>
          <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden relative z-10 ${
            isLight ? 'bg-slate-200' : 'bg-white/10'
          }`}>
            <div 
              className="h-full bg-sky-500 rounded-full transition-all duration-300"
              style={{ width: `${dailyTargets.length > 0 ? (dailyDone / dailyTargets.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 2: Target Bulanan */}
        <div 
          style={!isLight ? undefined : undefined}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            isLight
              ? filterPeriod === 'monthly'
                ? 'bg-teal-50 border-[2px] border-teal-400 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] text-slate-950'
                : 'bg-white border-slate-200 hover:border-teal-300 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-slate-950'
              : filterPeriod === 'monthly' 
              ? 'bg-[#111827] border border-teal-400/80 shadow-md text-white' 
              : 'bg-[#111827] border border-[#263449] hover:border-teal-400/40 text-white shadow-sm'
          }`}
        >
          {!isLight && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#2DD4BF]/20 via-[#2DD4BF]/5 to-transparent rounded-b-2xl z-0" />
          )}
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-teal-100 text-teal-800' : 'bg-teal-500/20 text-teal-400'
            }`}>
              <CalendarRange className="w-4 h-4" />
            </div>
            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${
              isLight ? 'bg-teal-100 text-teal-900 border border-teal-200' : 'text-teal-300 bg-teal-500/10'
            }`}>
              {monthlyTargets.length > 0 ? Math.round((monthlyDone / monthlyTargets.length) * 100) : 0}%
            </span>
          </div>
          <h4 className={`text-sm font-black relative z-10 ${isLight ? 'text-slate-950' : 'text-white'}`}>Target Bulanan</h4>
          <p className={`text-xs mt-0.5 relative z-10 font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
            {monthlyDone} dari {monthlyTargets.length} target bulan ini tercapai
          </p>
          <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden relative z-10 ${
            isLight ? 'bg-slate-200' : 'bg-white/10'
          }`}>
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${monthlyTargets.length > 0 ? (monthlyDone / monthlyTargets.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 3: Target Mingguan */}
        <div 
          onClick={() => setFilterPeriod('weekly')}
          style={!isLight ? undefined : undefined}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            isLight
              ? filterPeriod === 'weekly'
                ? 'bg-indigo-50 border-[2px] border-indigo-400 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] text-slate-950'
                : 'bg-white border-slate-200 hover:border-indigo-300 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-slate-950'
              : filterPeriod === 'weekly' 
              ? 'bg-[#111827] border border-indigo-400/80 shadow-md text-white' 
              : 'bg-[#111827] border border-[#263449] hover:border-indigo-400/40 text-white shadow-sm'
          }`}
        >
          {!isLight && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-indigo-500/20 via-indigo-500/5 to-transparent rounded-b-2xl z-0" />
          )}
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-500/20 text-indigo-400'
            }`}>
              <CalendarDays className="w-4 h-4" />
            </div>
            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${
              isLight ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' : 'text-indigo-300 bg-indigo-500/10'
            }`}>
              {weeklyTargets.length > 0 ? Math.round((weeklyDone / weeklyTargets.length) * 100) : 0}%
            </span>
          </div>
          <h4 className={`text-sm font-black relative z-10 ${isLight ? 'text-slate-950' : 'text-white'}`}>Target Mingguan</h4>
          <p className={`text-xs mt-0.5 relative z-10 font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
            {weeklyDone} dari {weeklyTargets.length} target minggu ini tercapai
          </p>
          <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden relative z-10 ${
            isLight ? 'bg-slate-200' : 'bg-white/10'
          }`}>
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${weeklyTargets.length > 0 ? (weeklyDone / weeklyTargets.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Target Items List */}
      <div className="space-y-3.5">
        {filteredTargets.length === 0 ? (
          <div className={`p-8 text-center rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all ${
            isLight ? 'text-slate-600 bg-slate-50/80 border-slate-200' : 'text-white/60 bg-white/[0.02] border-white/10'
          }`}>
            <TargetIllustration
              theme={theme}
              className="w-28 h-28 sm:w-32 sm:h-32"
            />
            <div className="max-w-md space-y-1">
              <h4 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Belum Ada Target di Kategori Ini
              </h4>
              <p className="text-xs font-medium">
                Buat target baru untuk mulai melacak pencapaian dan progres harian Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className={`px-5 py-2.5 rounded-xl ${
                isLight 
                  ? 'bg-[#003B2F] hover:bg-[#002e24]' 
                  : 'bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500'
              } text-white text-xs font-black flex items-center gap-2 shadow-md shadow-teal-500/25 active:scale-95 transition-all cursor-pointer`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Target Baru</span>
            </button>
          </div>
        ) : (
          filteredTargets.map((target) => {
            const isReached = target.currentCount >= target.targetCount;
            const percent = Math.min(100, Math.round((target.currentCount / target.targetCount) * 100));

            return (
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden ${
                  target.completed
                    ? isLight
                      ? 'bg-emerald-50/90 border-emerald-300/80 text-slate-950 shadow-sm'
                      : 'bg-[#0F1E1B] border-emerald-500/40 text-white shadow-xl'
                    : isReached
                    ? isLight
                      ? 'bg-amber-50/90 border-amber-300/80 ring-1 ring-amber-300/50 text-slate-950 shadow-sm'
                      : 'bg-[#1E1911] border-amber-400/40 text-white shadow-xl'
                    : isLight
                    ? 'bg-white border-slate-200/90 hover:border-teal-400 text-slate-950 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-md'
                    : 'bg-[#0F172A] border-slate-800 hover:border-teal-500/40 text-white shadow-xl hover:shadow-2xl'
                }`}
              >
                {/* Header Row: Checkbox Centang, Title, Period, Category & Delete */}
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Tombol Centang Target */}
                    <button
                      type="button"
                      onClick={() => onToggleTarget(target.id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 shadow-xs active:scale-95 ${
                        target.completed
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/30'
                          : isReached
                          ? isLight
                            ? 'bg-amber-100 hover:bg-emerald-100 border border-amber-400 text-amber-800'
                            : 'bg-amber-500/20 hover:bg-emerald-500/30 border border-amber-400 text-amber-300 animate-pulse'
                          : isLight
                          ? 'bg-white hover:bg-teal-50 border border-slate-300 hover:border-teal-400 text-transparent hover:text-teal-600'
                          : 'bg-white/10 hover:bg-sky-500/20 border border-white/20 hover:border-sky-400 text-transparent hover:text-sky-300'
                      }`}
                      title={target.completed ? "Batalkan centang target ini" : "Centang target ini"}
                    >
                      <Check className={`w-4 h-4 stroke-[3] ${target.completed ? 'text-white' : ''}`} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm sm:text-base font-black ${
                          target.completed 
                            ? isLight ? 'text-slate-400 line-through' : 'text-white/50 line-through' 
                            : isLight ? 'text-slate-950' : 'text-white'
                        }`}>
                          {target.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-white/5 border-white/10 text-white/70'
                        }`}>
                          {target.period === 'daily' ? 'Harian' : target.period === 'monthly' ? 'Bulanan' : 'Mingguan'}
                        </span>
                        {target.category && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isLight
                              ? 'bg-sky-100 border-sky-200 text-sky-800'
                              : 'bg-sky-500/10 border-sky-500/20 text-sky-300'
                          }`}>
                            {target.category}
                          </span>
                        )}
                        {target.completed && (
                          <span className={`text-xs font-black ml-1 ${
                            isLight ? 'text-emerald-700' : 'text-emerald-400'
                          }`}>
                            Tercapai ✓
                          </span>
                        )}
                      </div>

                      {/* Progress indicator bar */}
                      <div className={`w-full h-2 rounded-full overflow-hidden mt-2.5 ${
                        isLight ? 'bg-slate-200' : 'bg-white/10'
                      }`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            target.completed 
                              ? 'bg-emerald-500' 
                              : isReached 
                              ? 'bg-amber-500' 
                              : 'bg-gradient-to-r from-indigo-500 to-sky-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTarget(target.id)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                      isLight
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-white/30 hover:text-rose-400 hover:bg-white/5'
                    }`}
                    title="Hapus Target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Footer Controls: Manual Counter & The Target Reached Action Button */}
                <div className={`flex flex-wrap items-center justify-between gap-3 pt-2 border-t relative z-10 ${
                  isLight ? 'border-slate-100' : 'border-slate-800'
                }`}>
                  {/* Manual Progress Editor */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#131D31] border-slate-700/70'
                  }`}>
                    <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Progres Manual:</span>
                    <button
                      type="button"
                      onClick={() => onUpdateTargetCount(target.id, target.currentCount - 1)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 ${
                        isLight
                          ? 'bg-white hover:bg-slate-200 text-slate-800 shadow-xs'
                          : 'bg-[#1C283F] hover:bg-[#253554] text-slate-200'
                      }`}
                      disabled={target.currentCount <= 0}
                      title="Kurangi 1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    {editingId === target.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={editCountVal}
                          onChange={(e) => setEditCountVal(Number(e.target.value))}
                          className={`w-14 text-center text-xs font-mono font-bold rounded border outline-hidden py-0.5 ${
                            isLight
                              ? 'bg-white text-slate-900 border-teal-500'
                              : 'bg-[#12121a] text-sky-300 border-sky-400'
                          }`}
                          autoFocus
                          onBlur={() => handleSaveEditCount(target.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditCount(target.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEditCount(target)}
                        className={`px-2 py-0.5 text-xs font-mono font-black rounded transition-colors cursor-pointer ${
                          isLight
                            ? 'text-slate-950 hover:text-teal-700 hover:bg-white'
                            : 'text-white hover:text-sky-300 hover:bg-white/10'
                        }`}
                        title="Klik untuk ubah angka secara manual"
                      >
                        {target.currentCount}
                      </button>
                    )}

                    <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>/ {target.targetCount}</span>
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-white/40'}`}>{target.unit}</span>

                    <button
                      type="button"
                      onClick={() => onUpdateTargetCount(target.id, target.currentCount + 1)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-slate-200 text-slate-800 shadow-xs'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      title="Tambah 1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-[11px] font-mono font-bold ml-1 ${
                      isLight ? 'text-teal-800' : 'text-sky-300/80'
                    }`}>({percent}%)</span>
                  </div>

                  {/* THE HERO BUTTON: "kalau target tercapai maka bisa di tekna tombolnya" */}
                  <div className="flex items-center gap-2">
                    {target.completed ? (
                      /* Status Selesai */
                      <button
                        onClick={() => onToggleTarget(target.id)}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                          isLight
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                        title="Target sudah tercapai. Klik jika ingin membatalkan status selesai"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Target Selesai & Tercapai ✓</span>
                      </button>
                    ) : isReached ? (
                      /* TARGET TERKAPAI: Tombol Aktif & Bisa Ditekan! */
                      <button
                        onClick={() => onToggleTarget(target.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-600 hover:via-emerald-600 hover:to-teal-600 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/30 animate-pulse active:scale-95 transition-all cursor-pointer"
                        title="Target tercapai! Tekan tombol ini sekarang"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Target Tercapai! Tekan di Sini ✨</span>
                      </button>
                    ) : (
                      /* Belum Tercapai */
                      <div className="flex items-center gap-2">
                        <span className={`text-xs hidden sm:inline font-semibold ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                          (Kurang {target.targetCount - target.currentCount} {target.unit})
                        </span>
                        <button
                          onClick={() => onToggleTarget(target.id)}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isLight
                              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-950 shadow-xs'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
                          }`}
                          title="Tandai langsung sebagai selesai"
                        >
                          <Check className={`w-3.5 h-3.5 ${isLight ? 'text-slate-600' : 'text-white/40'}`} />
                          <span>Tandai Selesai</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {filteredTargets.length > 0 && (
          <div className="pt-2 flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isLight
                  ? 'bg-white hover:bg-teal-50/60 border-slate-300 hover:border-teal-400 text-slate-800'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-teal-500/40 text-white'
              }`}
            >
              <Plus className="w-4 h-4 text-teal-400 stroke-[2.5]" />
              <span>Tambah Target Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Target Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <form onSubmit={handleSubmit} className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-950'
              : 'bg-[#0e0e14] border-white/15 text-white'
          }`}>
            <h3 className={`text-base font-black flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
              <Plus className={`w-5 h-5 ${isLight ? 'text-teal-600' : 'text-sky-400'}`} />
              <span>Tambah Target Baru</span>
            </h3>

            <div>
              <label className={`text-xs block mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Nama Target:</label>
              <input
                type="text"
                placeholder="cth: Selesaikan 4 tugas utama / Baca 30 menit..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-xl outline-hidden transition-all font-semibold border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500'
                    : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-sky-400'
                }`}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs block mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Kategori Periode:</label>
                <select
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value as TargetPeriod)}
                  className={`w-full text-xs p-2.5 rounded-xl outline-hidden border font-semibold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-teal-500'
                      : 'bg-[#1a1a24] border-white/15 text-white focus:border-sky-400'
                  }`}
                >
                  <option value="daily">Harian</option>
                  <option value="monthly">Bulanan</option>
                  <option value="weekly">Mingguan</option>
                </select>
              </div>

              <div>
                <label className={`text-xs block mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Kategori Topik:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl outline-hidden border font-semibold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-teal-500'
                      : 'bg-[#1a1a24] border-white/15 text-white focus:border-sky-400'
                  }`}
                >
                  <option value="Produktif">Produktif</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Konsistensi">Konsistensi</option>
                  <option value="Pengembangan">Pengembangan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`text-xs block mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Target Angka:</label>
                <input
                  type="number"
                  min="1"
                  value={newTargetCount}
                  onChange={(e) => setNewTargetCount(Number(e.target.value))}
                  className={`w-full text-xs p-2.5 rounded-xl outline-hidden border font-semibold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-teal-500'
                      : 'bg-[#1a1a24] border-white/15 text-white focus:border-sky-400'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs block mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Isi Progres Awal:</label>
                <input
                  type="number"
                  min="0"
                  value={newCurrentCount}
                  onChange={(e) => setNewCurrentCount(Number(e.target.value))}
                  className={`w-full text-xs p-2.5 rounded-xl outline-hidden border font-semibold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-teal-500'
                      : 'bg-[#1a1a24] border-white/15 text-white focus:border-sky-400'
                  }`}
                  placeholder="0"
                />
              </div>

              <div>
                <label className={`text-xs block mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>Satuan:</label>
                <input
                  type="text"
                  placeholder="tugas, kali, jam"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl outline-hidden border font-semibold ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-teal-500'
                      : 'bg-[#1a1a24] border-white/15 text-white focus:border-sky-400'
                  }`}
                />
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className={`text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/60 hover:text-white'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                className={`text-xs px-5 py-2.5 ${
                  isLight 
                    ? 'bg-[#003B2F] hover:bg-[#002e24]' 
                    : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600'
                } text-white rounded-xl font-bold shadow-md transition-all cursor-pointer`}
              >
                Simpan Target
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
