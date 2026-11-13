import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Flame, Snowflake, Clock, Bell, BellRing } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { toISODateString, DAY_NAMES_ID, DAY_NAMES_SHORT_ID, MONTH_NAMES_SHORT_ID } from '../utils/dateUtils';
import { 
  checkAndTriggerHabitDeadlineNotification, 
  sendHabitTestNotification, 
  getNotificationPermissionStatus, 
  requestNotificationPermission 
} from '../utils/notifications';

interface HabitTrackerCardProps {
  habits: Habit[];
  streakDays: number;
  onUpdateHabits: (habits: Habit[]) => void;
  onUpdateStreak: (streak: number) => void;
  onOpenNewHabitModal?: () => void;
  theme?: 'dark' | 'light';
}

// 3D Fire Flame Icon with Multi-tier Lighting & Dynamic Radiant Glow
const Flame3DIcon: React.FC<{ isLit?: boolean; size?: number; idSuffix?: string }> = ({ 
  isLit = true, 
  size = 68,
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Dynamic glowing aura when lit */}
      {isLit && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-500/35 via-red-500/25 to-amber-400/20 blur-xl animate-flame-glow pointer-events-none" />
      )}
      
      <img 
        src="/assets/aistudio/fire_115156_80084a82.png" 
        alt="Flame Icon"
        width={size} 
        height={size} 
        className={`relative z-10 object-contain transition-all duration-500 ${isLit ? 'animate-flame' : 'opacity-40 grayscale-[40%]'}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          filter: isLit 
            ? 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.9)) drop-shadow(0 0 22px rgba(239, 68, 68, 0.75)) drop-shadow(0 0 35px rgba(245, 158, 11, 0.4))' 
            : 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.2))'
        }}
      />
    </div>
  );
};

// Helper untuk mendapatkan tanggal pembuatan kebiasaan secara akurat
export const getHabitCreationDate = (habit: Habit): Date => {
  if (habit.createdAt) {
    const d = new Date(habit.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  // Coba parse dari format habit-<timestamp>
  const match = habit.id.match(/habit-(\d+)/);
  if (match && match[1]) {
    const d = new Date(parseInt(match[1], 10));
    if (!isNaN(d.getTime())) return d;
  }
  // Coba cari dari tanggal komplesi paling awal jika ada
  if (habit.completedDates && habit.completedDates.length > 0) {
    const sorted = [...habit.completedDates].sort();
    const d = new Date(sorted[0]);
    if (!isNaN(d.getTime())) return d;
  }
  // Default ke hari ini jika benar-benar baru
  return new Date();
};

// Normalisasi Date ke jam 00:00:00 lokal untuk perhitungan hari yang presisi
export const getNormalizedDate = (d: Date): Date => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// Helper untuk menghitung streak dan posisi hari dimulai dari tanggal dibuatnya kebiasaan
export const getHabitStreakDetails = (habit: Habit, today: Date = new Date()) => {
  const creationDate = getNormalizedDate(getHabitCreationDate(habit));
  const todayNormalized = getNormalizedDate(today);
  const msPerDay = 24 * 60 * 60 * 1000;
  
  // Selisih hari kalender antara tanggal pembuatan dan hari ini (Hari ke-1 = index 0)
  const daysDiff = Math.round((todayNormalized.getTime() - creationDate.getTime()) / msPerDay);
  const todayIndex = Math.max(0, daysDiff);
  const targetDays = habit.totalDays || 7;
  const todayIso = toISODateString(today);
  
  let completedIndices: number[] = [];
  if (Array.isArray(habit.completedDayIndices) && habit.completedDayIndices.length > 0) {
    completedIndices = habit.completedDayIndices;
  } else if (Array.isArray(habit.completedDates) && habit.completedDates.length > 0) {
    completedIndices = habit.completedDates.map((dateStr) => {
      const d = getNormalizedDate(new Date(dateStr));
      return Math.round((d.getTime() - creationDate.getTime()) / msPerDay);
    });
  } else if (habit.completedToday || habit.lastCompletedDate === todayIso) {
    completedIndices = [todayIndex];
  }

  // Filter ketat: Hanya boleh angka valid >= 0, < targetDays, dan TIDAK BOLEH melebihi hari ini (<= todayIndex)
  const validCompletedSet = new Set(
    completedIndices.filter(
      (idx) => typeof idx === 'number' && !isNaN(idx) && idx >= 0 && idx < targetDays && idx <= todayIndex
    )
  );

  const isDoneToday = validCompletedSet.has(todayIndex) || habit.lastCompletedDate === todayIso || !!habit.completedDates?.includes(todayIso);

  if (isDoneToday) {
    validCompletedSet.add(todayIndex);
  }

  // Streak kebiasaan dihitung murni dimulai dari tanggal dibuatnya kebiasaan (index 0) sampai hari ini!
  // Hari yang sudah berlalu SEBELUM kebiasaan dibuat TIDAK pernah dihitung atau mematahkan streak.
  let currentStreak = 0;
  if (isDoneToday) {
    currentStreak = 1;
    for (let i = todayIndex - 1; i >= 0; i--) {
      if (validCompletedSet.has(i)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    // Jika hari ini belum selesai, pertahankan streak yang sudah diraih hingga kemarin (momentum tidak hilang)
    for (let i = todayIndex - 1; i >= 0; i--) {
      if (validCompletedSet.has(i)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    todayIndex,
    isDoneToday,
    currentStreak,
    creationDate,
    completedIndices: Array.from(validCompletedSet).sort((a, b) => a - b),
  };
};

export const HabitTrackerCard: React.FC<HabitTrackerCardProps> = ({
  habits,
  streakDays,
  onUpdateHabits,
  onUpdateStreak,
  onOpenNewHabitModal,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTotalDays, setNewTotalDays] = useState(7);
  const [newColor, setNewColor] = useState('#ea580c');

  // State untuk mencatat minggu yang sedang dilihat per kebiasaan
  const [habitWeekMap, setHabitWeekMap] = useState<Record<string, number>>({});

  // Waktu hari ini (real-time live clock)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hitung hitung mundur (countdown) jam, menit, detik menuju jam 12 malam (24:00 / batas pergantian hari)
  const midnightToday = new Date(
    currentDateTime.getFullYear(),
    currentDateTime.getMonth(),
    currentDateTime.getDate() + 1,
    0, 0, 0, 0
  );
  const remainingMs = Math.max(0, midnightToday.getTime() - currentDateTime.getTime());
  const totalRemainingSec = Math.floor(remainingMs / 1000);
  const countdownHours = String(Math.floor(totalRemainingSec / 3600)).padStart(2, '0');
  const countdownMinutes = String(Math.floor((totalRemainingSec % 3600) / 60)).padStart(2, '0');
  const countdownSeconds = String(totalRemainingSec % 60).padStart(2, '0');
  const countdownStr = `${countdownHours}:${countdownMinutes}:${countdownSeconds}`;
  const countdownDetailed = `${countdownHours}j ${countdownMinutes}m ${countdownSeconds}d`;
  const remainingHoursTotal = remainingMs / (1000 * 3600);
  const isUrgent5h = remainingHoursTotal <= 5 && remainingHoursTotal > 3;
  const isCritical3h = remainingHoursTotal <= 3 && remainingHoursTotal > 0;

  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(
    () => getNotificationPermissionStatus()
  );

  // Periksa izin notifikasi secara dinamis
  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus());
  }, []);

  // Notifikasi otomatis ke HP / Laptop: tepat 5 jam & 3 jam sebelum jam 12 malam
  useEffect(() => {
    const todayIso = toISODateString(currentDateTime);
    habits.forEach((habit) => {
      const { isDoneToday } = getHabitStreakDetails(habit);
      if (!isDoneToday) {
        checkAndTriggerHabitDeadlineNotification(
          habit.id,
          habit.title,
          remainingHoursTotal,
          countdownDetailed,
          todayIso
        );
      }
    });
  }, [currentDateTime, habits, remainingHoursTotal, countdownDetailed]);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionStatus(perm as any);
  };

  const handleTestNotification = async (habitTitle: string) => {
    await sendHabitTestNotification(habitTitle, countdownDetailed);
  };

  // Helper untuk mendapatkan daftar indeks hari yang telah selesai secara aman (tanpa menghapus riwayat)
  const getHabitCompletedIndices = (habit: Habit, targetDays: number, todayIndex: number): number[] => {
    const creationDate = getNormalizedDate(getHabitCreationDate(habit));
    const msPerDay = 24 * 60 * 60 * 1000;
    const todayIso = toISODateString(new Date());

    let rawIndices: number[] = [];
    if (Array.isArray(habit.completedDayIndices) && habit.completedDayIndices.length > 0) {
      rawIndices = habit.completedDayIndices;
    } else if (Array.isArray(habit.completedDates) && habit.completedDates.length > 0) {
      // Hitung indeks hari dari tanggal penyelesaian riil relatif terhadap creationDate
      rawIndices = habit.completedDates.map((dateStr) => {
        const d = getNormalizedDate(new Date(dateStr));
        return Math.round((d.getTime() - creationDate.getTime()) / msPerDay);
      });
    } else if (habit.completedToday || habit.lastCompletedDate === todayIso) {
      rawIndices = [todayIndex];
    }

    // Jika completedToday aktif hari ini, pastikan todayIndex ada di daftar
    if ((habit.completedToday || habit.lastCompletedDate === todayIso) && !rawIndices.includes(todayIndex)) {
      rawIndices.push(todayIndex);
    }

    // Filter ketat:
    // 1. Harus berupa angka valid >= 0
    // 2. Harus dalam batas targetDays (< targetDays)
    // 3. JANGAN PERNAH mengizinkan indeks masa depan (idx <= todayIndex)! Hari esok belum terjadi, tidak mungkin sudah dilakukan.
    return Array.from(
      new Set(
        rawIndices.filter(
          (idx) => typeof idx === 'number' && !isNaN(idx) && idx >= 0 && idx < targetDays && idx <= todayIndex
        )
      )
    ).sort((a, b) => a - b);
  };

  // Selesai Hari Ini untuk kebiasaan tertentu:
  // Aturan paten: Sekali diselesaikan hari ini, status TERKUNCI permanen dan TIDAK DAPAT diubah lagi!
  const handleCompleteToday = (id: string) => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    const targetDays = target.totalDays || 7;
    const { todayIndex, isDoneToday } = getHabitStreakDetails(target);

    // Jika sudah selesai hari ini, status terkunci: tidak bisa lagi diubah!
    if (isDoneToday) return;

    const todayIso = toISODateString(new Date());
    const currentIndices = getHabitCompletedIndices(target, targetDays, todayIndex);
    let newIndices: number[];

    // Tandai hari ini (todayIndex) selesai tanpa menghapus hari-hari yang telah dilakukan sebelumnya!
    if (todayIndex < targetDays) {
      newIndices = Array.from(new Set([...currentIndices, todayIndex])).sort((a, b) => a - b);
    } else {
      newIndices = currentIndices;
    }

    const nextCompletedDays = Math.min(targetDays, newIndices.length);

    const updated = habits.map((h) => {
      if (h.id === id) {
        return {
          ...h,
          totalDays: targetDays,
          completedDays: nextCompletedDays,
          completedDayIndices: newIndices,
          completedToday: true,
          lastCompletedDate: todayIso,
          completedDates: Array.from(new Set([...(h.completedDates || []), todayIso])),
        };
      }
      return h;
    });

    onUpdateHabits(updated);

    // Otomatis geser ke minggu berikutnya saat mencapai kelipatan 7 hari penuh (jika target > 1 minggu)
    const totalWeeks = Math.max(1, Math.ceil(targetDays / 7));
    if (nextCompletedDays > 0 && nextCompletedDays % 7 === 0) {
      const nextWeekIndex = Math.min(totalWeeks - 1, Math.floor(nextCompletedDays / 7));
      setHabitWeekMap((prev) => ({
        ...prev,
        [id]: nextWeekIndex,
      }));
    }

    const wasAnyDoneToday = habits.some((h) => h.lastCompletedDate === todayIso);
    const isAnyDoneAfter = updated.some((h) => h.lastCompletedDate === todayIso);

    // Momentum streak updates
    if (!wasAnyDoneToday && isAnyDoneAfter) {
      onUpdateStreak(streakDays + 1);
      triggerConfetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#ea580c', '#f59e0b', '#fbbf24', '#10b981'],
      });
    } else {
      triggerConfetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.65 },
        colors: ['#ea580c', '#f59e0b', '#10b981'],
      });
    }
  };

  // Klik langsung pada lingkaran hari mingguan:
  // Aturan ketat: Pengguna HANYA bisa mengisi pada hari itu dan batas sampai akhir pada hari itu (todayIndex).
  const handleDayCircleClick = (habitId: string, globalDayZeroIndex: number) => {
    const target = habits.find((h) => h.id === habitId);
    if (!target) return;

    const targetDays = target.totalDays || 7;
    if (globalDayZeroIndex >= targetDays) return;

    const { todayIndex, isDoneToday } = getHabitStreakDetails(target);

    // Hanya hari ini yang belum selesai yang dapat diisi; hari lain tidak memunculkan apa-apa ketika diklik
    if (globalDayZeroIndex !== todayIndex || isDoneToday) {
      return;
    }

    handleCompleteToday(habitId);
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: newTitle.trim(),
      completedDays: 0,
      totalDays: Number(newTotalDays) || 7,
      color: newColor || '#ea580c',
      completedToday: false,
      completedDayIndices: [],
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    onUpdateHabits([...habits, newHabit]);
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleDeleteHabit = (id: string) => {
    onUpdateHabits(habits.filter((h) => h.id !== id));
  };

  return (
    <div id="pelacak-kebiasaan-card" className="space-y-5">
      {habits.length === 0 ? (
        <div 
          className={`rounded-[28px] p-8 text-center border transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
              : 'bg-[#151B26] border-slate-800 text-white shadow-xl'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 bg-slate-800/40 border border-slate-700/50">
            <Flame3DIcon isLit={false} size={48} idSuffix="empty" />
          </div>
          <h4 className="text-base font-black">Belum Ada Kebiasaan</h4>
          <p className={`text-xs mt-1 max-w-xs mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Mulai bangun disiplin dan lacak konsistensi hari demi hari.
          </p>
          {onOpenNewHabitModal && (
            <button
              onClick={onOpenNewHabitModal}
              className={`mt-4 px-4 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-[#003B2F] hover:bg-[#002e24] text-white shadow-[#003B2F]/20'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-teal-500/20'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Kebiasaan Pertama</span>
            </button>
          )}
        </div>
      ) : (
        habits.map((habit) => {
          const targetDays = habit.totalDays || 7;
          const habitColor = habit.color || '#ea580c';

          // Detail streak dan tanggal awal pembuatan kebiasaan
          const { todayIndex, isDoneToday, creationDate } = getHabitStreakDetails(habit);

          // Ambil daftar hari yang telah selesai secara aman (tanpa menghapus hari yang sudah pernah diselesaikan)
          const habitCompletedIndices = getHabitCompletedIndices(habit, targetDays, todayIndex);
          const clampedCompletedDays = Math.min(targetDays, habitCompletedIndices.length);
          
          // Total minggu HARUS PERSIS sesuai targetDays (tidak boleh lebih dari hari yang ditentukan)
          const totalWeeks = Math.max(1, Math.ceil(targetDays / 7));

          // Otomatis tentukan minggu aktif: arahkan ke minggu di mana hari ini berada (atau minggu yang dipilih user)
          const currentDayWeekIndex = Math.min(totalWeeks - 1, Math.floor(todayIndex / 7));
          const activeWeekIndex = habitWeekMap[habit.id] !== undefined 
            ? Math.min(totalWeeks - 1, Math.max(0, habitWeekMap[habit.id]))
            : currentDayWeekIndex;

          const percentage = Math.min(
            100,
            Math.round((clampedCompletedDays / targetDays) * 100)
          );

          return (
            <div 
              key={habit.id}
              className={`rounded-[30px] p-5 sm:p-7 transition-all duration-300 border relative overflow-hidden ${
                isLight
                  ? 'text-slate-900'
                  : 'text-white'
              }`}
              style={{
                borderColor: isLight ? `${habitColor}55` : `${habitColor}60`,
                boxShadow: isLight
                  ? `0 0 28px -2px ${habitColor}35, 0 10px 32px rgba(0,0,0,0.06), inset 0 1px 0 ${habitColor}50`
                  : `0 0 34px -2px ${habitColor}50, 0 14px 40px rgba(0,0,0,0.5), inset 0 1px 0 ${habitColor}60`,
                background: isLight
                  ? `linear-gradient(180deg, ${habitColor}12 0%, #ffffff 32%)`
                  : `linear-gradient(180deg, ${habitColor}22 0%, #151B26 32%)`,
              }}
            >
              {/* Garis Aksen Atas: Menggunakan gradasi dan pendaran warna aksen */}
              <div 
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-1.5 z-20 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, ${habitColor}40 0%, ${habitColor} 50%, ${habitColor}40 100%)`,
                  boxShadow: `0 0 14px ${habitColor}, 0 2px 8px ${habitColor}88`,
                }}
              />

              {/* Semburan pendaran warna lembut di bagian atas kartu */}
              <div 
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                style={{
                  background: isLight
                    ? `radial-gradient(120% 100% at 50% 0%, ${habitColor}20 0%, ${habitColor}05 50%, transparent 100%)`
                    : `radial-gradient(120% 100% at 50% 0%, ${habitColor}32 0%, ${habitColor}0C 55%, transparent 100%)`,
                }}
              />

              <div className="space-y-4 relative z-10 pt-0.5">
                  {/* 1. Nama Kebiasaan & Waktu Menuju Jam 12 Malam */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <h3 className={`text-base sm:text-lg font-black tracking-tight ${
                            isLight ? 'text-slate-950' : 'text-white'
                          }`}>
                            {habit.title}
                          </h3>

                          {/* Waktu Hitung Mundur Jam:Menit:Detik Berwarna */}
                          <div 
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-xs"
                            style={{
                              borderColor: `${habitColor}40`,
                              backgroundColor: isLight ? `${habitColor}10` : `${habitColor}20`,
                            }}
                          >
                            <Clock className="w-4 h-4 shrink-0" style={{ color: habitColor }} />
                            <span 
                              className={`font-mono font-black text-sm sm:text-base tracking-wider ${
                                isLight ? 'text-slate-950' : 'text-white'
                              }`}
                            >
                              {countdownStr}
                            </span>
                          </div>
                        </div>

                        {/* Div Waktu Aktif Real-Time & Pengingat Notifikasi Perangkat HP (5 Jam & 3 Jam Sebelum Jam 12 Malam) */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                          {!isDoneToday ? (
                            isCritical3h ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300 font-black animate-pulse shadow-xs">
                                <BellRing className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                <span>Notif HP 3 Jam: Waktu Kritis, Ayo Selesaikan!</span>
                              </div>
                            ) : isUrgent5h ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-black shadow-xs">
                                <Bell className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-bounce" />
                                <span>Notif HP 5 Jam: Masih Ada Waktu, Ayo Selesaikan!</span>
                              </div>
                            ) : (
                              <div 
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold"
                                style={{
                                  borderColor: isLight ? `${habitColor}35` : `${habitColor}40`,
                                  backgroundColor: isLight ? `${habitColor}0C` : `${habitColor}16`,
                                  color: isLight ? '#334155' : '#cbd5e1',
                                }}
                              >
                                <Bell className="w-3.5 h-3.5 shrink-0" style={{ color: habitColor }} />
                                <span>Notif HP terjadwal: 5 jam & 3 jam sblm jam 12 malam</span>
                              </div>
                            )
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Target Hari Ini Selesai</span>
                            </div>
                          )}

                          {/* Tombol Izinkan atau Uji Notifikasi Perangkat Langsung */}
                          {permissionStatus !== 'granted' ? (
                            <button
                              type="button"
                              onClick={handleRequestPermission}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs active:scale-95 transition-all"
                              title="Izinkan notifikasi perangkat agar pengingat muncul di HP / Laptop Anda"
                            >
                              <Bell className="w-3 h-3" />
                              <span>Izinkan Notif HP</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTestNotification(habit.title)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-300 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95 transition-all"
                              title="Uji coba kirim notifikasi pengingat ke HP sekarang"
                            >
                              <span>Tes Notif HP</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteHabit(habit.id)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                          isLight
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-white/30 hover:text-rose-400 hover:bg-white/5'
                        }`}
                        title="Hapus Kebiasaan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Target Harian & Bilah Progres (Statistik Sesuai Warna Kebiasaan) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/80'}`}>
                          Target Harian:
                        </span>
                        <span className="text-sm font-black" style={{ color: habitColor }}>
                          {clampedCompletedDays}/{targetDays} hari
                        </span>
                      </div>
                      <span 
                        className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full border shadow-2xs"
                        style={{
                          backgroundColor: isLight ? `${habitColor}14` : `${habitColor}25`,
                          borderColor: `${habitColor}50`,
                          color: isLight ? '#0f172a' : '#ffffff',
                        }}
                      >
                        {percentage}%
                      </span>
                    </div>

                    {/* Bilah Progres Statistik (Tebal, Glowing & Sesuai Warna Kebiasaan) */}
                    <div className={`w-full h-4 sm:h-5 rounded-full p-1 border transition-all duration-300 relative overflow-hidden shadow-inner ${
                      isLight
                        ? 'bg-slate-100 border-slate-300/90'
                        : 'bg-[#0E131D] border-slate-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
                    }`}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max(percentage, clampedCompletedDays > 0 ? 10 : 3)}%`,
                          background: clampedCompletedDays > 0
                            ? `linear-gradient(90deg, ${habitColor}CC 0%, ${habitColor} 100%)`
                            : isLight ? '#cbd5e1' : '#334155',
                          boxShadow: clampedCompletedDays > 0 
                            ? `0 0 16px ${habitColor}88, 0 0 8px ${habitColor}AA, inset 0 1px 0 rgba(255, 255, 255, 0.45)` 
                            : 'none',
                        }}
                      >
                        {/* Shimmer gloss effect pada permukaan atas bilah progres */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/10 pointer-events-none rounded-full" />
                        
                        {/* Indikator persentase di dalam bilah jika cukup lebar */}
                        {percentage >= 18 && (
                          <span className={`relative z-10 text-[10px] font-mono font-black drop-shadow-xs select-none ${
                            isLight ? 'text-slate-950' : 'text-white'
                          }`}>
                            {percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Ceklis Mingguan (Dimulai Tepat dari Tanggal Dibuatnya Kebiasaan) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                        <span>Ceklis Mingguan</span>
                      </div>

                      {/* Navigasi Geser Minggu Otomatis & Manual (jika > 1 minggu) */}
                      {totalWeeks > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={activeWeekIndex === 0}
                            onClick={() => setHabitWeekMap((prev) => ({ ...prev, [habit.id]: activeWeekIndex - 1 }))}
                            className={`p-1 rounded-lg border transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                              isLight 
                                ? 'border-slate-200 hover:bg-slate-100 text-slate-700' 
                                : 'border-slate-700 hover:bg-slate-800 text-white'
                            }`}
                            title="Lihat Minggu Sebelumnya"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            isLight 
                              ? 'bg-slate-100 border-slate-300 text-slate-800' 
                              : 'bg-white/5 border-white/10 text-teal-300'
                          }`}>
                            Minggu {activeWeekIndex + 1}/{totalWeeks}
                          </span>

                          <button
                            type="button"
                            disabled={activeWeekIndex >= totalWeeks - 1}
                            onClick={() => setHabitWeekMap((prev) => ({ ...prev, [habit.id]: activeWeekIndex + 1 }))}
                            className={`p-1 rounded-lg border transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                              isLight 
                                ? 'border-slate-200 hover:bg-slate-100 text-slate-700' 
                                : 'border-slate-700 hover:bg-slate-800 text-white'
                            }`}
                            title="Lihat Minggu Berikutnya"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 7 Lingkaran Hari: Berjalan Mulai Hari & Tanggal Dibuatnya Kebiasaan (Tanpa Hari yang Sudah Berlalu) */}
                    <div 
                      key={activeWeekIndex}
                      className="flex items-center justify-between gap-1 sm:gap-2 animate-in fade-in slide-in-from-right-3 duration-300"
                    >
                      {Array.from({ length: 7 }, (_, slotIdx) => {
                        const globalDayZeroIndex = activeWeekIndex * 7 + slotIdx;
                        const globalDayNum = globalDayZeroIndex + 1; // Hari ke-1, Hari ke-2, dst.
                        const isWithinTarget = globalDayZeroIndex < targetDays;

                        // Tanggal presisi dimulai dari tanggal dibuatnya kebiasaan (creationDate)
                        const slotDate = new Date(
                          creationDate.getFullYear(),
                          creationDate.getMonth(),
                          creationDate.getDate() + globalDayZeroIndex
                        );
                        const dayOfWeek = slotDate.getDay();
                        const dayShort = DAY_NAMES_SHORT_ID[dayOfWeek];
                        const dayFull = DAY_NAMES_ID[dayOfWeek];
                        const dateNum = slotDate.getDate();
                        const monthShort = MONTH_NAMES_SHORT_ID[slotDate.getMonth()];

                        // Status hari presisi
                        const isSlotToday = isWithinTarget && globalDayZeroIndex === todayIndex;
                        const isSlotPast = isWithinTarget && globalDayZeroIndex < todayIndex;
                        const isSlotFuture = isWithinTarget && globalDayZeroIndex > todayIndex;
                        // Hari dianggap selesai HANYA jika memang ada di habitCompletedIndices dan bukan hari masa depan!
                        const isSlotDone = isWithinTarget && !isSlotFuture && habitCompletedIndices.includes(globalDayZeroIndex);

                        // 1. Hari yang sudah berlalu dan DILAKUKAN -> Lambang Api 🔥 (Streak Menyala!)
                        // 2. Hari ini dan DILAKUKAN -> Lambang Api 🔥 (Streak Menyala!)
                        const isSlotOnFire = isWithinTarget && isSlotDone;

                        // 3. Hari yang sudah berlalu dan TIDAK DILAKUKAN -> Lambang Es ❄️ (Membeku!)
                        const isSlotFrozen = isWithinTarget && isSlotPast && !isSlotDone;

                        return (
                          <div key={slotIdx} className="flex flex-col items-center gap-1.5 flex-1 relative">
                            <button
                              type="button"
                              disabled={!isWithinTarget || isSlotPast || isSlotFuture || (isSlotToday && isSlotDone)}
                              onClick={() => {
                                if (isWithinTarget && isSlotToday && !isSlotDone) {
                                  handleDayCircleClick(habit.id, globalDayZeroIndex);
                                }
                              }}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all relative ${
                                !isWithinTarget
                                  ? 'opacity-20 cursor-not-allowed border border-dashed border-slate-600/40 text-transparent'
                                  : isSlotOnFire
                                    ? 'bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 text-white font-black border-2 border-amber-300 shadow-[0_0_16px_rgba(249,115,22,0.85)] ring-2 ring-orange-500/30 cursor-default opacity-95'
                                    : isSlotFrozen
                                      ? isLight
                                        ? 'bg-sky-100/90 border-2 border-sky-400 text-sky-700 shadow-[0_0_12px_rgba(56,189,248,0.45)] ring-1 ring-sky-300/40 cursor-default'
                                        : 'bg-gradient-to-br from-sky-500/30 via-blue-600/25 to-slate-900 border-2 border-sky-400 text-sky-200 shadow-[0_0_14px_rgba(56,189,248,0.55)] ring-1 ring-sky-400/30 cursor-default'
                                      : isSlotToday
                                        ? 'border-2 cursor-pointer active:scale-95 animate-pulse'
                                        : isLight
                                          ? 'bg-slate-100 border border-slate-300 text-slate-400 cursor-default opacity-40'
                                          : 'bg-[#141A24] border border-slate-800/80 text-white/20 cursor-default opacity-35'
                              }`}
                              style={
                                isSlotToday && !isSlotDone
                                  ? {
                                      borderColor: habitColor,
                                      backgroundColor: isLight ? `${habitColor}14` : `${habitColor}22`,
                                      boxShadow: `0 0 12px ${habitColor}50`,
                                    }
                                  : undefined
                              }
                              title={
                                !isWithinTarget
                                  ? `Di luar target (${targetDays} hari)`
                                  : isSlotOnFire
                                    ? `${dayFull}, ${dateNum} ${monthShort} (Hari ke-${globalDayNum}${isSlotToday ? ' • Hari Ini' : ''}): Selesai 🔥`
                                    : isSlotFrozen
                                      ? `${dayFull}, ${dateNum} ${monthShort} (Hari ke-${globalDayNum}): Terlewat ❄️`
                                      : isSlotToday
                                        ? `${dayFull}, ${dateNum} ${monthShort} (Hari ke-${globalDayNum} • Hari Ini): Belum selesai ⏳`
                                        : `${dayFull}, ${dateNum} ${monthShort} (Hari ke-${globalDayNum}): Belum tiba`
                              }
                            >
                              {isSlotOnFire && (
                                <Flame className="w-5 h-5 fill-amber-100 text-amber-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
                              )}
                              {isSlotFrozen && (
                                <Snowflake className="w-5 h-5 text-sky-500 dark:text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                              )}
                              {isSlotToday && !isSlotDone && (
                                <span 
                                  className="w-2.5 h-2.5 rounded-full" 
                                  style={{
                                    backgroundColor: habitColor,
                                    boxShadow: `0 0 8px ${habitColor}`,
                                  }}
                                />
                              )}
                              {isSlotFuture && (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500/40" />
                              )}
                            </button>
                            <div className="flex flex-col items-center">
                              <span 
                                className={`text-[10px] sm:text-[11px] font-semibold text-center ${
                                  !isWithinTarget 
                                    ? 'opacity-25' 
                                    : isSlotOnFire
                                      ? isLight ? 'text-amber-800 font-black' : 'text-orange-400 font-black'
                                      : isSlotFrozen
                                        ? isLight ? 'text-sky-800 font-extrabold' : 'text-sky-400 font-bold'
                                        : isSlotToday
                                          ? 'font-black'
                                          : isLight ? 'text-slate-800 font-bold' : 'text-white/60'
                                }`}
                                style={isSlotToday && !isSlotDone ? { color: habitColor } : undefined}
                              >
                                {dayShort}
                              </span>
                              <span 
                                className={`text-[9px] font-mono leading-none mt-0.5 ${
                                  !isWithinTarget
                                    ? 'opacity-20'
                                    : isSlotOnFire
                                      ? isLight ? 'text-amber-800 font-black' : 'text-orange-400 font-black'
                                      : isSlotFrozen
                                        ? isLight ? 'text-sky-800 font-extrabold' : 'text-sky-400/90 font-bold'
                                        : isSlotToday
                                          ? 'font-black'
                                          : isLight ? 'text-slate-700 font-bold' : 'text-white/40'
                                }`}
                                style={isSlotToday && !isSlotDone ? { color: habitColor } : undefined}
                              >
                                {dateNum}
                              </span>
                              {isSlotToday && !isSlotDone && (
                                <span 
                                  className="w-1.5 h-1.5 rounded-full mt-1 animate-ping" 
                                  style={{ backgroundColor: habitColor }}
                                  title="Hari Ini ⏳" 
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Tombol Selesai Hari Ini (Sesuai Warna Kebiasaan) */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isDoneToday}
                        onClick={() => handleCompleteToday(habit.id)}
                        className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all select-none shadow-md ${
                          isDoneToday
                            ? 'border cursor-not-allowed opacity-90 shadow-2xs'
                            : 'cursor-pointer active:scale-[0.99] text-white'
                        }`}
                        style={
                          isDoneToday
                            ? {
                                borderColor: `${habitColor}45`,
                                backgroundColor: isLight ? `${habitColor}10` : `${habitColor}1F`,
                                color: isLight ? '#0f172a' : '#ffffff',
                              }
                            : {
                                background: isLight
                                  ? `linear-gradient(135deg, ${habitColor}, ${habitColor}E6)`
                                  : `linear-gradient(135deg, ${habitColor}, ${habitColor}DD)`,
                                boxShadow: `0 4px 18px ${habitColor}40`,
                                color: '#ffffff',
                              }
                        }
                        title={
                          isDoneToday 
                            ? 'Hebat! Kebiasaan hari ini telah tuntas. Tetap pertahankan!'
                            : 'Klik untuk tuntaskan kebiasaan hari ini'
                        }
                      >
                        {isDoneToday ? (
                          <span>Luar Biasa! Target Tuntas</span>
                        ) : (
                          <span>Tuntaskan Hari Ini</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
            </div>
          );
        })
      )}

      {/* Form Tambah Kebiasaan Baru */}
      {showAddForm ? (
        <form 
          onSubmit={handleAddHabit} 
          className={`rounded-[28px] p-5 sm:p-6 border space-y-3 relative z-10 ${
            isLight 
              ? 'bg-white border-slate-200 shadow-md' 
              : 'bg-[#151B26] border-slate-800 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 dark:border-white/10">
            <h4 className={`text-sm font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Tambah Kebiasaan Baru
            </h4>
          </div>
          <input
            type="text"
            placeholder="Nama kebiasaan (cth: Minum Air Putih, Tidur Tepat Waktu)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={`w-full text-xs p-3 rounded-xl outline-hidden transition-all font-bold ${
              isLight 
                ? 'bg-slate-50 border border-slate-300 text-slate-950 placeholder-slate-400 focus:bg-white focus:border-teal-600'
                : 'bg-[#111620] border border-slate-700 text-white placeholder-white/30 focus:border-teal-400'
            }`}
            autoFocus
          />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className={`flex items-center space-x-2 text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>
                <span>Target:</span>
                <select
                  value={newTotalDays}
                  onChange={(e) => setNewTotalDays(Number(e.target.value))}
                  className={`text-xs rounded-lg px-2.5 py-1 font-bold ${
                    isLight 
                      ? 'bg-white text-slate-900 border border-slate-300'
                      : 'bg-[#1C2433] text-white border border-slate-700'
                  }`}
                >
                  <option value={7}>7 Hari (1 Minggu)</option>
                  <option value={14}>14 Hari (2 Minggu)</option>
                  <option value={21}>21 Hari (3 Minggu)</option>
                  <option value={30}>30 Hari (1 Bulan)</option>
                </select>
              </div>

              {/* Pilihan Warna Cepat */}
              <div className="flex items-center space-x-1.5">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/60'}`}>Warna:</span>
                {['#ea580c', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      newColor === c ? 'scale-125 ring-2 ring-offset-1 ' + (isLight ? 'ring-slate-800' : 'ring-white') : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={`text-xs px-3 py-1.5 cursor-pointer transition-colors font-bold ${
                  isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/60 hover:text-white'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{
                  background: newColor || '#ea580c',
                  boxShadow: `0 2px 10px ${newColor}50`,
                }}
                className="text-xs px-4 py-2 text-white rounded-xl font-black shadow-md cursor-pointer transition-all uppercase tracking-wider"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
};
