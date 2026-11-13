import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { LevelRoadmapModal } from './LevelRoadmapModal';
import { MobileDashboardHero } from './MobileDashboardHero';
import { AscendDesktopDashboard } from './AscendDesktopDashboard';
import { GlobalSearchBar } from './GlobalSearchBar';
import { PageTransitionSkeleton } from './PageTransitionSkeleton';
import { AdminAnnouncementsModal } from './AdminAnnouncementsModal';
import { dbService, subscribeToRealtimeSync, CloudFullData } from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { checkIsAdminUser } from '../utils/admin';
import { SupabaseAuthModal } from './SupabaseAuthModal';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Sub-views and modals static imports (prevents dynamic import fetch errors)
import { NewEntryModal } from './NewEntryModal';
import { SettingsModal } from './SettingsModal';
import { HelpModal } from './HelpModal';
import { ResetConfirmModal } from './ResetConfirmModal';
import { DeviceSyncModal } from './DeviceSyncModal';
import { InstallAppModal } from './InstallAppModal';
import { ProfileModal } from './ProfileModal';
import { ExperienceFeedbackModal } from './ExperienceFeedbackModal';
import { CloseMonthModal } from './CloseMonthModal';
import { RollingProfileBadge } from './RollingProfileBadge';

import { ProgressView } from './Views/ProgressView';
import { AgendaView } from './Views/AgendaView';
import { HabitsView } from './Views/HabitsView';
import { TargetsView } from './Views/TargetsView';
import { NotesView } from './Views/NotesView';
import { FinanceView } from './Views/FinanceView';
import { ArchiveView } from './Views/ArchiveView';
import { ProfileView } from './ProfileView';
import { AdminFeedbackView } from './Views/AdminFeedbackView';
import { AdminPortalView } from './Views/AdminPortalView';
import { SettingsView } from './Views/SettingsView';
import { NotificationsView } from './Views/NotificationsView';

import { useDeviceNotifications } from '../hooks/useDeviceNotifications';
import {
  checkAllHabitsForDeadlineReminders,
  checkAndTriggerMonthClosingDeviceNotification,
} from '../utils/notifications';
import { TransactionSuccessModal } from './TransactionSuccessModal';
import { TransactionReceiptData } from '../utils/transactionReceiptPdf';
import { DeviceNotificationPermissionPrompt } from './DeviceNotificationPermissionPrompt';

import { 
  Task, 
  Habit, 
  Transaction, 
  QuickNote, 
  UserProfile, 
  NavTab,
  TargetItem,
  AppAnnouncement
} from '../types';
import { 
  initialTasks, 
  initialHabits, 
  initialTransactions, 
  initialQuickNotes, 
  initialUserProfile 
} from '../data/initialData';
import { initialTargets } from '../data/initialTargets';
import { getUserLevelProgress } from '../utils/levelUtils';
import { 
  getRealToday, 
  getDaysInMonth, 
  toISODateString, 
  isTransactionToday
} from '../utils/dateUtils';
import { getAvatarSignedUrl } from '../lib/avatarService';
import { 
  CheckCircle2, 
  Bell
} from 'lucide-react';

