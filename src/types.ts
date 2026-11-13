export type TaskDayStatus = 'done' | 'missed' | null;

export interface Task {
  id: string;
  title: string;
  flagged?: boolean;
  days: Record<number, TaskDayStatus>;
  category?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  completedDays: number;
  totalDays: number;
  color?: string;
  completedToday?: boolean;
  lastCompletedDate?: string;
  completedDayIndices?: number[];
  completedDates?: string[];
  createdAt?: string;
}

export type TransactionType = 'income' | 'expense' | 'withdrawal' | 'savings_deposit' | 'savings_withdrawal';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  timestamp?: number;
  affectsCash?: boolean;
}

export interface QuickNote {
  id: string;
  title?: string;
  text: string;
  createdAt: string;
  date?: string;
  timestamp?: number;
  tags?: string[];
  noteNumber?: number;
  audioUrl?: string; // Data URL atau URL audio rekaman suara
  audioDuration?: number; // Durasi audio dalam detik
  isVoiceNote?: boolean; // Penanda catatan suara instan
}

export interface AppFeedback {
  rating: number; // 1 to 5 bintang
  suggestions: string; // Saran / masukan dari pengguna
  submittedAt?: string; // Tanggal ISO pengiriman ulasan
  updatedAt?: string;
  tags?: string[];
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl?: string;
  greetingTitle: string;
  greetingSubtitle: string;
  streakDays: number;
  lastStreakDate?: string; // Format YYYY-MM-DD tanggal terakhir streak dihitung
  monthName: string;
  monthIndex?: number;
  year: number;
  selectedDay?: number;
  totalDaysInMonth: number;
  currencySymbol: string;
  firstAppOpenAt?: string; // Waktu pertama kali membuka / masuk aplikasi (ISO)
  accountCreatedAt?: string; // Waktu akun pertama kali dibuat (ISO)
  feedback?: AppFeedback; // Data rating bintang dan saran pengguna
}

export type TargetPeriod = 'daily' | 'monthly' | 'weekly';

export interface TargetItem {
  id: string;
  title: string;
  period: TargetPeriod;
  targetCount: number;
  currentCount: number;
  unit: string;
  completed?: boolean;
  category?: string;
  isManual?: boolean;
  autoTrack?: 'today_tasks' | 'today_habits' | 'streak_days' | 'monthly_consistency' | 'custom';
  createdAt?: string;
}

export type AnnouncementType = 'info' | 'update' | 'warning' | 'event';

export interface AppAnnouncement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  isPinned?: boolean;
  authorName?: string;
  authorEmail?: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

export type NavTab = 'dashboard' | 'progress' | 'agenda' | 'habits' | 'targets' | 'finance' | 'notes' | 'archive' | 'settings' | 'help' | 'profile' | 'admin-feedback' | 'notifications' | 'admin-portal';

export type PdfReportStatus = 'Tersedia' | 'Kedaluwarsa' | 'Sedang Diproses' | 'Gagal';

export interface PdfReportItem {
  id: string;
  userId: string;
  periodYear: number;
  periodMonth: number; // 1-12
  monthName: string;
  fileName: string;
  storagePath: string;
  fileSize?: number;
  status: PdfReportStatus;
  expiresAt?: string | null;
  errorLog?: string | null;
  createdAt: string;
  downloadUrl?: string;
  summaryData?: {
    totalTasks?: number;
    consistencyRate?: number;
    totalIncome?: number;
    totalExpense?: number;
    totalHabits?: number;
  };
}
