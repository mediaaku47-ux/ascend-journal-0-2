import { Task, Habit, TargetItem } from '../types';

export interface LevelDefinition {
  level: number;
  name: string; // "MULAI" | "BERKEMBANG" | "KONSISTEN" | "DISIPLIN" | "UNGGUL"
  title: string; // "LEVEL 1 — MULAI", etc.
  minPoints: number;
  maxPoints: number;
  minConsistency: number; // Ambang minimal konsistensi agenda harian (%)
  minDoneTasks: number;   // Minimal jumlah tugas selesai
  description: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  gradient: string;
  accentColor: string;
  iconType: 'compass' | 'trending-up' | 'flame' | 'shield' | 'crown';
  perks: string[];
}

export const LEVELS: LevelDefinition[] = [
  {
    level: 1,
    name: 'MULAI',
    title: 'LEVEL 1 — MULAI',
    minPoints: 0,
    maxPoints: 50,
    minConsistency: 0,
    minDoneTasks: 0,
    description: 'Membangun fondasi rutinitas dan kebiasaan awal.',
    badgeBg: 'bg-slate-500/20',
    badgeBorder: 'border-slate-400/40',
    badgeText: 'text-slate-200',
    gradient: 'from-slate-400 via-sky-500 to-indigo-500',
    accentColor: '#94a3b8',
    iconType: 'compass',
    perks: [
      'Akses agenda & kebiasaan harian',
      'Pencatatan arus kas & keuangan',
      'Target harian otomatis',
    ],
  },
  {
    level: 2,
    name: 'BERKEMBANG',
    title: 'LEVEL 2 — BERKEMBANG',
    minPoints: 50,
    maxPoints: 120,
    minConsistency: 30, // Minimal 30% konsistensi
    minDoneTasks: 3,    // Minimal 3 tugas tuntas
    description: 'Mulai bertumbuh dan mengembangkan ritme produktivitas teratur.',
    badgeBg: 'bg-teal-500/20',
    badgeBorder: 'border-teal-400/40',
    badgeText: 'text-teal-300',
    gradient: 'from-teal-400 via-emerald-500 to-sky-400',
    accentColor: '#2dd4bf',
    iconType: 'trending-up',
    perks: [
      'Pola produktivitas mulai terbentuk',
      'Pelacakan kebiasaan bertahap',
      'Grafik tren konsistensi mingguan',
    ],
  },
  {
    level: 3,
    name: 'KONSISTEN',
    title: 'LEVEL 3 — KONSISTEN',
    minPoints: 120,
    maxPoints: 220,
    minConsistency: 55, // Minimal 55% konsistensi
    minDoneTasks: 10,   // Minimal 10 tugas tuntas
    description: 'Pola konsistensi harian stabil di atas separuh target.',
    badgeBg: 'bg-sky-500/20',
    badgeBorder: 'border-sky-400/40',
    badgeText: 'text-sky-300',
    gradient: 'from-indigo-500 via-sky-500 to-teal-500',
    accentColor: '#38bdf8',
    iconType: 'flame',
    perks: [
      'Momentum kebiasaan aktif stabil',
      'Target mingguan & bulanan otomatis',
      'Evaluasi performa rutin',
    ],
  },
  {
    level: 4,
    name: 'DISIPLIN',
    title: 'LEVEL 4 — DISIPLIN',
    minPoints: 220,
    maxPoints: 350,
    minConsistency: 75, // Minimal 75% konsistensi
    minDoneTasks: 22,   // Minimal 22 tugas tuntas
    description: 'Kedisiplinan tinggi, konsisten tuntas, dan efisiensi waktu optimal.',
    badgeBg: 'bg-indigo-500/20',
    badgeBorder: 'border-indigo-400/40',
    badgeText: 'text-indigo-300',
    gradient: 'from-sky-500 via-indigo-500 to-teal-400',
    accentColor: '#818cf8',
    iconType: 'shield',
    perks: [
      'Kedisiplinan teruji dan konsisten',
      'Efisiensi waktu optimal',
      'Ekspor laporan rapor PDF',
    ],
  },
  {
    level: 5,
    name: 'UNGGUL',
    title: 'LEVEL 5 — UNGGUL',
    minPoints: 350,
    maxPoints: 999999,
    minConsistency: 88, // Minimal 88% konsistensi tinggi
    minDoneTasks: 35,   // Minimal 35 tugas tuntas
    description: 'Puncak keunggulan kedisiplinan dan konsistensi agenda maksimal.',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-400/50',
    badgeText: 'text-amber-300',
    gradient: 'from-indigo-500 via-sky-400 to-amber-400',
    accentColor: '#f59e0b',
    iconType: 'crown',
    perks: [
      'Gelar Keunggulan Puncak 🏆',
      'Momentum kebiasaan tingkat master',
      'Penguasaan agenda & target hidup',
    ],
  },
];

