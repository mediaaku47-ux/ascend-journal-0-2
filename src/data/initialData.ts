import { Task, Habit, Transaction, QuickNote, UserProfile } from '../types';
import { getRealToday } from '../utils/dateUtils';

const realToday = getRealToday();
const currentDay = realToday.day;

export const initialUserProfile: UserProfile = {
  name: '',
  greetingTitle: 'Selamat Datang',
  greetingSubtitle: 'Kelola agenda, kebiasaan, dan keuangan Anda hari ini.',
  streakDays: 0,
  monthIndex: realToday.monthIndex,
  monthName: realToday.monthName,
  year: realToday.year,
  selectedDay: currentDay,
  totalDaysInMonth: realToday.totalDaysInMonth,
  currencySymbol: 'Rp',
  firstAppOpenAt: new Date().toISOString(),
};

export const initialTasks: Task[] = [];

export const initialHabits: Habit[] = [];

export const initialTransactions: Transaction[] = [];

export const initialQuickNotes: QuickNote[] = [];