interface MainDashboardProps {
  currentUser: SupabaseUser;
  initialProfile?: UserProfile | null;
  onLogout: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  currentUser,
  initialProfile,
  onLogout,
}) => {
  const realToday = getRealToday();

  // Theme State (Dark & Light Mode) - Pengguna baru selalu dimulai dengan Mode Terang (Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('ascend_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Simpan mode terang sebagai bawaan awal
      localStorage.setItem('ascend_theme', 'light');
      return 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('ascend_theme', next);
      } catch (e) {
        // ignore
      }
      setToastMessage(`Mode ${next === 'light' ? 'Terang' : 'Gelap'} Aktif`);
      setTimeout(() => setToastMessage(null), 2500);
      return next;
    });
  };

  // Sinkronisasi kelas dark/light di document.documentElement agar Tailwind styling akurat
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Navigation & Loading State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isInitialEntryLoading, setIsInitialEntryLoading] = useState<boolean>(true);
  const [isTabTransitioning, setIsTabTransitioning] = useState<boolean>(false);
  const tabTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const entryTimer = setTimeout(() => {
      setIsInitialEntryLoading(false);
    }, 420);

    return () => {
      clearTimeout(entryTimer);
      if (tabTransitionTimerRef.current) {
        clearTimeout(tabTransitionTimerRef.current);
      }
    };
  }, []);

  // Modals
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [newEntryInitialType, setNewEntryInitialType] = useState<'task' | 'habit' | 'transaction' | 'note'>('task');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCloseMonthModalOpen, setIsCloseMonthModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAnnouncementsAdminOpen, setIsAnnouncementsAdminOpen] = useState(false);
  const [supabaseModalTab, setSupabaseModalTab] = useState<'login' | 'register' | 'account' | 'config' | 'migration'>('account');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenSupabaseModal = (tab?: 'login' | 'register' | 'account' | 'config' | 'migration') => {
    if (tab) {
      setSupabaseModalTab(tab);
    }
    setIsSupabaseModalOpen(true);
  };

  const handleSimulateReminder = () => {
    showToast('Pengingat jurnal malam telah dinonaktifkan.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const [realtimeStatus, setRealtimeStatus] = useState<string>('SUBSCRIBED');

  // Melacak waktu mutasi lokal untuk mencegah tabrakan / penimpaan (overwrite) oleh realtime Supabase
  const lastMutationTimeRef = useRef<{ [key: string]: number }>({
    agendas: 0,
    journals: 0,
    habits: 0,
    wallets: 0,
    targets: 0,
  });

  // App Data State with LocalStorage Initialization
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (initialProfile) return initialProfile;
    const saved = localStorage.getItem('journalstream_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Alex' || parsed.name === 'Kamal' || parsed.currencySymbol === '$') {
          return initialUserProfile;
        }
        const currentMonthIdx = parsed.monthIndex ?? realToday.monthIndex;
        const currentYear = parsed.year ?? realToday.year;
        const currentMonthName = parsed.monthName || realToday.monthName;
        const daysInM = getDaysInMonth(currentYear, currentMonthIdx);

        return {
          ...parsed,
          monthIndex: currentMonthIdx,
          year: currentYear,
          monthName: currentMonthName,
          totalDaysInMonth: daysInM,
          selectedDay: parsed.selectedDay || realToday.day,
        };
      } catch (e) {
        return initialUserProfile;
      }
    }
    return {
      ...initialUserProfile,
      monthIndex: realToday.monthIndex,
      year: realToday.year,
      monthName: realToday.monthName,
      totalDaysInMonth: realToday.totalDaysInMonth,
      selectedDay: realToday.day,
    };
  });

  // State aplikasi utama - Inisialisasi dari LocalStorage dan sinkronisasi dengan Supabase
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('journalstream_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem('journalstream_habits');
      if (!saved) return [];
      const parsed: Habit[] = JSON.parse(saved);
      const todayIso = toISODateString(new Date());
      return parsed.map((h) => ({
        ...h,
        completedToday: h.lastCompletedDate === todayIso,
      }));
    } catch {
      return [];
    }
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('journalstream_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>(() => {
    try {
      const saved = localStorage.getItem('journalstream_quick_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [totalBalance, setTotalBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('journalstream_total_balance');
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [savingsBalance, setSavingsBalance] = useState<number>(() => {
    const saved = localStorage.getItem('journalstream_savings_balance');
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num)) return num;
    }
    return 0;
  });
  const [targets, setTargets] = useState<TargetItem[]>(() => {
    try {
      const saved = localStorage.getItem('journalstream_targets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingFromSupabase, setIsLoadingFromSupabase] = useState<boolean>(() => Boolean(currentUser?.id));
  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([]);

  // Status notifikasi belum dibaca (Unread status)
  const READ_ANNOUNCEMENTS_STORAGE_KEY = 'ascend_read_announcements_ids';
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(READ_ANNOUNCEMENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleReadUpdate = () => {
      try {
        const stored = localStorage.getItem(READ_ANNOUNCEMENTS_STORAGE_KEY);
        setReadAnnouncementIds(stored ? JSON.parse(stored) : []);
      } catch {
        setReadAnnouncementIds([]);
      }
    };

    window.addEventListener('ascend-announcements-read-updated', handleReadUpdate);
    window.addEventListener('storage', handleReadUpdate);
    return () => {
      window.removeEventListener('ascend-announcements-read-updated', handleReadUpdate);
      window.removeEventListener('storage', handleReadUpdate);
    };
  }, []);

  // Hitung jumlah notifikasi aktif yang belum dibaca pengguna
  const unreadAnnouncementsCount = useMemo(() => {
    if (!announcements || announcements.length === 0) return 0;
    const active = announcements.filter((a) => a.isActive);
    return active.filter((a) => !readAnnouncementIds.includes(a.id)).length;
  }, [announcements, readAnnouncementIds]);

  // Otomatis tandai sebagai sudah dibaca saat pengguna membuka halaman notifikasi
  useEffect(() => {
    if (activeTab === 'notifications' && announcements && announcements.length > 0) {
      const activeIds = announcements.filter((a) => a.isActive).map((a) => a.id);
      const hasUnread = activeIds.some((id) => !readAnnouncementIds.includes(id));
      if (hasUnread) {
        const updated = Array.from(new Set([...readAnnouncementIds, ...activeIds]));
        setReadAnnouncementIds(updated);
        try {
          localStorage.setItem(READ_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event('ascend-announcements-read-updated'));
        } catch (e) {
          console.warn('Gagal menyimpan status baca notifikasi:', e);
        }
      }
    }
  }, [activeTab, announcements, readAnnouncementIds]);

  const [recentTransactionReceipt, setRecentTransactionReceipt] = useState<TransactionReceiptData | null>(null);

  const incomeToday = transactions
    .filter((t) => t.type === 'income' && isTransactionToday(t))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenseToday = transactions
    .filter((t) => t.type === 'expense' && isTransactionToday(t))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const withdrawalToday = transactions
    .filter((t) => t.type === 'withdrawal' && isTransactionToday(t))
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Hook Notifikasi Perangkat (HP / Browser) untuk Pengingat Agenda, Jurnal & Kebiasaan
  useDeviceNotifications({
    tasks,
    habits,
    quickNotes,
  });



  // Format nama tampilan pengguna untuk Header Desktop
  const headerDisplayName = useMemo(() => {
    let raw = userProfile?.name?.trim() || '';
    if (!raw || raw.toLowerCase() === 'pengguna' || raw.includes('@')) {
      raw = (raw || currentUser?.email || userProfile?.email || '').split('@')[0];
    }
    const cleaned = raw.replace(/[._-]+/g, ' ').replace(/\d+$/, '').trim();
    if (!cleaned) return 'Pengguna';
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }, [userProfile?.name, userProfile?.email, currentUser?.email]);

  // Resolusi Foto Profil Pengguna untuk Header Desktop (Data URL, HTTP URL, atau Path Supabase Storage)
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState<string>(() => userProfile?.avatarUrl || '');

  useEffect(() => {
    let active = true;

    async function resolveAvatar() {
      const raw = userProfile?.avatarUrl;
      if (!raw) {
        setHeaderAvatarUrl('');
        return;
      }

      // Jika berupa Data URL base64 atau Blob URL lokal
      if (raw.startsWith('data:') || raw.startsWith('blob:')) {
        setHeaderAvatarUrl(raw);
        return;
      }

      // Jika URL http/https lengkap
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        setHeaderAvatarUrl(raw);
        return;
      }

      // Jika berupa path di Supabase Storage (misal: 'userId/avatar_123.jpg')
      try {
        const signed = await getAvatarSignedUrl(raw, 86400);
        if (active && signed) {
          setHeaderAvatarUrl(signed);
        } else if (active) {
          setHeaderAvatarUrl('');
        }
      } catch {
        if (active) setHeaderAvatarUrl('');
      }
    }

    resolveAvatar();

    return () => {
      active = false;
    };
  }, [userProfile?.avatarUrl]);

  // Evaluasi Pengalaman 24 Jam: Munculkan dialog rating bintang & saran setelah 24 jam pertama dihitung dari awal membuat akun
  useEffect(() => {
    let accountCreatedAt = 
      userProfile.accountCreatedAt || 
      localStorage.getItem('ascend_account_created_at') || 
      (currentUser?.created_at && currentUser.created_at !== '2026-01-01T00:00:00.000Z' ? currentUser.created_at : null);
    
    // Pastikan jika belum ada atau menggunakan placeholder dummy masa lalu, set ke waktu saat ini
    if (!accountCreatedAt || accountCreatedAt === '2026-01-01T00:00:00.000Z') {
      accountCreatedAt = new Date().toISOString();
      localStorage.setItem('ascend_account_created_at', accountCreatedAt);
      setUserProfile((prev) => ({ ...prev, accountCreatedAt }));
    }

    const elapsedMs = Date.now() - new Date(accountCreatedAt).getTime();
    const is24HoursPassed = elapsedMs >= 24 * 60 * 60 * 1000;
    const hasSubmittedFeedback = Boolean(userProfile.feedback?.submittedAt);
    const hasDismissedSession = sessionStorage.getItem('journalstream_feedback_dismissed');

    if (is24HoursPassed && !hasSubmittedFeedback && !hasDismissedSession) {
      const timer = setTimeout(() => {
        setIsFeedbackModalOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userProfile.accountCreatedAt, userProfile.feedback?.submittedAt, currentUser?.created_at]);

  // Backup cache ke LocalStorage hanya setelah data dari Supabase selesai dimuat
  useEffect(() => {
    if (isLoadingFromSupabase) return;
    localStorage.setItem('journalstream_user_profile', JSON.stringify(userProfile));
  }, [userProfile, isLoadingFromSupabase]);

  useEffect(() => {
    if (isLoadingFromSupabase) return;
    localStorage.setItem('journalstream_tasks', JSON.stringify(tasks));
  }, [tasks, isLoadingFromSupabase]);

  useEffect(() => {
    if (isLoadingFromSupabase) return;
    localStorage.setItem('journalstream_habits', JSON.stringify(habits));
  }, [habits, isLoadingFromSupabase]);

  // Pengawas Notifikasi Perangkat (Kebiasaan & Akhir Bulan)
  // Berjalan di latar belakang setiap 10 detik dan seketika saat tab/layar aktif di seluruh aplikasi
  useEffect(() => {
    const runCheck = () => {
      checkAllHabitsForDeadlineReminders(habits);
      void checkAndTriggerMonthClosingDeviceNotification(
        userProfile.monthName,
        userProfile.monthIndex,
        userProfile.year,
        tasks
      );
    };

    runCheck();
    const interval = setInterval(runCheck, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runCheck();
      }
    };

    const handleFocus = () => {
      runCheck();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [habits, tasks, userProfile.monthName, userProfile.monthIndex, userProfile.year]);

  useEffect(() => {
    if (isLoadingFromSupabase) return;
    localStorage.setItem('journalstream_transactions', JSON.stringify(transactions));
  }, [transactions, isLoadingFromSupabase]);

  useEffect(() => {
    if (isLoadingFromSupabase) return;
    localStorage.setItem('journalstream_quick_notes', JSON.stringify(quickNotes));
  }, [quickNotes, isLoadingFromSupabase]);

  useEffect(() => {
    if (isLoadingFromSupabase) return;
    localStorage.setItem('journalstream_total_balance', totalBalance.toString());
  }, [totalBalance, isLoadingFromSupabase]);

  useEffect(() => {
    if (isLoadingFromSupabase) return;
    localStorage.setItem('journalstream_savings_balance', savingsBalance.toString());
  }, [savingsBalance, isLoadingFromSupabase]);

  useEffect(() => {
    if (isLoadingFromSupabase) return;
    localStorage.setItem('journalstream_targets', JSON.stringify(targets));
  }, [targets, isLoadingFromSupabase]);

  const handleResetToCleanState = () => {
    setUserProfile({
      ...initialUserProfile,
      monthIndex: realToday.monthIndex,
      monthName: realToday.monthName,
      year: realToday.year,
      selectedDay: realToday.day,
      totalDaysInMonth: realToday.totalDaysInMonth,
    });
    setTasks([]);
    setHabits([]);
    setTransactions([]);
    setQuickNotes([]);
    setTargets([]);
    setTotalBalance(0);
    setSavingsBalance(0);

    localStorage.removeItem('journalstream_user_profile');
    localStorage.removeItem('journalstream_tasks');
    localStorage.removeItem('journalstream_habits');
    localStorage.removeItem('journalstream_transactions');
    localStorage.removeItem('journalstream_quick_notes');
    localStorage.removeItem('journalstream_targets');
    localStorage.removeItem('journalstream_total_balance');
    localStorage.removeItem('journalstream_savings_balance');
  };

  const handleApplyCloudData = (data: CloudFullData, sourceTable?: string) => {
    const now = Date.now();
    const MUTATION_PROTECT_MS = 4500; // Lindungi perubahan lokal pengguna agar tidak tertimpa data lama

    if (data.totalBalance !== undefined) {
      if (sourceTable !== 'wallets' || now - lastMutationTimeRef.current.wallets > MUTATION_PROTECT_MS) {
        setTotalBalance(data.totalBalance);
      }
    }
    if (data.savingsBalance !== undefined) {
      if (sourceTable !== 'wallets' || now - lastMutationTimeRef.current.wallets > MUTATION_PROTECT_MS) {
        setSavingsBalance(data.savingsBalance);
      }
    }
    if (data.transactions !== undefined) {
      if (sourceTable !== 'wallets' || now - lastMutationTimeRef.current.wallets > MUTATION_PROTECT_MS) {
        setTransactions(data.transactions);
      }
    }
    if (data.tasks !== undefined) {
      if (sourceTable !== 'agendas' || now - lastMutationTimeRef.current.agendas > MUTATION_PROTECT_MS) {
        setTasks(data.tasks);
      }
    }
    if (data.quickNotes !== undefined) {
      if (sourceTable !== 'journals' || now - lastMutationTimeRef.current.journals > MUTATION_PROTECT_MS) {
        setQuickNotes(data.quickNotes);
      }
    }
    if (data.habits !== undefined) {
      if (sourceTable !== 'habits' || now - lastMutationTimeRef.current.habits > MUTATION_PROTECT_MS) {
        const todayIso = toISODateString(new Date());
        setHabits(data.habits.map((h) => ({
          ...h,
          completedToday: h.lastCompletedDate === todayIso,
        })));
      }
    }
    if (data.targets !== undefined) {
      if (sourceTable !== 'targets' || now - lastMutationTimeRef.current.targets > MUTATION_PROTECT_MS) {
        setTargets(data.targets);
      }
    }
    if (data.userProfile) {
      setUserProfile((prev) => ({
        ...prev,
        ...data.userProfile,
      }));
    }
  };

  // Inisialisasi saat aplikasi pertama kali dimuat (load/refresh) untuk mengambil (SELECT) seluruh data dari Supabase berdasarkan user_id yang sedang login
  useEffect(() => {
    let isMounted = true;
    if (!currentUser?.id) {
      setIsLoadingFromSupabase(false);
      return;
    }

    setIsLoadingFromSupabase(true);

    // Mengambil (SELECT) data lengkap dari Supabase (wallets, agendas, journals, habits, targets, user_profiles)
    dbService.fetchAllUserData(currentUser.id)
      .then((cloudData) => {
        if (!isMounted || !cloudData) return;

        // Pastikan state aplikasi (saldo, agenda, jurnal) diisi (set state) langsung dari hasil pengambilan data Supabase
        if (cloudData.totalBalance !== undefined) {
          setTotalBalance(cloudData.totalBalance);
        }
        if (cloudData.savingsBalance !== undefined) {
          setSavingsBalance(cloudData.savingsBalance);
        } else if (cloudData.transactions) {
          const compSavings = cloudData.transactions.reduce((sum, t) => {
            if (t.type === 'savings_deposit') return sum + t.amount;
            if (t.type === 'savings_withdrawal' || (t.type === 'withdrawal' && t.category?.toLowerCase().includes('tabung'))) return sum - t.amount;
            return sum;
          }, 0);
          if (compSavings > 0) setSavingsBalance(compSavings);
        }
        if (cloudData.transactions !== undefined) {
          setTransactions(cloudData.transactions);
        }
        if (cloudData.tasks !== undefined) {
          setTasks(cloudData.tasks);
        }
        if (cloudData.quickNotes !== undefined) {
          setQuickNotes(cloudData.quickNotes);
        }
        if (cloudData.habits !== undefined) {
          const todayIso = toISODateString(new Date());
          setHabits(cloudData.habits.map((h) => ({
            ...h,
            completedToday: h.lastCompletedDate === todayIso,
          })));
        }
        if (cloudData.targets !== undefined) {
          setTargets(cloudData.targets);
        }
        if (cloudData.userProfile) {
          setUserProfile((prev) => {
            const resolvedName = (cloudData.userProfile?.name && cloudData.userProfile.name !== 'Pengguna')
              ? cloudData.userProfile.name
              : (currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || (currentUser?.email ? currentUser.email.split('@')[0] : '') || cloudData.userProfile?.name || prev.name);

            return {
              ...prev,
              ...cloudData.userProfile,
              name: resolvedName,
              email: currentUser?.email || cloudData.userProfile?.email || prev.email,
              monthIndex: prev.monthIndex ?? realToday.monthIndex,
              year: prev.year ?? realToday.year,
              monthName: prev.monthName || realToday.monthName,
              totalDaysInMonth: prev.totalDaysInMonth || realToday.totalDaysInMonth,
              selectedDay: prev.selectedDay || realToday.day,
            };
          });
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat data dari Supabase:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingFromSupabase(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Muat daftar pengumuman aplikasi dari Supabase / Local Cache
  const loadAnnouncements = async () => {
    try {
      const data = await dbService.fetchAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.warn('Gagal memuat pengumuman:', err);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Realtime live sync
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToRealtimeSync(currentUser.id, {
      onRefreshNeeded: async (table) => {
        try {
          if (table === 'announcements') {
            await loadAnnouncements();
            showToast('Ada pembaruan pengumuman aplikasi!');
            return;
          }
          const cloudData = await dbService.fetchAllUserData(currentUser.id);
          if (cloudData) {
            handleApplyCloudData(cloudData, table);
            showToast(`Sinkronisasi Realtime: Perubahan ${table} diperbarui!`);
          }
        } catch (err) {
          console.warn('Realtime sync notification failed:', err);
        }
      },
      onStatusChange: (status) => {
        setRealtimeStatus(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Auto-sync target progress based on tasks and habits
  useEffect(() => {
    const currentDay = userProfile.selectedDay || realToday.day;
    const doneTasksToday = tasks.filter((t) => t.days[currentDay] === 'done').length;
    const doneHabitsToday = habits.filter((h) => h.completedToday).length;

    setTargets((prevTargets) => {
      let hasChanged = false;
      const updated = prevTargets.map((target) => {
        if (!target.isManual && (target.autoTrack === 'today_tasks' || (target.autoTrack as string) === 'daily_tasks')) {
          if (target.currentCount !== doneTasksToday) {
            hasChanged = true;
            return {
              ...target,
              currentCount: doneTasksToday,
              completed: doneTasksToday >= target.targetCount,
            };
          }
        } else if (!target.isManual && (target.autoTrack === 'today_habits' || (target.autoTrack as string) === 'daily_habits')) {
          if (target.currentCount !== doneHabitsToday) {
            hasChanged = true;
            return {
              ...target,
              currentCount: doneHabitsToday,
              completed: doneHabitsToday >= target.targetCount,
            };
          }
        }
        return target;
      });

      return hasChanged ? updated : prevTargets;
    });
  }, [tasks, habits, userProfile.selectedDay, realToday.day]);

  const levelProgress = useMemo(() => {
    return getUserLevelProgress(
      tasks,
      habits,
      userProfile.streakDays,
      userProfile.selectedDay || realToday.day,
      targets
    );
  }, [tasks, habits, userProfile.streakDays, userProfile.selectedDay, realToday.day, targets]);

  const handleToggleTarget = (id: string) => {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const willBeCompleted = !t.completed;
          if (willBeCompleted) {
            showToast(`🎉 Luar biasa! Target "${t.title}" berhasil tercapai! ✨`);
          }
          const updated = {
            ...t,
            completed: willBeCompleted,
            currentCount: willBeCompleted 
              ? (t.currentCount >= t.targetCount ? t.currentCount : t.targetCount)
              : t.currentCount,
          };
          dbService.upsertTarget(currentUser.id, updated).catch(console.warn);
          return updated;
        }
        return t;
      })
    );
  };

  const handleUpdateTargetCount = (id: string, newCount: number) => {
    const safeCount = Math.max(0, newCount);
    setTargets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = {
            ...t,
            currentCount: safeCount,
            isManual: true,
          };
          dbService.upsertTarget(currentUser.id, updated).catch(console.warn);
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddTarget = (newTarget: Omit<TargetItem, 'id' | 'createdAt'>) => {
    const item: TargetItem = {
      ...newTarget,
      id: 'target_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setTargets((prev) => [item, ...prev]);
    dbService.upsertTarget(currentUser.id, item).catch(console.warn);
    showToast(`Target "${newTarget.title}" berhasil ditambahkan!`);
  };

  const handleDeleteTarget = (id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
    dbService.deleteTarget(currentUser.id, id).catch(console.warn);
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'help') {
      setIsHelpOpen(true);
      return;
    }
    if (tab === activeTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabTransitionTimerRef.current) {
      clearTimeout(tabTransitionTimerRef.current);
    }
    setActiveTab(tab);
    setIsTabTransitioning(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    tabTransitionTimerRef.current = setTimeout(() => {
      setIsTabTransitioning(false);
      tabTransitionTimerRef.current = null;
    }, 750);
  };

  const handleAddTask = (newTask: Task) => {
    lastMutationTimeRef.current.agendas = Date.now();
    setTasks((prev) => [...prev, newTask]);
    if (currentUser?.id) {
      dbService.upsertAgenda(currentUser.id, newTask)
        .then(() => showToast('Agenda tersimpan di Supabase!'))
        .catch(console.warn);
    }
  };

  const handleUpdateTasks = async (newTasks: Task[]): Promise<void> => {
    lastMutationTimeRef.current.agendas = Date.now();
    if (currentUser?.id) {
      const res = await dbService.syncAllAgendas(currentUser.id, newTasks);
      if (res && (res as { error?: { message?: string } }).error) {
        const errMsg = (res as { error: { message?: string } }).error.message || 'Gagal menyimpan agenda ke database.';
        showToast(`Gagal menyimpan: ${errMsg}`);
        throw new Error(errMsg);
      }
    }
    setTasks(newTasks);
  };



  const handleAddHabit = (newHabit: Habit) => {
    lastMutationTimeRef.current.habits = Date.now();
    setHabits((prev) => [...prev, newHabit]);
    if (currentUser?.id) {
      dbService.upsertHabit(currentUser.id, newHabit)
        .then(() => showToast('Kebiasaan tersimpan di Supabase!'))
        .catch(console.warn);
    }
  };

  const handleUpdateHabits = (newHabits: Habit[]) => {
    lastMutationTimeRef.current.habits = Date.now();
    setHabits(newHabits);
    if (currentUser?.id) {
      dbService.syncAllHabits(currentUser.id, newHabits).catch(console.warn);
    }
  };



  const handleAddTransaction = (newTx: Transaction) => {
    lastMutationTimeRef.current.wallets = Date.now();
    const updated = [newTx, ...transactions];
    let newBal = totalBalance;
    let newSavings = savingsBalance;

    const isTabungan = newTx.type === 'savings_deposit' || newTx.type === 'savings_withdrawal';
    let typeLabel = 'Transaksi Kas';
    let balanceBefore = isTabungan ? savingsBalance : totalBalance;
    let balanceAfter = balanceBefore;

    if (newTx.type === 'income') {
      newBal = totalBalance + newTx.amount;
      typeLabel = 'Pemasukan Kas';
      balanceBefore = totalBalance;
      balanceAfter = newBal;
    } else if (newTx.type === 'expense') {
      newBal = totalBalance - newTx.amount;
      typeLabel = 'Pengeluaran Kas';
      balanceBefore = totalBalance;
      balanceAfter = newBal;
    } else if (newTx.type === 'savings_deposit') {
      newSavings = savingsBalance + newTx.amount;
      typeLabel = 'Isi Saldo Tabungan';
      balanceBefore = savingsBalance;
      balanceAfter = newSavings;
      if (newTx.affectsCash !== false) {
        newBal = totalBalance - newTx.amount;
      }
    } else if (newTx.type === 'savings_withdrawal') {
      newSavings = Math.max(0, savingsBalance - newTx.amount);
      typeLabel = 'Tarik Saldo Tabungan';
      balanceBefore = savingsBalance;
      balanceAfter = newSavings;
      if (newTx.affectsCash !== false) {
        newBal = totalBalance + newTx.amount;
      }
    } else if (newTx.type === 'withdrawal') {
      newBal = Math.max(0, totalBalance - newTx.amount);
      typeLabel = 'Penarikan Kas';
      balanceBefore = totalBalance;
      balanceAfter = newBal;
    }

    setTransactions(updated);
    setTotalBalance(newBal);
    setSavingsBalance(newSavings);

    // Siapkan data bukti transaksi resmi ASCEND
    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';

    const receiptData: TransactionReceiptData = {
      id: newTx.id || `TX-${Date.now()}`,
      userName: userProfile.name || currentUser?.email || 'Pengguna ASCEND',
      category: isTabungan ? 'Tabungan' : 'Kas',
      type: typeLabel,
      title: newTx.title || (isTabungan ? 'Tabungan Simpanan' : 'Kas Utama'),
      amount: newTx.amount,
      currencySymbol: userProfile.currencySymbol || 'Rp',
      dateTime: formattedDateTime,
      balanceBefore,
      balanceAfter,
    };

    // Tampilkan notifikasi & konfirmasi transaksi seketika (hanya 1x per transaksi)
    setRecentTransactionReceipt(receiptData);

    if (currentUser?.id) {
      dbService.syncWallet(currentUser.id, newBal, updated, newSavings)
        .then(() => showToast('Transaksi & Tabungan tersimpan di Supabase!'))
        .catch(console.warn);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    lastMutationTimeRef.current.wallets = Date.now();
    const target = transactions.find((t) => t.id === id);
    if (target) {
      let newBal = totalBalance;
      let newSavings = savingsBalance;

      if (target.type === 'income') {
        newBal = totalBalance - target.amount;
      } else if (target.type === 'expense') {
        newBal = totalBalance + target.amount;
      } else if (target.type === 'savings_deposit') {
        newSavings = Math.max(0, savingsBalance - target.amount);
        if (target.affectsCash !== false) {
          newBal = totalBalance + target.amount;
        }
      } else if (target.type === 'savings_withdrawal' || target.type === 'withdrawal') {
        newSavings = savingsBalance + target.amount;
        if (target.affectsCash !== false) {
          newBal = Math.max(0, totalBalance - target.amount);
        }
      }

      const updated = transactions.filter((t) => t.id !== id);
      setTotalBalance(newBal);
      setSavingsBalance(newSavings);
      setTransactions(updated);

      if (currentUser?.id) {
        dbService.syncWallet(currentUser.id, newBal, updated, newSavings)
          .then(() => showToast('Saldo & Tabungan diperbarui di Supabase!'))
          .catch(console.warn);
      }
    }
  };

  const handleUpdateBalance = (newBal: number) => {
    lastMutationTimeRef.current.wallets = Date.now();
    setTotalBalance(newBal);
    if (currentUser?.id) {
      dbService.syncWallet(currentUser.id, newBal, transactions, savingsBalance)
        .then(() => showToast('Saldo kas berhasil disimpan di Supabase!'))
        .catch(console.warn);
    }
  };

  const handleUpdateSavingsBalance = (newSavings: number) => {
    lastMutationTimeRef.current.wallets = Date.now();
    setSavingsBalance(newSavings);
    if (currentUser?.id) {
      dbService.syncWallet(currentUser.id, totalBalance, transactions, newSavings)
        .then(() => showToast('Saldo tabungan berhasil disimpan di Supabase!'))
        .catch(console.warn);
    }
  };

  const handleSaveNote = (newNote: QuickNote) => {
    lastMutationTimeRef.current.journals = Date.now();
    setQuickNotes((prev) => [newNote, ...prev]);
    if (currentUser?.id) {
      dbService.upsertJournal(currentUser.id, newNote)
        .then(() => {
          showToast('Jurnal tersimpan di Supabase!');
        })
        .catch((err: any) => {
          console.warn('Gagal simpan jurnal ke Supabase:', err);
          if (err?.code === 'PGRST205' || err?.message?.includes('PGRST205')) {
            showToast('Tabel journals belum terdaftar di Supabase. Klik "Migrasi Tabel" untuk mendaftarkannya.');
          }
        });
    } else {
      showToast('Jurnal tersimpan di memori perangkat.');
    }
  };

  const handleDeleteNote = (id: string) => {
    lastMutationTimeRef.current.journals = Date.now();
    setQuickNotes((prev) => prev.filter((n) => n.id !== id));
    if (currentUser?.id) {
      dbService.deleteJournal(currentUser.id, id)
        .then(() => showToast('Jurnal dihapus dari Supabase.'))
        .catch(console.warn);
    }
  };

  const handleWipeAll = () => {
    handleResetToCleanState();
    setIsResetModalOpen(false);
    showToast('Seluruh data berhasil di-reset menjadi bersih.');
  };

  const handleResetToSample = () => {
    setUserProfile(initialUserProfile);
    setTasks(initialTasks);
    setHabits(initialHabits);
    setTransactions(initialTransactions);
    setQuickNotes(initialQuickNotes);
    setTargets(initialTargets);
    setTotalBalance(0);
    setIsResetModalOpen(false);
    showToast('Data direset ke kondisi awal.');
  };

  const handleClearTasks = () => {
    setTasks([]);
    setIsResetModalOpen(false);
  };

  const handleClearHabits = () => {
    setHabits([]);
    setIsResetModalOpen(false);
  };

  const handleClearTransactions = () => {
    setTransactions([]);
    setTotalBalance(0);
    setIsResetModalOpen(false);
  };

  const handleClearNotes = () => {
    setQuickNotes([]);
    setIsResetModalOpen(false);
  };

  // Penutupan bulan dan reset aman (hanya dipanggil setelah berkas PDF sukses terverifikasi di storage)
  const handleCloseMonthAndReset = async () => {
    // 1. Bersihkan status centang checklist agenda untuk menyambut bulan baru
    const resetTasks = tasks.map((t) => ({
      ...t,
      days: {},
    }));
    setTasks(resetTasks);

    // 2. Reset progres hari kebiasaan ke 0 untuk bulan baru
    const resetHabits = habits.map((h) => ({
      ...h,
      completedDays: 0,
      completedToday: false,
      completedDayIndices: [],
      completedDates: [],
    }));
    setHabits(resetHabits);

    // 3. Bersihkan transaksi bulan berjalan yang telah tercatat rapi di laporan PDF
    setTransactions([]);

    // 4. Majukan bulan berjalan ke bulan berikutnya
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const nextMonthIdx = ((userProfile.monthIndex ?? new Date().getMonth()) + 1) % 12;
    const nextYear = nextMonthIdx === 0 ? userProfile.year + 1 : userProfile.year;
    const nextMonthName = monthNames[nextMonthIdx];

    const updatedProfile: UserProfile = {
      ...userProfile,
      monthIndex: nextMonthIdx,
      monthName: nextMonthName,
      year: nextYear,
      totalDaysInMonth: getDaysInMonth(nextYear, nextMonthIdx),
    };
    setUserProfile(updatedProfile);

    // 5. Sinkronisasi data bulan baru ke Supabase jika login
    if (currentUser?.id) {
      try {
        await Promise.all([
          dbService.syncAllAgendas(currentUser.id, resetTasks),
          dbService.syncAllHabits(currentUser.id, resetHabits),
          dbService.syncWallet(currentUser.id, totalBalance, []),
          dbService.syncProfile(currentUser.id, updatedProfile),
        ]);
      } catch (err) {
        console.warn('Sync setelah penutupan bulan:', err);
      }
    }

    showToast(`Bulan ${nextMonthName} ${nextYear} dimulai! Data telah bersih dan siap diisi.`);
  };

  const handleUpdateStreak = (incrementOrVal: boolean | number) => {
    setUserProfile((prev) => {
      let newStreak: number;
      if (typeof incrementOrVal === 'number') {
        newStreak = Math.max(0, incrementOrVal);
      } else {
        newStreak = incrementOrVal ? prev.streakDays + 1 : Math.max(0, prev.streakDays - 1);
      }
      const updated = { ...prev, streakDays: newStreak };
      dbService.syncProfile(currentUser.id, updated).catch(console.warn);
      return updated;
    });
  };

  const handleExportPDF = async () => {
    try {
      showToast('Menyiapkan dokumen PDF bulanan...');
      const { exportMonthlyReportPDF } = await import('../utils/pdfExport');
      exportMonthlyReportPDF({
        userProfile,
        tasks,
        habits,
        transactions,
        quickNotes,
        totalBalance,
      });
      showToast('Laporan PDF berhasil diunduh!');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Terjadi kendala saat membuat PDF. Silakan coba lagi.');
    }
  };

  const handleExportData = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userProfile,
      tasks,
      habits,
      transactions,
      quickNotes,
      targets,
      totalBalance,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journalstream_backup_${toISODateString(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup JSON berhasil diunduh.');
  };

  const handleApplySyncData = (data: any) => {
    if (data.userProfile) setUserProfile(data.userProfile);
    if (data.tasks) setTasks(data.tasks);
    if (data.habits) setHabits(data.habits);
    if (data.transactions) setTransactions(data.transactions);
    if (data.quickNotes) setQuickNotes(data.quickNotes);
    if (data.totalBalance !== undefined) setTotalBalance(data.totalBalance);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        handleApplySyncData(parsed);
        showToast('Data berhasil diimpor & disimpan!');
        setIsSettingsOpen(false);
      } catch (err) {
        alert('Gagal membaca file backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className={`${theme === 'light' ? 'bg-white text-slate-900' : 'bg-[#090D16] text-white'} flex flex-col md:flex-row antialiased relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-white min-h-screen transition-colors duration-200`}
      style={theme === 'light' ? {
        backgroundColor: '#FFFFFF',
      } : {
        backgroundColor: '#090D16',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #111827 0%, #090D16 55%, #090D16 100%)',
      }}
    >
      {/* Ambient Glowing Sci-Fi Orbs for Desktop view */}
      {theme === 'dark' ? (
        <>
          <div className="hidden md:block fixed top-[-10%] left-[-10%] w-[55vw] max-w-[600px] h-[55vw] max-h-[600px] bg-cyan-500/[0.04] rounded-full blur-[140px] pointer-events-none z-0"></div>
          <div className="hidden md:block fixed bottom-[-10%] right-[-10%] w-[65vw] max-w-[700px] h-[65vw] max-h-[700px] bg-blue-500/[0.04] rounded-full blur-[150px] pointer-events-none z-0"></div>
        </>
      ) : (
        <>
          <div className="hidden md:block fixed top-[-10%] left-[-10%] w-[55vw] max-w-[600px] h-[55vw] max-h-[600px] bg-teal-300/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
          <div className="hidden md:block fixed bottom-[-10%] right-[-10%] w-[65vw] max-w-[700px] h-[65vw] max-h-[700px] bg-emerald-200/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
        </>
      )}

      {/* Desktop Navigation Sidebar (Sci-Fi HUD Dark Teal) */}
      <Sidebar
        activeTab={activeTab}
        isOpen={true}
        onTabChange={handleTabChange}
        onOpenNewEntry={() => {
          if (activeTab === 'agenda') setNewEntryInitialType('task');
          else if (activeTab === 'habits') setNewEntryInitialType('habit');
          else if (activeTab === 'finance') setNewEntryInitialType('transaction');
          else if (activeTab === 'notes') setNewEntryInitialType('note');
          else setNewEntryInitialType('task');
          setIsNewEntryOpen(true);
        }}
        currentUser={currentUser}
        userProfile={userProfile}
        isSupabaseConfigured={isSupabaseConfigured()}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onLogout={onLogout}
        onOpenAnnouncementsAdmin={() => setIsAnnouncementsAdminOpen(true)}
        announcements={announcements}
        theme={theme}
      />

      {/* Main Container Area - Responsive Margin for Sidebar */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 w-full min-w-0 max-w-full overflow-x-hidden md:ml-[250px]">
        {/* Mobile Navigation Header & Bottom Nav */}
        <MobileNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenNewEntry={(type) => {
            if (type) setNewEntryInitialType(type);
            setIsNewEntryOpen(true);
          }}
          onOpenSettings={() => handleTabChange('settings')}
          onOpenProfile={() => handleTabChange('profile')}
          isProfileOpen={activeTab === 'profile'}
          isSettingsOpen={activeTab === 'settings'}
          currentUser={currentUser}
          userProfile={userProfile}
          isSupabaseConfigured={isSupabaseConfigured()}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onLogout={onLogout}
          onOpenAnnouncementsAdmin={() => setIsAnnouncementsAdminOpen(true)}
          announcements={announcements}
          theme={theme}
        />


        {/* Top Header Khusus Desktop: Sejajar & Menyambung dengan Header Sidebar (h-[70px] dengan border-b) */}
        <header className={`hidden md:flex h-[70px] px-6 lg:px-8 items-center justify-between gap-4 shrink-0 border-b sticky top-0 z-30 transition-colors ${
          theme === 'light' 
            ? 'bg-gradient-to-t from-teal-100/90 via-[#EBF7F2] to-white border-teal-500/25 text-slate-900 shadow-xs' 
            : 'bg-gradient-to-t from-emerald-950/40 via-[#0A121E] to-[#090D16] border-emerald-900/40 text-white shadow-md'
        }`}>
          {/* 1. Kolom Pencarian Berukuran Panjang Sebagai Elemen Utama */}
          <div className="flex-1 min-w-0 max-w-3xl">
            <GlobalSearchBar
              tasks={tasks}
              habits={habits}
              notes={quickNotes}
              transactions={transactions}
              targets={targets}
              onNavigateToTab={handleTabChange}
              theme={theme}
              placeholder="Cari agenda, kebiasaan, catatan, transaksi, target..."
            />
          </div>

          {/* Sisi Kanan: Ikon Pemberitahuan & Foto Profil Pengguna */}
          <div className="flex items-center gap-3 shrink-0">
            {/* 2. Ikon Pemberitahuan di Sebelah Kanan Kolom Pencarian */}
            <button
              type="button"
              onClick={() => handleTabChange('notifications')}
              title={unreadAnnouncementsCount > 0 ? `${unreadAnnouncementsCount} Pemberitahuan Baru` : "Pemberitahuan & Update"}
              aria-label={unreadAnnouncementsCount > 0 ? `${unreadAnnouncementsCount} Pemberitahuan Baru` : "Pemberitahuan & Update"}
              className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white/90 border-teal-200/90 text-teal-700 hover:bg-teal-50 hover:border-teal-400 shadow-xs'
                  : 'bg-[#0B101D] border-slate-700/80 text-cyan-300 hover:bg-[#111726] hover:border-cyan-400/50 shadow-md'
              }`}
            >
              <Bell className="w-4.5 h-4.5 stroke-[2.2]" />
              {unreadAnnouncementsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-white dark:ring-[#0B101D]" />
              )}
            </button>

            {/* 3. Akun Pengguna: Foto & Nama dengan Efek Transisi Menggulung */}
            <RollingProfileBadge
              avatarUrl={headerAvatarUrl}
              displayName={headerDisplayName}
              theme={theme}
              onClick={() => handleTabChange('profile')}
              variant="desktop"
            />
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className={`flex-grow ${activeTab === 'dashboard' || activeTab === 'profile' || activeTab === 'settings' ? 'p-0' : 'p-4 sm:p-6 md:p-8 space-y-6 pb-20 md:pb-16'} max-w-[1400px] mx-auto w-full`}>
          <AnimatePresence mode="wait" initial={false}>
            {isInitialEntryLoading || isLoadingFromSupabase || isTabTransitioning ? (
              <motion.div
                key={`skeleton-${activeTab}`}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="w-full"
              >
                <PageTransitionSkeleton tab={activeTab} theme={theme} />
              </motion.div>
            ) : (
              <motion.div
                key={`content-${activeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
          {activeTab === 'dashboard' && (
              <div>
                {/* TAMPILAN KHUSUS HP / MOBILE (TIDAK DIUBAH - TETAP PERSIS ASLINYA) */}
                <div className="md:hidden">
                  <MobileDashboardHero
                    userProfile={userProfile}
                    totalBalance={totalBalance}
                    savingsBalance={savingsBalance}
                    incomeToday={incomeToday}
                    expenseToday={expenseToday}
                    currencySymbol={userProfile.currencySymbol}
                    transactions={transactions}
                    tasks={tasks}
                    habits={habits}
                    targets={targets}
                    notes={quickNotes}
                    levelProgress={levelProgress}
                    announcements={announcements}
                    onOpenNewEntry={(type) => {
                      if (type) setNewEntryInitialType(type);
                      setIsNewEntryOpen(true);
                    }}
                    onAddTransaction={handleAddTransaction}
                    onNavigateToTab={handleTabChange}
                    onUpdateTasks={handleUpdateTasks}
                    onUpdateHabits={handleUpdateHabits}
                    onToggleTarget={handleToggleTarget}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                    onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
                    onExportPDF={handleExportPDF}
                    onExportData={handleExportData}
                    onOpenProfile={() => handleTabChange('profile')}
                    onOpenSettings={() => handleTabChange('settings')}
                    onOpenHelp={() => setIsHelpOpen(true)}
                    onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                    onOpenSync={() => setIsSyncModalOpen(true)}
                    onOpenAnnouncementsAdmin={() => setIsAnnouncementsAdminOpen(true)}
                    isAdmin={checkIsAdminUser(currentUser, userProfile)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    onLogout={onLogout}
                  />
                </div>

                {/* TAMPILAN KHUSUS LEPTOP (SESUAI GAMBAR REFERENSI PENGGUNA) */}
                <div className="hidden md:block">
                  <AscendDesktopDashboard
                    userProfile={userProfile}
                    userEmail={currentUser?.email}
                    totalBalance={totalBalance}
                    savingsBalance={savingsBalance}
                    incomeToday={incomeToday}
                    expenseToday={expenseToday}
                    tasks={tasks}
                    transactions={transactions}
                    habits={habits}
                    targets={targets}
                    notes={quickNotes}
                    announcements={announcements}
                    activeTab={activeTab}
                    onNavigateToTab={handleTabChange}
                    onOpenNewEntry={(type) => {
                      if (type) setNewEntryInitialType(type);
                      setIsNewEntryOpen(true);
                    }}
                    theme={theme}
                  />
                </div>
              </div>
          )}

          {activeTab === 'progress' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <ProgressView
                tasks={tasks}
                habits={habits}
                userProfile={userProfile}
                targets={targets}
                levelProgress={levelProgress}
                totalBalance={totalBalance}
                savingsBalance={savingsBalance}
                incomeToday={incomeToday}
                expenseToday={expenseToday}
                currencySymbol={userProfile.currencySymbol}
                transactions={transactions}
                onUpdateHabits={handleUpdateHabits}
                onUpdateStreak={handleUpdateStreak}
                onToggleTarget={handleToggleTarget}
                onUpdateTargetCount={handleUpdateTargetCount}
                onAddTarget={handleAddTarget}
                onDeleteTarget={handleDeleteTarget}
                onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
                onOpenNewEntry={() => {
                  setNewEntryInitialType('task');
                  setIsNewEntryOpen(true);
                }}
                onExportPDF={handleExportPDF}
                onNavigateToTargets={() => handleTabChange('targets')}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'agenda' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <AgendaView
                tasks={tasks}
                onUpdateTasks={handleUpdateTasks}
                userProfile={userProfile}
                onOpenNewEntry={() => {
                  setNewEntryInitialType('task');
                  setIsNewEntryOpen(true);
                }}
                onOpenCloseMonthModal={() => setIsCloseMonthModalOpen(true)}
                onShowToast={showToast}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'habits' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <HabitsView
                habits={habits}
                tasks={tasks}
                userProfile={userProfile}
                streakDays={userProfile.streakDays}
                onUpdateHabits={handleUpdateHabits}
                onUpdateStreak={handleUpdateStreak}
                onAddHabit={handleAddHabit}
                onOpenNewEntry={() => {
                  setNewEntryInitialType('habit');
                  setIsNewEntryOpen(true);
                }}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'finance' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <FinanceView
                transactions={transactions}
                totalBalance={totalBalance}
                savingsBalance={savingsBalance}
                incomeToday={incomeToday}
                expenseToday={expenseToday}
                withdrawalToday={withdrawalToday}
                userProfile={userProfile}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onOpenNewEntry={() => {
                  setNewEntryInitialType('transaction');
                  setIsNewEntryOpen(true);
                }}
                onUpdateSavingsBalance={handleUpdateSavingsBalance}
                onUpdateTotalBalance={handleUpdateBalance}
                onNavigateToDashboard={() => handleTabChange('dashboard')}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'targets' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <TargetsView
                targets={targets}
                onToggleTarget={handleToggleTarget}
                onUpdateTargetCount={handleUpdateTargetCount}
                onAddTarget={handleAddTarget}
                onDeleteTarget={handleDeleteTarget}
                onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'notes' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <NotesView
                notes={quickNotes}
                userProfile={userProfile}
                onSaveNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'archive' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <ArchiveView
                userId={currentUser?.id}
                tasks={tasks}
                habits={habits}
                transactions={transactions}
                notes={quickNotes}
                userProfile={userProfile}
                totalBalance={totalBalance}
                onExportData={handleExportData}
                onExportPDF={handleExportPDF}
                onOpenResetModal={() => setIsResetModalOpen(true)}
                onOpenCloseMonthModal={() => setIsCloseMonthModalOpen(true)}
                onShowToast={showToast}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'profile' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <ProfileView
                userProfile={userProfile}
                onUpdateProfile={(updatedProfile) => {
                  setUserProfile(updatedProfile);
                  if (currentUser?.id) {
                    dbService.syncProfile(currentUser.id, updatedProfile).catch(console.warn);
                  }
                }}
                currentUser={currentUser}
                totalBalance={totalBalance}
                onOpenSupabaseModal={() => handleOpenSupabaseModal('config')}
                onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
                onOpenAnnouncementsAdmin={() => setIsAnnouncementsAdminOpen(true)}
                onNavigateToTab={(tab) => handleTabChange(tab)}
                onOpenSync={() => setIsSyncModalOpen(true)}
                onOpenHelp={() => setIsHelpOpen(true)}
                onOpenSettings={() => handleTabChange('settings')}
                onShowToast={showToast}
                onNavigateToDashboard={() => handleTabChange('dashboard')}
                onLogout={onLogout}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'admin-feedback' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <AdminFeedbackView
                currentUser={currentUser}
                userProfile={userProfile}
                onShowToast={showToast}
                onNavigateToDashboard={() => handleTabChange('dashboard')}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'admin-portal' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <AdminPortalView
                currentUser={currentUser}
                userProfile={userProfile}
                announcements={announcements}
                onAnnouncementsUpdated={(updated) => setAnnouncements(updated)}
                onOpenAnnouncementsAdmin={() => setIsAnnouncementsAdminOpen(true)}
                onShowToast={showToast}
                onNavigateToDashboard={() => handleTabChange('dashboard')}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'notifications' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <NotificationsView
                announcements={announcements}
                userProfile={userProfile}
                currentUser={currentUser}
                onNavigateToDashboard={() => handleTabChange('dashboard')}
                onOpenAnnouncementsAdmin={() => setIsAnnouncementsAdminOpen(true)}
                onSimulateReminder={handleSimulateReminder}
                onShowToast={showToast}
                theme={theme}
              />
            </Suspense>
          )}

          {activeTab === 'settings' && (
            <Suspense fallback={<PageTransitionSkeleton tab={activeTab} theme={theme} />}>
              <SettingsView
                userProfile={userProfile}
                onUpdateProfile={(updatedProfile) => {
                  setUserProfile(updatedProfile);
                  if (currentUser?.id) {
                    dbService.syncProfile(currentUser.id, updatedProfile).catch(console.warn);
                  }
                }}
                onOpenResetModal={() => setIsResetModalOpen(true)}
                onExportData={handleExportData}
                onExportPDF={handleExportPDF}
                onImportData={handleImportData}
                onOpenSync={() => setIsSyncModalOpen(true)}
                onSimulateReminder={handleSimulateReminder}
                currentUser={currentUser}
                onOpenSupabaseModal={() => handleOpenSupabaseModal('account')}
                isSupabaseConfigured={isSupabaseConfigured()}
                onLogout={onLogout}
                onOpenProfile={() => handleTabChange('profile')}
                onOpenHelp={() => setIsHelpOpen(true)}
                onNavigateToDashboard={() => handleTabChange('dashboard')}
                onShowToast={showToast}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </Suspense>
          )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 border border-emerald-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-100">{toastMessage}</span>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {isInstallModalOpen && (
          <InstallAppModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
          />
        )}

        {isNewEntryOpen && (
          <NewEntryModal
            isOpen={isNewEntryOpen}
            onClose={() => setIsNewEntryOpen(false)}
            onAddTask={handleAddTask}
            onAddHabit={handleAddHabit}
            onAddTransaction={handleAddTransaction}
            onAddNote={handleSaveNote}
            currencySymbol={userProfile.currencySymbol}
            initialType={newEntryInitialType}
            theme={theme}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            userProfile={userProfile}
            onUpdateProfile={(updatedProfile) => {
              setUserProfile(updatedProfile);
              dbService.syncProfile(currentUser.id, updatedProfile).catch(console.warn);
            }}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onExportData={handleExportData}
            onExportPDF={handleExportPDF}
            onImportData={handleImportData}
            onOpenSync={() => setIsSyncModalOpen(true)}
            onSimulateReminder={handleSimulateReminder}
            currentUser={currentUser}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            isSupabaseConfigured={isSupabaseConfigured()}
            onLogout={onLogout}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            userProfile={userProfile}
            onUpdateProfile={(updatedProfile) => {
              setUserProfile(updatedProfile);
              if (currentUser?.id) {
                dbService.syncProfile(currentUser.id, updatedProfile).catch(console.warn);
              }
            }}
            currentUser={currentUser}
            onLogout={onLogout}
            onShowToast={showToast}
            theme={theme}
          />
        )}

        {isFeedbackModalOpen && (
          <Suspense fallback={null}>
            <ExperienceFeedbackModal
              isOpen={isFeedbackModalOpen}
              onClose={() => {
                setIsFeedbackModalOpen(false);
                sessionStorage.setItem('journalstream_feedback_dismissed', 'true');
              }}
              initialFeedback={userProfile.feedback}
              is24HourTrigger={
                Boolean((userProfile.accountCreatedAt || localStorage.getItem('ascend_account_created_at')) && 
                  (Date.now() - new Date(userProfile.accountCreatedAt || localStorage.getItem('ascend_account_created_at') || '').getTime()) >= 24 * 60 * 60 * 1000
                )
              }
              firstAppOpenAt={userProfile.firstAppOpenAt}
              accountCreatedAt={userProfile.accountCreatedAt || localStorage.getItem('ascend_account_created_at') || currentUser?.created_at}
              onShowToast={showToast}
              onSaveFeedback={(newFeedback) => {
                const updatedProfile = {
                  ...userProfile,
                  feedback: newFeedback,
                };
                setUserProfile(updatedProfile);
                localStorage.setItem('journalstream_user_profile', JSON.stringify(updatedProfile));
                localStorage.setItem('journalstream_app_feedback', JSON.stringify(newFeedback));
                if (currentUser?.id) {
                  dbService.syncProfile(currentUser.id, updatedProfile).catch(console.warn);
                }
              }}
            />
          </Suspense>
        )}

        {isSyncModalOpen && (
          <DeviceSyncModal
            isOpen={isSyncModalOpen}
            onClose={() => setIsSyncModalOpen(false)}
            userProfile={userProfile}
            tasks={tasks}
            habits={habits}
            transactions={transactions}
            quickNotes={quickNotes}
            totalBalance={totalBalance}
            onApplySyncData={handleApplySyncData}
            showToast={showToast}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            currentUser={currentUser}
            theme={theme}
          />
        )}

        <SupabaseAuthModal
          isOpen={isSupabaseModalOpen}
          onClose={() => {
            setIsSupabaseModalOpen(false);
          }}
          currentUser={currentUser}
          onUserChange={() => {}}
          userProfile={userProfile}
          tasks={tasks}
          habits={habits}
          transactions={transactions}
          quickNotes={quickNotes}
          targets={targets}
          totalBalance={totalBalance}
          onApplyCloudData={handleApplyCloudData}
          showToast={showToast}
          realtimeStatus={realtimeStatus}
          initialTab={supabaseModalTab}
        />

        {/* Modal Khusus Admin: Menulis & Mengelola Pengumuman Aplikasi */}
        {isAnnouncementsAdminOpen && (
          <AdminAnnouncementsModal
            isOpen={isAnnouncementsAdminOpen}
            onClose={() => setIsAnnouncementsAdminOpen(false)}
            currentUser={currentUser}
            userProfile={userProfile}
            onShowToast={showToast}
            onAnnouncementsUpdated={(updatedList) => {
              setAnnouncements(updatedList);
              showToast('Pengumuman berhasil disiarkan ke seluruh pengguna!');
            }}
          />
        )}

        {isResetModalOpen && (
          <ResetConfirmModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            onWipeAll={handleWipeAll}
            onResetToSample={handleResetToSample}
            onClearTasks={handleClearTasks}
            onClearHabits={handleClearHabits}
            onClearTransactions={handleClearTransactions}
            onClearNotes={handleClearNotes}
            theme={theme}
          />
        )}

        {isHelpOpen && (
          <HelpModal
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
            theme={theme}
          />
        )}

        {isCloseMonthModalOpen && (
          <CloseMonthModal
            isOpen={isCloseMonthModalOpen}
            onClose={() => setIsCloseMonthModalOpen(false)}
            userId={currentUser?.id}
            userProfile={userProfile}
            tasks={tasks}
            habits={habits}
            transactions={transactions}
            notes={quickNotes}
            totalBalance={totalBalance}
            onResetMonthData={handleCloseMonthAndReset}
            onArchiveCompleted={(report) => {
              showToast(`Laporan ${report.monthName} berhasil diarsipkan ke Supabase Storage!`);
            }}
            theme={theme}
          />
        )}
      </Suspense>

      <LevelRoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
        levelProgress={levelProgress}
        theme={theme}
      />

      {/* Modal Notifikasi Sukses Transaksi & Unduh Bukti PDF */}
      {recentTransactionReceipt && (
        <TransactionSuccessModal
          receipt={recentTransactionReceipt}
          onClose={() => setRecentTransactionReceipt(null)}
          isLight={theme === 'light'}
        />
      )}

      {/* Prompt Permintaan Izin Notifikasi Perangkat Resmi Browser */}
      <DeviceNotificationPermissionPrompt isLight={theme === 'light'} />
    </div>
  );
};