export interface UserLevelProgress {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  totalPoints: number;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  pointsRemaining: number;
  progressPercent: number; // Progres di level aktif (0 - 100%)
  overallProgressPercent: number; // Progres kumulatif dari Level 1 sampai 5 (5 - 100%)
  itemsRemaining: number; // Jumlah kebiasaan/tugas yang harus diselesaikan untuk naik level
  consistencyRemaining: number; // Selisih konsistensi untuk mencapai level berikutnya (%)
  effectiveConsistency: number; // Tingkat konsistensi efektif gabungan (%)
  agendaConsistencyRate: number; // Konsistensi murni agenda harian (%)
  requirementReason: string; // Penjelasan syarat level berikutnya
  tasksPoints: number;
  habitsPoints: number;
  streakPoints: number;
  targetsPoints: number;
  doneTasksCount: number;
  doneHabitsCount: number;
  completedTargetsCount: number;
  todayTasksDone: number;
  todayHabitsDone: number;
}

export function getUserLevelProgress(
  tasks: Task[],
  habits: Habit[],
  streakDays: number,
  currentDay: number,
  targets?: TargetItem[]
): UserLevelProgress {
  // 1. Hitung total tugas selesai, slot yang ditugaskan, dan performa hari ini
  let doneTasksCount = 0;
  let todayTasksDone = 0;
  let flaggedTasksDone = 0;
  let totalAssignedSlots = 0;
  let totalDoneChecklist = 0;

  tasks.forEach((task) => {
    Object.entries(task.days || {}).forEach(([dayKey, status]) => {
      if (status === 'done') {
        doneTasksCount += 1;
        totalDoneChecklist += 1;
        if (task.flagged) {
          flaggedTasksDone += 1;
        }
        if (Number(dayKey) === currentDay) {
          todayTasksDone += 1;
        }
      }
      if (status === 'done' || status === 'missed') {
        totalAssignedSlots += 1;
      }
    });
  });

  // Konsistensi agenda hari ini & bulanan
  const todayTasksCount = tasks.length;
  const todayScore = todayTasksCount > 0 ? Math.round((todayTasksDone / todayTasksCount) * 100) : 0;

  let agendaConsistencyRate = 0;
  if (totalAssignedSlots > 0) {
    agendaConsistencyRate = Math.round((totalDoneChecklist / totalAssignedSlots) * 100);
  } else if (todayTasksCount > 0) {
    agendaConsistencyRate = todayScore;
  } else if (doneTasksCount > 0) {
    agendaConsistencyRate = Math.min(100, doneTasksCount * 10);
  }

  // 2. Hitung performa kebiasaan
  let doneHabitsCount = 0;
  let todayHabitsDone = 0;
  let totalHabitsTarget = 0;

  habits.forEach((habit) => {
    doneHabitsCount += (habit.completedDays || 0);
    totalHabitsTarget += (habit.totalDays || 30);
    if (habit.completedToday) {
      todayHabitsDone += 1;
    }
  });

  const habitsConsistencyRate = totalHabitsTarget > 0 
    ? Math.round((doneHabitsCount / totalHabitsTarget) * 100)
    : (habits.length > 0 && todayHabitsDone > 0 ? Math.round((todayHabitsDone / habits.length) * 100) : 0);

  // 3. Hitung Tingkat Konsistensi Efektif Gabungan
  // Prioritas utama adalah agenda harian pengguna
  let effectiveConsistency = 0;
  if (tasks.length > 0 && habits.length > 0) {
    effectiveConsistency = Math.round((agendaConsistencyRate * 0.7) + (habitsConsistencyRate * 0.3));
  } else if (tasks.length > 0) {
    effectiveConsistency = agendaConsistencyRate;
  } else if (habits.length > 0) {
    effectiveConsistency = habitsConsistencyRate;
  } else {
    effectiveConsistency = 0;
  }

  // 4. Hitung Akumulasi Poin (XP)
  // Setiap tugas selesai = 2 poin (+1 bonus jika prioritas)
  const tasksPoints = (doneTasksCount * 2) + flaggedTasksDone;
  // Setiap hari kebiasaan = 2 poin
  const habitsPoints = doneHabitsCount * 2;
  // Momentum streak (maksimal 50 poin agar tidak mendominasi jika konsistensi rendah)
  const streakPoints = Math.min(50, Math.max(0, streakDays || 0) * 2);
  // Target tercapai (5 poin per target)
  const completedTargetsCount = (targets || []).filter((t) => t.completed).length;
  const targetsPoints = completedTargetsCount * 5;

  const totalPoints = tasksPoints + habitsPoints + streakPoints + targetsPoints;

  // 5. Tentukan Level Secara Akurat Sesuai Statistik & Agenda Harian
  // Syarat mutlak: Seseorang tidak boleh berada di level tinggi (misal UNGGUL) jika konsistensi rendah!
  let currentLevel = LEVELS[0];
  let nextLevel: LevelDefinition | null = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const lvl = LEVELS[i];
    const meetsPoints = totalPoints >= lvl.minPoints;
    const meetsConsistency = effectiveConsistency >= lvl.minConsistency;
    const meetsTasks = doneTasksCount >= lvl.minDoneTasks;

    // Untuk level 1, selalu terpenuhi. Untuk level 2-5, harus memenuhi konsistensi & tugas
    if (lvl.level === 1 || (meetsPoints && meetsConsistency && meetsTasks)) {
      currentLevel = lvl;
      nextLevel = i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
      break;
    }
  }

  let pointsInCurrentLevel = 0;
  let pointsNeededForNextLevel = 0;
  let pointsRemaining = 0;
  let progressPercent = 100;
  let overallProgressPercent = 100;
  let itemsRemaining = 0;
  let consistencyRemaining = 0;
  let requirementReason = '';

  const baseLevelPct = (currentLevel.level - 1) * 20;

  if (nextLevel) {
    pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
    pointsInCurrentLevel = Math.max(0, totalPoints - currentLevel.minPoints);

    const pointsRatio = pointsNeededForNextLevel > 0 
      ? Math.min(1, pointsInCurrentLevel / pointsNeededForNextLevel) 
      : 0;

    const consistencyNeeded = Math.max(1, nextLevel.minConsistency - currentLevel.minConsistency);
    const consistencyGain = Math.max(0, effectiveConsistency - currentLevel.minConsistency);
    const consistencyRatio = Math.min(1, consistencyGain / consistencyNeeded);

    // Rasio progres aktif merupakan gabungan pencapaian poin dan konsistensi
    const activeLevelRatio = (pointsRatio * 0.5) + (consistencyRatio * 0.5);

    // Progres di dalam level aktif (5% - 99%)
    progressPercent = Math.min(
      99,
      Math.max(5, Math.round(activeLevelRatio * 100))
    );

    // Progres kumulatif 1–5 secara akurat merefleksikan posisi level & statistik konsistensi
    overallProgressPercent = Math.min(
      99,
      Math.max(5, Math.round(baseLevelPct + (activeLevelRatio * 20)))
    );

    pointsRemaining = Math.max(0, nextLevel.minPoints - totalPoints);
    const tasksRemaining = Math.max(0, nextLevel.minDoneTasks - doneTasksCount);
    consistencyRemaining = Math.max(0, nextLevel.minConsistency - effectiveConsistency);

    // Berapa banyak aktivitas lagi yang perlu diselesaikan
    itemsRemaining = Math.max(1, Math.max(tasksRemaining, Math.ceil(pointsRemaining / 2)));

    if (consistencyRemaining > 0) {
      requirementReason = `Butuh konsistensi ≥${nextLevel.minConsistency}% (saat ini ${effectiveConsistency}%) & ${itemsRemaining} aktivitas lagi`;
    } else {
      requirementReason = `Selesaikan ${itemsRemaining} tugas lagi untuk naik ke ${nextLevel.name}`;
    }
  } else {
    // Level 5 (Puncak Keunggulan)
    progressPercent = Math.min(100, Math.max(88, effectiveConsistency));
    overallProgressPercent = Math.min(100, Math.max(90, effectiveConsistency));
    pointsRemaining = 0;
    itemsRemaining = 0;
    consistencyRemaining = 0;
    pointsInCurrentLevel = totalPoints - currentLevel.minPoints;
    pointsNeededForNextLevel = 100;
    requirementReason = 'Puncak Keunggulan tercapai! Pertahankan konsistensi harian Anda.';
  }

  return {
    currentLevel,
    nextLevel,
    totalPoints,
    pointsInCurrentLevel,
    pointsNeededForNextLevel,
    pointsRemaining,
    progressPercent,
    overallProgressPercent,
    itemsRemaining,
    consistencyRemaining,
    effectiveConsistency,
    agendaConsistencyRate,
    requirementReason,
    tasksPoints,
    habitsPoints,
    streakPoints,
    targetsPoints,
    doneTasksCount,
    doneHabitsCount,
    completedTargetsCount,
    todayTasksDone,
    todayHabitsDone,
  };
}
