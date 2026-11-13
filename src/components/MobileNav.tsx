import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home,
  Megaphone,
  Plus,
  Settings,
  User as UserIcon,
  X,
  Landmark,
  Calendar,
  CheckCircle2,
  StickyNote,
  ExternalLink,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import { NavTab, UserProfile, AppAnnouncement } from '../types';
import { User } from '@supabase/supabase-js';

interface MobileNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewEntry?: (type?: 'task' | 'habit' | 'transaction' | 'note') => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  isProfileOpen?: boolean;
  isSettingsOpen?: boolean;
  currentUser?: User | null;
  userProfile?: UserProfile;
  isSupabaseConfigured?: boolean;
  onOpenSupabaseModal?: () => void;
  onLogout?: () => void;
  onOpenAnnouncementsAdmin?: () => void;
  announcements?: AppAnnouncement[];
  theme?: 'dark' | 'light';
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewEntry,
  onOpenSettings,
  onOpenProfile,
  isProfileOpen = false,
  isSettingsOpen = false,
  currentUser,
  userProfile,
  onOpenAnnouncementsAdmin,
  announcements = [],
  theme = 'dark',
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const isLight = theme === 'light';

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Beranda';
      case 'finance': return 'Keuangan & Tabungan';
      case 'progress': return 'Analytics & XP';
      case 'agenda': return 'Agenda Harian';
      case 'habits': return 'Pelacak Kebiasaan';
      case 'targets': return 'Target & Gol';
      case 'notes': return 'Catatan & Memo';
      case 'archive': return 'Arsip & Laporan';
      case 'profile': return 'Profil Pengguna';
      case 'settings': return 'Pengaturan & Cloud';
      case 'notifications': return 'Pemberitahuan & Update';
      case 'admin-feedback': return 'Penilaian Pengguna';
      case 'admin-portal': return 'Portal Administrator';
      default: return 'Ascend Journal';
    }
  };

  const READ_ANNOUNCEMENTS_STORAGE_KEY = 'ascend_read_announcements_ids';
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(READ_ANNOUNCEMENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
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

  // Hitung pengumuman yang aktif dan belum dibaca pengguna
  const activeAnnouncements = announcements.filter(a => a.isActive);
  const unreadCount = activeAnnouncements.filter(a => !readAnnouncementIds.includes(a.id)).length;

  // Tentukan ID item navigasi yang aktif (Setiap item memiliki halaman sendiri)
  const currentActiveId: 'home' | 'notifications' | 'add' | 'settings' | 'profile' = isAddMenuOpen
    ? 'add'
    : activeTab === 'notifications' || isNotificationsOpen
    ? 'notifications'
    : isProfileOpen || activeTab === 'profile'
    ? 'profile'
    : isSettingsOpen || activeTab === 'settings'
    ? 'settings'
    : 'home';

  const navItems = [
    { id: 'home' as const, label: 'Beranda', icon: Home },
    { id: 'notifications' as const, label: 'Notifikasi', icon: Megaphone },
    { id: 'add' as const, label: 'Tambah', icon: Plus },
    { id: 'settings' as const, label: 'Pengaturan', icon: Settings },
    { id: 'profile' as const, label: 'Profil', icon: UserIcon },
  ];

  const handleItemClick = (id: 'home' | 'notifications' | 'add' | 'settings' | 'profile') => {
    if (id === 'home') {
      setIsAddMenuOpen(false);
      setIsNotificationsOpen(false);
      onTabChange('dashboard');
    } else if (id === 'notifications') {
      setIsAddMenuOpen(false);
      setIsNotificationsOpen(false);
      onTabChange('notifications');
    } else if (id === 'add') {
      setIsNotificationsOpen(false);
      setIsAddMenuOpen(prev => !prev);
    } else if (id === 'settings') {
      setIsAddMenuOpen(false);
      setIsNotificationsOpen(false);
      onTabChange('settings');
    } else if (id === 'profile') {
      setIsAddMenuOpen(false);
      setIsNotificationsOpen(false);
      onTabChange('profile');
    }
  };

  // Item menu aksi melingkar (Radial Action Menu) di sekitar tombol (+)
  const radialMenuItems = [
    {
      id: 'task',
      title: 'Agenda',
      sublabel: 'Tugas Harian',
      icon: Calendar,
      x: -92,
      y: -52,
      gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      glow: '0 8px 22px rgba(16, 185, 129, 0.45)',
      onClick: () => {
        setIsAddMenuOpen(false);
        onOpenNewEntry?.('task');
      },
    },
    {
      id: 'habit',
      title: 'Kebiasaan',
      sublabel: 'Rutinitas',
      icon: CheckCircle2,
      x: -38,
      y: -104,
      gradient: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)',
      glow: '0 8px 22px rgba(5, 150, 105, 0.45)',
      onClick: () => {
        setIsAddMenuOpen(false);
        onOpenNewEntry?.('habit');
      },
    },
    {
      id: 'transaction',
      title: 'Keuangan',
      sublabel: 'Catat Kas',
      icon: Landmark,
      x: 38,
      y: -104,
      gradient: 'linear-gradient(135deg, #0D9488 0%, #115E59 100%)',
      glow: '0 8px 22px rgba(13, 148, 136, 0.45)',
      onClick: () => {
        setIsAddMenuOpen(false);
        onOpenNewEntry?.('transaction');
      },
    },
    {
      id: 'note',
      title: 'Catatan',
      sublabel: 'Memo & Ide',
      icon: StickyNote,
      x: 92,
      y: -52,
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      glow: '0 8px 22px rgba(6, 182, 212, 0.45)',
      onClick: () => {
        setIsAddMenuOpen(false);
        onOpenNewEntry?.('note');
      },
    },
  ];

  return (
    <>
      {/* Mobile Top App Bar (Hanya ditampilkan pada halaman sub-view selain dashboard) */}
      <AnimatePresence>
        {activeTab !== 'dashboard' && (
          <motion.header
            key="mobile-subpage-header"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={isLight ? { backgroundColor: '#032D22', borderColor: 'rgba(45, 212, 191, 0.3)' } : { backgroundColor: '#141A2E', borderColor: 'rgba(255, 255, 255, 0.08)' }}
            className="md:hidden border-b flex items-center justify-between w-full px-3 h-14 sticky top-0 z-20 shadow-md backdrop-blur-xl text-white"
          >
            {/* Sisi Kiri: Ikon panah kembali + Nama Halaman Fitur */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0 ${
                  isLight
                    ? 'text-teal-200 hover:text-white hover:bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Kembali ke Dashboard"
                aria-label="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>

              <motion.span
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`text-[15px] font-semibold truncate ${
                  isLight ? 'text-teal-50' : 'text-slate-100'
                }`}
              >
                {getPageTitle(activeTab)}
              </motion.span>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* MENU POP-UP MELINGKAR (RADIAL ACTION MENU) */}
      <AnimatePresence>
        {isAddMenuOpen && (
          <div className="fixed inset-0 z-45 md:hidden pointer-events-none select-none">
            {/* Backdrop Gelap dengan Efek Blur Ringan */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsAddMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto cursor-pointer"
            />

            {/* Radial Menu Hub - Berpusat tepat di atas tombol aksi utama (+) */}
            <div className="absolute bottom-[66px] left-1/2 -translate-x-1/2 pointer-events-none z-50">
              {/* Soft Radial Ambient Glow */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.22 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"
              />

              {/* Faint Dotted Radial Arc Line */}
              <motion.svg
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.45, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none"
                viewBox="0 0 256 256"
              >
                <path
                  d="M 34 85 A 106 106 0 0 1 222 85"
                  fill="none"
                  stroke={isLight ? '#2DD4BF' : '#10B981'}
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                />
              </motion.svg>

              {/* Tombol-tombol Fitur Melingkar (Radial Action Buttons) */}
              {radialMenuItems.map((opt, idx) => {
                const OptIcon = opt.icon;
                return (
                  <motion.div
                    key={opt.id}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{ opacity: 1, scale: 1, x: opt.x, y: opt.y }}
                    exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    transition={{
                      type: 'spring',
                      damping: 18,
                      stiffness: 280,
                      delay: idx * 0.03,
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        opt.onClick();
                      }}
                      className="flex flex-col items-center group cursor-pointer active:scale-90 transition-transform focus:outline-none"
                    >
                      {/* Tombol Bulat Bernuansa Emerald */}
                      <div
                        style={{
                          background: opt.gradient,
                          boxShadow: opt.glow,
                        }}
                        className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white/35 relative overflow-hidden transition-all duration-200 group-hover:scale-110"
                      >
                        {/* Glossy Top Glass Reflex */}
                        <div
                          style={{
                            background:
                              'linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
                          }}
                          className="absolute top-0 inset-x-0 h-1/2 rounded-t-full pointer-events-none"
                        />
                        <OptIcon className="w-5 h-5 text-white stroke-[2.4] relative z-10 drop-shadow-sm" />
                      </div>

                      {/* Label Badge */}
                      <span
                        className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight shadow-lg border whitespace-nowrap select-none transition-colors ${
                          isLight
                            ? 'bg-[#032D22]/95 border-teal-400/40 text-teal-50 shadow-teal-950/40'
                            : 'bg-[#0E141E]/95 border-emerald-500/35 text-white shadow-black/70'
                        }`}
                      >
                        {opt.title}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* BILAH NAVIGASI BAWAH (100% Bersatu dengan Layar HP di Bagian Bawah) */}
      <nav 
        aria-label="Navigasi Bawah Mobile"
        className={`md:hidden fixed bottom-0 inset-x-0 w-full select-none overflow-visible ${
          isAddMenuOpen ? 'z-50' : 'z-40'
        }`}
      >
        <div 
          className="relative h-[68px] w-full px-2 flex items-center justify-around overflow-visible backdrop-blur-2xl border-t"
          style={isLight ? {
            background: 'linear-gradient(180deg, #032D22 0%, #04382B 100%)',
            boxShadow: '0 -4px 20px rgba(3, 45, 34, 0.25)',
            borderColor: 'rgba(45, 212, 191, 0.35)',
          } : {
            background: 'linear-gradient(180deg, rgba(14, 20, 30, 0.98) 0%, rgba(10, 14, 22, 0.98) 100%)',
            boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.65)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {navItems.map((item) => {
            const isActive = currentActiveId === item.id;
            const Icon = item.icon;

            // Tombol Tambah (+) Melayang di Tengah
            if (item.id === 'add') {
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  aria-label={isAddMenuOpen ? 'Tutup Pilihan Tambah' : item.label}
                  className="relative flex-1 h-full flex flex-col items-center justify-center cursor-pointer focus:outline-none transition-all group overflow-visible z-50"
                >
                  <motion.div 
                    animate={{
                      rotate: isAddMenuOpen ? 135 : 0,
                      scale: isAddMenuOpen ? 1.05 : 1,
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className={`w-13 h-13 -mt-6 rounded-full bg-[#2DD4BF] text-[#0B0E14] flex items-center justify-center shadow-[0_0_24px_rgba(45,212,191,0.7)] ${
                      isLight ? 'border-4 border-[#032D22]' : 'border-4 border-[#0B0E14]'
                    } cursor-pointer active:scale-95 transition-transform`}
                  >
                    <Plus 
                      className="w-6 h-6 text-[#0B0E14] stroke-[3]" 
                    />
                  </motion.div>
                  <span 
                    className="text-[#2DD4BF] text-[10.5px] tracking-tight text-center mt-1 font-semibold transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
                  >
                    {isAddMenuOpen ? 'Tutup' : 'Tambah'}
                  </span>
                </button>
              );
            }

            // Menu Lain: Beranda, Notifikasi, Pengaturan, Profil
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                aria-label={item.label}
                className="relative flex-1 h-full flex flex-col items-center justify-center cursor-pointer focus:outline-none transition-all group overflow-visible"
              >
                {/* Indikator Garis Atas Bergeser Halus (Sliding Top Active Bar) */}
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active-bar"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    className="absolute top-0 w-9 h-[3px] rounded-b-full bg-[#2DD4BF] shadow-[0_2px_12px_rgba(45,212,191,0.85)] pointer-events-none"
                  />
                )}

                <div className="flex flex-col items-center justify-center py-1 transition-transform group-active:scale-90">
                  <div className="relative px-3.5 py-1 flex items-center justify-center">
                    {/* Pill Latar Belakang Bergeser (Morphing Active Pill) */}
                    {isActive && (
                      <motion.span
                        layoutId="mobile-nav-active-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 pointer-events-none"
                      />
                    )}

                    <motion.div
                      animate={{
                        scale: isActive ? 1.12 : 1,
                        y: isActive ? -1 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                      className="relative z-10"
                    >
                      <Icon 
                        className={`w-5 h-5 transition-colors duration-200 ${
                          isActive 
                            ? 'text-[#2DD4BF] stroke-[2.4]' 
                            : (isLight ? 'text-teal-100 stroke-[1.8] group-hover:text-white' : 'text-slate-200 stroke-[1.8] group-hover:text-white')
                        }`} 
                      />
                      {item.id === 'notifications' && unreadCount > 0 && (
                        <span 
                          className={`absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white font-black text-[9px] leading-none flex items-center justify-center shadow-xs border ${
                            isLight ? 'border-[#032D22]' : 'border-[#0E141E]'
                          } animate-in zoom-in-75 duration-150`}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </motion.div>
                  </div>

                  <motion.span 
                    animate={{
                      scale: isActive ? 1.03 : 1,
                      opacity: isActive ? 1 : 0.85,
                    }}
                    transition={{ duration: 0.18 }}
                    className={`text-[10.5px] tracking-tight text-center mt-0.5 transition-colors duration-200 font-semibold ${
                      isActive 
                        ? 'text-[#2DD4BF]' 
                        : (isLight ? 'text-teal-100 group-hover:text-white' : 'text-slate-200 group-hover:text-white')
                    }`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
                  >
                    {item.label}
                  </motion.span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* DRAWER / BOTTOM SHEET PEMBERITAHUAN & NOTIFIKASI MOBILE */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            {/* Backdrop Gelap dengan Efek Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-xs"
            />

            {/* Kontainer Lembar Bawah (Bottom Sheet) */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-lg mx-auto bg-[#12172A] text-white rounded-t-[32px] p-5 pb-28 border-t border-indigo-400/25 shadow-2xl z-10 max-h-[85vh] overflow-y-auto space-y-5"
            >
              {/* Handle Bar */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />

              {/* Header Lembar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Megaphone className="w-5 h-5 -rotate-12" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      Pemberitahuan
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                          {unreadCount} Baru
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">Pengumuman & update sistem terbaru</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Tutup Pemberitahuan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Ringkasan Streak & Pengingat */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-950/40 border border-indigo-400/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Konsistensi Hari Ini</h4>
                    <p className="text-[11px] text-slate-300">
                      Streak aktif: <span className="text-orange-400 font-bold">{userProfile?.streakDays || 0} hari</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aktif</span>
                </div>
              </div>

              {/* Daftar Pengumuman Resmi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Pengumuman Resmi</span>
                </div>

                {activeAnnouncements.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeAnnouncements.map((announcement) => {
                      const isEvent = announcement.type === 'event';
                      const isWarning = announcement.type === 'warning';
                      const isUpdate = announcement.type === 'update';

                      return (
                        <div
                          key={announcement.id}
                          className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-indigo-400/30 transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isEvent 
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                  : isWarning 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : isUpdate
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              }`}>
                                {announcement.type}
                              </span>
                              <h4 className="text-xs font-bold text-white tracking-tight">
                                {announcement.title}
                              </h4>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {announcement.createdAt?.slice(0, 10) || 'Baru'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {announcement.message}
                          </p>

                          {announcement.actionUrl && (
                            <div className="pt-1">
                              <a
                                href={announcement.actionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                              >
                                <span>{announcement.actionLabel || 'Pelajari Lebih Lanjut'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center text-slate-400">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h5 className="text-xs font-semibold text-slate-300">Semua Pemberitahuan Sudah Terbaca</h5>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Belum ada pengumuman baru dari administrator. Semua aktivitas berjalan optimal!
                    </p>
                  </div>
                )}
              </div>

              {/* Tombol Tutup */}
              <div className="pt-2">
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Tutup Notifikasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
