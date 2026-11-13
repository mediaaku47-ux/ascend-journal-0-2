import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Check, 
  X, 
  Flag, 
  Plus, 
  Trash2,
  Calendar,
  CheckSquare,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Task, TaskDayStatus } from '../types';
import { getDayInfo } from '../utils/dateUtils';
import { triggerConfetti } from '../utils/confetti';

interface AgendaTableProps {
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void | Promise<void>;
  monthName: string;
  monthIndex?: number;
  year?: number;
  totalDaysInMonth?: number;
  onShowToast?: (msg: string) => void;
  theme?: 'dark' | 'light';
}

export const AgendaTable: React.FC<AgendaTableProps> = ({
  tasks,
  onUpdateTasks,
  monthName,
  monthIndex = 2,
  year = 2026,
  totalDaysInMonth = 31,
  onShowToast,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const today = new Date();
  const isCurrentMonthActive = today.getFullYear() === year && today.getMonth() === monthIndex;
  const currentRealDay = today.getDate();

  // Active day for daily checklist mode (defaults to current real day if viewing current month, or day 1)
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    if (isCurrentMonthActive) {
      return Math.min(Math.max(1, currentRealDay), totalDaysInMonth);
    }
    return 1;
  });

  // Mode: 'daily' (optimized for mobile touch) vs 'matrix' (full 31-day spreadsheet)
  // Default to 'daily' on small screens (< 768px)
  const [viewMode, setViewMode] = useState<'daily' | 'matrix'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'daily' : 'matrix';
    }
    return 'daily';
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskFlagged, setNewTaskFlagged] = useState(false);
  const [activeDayHover, setActiveDayHover] = useState<number | null>(null);

  // Draft/pending checkmarks sebelum tombol "Simpan" diklik
  const [pendingDays, setPendingDays] = useState<Record<string, Record<number, TaskDayStatus>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Generate array [1, 2, ..., totalDaysInMonth]
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  // Cek apakah hari pada agenda sudah tersimpan di database (terkunci & tidak bisa diubah)
  const isDayLocked = (task: Task, day: number): boolean => {
    const saved = task.days?.[day];
    return saved === 'done' || saved === 'missed';
  };

  // Cek apakah hari pada agenda masih berupa draft yang baru dicentang
  const isDayPending = (taskId: string, day: number): boolean => {
    const pending = pendingDays[taskId]?.[day];
    return pending === 'done' || pending === 'missed';
  };

  // Status efektif (prioritaskan status terkunci dari DB, lalu draft pending)
  const getEffectiveDayStatus = (task: Task, day: number): TaskDayStatus => {
    if (isDayLocked(task, day)) {
      return task.days[day];
    }
    const pending = pendingDays[task.id]?.[day];
    return pending ?? null;
  };

  // Hitung total ceklis draft yang menunggu untuk disimpan
  const pendingCount = useMemo(() => {
    let count = 0;
    Object.values(pendingDays).forEach((dayMap) => {
      Object.values(dayMap).forEach((st) => {
        if (st === 'done' || st === 'missed') count++;
      });
    });
    return count;
  }, [pendingDays]);

  const pendingForSelectedDayCount = useMemo(() => {
    let count = 0;
    tasks.forEach((t) => {
      if (!isDayLocked(t, selectedDay) && isDayPending(t.id, selectedDay)) {
        count++;
      }
    });
    return count;
  }, [tasks, pendingDays, selectedDay]);

  const hasUnlockedTasksOnSelectedDay = useMemo(() => {
    return tasks.some((t) => !isDayLocked(t, selectedDay));
  }, [tasks, selectedDay]);

  // Helper update pendingDays secara aman
  const setPendingStatus = (taskId: string, day: number, status: TaskDayStatus) => {
    setSaveError(null);
    setSaveSuccessMsg(null);
    setPendingDays((prev) => {
      const taskMap = { ...(prev[taskId] || {}) };
      if (status === null) {
        delete taskMap[day];
      } else {
        taskMap[day] = status;
      }
      const next = { ...prev };
      if (Object.keys(taskMap).length === 0) {
        delete next[taskId];
      } else {
        next[taskId] = taskMap;
      }
      return next;
    });
  };

  // Toggle task status for a specific day (Hanya untuk hari yang belum terkunci)
  const handleCellClick = (taskId: string, day: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (isDayLocked(task, day)) {
      onShowToast?.('Ceklis ini sudah disimpan ke database dan terkunci.');
      return;
    }

    const currentPending = pendingDays[taskId]?.[day] ?? null;
    if (currentPending === 'done' || currentPending === 'missed') {
      setPendingStatus(taskId, day, null);
    } else {
      setPendingStatus(taskId, day, 'done');
      triggerConfetti({
        particleCount: 18,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#f97316', '#fbbf24', '#10b981'],
      });
    }
  };

  // Toggle status terlewat/tidak dilakukan (silang) — hanya untuk hari yang belum terkunci
  const handleToggleMissed = (taskId: string, day: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (isDayLocked(task, day)) {
      onShowToast?.('Status ini sudah disimpan ke database dan terkunci.');
      return;
    }

    const currentPending = pendingDays[taskId]?.[day] ?? null;
    const nextStatus: TaskDayStatus = currentPending === 'missed' ? null : 'missed';
    setPendingStatus(taskId, day, nextStatus);
  };

  // Handler klik kanan untuk menandai silang langsung di tabel matriks
  const handleCellContextMenu = (e: React.MouseEvent, taskId: string, day: number) => {
    e.preventDefault();
    handleToggleMissed(taskId, day);
  };

  // Mark all unlocked tasks done for selectedDay (masuk ke draft pending)
  const handleMarkAllDoneForDay = (day: number) => {
    const unlockedTasks = tasks.filter((t) => !isDayLocked(t, day));
    if (unlockedTasks.length === 0) {
      onShowToast?.('Semua agenda pada tanggal ini sudah tersimpan & terkunci.');
      return;
    }

    setSaveError(null);
    setSaveSuccessMsg(null);
    setPendingDays((prev) => {
      const next = { ...prev };
      unlockedTasks.forEach((t) => {
        next[t.id] = {
          ...(next[t.id] || {}),
          [day]: 'done',
        };
      });
      return next;
    });
    triggerConfetti({
      particleCount: 30,
      spread: 55,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#f59e0b'],
    });
  };

  // Reset hanya draft pending untuk selectedDay (tidak menyentuh data yang sudah tersimpan)
  const handleResetDay = (day: number) => {
    setPendingDays((prev) => {
      const next: Record<string, Record<number, TaskDayStatus>> = {};
      Object.entries(prev).forEach(([tId, dayMap]) => {
        const copyMap = { ...dayMap };
        delete copyMap[day];
        if (Object.keys(copyMap).length > 0) {
          next[tId] = copyMap;
        }
      });
      return next;
    });
  };

  // Simpan seluruh ceklis pending ke database dan kunci permanen
  const handleSavePending = async () => {
    if (pendingCount === 0 || isSaving) return;

    const updatedTasks = tasks.map((t) => {
      const taskPending = pendingDays[t.id];
      if (!taskPending) return t;

      const mergedDays: Record<number, TaskDayStatus> = { ...t.days };
      Object.entries(taskPending).forEach(([dayKey, status]) => {
        const dayNum = Number(dayKey);
        // Jangan pernah menimpa hari yang sudah terkunci sebelumnya
        if (!isDayLocked(t, dayNum) && (status === 'done' || status === 'missed')) {
          mergedDays[dayNum] = status;
        }
      });

      return {
        ...t,
        days: mergedDays,
      };
    });

    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateTasks(updatedTasks);
      setPendingDays({});
      setSaveSuccessMsg('Berhasil disimpan ke database! Ceklis kini terkunci dan tidak dapat diubah lagi.');
      onShowToast?.('Agenda berhasil disimpan ke database & dikunci!');
      triggerConfetti({
        particleCount: 40,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#10b981', '#14b8a6', '#34d399'],
      });
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 4500);
    } catch (err: any) {
      setSaveError(err?.message || 'Gagal menyimpan ke database. Silakan periksa koneksi lalu coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };


  // Helper to calculate consistency percentage for a task (including pending preview)
  const calculateTaskConsistency = (task: Task): number => {
    let recordedCount = 0;
    let doneCount = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const st = getEffectiveDayStatus(task, d);
      if (st === 'done' || st === 'missed') {
        recordedCount++;
        if (st === 'done') doneCount++;
      }
    }

    if (recordedCount === 0) return 0;
    return Math.round((doneCount / recordedCount) * 100);
  };

  // Helper to get color styling for percentage pill
  const getConsistencyBadgeClass = (percentage: number) => {
    if (percentage >= 90) {
      return 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow-xs';
    }
    if (percentage >= 60) {
      return 'bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold shadow-xs';
    }
    return 'bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold shadow-xs';
  };

  // Add new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      flagged: newTaskFlagged,
      days: {},
      createdAt: new Date().toISOString(),
    };
    setNewTaskTitle('');
    setNewTaskFlagged(false);
    try {
      await onUpdateTasks([...tasks, newTask]);
    } catch {
      onShowToast?.('Gagal menambahkan agenda ke database.');
    }
  };

  // Delete task (dilindungi jika sudah memiliki riwayat ceklis tersimpan di database)
  const handleDeleteTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (target && Object.values(target.days || {}).some((v) => v === 'done' || v === 'missed')) {
      onShowToast?.('Agenda yang sudah memiliki ceklis tersimpan di database terkunci & tidak dapat dihapus.');
      return;
    }
    setPendingDays((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    try {
      await onUpdateTasks(tasks.filter((t) => t.id !== taskId));
    } catch {
      onShowToast?.('Gagal menghapus agenda.');
    }
  };

  // Toggle flag
  const handleToggleFlag = async (taskId: string) => {
    try {
      await onUpdateTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, flagged: !t.flagged } : t))
      );
    } catch {
      onShowToast?.('Gagal memperbarui prioritas agenda.');
    }
  };


  // Info for currently selected day
  const selectedDayInfo = getDayInfo(year, monthIndex, selectedDay);
  const isSelectedDayToday = isCurrentMonthActive && currentRealDay === selectedDay;

  // Selected day statistics
  const dayDoneCount = tasks.filter((t) => getEffectiveDayStatus(t, selectedDay) === 'done').length;
  const dayPercent = tasks.length > 0 ? Math.round((dayDoneCount / tasks.length) * 100) : 0;

  return (
    <div 
      id="agenda-harian-card"
      style={
        isLight
          ? {
              boxShadow: '0 4px 24px -2px rgba(0, 0, 0, 0.06)',
            }
          : undefined
      }
      className={`${
        isLight
          ? 'bg-white border border-slate-200/90 text-slate-900 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06)]'
          : 'bg-[#111827] border border-[#263449] text-white shadow-md'
      } rounded-[28px] p-4 sm:p-5 md:p-6 relative overflow-hidden transition-all duration-300`}
    >
      {/* Inward Glow dari Bawah ke Atas (Cahaya ke Dalam) */}
      <div 
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-44 rounded-b-[28px] z-0 ${
          isLight
            ? 'bg-gradient-to-t from-[#032D22]/12 via-[#032D22]/4 to-transparent'
            : 'bg-gradient-to-t from-[#2DD4BF]/22 via-[#2DD4BF]/6 to-transparent'
        }`} 
      />

      {/* Subtle glowing radial background highlight */}
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-teal-500/10' : 'bg-sky-500/10'}`} />

      {/* Header with View Switcher */}
      <div className={`flex justify-between items-start md:items-center mb-4 border-b pb-4 flex-col sm:flex-row gap-3 relative z-10 ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
              <span>Agenda Harian</span>
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isLight 
                ? 'bg-teal-100 text-teal-800 border-teal-300' 
                : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
            }`}>
              {tasks.length} Agenda
            </span>
          </div>
          <p className={`text-xs font-semibold mt-0.5 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
            <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-sky-400'}`} />
            <span>{monthName} {year}</span>
          </p>
        </div>

        {/* View Mode Toggle & Reset Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Selector: Daily Touch vs 31-Day Matrix */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? isLight ? 'bg-[#003B2F] text-white shadow-xs' : 'bg-teal-600 text-white shadow-xs'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-white/60 hover:text-white'
              }`}
              title="Tampilan Ceklis Harian Mobile (Besar & Mudah Ditekan)"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Ceklis Harian</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? isLight ? 'bg-[#003B2F] text-white shadow-xs' : 'bg-teal-600 text-white shadow-xs'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-white/60 hover:text-white'
              }`}
              title="Tampilan Matriks Tabel 31 Hari Lengkap"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Matriks 31 Hari</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: CEKLIS HARIAN (MOBILE TOUCH-OPTIMIZED - NO OVERLAPPING COLUMNS) */}
      {/* ========================================================================= */}
      {viewMode === 'daily' && (
        <div className="space-y-4 relative z-10">
          {/* Day Navigator Bar */}
          <div className={`p-3 rounded-2xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-white/[0.03] border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))}
                disabled={selectedDay <= 1}
                className={`p-2 rounded-xl border disabled:opacity-20 cursor-pointer transition-all active:scale-95 ${
                  isLight 
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                }`}
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-sm font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {selectedDayInfo.name}, {selectedDay} {monthName}
                  </span>
                  {isSelectedDayToday && (
                    <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                      Hari Ini ✨
                    </span>
                  )}
                </div>
                <div className={`text-[11px] font-semibold mt-0.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                  {dayDoneCount} dari {tasks.length} agenda selesai ({dayPercent}%)
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDay((prev) => Math.min(totalDaysInMonth, prev + 1))}
                disabled={selectedDay >= totalDaysInMonth}
                className={`p-2 rounded-xl border disabled:opacity-20 cursor-pointer transition-all active:scale-95 ${
                  isLight 
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                }`}
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Day Scroller Ribbon */}
            <div className="overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
              <div className="flex items-center gap-1.5 min-w-max">
                {daysArray.map((day) => {
                  const dInfo = getDayInfo(year, monthIndex, day);
                  const isDaySelected = selectedDay === day;
                  const isDayToday = isCurrentMonthActive && currentRealDay === day;
                  const doneInDay = tasks.filter((t) => getEffectiveDayStatus(t, day) === 'done').length;
                  const allDone = tasks.length > 0 && doneInDay === tasks.length;

                  return (
                    <button
                      key={`day-btn-${day}`}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`px-2.5 py-1.5 rounded-xl flex flex-col items-center min-w-[38px] transition-all cursor-pointer ${
                        isDaySelected
                          ? isLight 
                            ? 'bg-[#003B2F] text-white font-bold shadow-md scale-105' 
                            : 'bg-teal-600 text-white font-bold shadow-md scale-105'
                          : isDayToday
                          ? isLight
                            ? 'bg-teal-100 text-teal-900 border border-teal-300 font-bold'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                          : isLight
                          ? 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 font-bold'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-tighter opacity-85 font-semibold">
                        {dInfo.short}
                      </span>
                      <span className="text-xs font-mono font-bold leading-tight">
                        {day}
                      </span>
                      {allDone ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shadow-xs" />
                      ) : doneInDay > 0 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-0.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Progress Bar & Batch Actions */}
            <div className="space-y-1.5 pt-1">
              <div className={`w-full h-2 rounded-full overflow-hidden p-0.5 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 transition-all duration-300 shadow-sm"
                  style={{ width: `${dayPercent}%` }}
                />
              </div>

              <div className={`flex items-center justify-between text-[11px] pt-1 font-semibold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!hasUnlockedTasksOnSelectedDay}
                    onClick={() => handleMarkAllDoneForDay(selectedDay)}
                    className={`${isLight ? 'text-emerald-700 hover:text-emerald-900' : 'text-emerald-400 hover:text-emerald-300'} disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition-colors cursor-pointer`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ceklis Semua Hari Ini</span>
                  </button>
                  {pendingForSelectedDayCount > 0 && (
                    <>
                      <span className={isLight ? 'text-slate-300' : 'text-white/20'}>•</span>
                      <button
                        type="button"
                        onClick={() => handleResetDay(selectedDay)}
                        className={`${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/40 hover:text-white'} transition-colors cursor-pointer`}
                      >
                        Batal Draft
                      </button>
                    </>
                  )}
                </div>

                {isCurrentMonthActive && selectedDay !== currentRealDay && (
                  <button
                    type="button"
                    onClick={() => setSelectedDay(currentRealDay)}
                    className={`${isLight ? 'text-teal-700 hover:text-teal-900' : 'text-sky-400 hover:text-sky-300'} font-bold cursor-pointer`}
                  >
                    Kembali ke Hari Ini
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Input Bar khusus di bagian atas agar mengisi agenda harian sangat mudah & cepat */}
          <form
            onSubmit={handleAddTask}
            className={`flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 sm:p-2.5 rounded-2xl border shadow-sm mb-3 min-w-0 max-w-full overflow-hidden ${
              isLight 
                ? 'bg-slate-50 border-slate-300' 
                : 'bg-white/[0.04] border-sky-500/30'
            }`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isLight ? 'bg-teal-100 text-teal-800' : 'bg-sky-500/20 text-sky-400'
            }`}>
              <Plus className="w-4 h-4" />
            </div>
            <input
              id="quick-add-daily-task"
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={`Tambah agenda tgl ${selectedDay} ${monthName}...`}
              className={`flex-1 min-w-[140px] bg-transparent border-none outline-hidden focus:ring-0 text-xs sm:text-sm py-1 font-semibold ${
                isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-white/40'
              }`}
            />
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setNewTaskFlagged(!newTaskFlagged)}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors text-xs flex items-center gap-1 cursor-pointer border shrink-0 ${
                  newTaskFlagged
                    ? isLight
                      ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
                    : isLight
                    ? 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                }`}
                title="Tandai prioritas penting"
              >
                <Flag className={`w-3.5 h-3.5 ${newTaskFlagged ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="text-[10px] hidden sm:inline">{newTaskFlagged ? 'Prioritas' : ''}</span>
              </button>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className={`text-xs ${
                  isLight ? 'bg-[#003B2F] hover:bg-[#002e24]' : 'bg-teal-600 hover:bg-teal-700'
                } disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all font-bold cursor-pointer shadow-sm shrink-0 active:scale-95 whitespace-nowrap`}
              >
                Tambah
              </button>
            </div>
          </form>

          {/* List of Tasks for Selected Day (Full-width cards with large, accessible checkboxes) */}
          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center text-xs font-semibold ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/[0.02] border-white/5 text-white/40'
              }`}>
                Belum ada agenda bulan ini. Tambahkan tugas agenda baru dengan form di atas!
              </div>
            ) : (
              tasks.map((task) => {
                const locked = isDayLocked(task, selectedDay);
                const pending = !locked && isDayPending(task.id, selectedDay);
                const status = getEffectiveDayStatus(task, selectedDay);
                const isDone = status === 'done';
                const isMissed = status === 'missed';
                const consistency = calculateTaskConsistency(task);
                const hasSavedHistory = Object.values(task.days || {}).some((v) => v === 'done' || v === 'missed');

                return (
                  <div
                    key={`daily-task-${task.id}`}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
                      isDone
                        ? isLight 
                          ? 'bg-emerald-50/90 border-emerald-300 shadow-sm'
                          : 'bg-white/[0.06] border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                        : isMissed
                        ? isLight
                          ? 'bg-rose-50 border-rose-300'
                          : 'bg-rose-500/10 border-rose-500/30'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-teal-500/40'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Left/Top: Task Title & Details */}
                    <div className="min-w-0 w-full sm:flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs sm:text-sm font-bold leading-snug break-words ${
                            isDone 
                              ? isLight ? 'line-through text-slate-500' : 'line-through text-white/60'
                              : isMissed 
                              ? isLight ? 'line-through text-rose-700' : 'line-through text-rose-300/60'
                              : isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                        {locked && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                            isLight ? 'bg-slate-200/80 text-slate-700 border-slate-300' : 'bg-white/10 text-white/80 border-white/15'
                          }`} title="Sudah tersimpan di database dan terkunci">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Terkunci</span>
                          </span>
                        )}
                        {pending && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                            isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/35'
                          }`}>
                            <span>Belum disimpan</span>
                          </span>
                        )}
                        {task.flagged && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                            isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            <Flag className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                            <span>Prioritas</span>
                          </span>
                        )}
                        {task.category && (
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium ${
                            isLight ? 'bg-slate-200/70 text-slate-600' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {task.category}
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center gap-2 mt-1 text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-white/40'}`}>
                        <span className={isDone ? (isLight ? 'text-emerald-800 font-bold' : 'text-emerald-400 font-semibold') : isMissed ? (isLight ? 'text-rose-800 font-bold' : 'text-rose-400 font-medium') : ''}>
                          {isDone
                            ? locked ? 'Selesai • Tersimpan' : 'Selesai (klik Simpan di bawah)'
                            : isMissed
                            ? locked ? 'Melewati • Tersimpan' : 'Melewati (klik Simpan di bawah)'
                            : 'Belum diisi'}
                        </span>
                        <span>•</span>
                        <span className={isLight ? 'text-slate-600' : 'text-white/50'}>
                          Konsistensi: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white/80'}>{consistency}%</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right/Bottom on mobile: Kartu Kecil Selesai & Melewati + Aksi Prioritas & Hapus */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/10 shrink-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Kartu Kecil: Selesai */}
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() => handleCellClick(task.id, selectedDay)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            locked
                              ? isDone
                                ? 'bg-emerald-600 border-emerald-500 text-white cursor-not-allowed opacity-90 shadow-xs'
                                : 'opacity-35 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-white/30'
                              : isDone
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-xs cursor-pointer active:scale-95 ring-2 ring-amber-400/70'
                              : isLight
                                ? 'bg-emerald-50 border-emerald-300/80 text-emerald-700 hover:bg-emerald-100 cursor-pointer active:scale-95'
                                : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 cursor-pointer active:scale-95'
                          }`}
                          title={locked ? 'Sudah tersimpan di database & terkunci' : 'Tandai Selesai (Melakukan)'}
                        >
                          {locked && isDone ? (
                            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                          <span>Selesai</span>
                        </button>

                        {/* Kartu Kecil: Melewati */}
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() => handleToggleMissed(task.id, selectedDay)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            locked
                              ? isMissed
                                ? 'bg-rose-600 border-rose-500 text-white cursor-not-allowed opacity-90 shadow-xs'
                                : 'opacity-35 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-white/30'
                              : isMissed
                              ? 'bg-rose-500 border-rose-400 text-white shadow-xs cursor-pointer active:scale-95 ring-2 ring-amber-400/70'
                              : isLight
                                ? 'bg-rose-50 border-rose-300/80 text-rose-700 hover:bg-rose-100 cursor-pointer active:scale-95'
                                : 'bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/25 cursor-pointer active:scale-95'
                          }`}
                          title={locked ? 'Sudah tersimpan di database & terkunci' : 'Tandai Melewati (Tidak Melakukan)'}
                        >
                          {locked && isMissed ? (
                            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                          <span>Melewati</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(task.id)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            task.flagged 
                              ? 'text-rose-500' 
                              : isLight ? 'text-slate-400 hover:text-rose-500 hover:bg-slate-100' : 'text-white/30 hover:text-rose-400 hover:bg-white/10'
                          }`}
                          title={task.flagged ? 'Hapus Prioritas' : 'Tandai Prioritas'}
                        >
                          <Flag className={`w-3.5 h-3.5 ${task.flagged ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        <button
                          type="button"
                          disabled={hasSavedHistory}
                          onClick={() => handleDeleteTask(task.id)}
                          className={`p-2 rounded-xl transition-colors ${
                            hasSavedHistory
                              ? 'opacity-30 cursor-not-allowed text-slate-400'
                              : isLight 
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer' 
                                : 'text-white/30 hover:text-rose-400 hover:bg-white/10 cursor-pointer'
                          }`}
                          title={hasSavedHistory ? 'Agenda dengan ceklis tersimpan tidak dapat dihapus' : 'Hapus Agenda'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MATRIKS 31 HARI (RESPONSIVE TABLE - FIXED OVERLAPPING ISSUE)     */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="relative z-10 space-y-2">
          {/* Scroll instruction hint on mobile */}
          <div className={`md:hidden flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl border font-bold ${
            isLight 
              ? 'bg-teal-50 text-teal-900 border-teal-200' 
              : 'text-sky-300/80 bg-sky-500/10 border-sky-500/20'
          }`}>
            <span>👉 Geser tabel ke kanan untuk melihat tanggal 1 - {totalDaysInMonth}</span>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`underline font-bold ml-2 ${isLight ? 'text-teal-950' : 'text-white'}`}
            >
              Mode Ceklis HP
            </button>
          </div>

          <div className="overflow-x-auto pb-2 custom-scrollbar -mx-4 px-4 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr>
                  {/* Left Column: Agenda Title (Sticky only on desktop, compact on mobile to prevent overlapping) */}
                  <th className={`font-bold text-[11px] tracking-wider uppercase border-b py-3 pr-3 w-[130px] md:w-auto md:min-w-[200px] md:max-w-[220px] md:sticky md:left-0 backdrop-blur-md z-20 ${
                    isLight 
                      ? 'bg-white text-slate-900 border-slate-200' 
                      : 'bg-[#0d0d12]/95 text-white/50 border-white/10'
                  }`}>
                    Agenda / Tugas
                  </th>

                  {daysArray.map((day) => {
                    const dayInfo = getDayInfo(year, monthIndex, day);
                    const isToday = isCurrentMonthActive && currentRealDay === day;

                    return (
                      <th
                        key={`th-day-${day}`}
                        className={`font-mono-label text-center border-b p-1 min-w-[34px] md:min-w-[28px] select-none transition-colors ${
                          isLight ? 'border-slate-200' : 'border-white/10 grid-cell'
                        } ${
                          isToday
                            ? isLight
                              ? 'bg-teal-100 text-teal-950 font-black border-x border-teal-300'
                              : 'bg-sky-500/20 text-sky-300 font-bold border-x border-sky-500/30'
                            : activeDayHover === day
                            ? isLight ? 'bg-slate-100 text-slate-950 font-bold' : 'bg-white/10 text-white font-bold'
                            : dayInfo.isWeekend
                            ? isLight ? 'text-slate-400 bg-slate-50' : 'text-white/30 bg-white/[0.01]'
                            : isLight ? 'text-slate-700 font-bold' : 'text-white/60'
                        }`}
                        onMouseEnter={() => setActiveDayHover(day)}
                        onMouseLeave={() => setActiveDayHover(null)}
                        title={`${dayInfo.name}, ${day} ${monthName}${isToday ? ' (Hari Ini)' : ''}`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`text-[9px] uppercase font-sans tracking-tighter ${isLight ? 'text-slate-500 font-bold' : 'text-white/40'}`}>
                            {dayInfo.short}
                          </span>
                          <span className="text-[11px] font-mono leading-none mt-0.5 font-bold">
                            {day}
                          </span>
                        </div>
                      </th>
                    );
                  })}

                  {/* Right Column: Konsistensi (Sticky ONLY on desktop md:screens so it doesn't overlap day cells on mobile) */}
                  <th className={`font-bold text-[11px] text-right tracking-wider uppercase border-b py-3 pl-4 min-w-[90px] md:sticky md:right-0 backdrop-blur-md z-20 ${
                    isLight 
                      ? 'bg-white text-slate-900 border-slate-200' 
                      : 'bg-[#0d0d12]/95 text-white/50 border-white/10'
                  }`}>
                    Konsistensi
                  </th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => {
                  const consistency = calculateTaskConsistency(task);
                  const badgeClass = getConsistencyBadgeClass(consistency);

                  return (
                    <tr
                      key={task.id}
                      className={`group transition-colors border-b ${
                        isLight ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-white/[0.03] border-white/5'
                      }`}
                    >
                      {/* Task title column */}
                      <td className={`py-2.5 pr-3 md:sticky md:left-0 transition-colors z-10 border-r ${
                        isLight 
                          ? 'bg-white group-hover:bg-slate-50 border-slate-200' 
                          : 'bg-[#0d0d12]/95 group-hover:bg-[#13131c]/95 border-white/5'
                      }`}>
                        <div className="flex items-center justify-between space-x-1.5">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span
                              className={`text-xs block truncate max-w-[110px] md:max-w-[170px] font-bold ${
                                isLight ? 'text-slate-900' : 'text-white/90 font-medium'
                              }`}
                              title={task.title}
                            >
                              {task.title}
                            </span>
                            {task.flagged && (
                              <button
                                type="button"
                                onClick={() => handleToggleFlag(task.id)}
                                title="Tandai Prioritas"
                                className="shrink-0 cursor-pointer"
                              >
                                <Flag className="w-3 h-3 text-rose-500 fill-rose-500" />
                              </button>
                            )}
                          </div>

                          {/* Quick action controls */}
                          <div className="flex md:hidden md:group-hover:flex items-center space-x-0.5 opacity-80">
                            <button
                              onClick={() => handleToggleFlag(task.id)}
                              className={`p-1 rounded-lg transition-colors ${
                                task.flagged 
                                  ? 'text-rose-500' 
                                  : isLight ? 'text-slate-400 hover:text-rose-500' : 'text-white/40 hover:text-rose-400'
                              }`}
                              title={task.flagged ? 'Hapus Prioritas' : 'Tandai Prioritas'}
                            >
                              <Flag className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={Object.values(task.days || {}).some((v) => v === 'done' || v === 'missed')}
                              onClick={() => handleDeleteTask(task.id)}
                              className={`p-1 rounded-lg transition-colors ${
                                Object.values(task.days || {}).some((v) => v === 'done' || v === 'missed')
                                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                                  : isLight ? 'text-slate-400 hover:text-rose-600 cursor-pointer' : 'text-white/40 hover:text-rose-400 cursor-pointer'
                              }`}
                              title={Object.values(task.days || {}).some((v) => v === 'done' || v === 'missed') ? 'Agenda dengan ceklis tersimpan tidak dapat dihapus' : 'Hapus Agenda'}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Day cells 1..31 with touch-friendly spacing & glowing grid buttons */}
                      {daysArray.map((day) => {
                        const locked = isDayLocked(task, day);
                        const pending = !locked && isDayPending(task.id, day);
                        const status = getEffectiveDayStatus(task, day);
                        const isDone = status === 'done';
                        const isMissed = status === 'missed';

                        return (
                          <td
                            key={`cell-${task.id}-${day}`}
                            onMouseEnter={() => setActiveDayHover(day)}
                            onMouseLeave={() => setActiveDayHover(null)}
                            className={`p-1 text-center align-middle select-none transition-colors h-11 ${
                              isLight ? 'border-r border-slate-100' : 'grid-cell'
                            } ${
                              activeDayHover === day ? (isLight ? 'bg-slate-100' : 'bg-white/[0.04]') : ''
                            }`}
                          >
                            <button
                              type="button"
                              disabled={locked}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellClick(task.id, day);
                              }}
                              onContextMenu={(e) => handleCellContextMenu(e, task.id, day)}
                              className={`relative w-7 h-7 sm:w-7.5 sm:h-7.5 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 font-bold ${
                                locked
                                  ? isDone
                                    ? isLight
                                      ? 'bg-teal-700 text-white shadow-xs cursor-not-allowed'
                                      : 'bg-emerald-600/40 border border-emerald-400 text-emerald-200 cursor-not-allowed'
                                    : isLight
                                    ? 'bg-rose-200 border border-rose-400 text-rose-900 cursor-not-allowed'
                                    : 'bg-rose-500/35 border border-rose-400 text-rose-200 cursor-not-allowed'
                                  : isDone
                                  ? isLight
                                    ? 'bg-teal-600 text-white shadow-xs ring-2 ring-amber-400 cursor-pointer active:scale-90'
                                    : 'bg-gradient-to-br from-emerald-500/25 to-teal-500/30 border border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)] text-emerald-300 ring-1 ring-amber-400/50 cursor-pointer active:scale-90'
                                  : isMissed
                                  ? isLight
                                    ? 'bg-rose-100 border border-amber-400 ring-1 ring-amber-400 text-rose-800 cursor-pointer active:scale-90'
                                    : 'bg-rose-500/20 border border-amber-400 text-rose-300 cursor-pointer active:scale-90'
                                  : isLight
                                  ? 'bg-slate-100 border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-transparent hover:text-teal-700 group/cell cursor-pointer active:scale-90'
                                  : 'bg-white/[0.03] border border-white/10 hover:border-emerald-400/60 hover:bg-emerald-500/10 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] text-transparent hover:text-emerald-400/60 group/cell cursor-pointer active:scale-90'
                              }`}
                              title={`Tanggal ${day} ${monthName}: ${task.title} - ${
                                locked
                                  ? isDone
                                    ? 'Selesai (Tersimpan di database & terkunci)'
                                    : 'Tidak Dilakukan (Tersimpan di database & terkunci)'
                                  : pending
                                  ? 'Draft baru dicentang — klik Simpan di bawah untuk mengunci ke database'
                                  : 'Klik untuk ceklis selesai, klik kanan untuk tanda silang'
                              }`}
                              aria-label={`Tanggal ${day}: ${task.title}`}
                            >
                              {isDone && (
                                <Check className={`w-4 h-4 stroke-[3] ${isLight ? 'text-white' : 'text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]'}`} />
                              )}
                              {isMissed && (
                                <X className={`w-3.5 h-3.5 stroke-[3] ${isLight ? 'text-rose-700' : 'text-rose-300 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]'}`} />
                              )}
                              {locked && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-900/90 border border-white/40 flex items-center justify-center">
                                  <Lock className="w-1.5 h-1.5 text-white" />
                                </span>
                              )}
                              {!status && (
                                <>
                                  <span className={`w-1.5 h-1.5 rounded-full transition-opacity ${isLight ? 'bg-slate-300 group-hover/cell:opacity-0' : 'bg-white/15 group-hover/cell:opacity-0'}`} />
                                  <Check className={`w-3.5 h-3.5 stroke-[2.5] hidden group-hover/cell:block ${isLight ? 'text-teal-700' : 'text-emerald-400'}`} />
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Consistency badge column (Non-sticky on mobile so it doesn't crush the table) */}
                      <td className={`py-2.5 pl-4 text-right md:sticky md:right-0 transition-colors z-10 border-l ${
                        isLight 
                          ? 'bg-white group-hover:bg-slate-50 border-slate-200' 
                          : 'bg-[#0d0d12]/95 group-hover:bg-[#13131c]/95 border-white/5'
                      }`}>
                        <span
                          className={`font-mono-label text-[11px] px-2.5 py-1 rounded-full inline-block min-w-[48px] text-center font-bold ${badgeClass}`}
                        >
                          {consistency}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TANDA / BAR SIMPAN DI BAGIAN BAWAH (MUNCUL SAAT ADA CEKLIS BARU)         */}
      {/* ========================================================================= */}
      {(pendingCount > 0 || saveError || saveSuccessMsg) && (
        <div className="mt-5 relative z-10 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {saveError && (
            <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              isLight ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccessMsg && pendingCount === 0 && (
            <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
            }`}>
              <Lock className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {pendingCount > 0 && (
            <div
              id="agenda-save-bar"
              className="flex items-center justify-end"
            >
              <button
                type="button"
                id="btn-save-agenda-checklist"
                disabled={isSaving}
                onClick={handleSavePending}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md disabled:opacity-60 disabled:cursor-wait ${
                  isLight
                    ? 'bg-[#003B2F] hover:bg-[#002a21] text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Agenda Harian</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
