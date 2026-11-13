import React from 'react';
import { 
  LayoutGrid, 
  Calendar, 
  CheckCircle2, 
  Landmark, 
  TrendingUp, 
  Target, 
  StickyNote, 
  FolderArchive, 
  Settings,
  ArrowLeft
} from 'lucide-react';
import { NavTab, UserProfile } from '../types';
import { User } from '@supabase/supabase-js';
import { AppLogo } from './AppLogo';

interface SidebarProps {
  activeTab: NavTab;
  isOpen?: boolean;
  onToggle?: () => void;
  onTabChange: (tab: NavTab) => void;
  onOpenNewEntry?: () => void;
  currentUser?: User | null;
  userProfile?: UserProfile;
  isSupabaseConfigured?: boolean;
  onOpenSupabaseModal?: () => void;
  onLogout?: () => void;
  onToggleTheme?: () => void;
  onOpenHelp?: () => void;
  onOpenAnnouncementsAdmin?: () => void;
  announcements?: any[];
  theme?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  theme = 'light',
}) => {
  const isLight = theme === 'light';

  // Daftar Navigasi Pilihan Fitur (Sesuai Referensi Gambar Pengguna)
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dasbor Awal', icon: LayoutGrid },
    { id: 'agenda' as NavTab, label: 'Agenda Harian', icon: Calendar },
    { id: 'habits' as NavTab, label: 'Pelacak Kebiasaan', icon: CheckCircle2 },
    { id: 'finance' as NavTab, label: 'Keuangan & Kas', icon: Landmark },
    { id: 'progress' as NavTab, label: 'Perkembangan', icon: TrendingUp },
    { id: 'targets' as NavTab, label: 'Target & Gol', icon: Target },
    { id: 'notes' as NavTab, label: 'Catatan & Memo', icon: StickyNote },
    { id: 'archive' as NavTab, label: 'Arsip & Riwayat', icon: FolderArchive },
  ];

  return (
    <aside 
      id="desktop-sidebar"
      className={`hidden md:flex fixed left-0 top-0 bottom-0 z-30 flex-col select-none transition-all duration-300 w-[250px] ${
        isLight 
          ? 'bg-[#02231A] text-white shadow-2xl border-r border-teal-500/20' 
          : 'bg-[#111827] text-white shadow-xl border-r border-[#263449]'
      }`}
    >
      {/* 1. Header Logo & Nama ASCEND JOURNAL (atau Ikon Panah Kembali saja saat di halaman fitur) */}
      <div className={`h-[70px] px-4 flex items-center shrink-0 border-b ${
        isLight ? 'border-teal-500/25' : 'border-[#263449]'
      }`}>
        {activeTab === 'dashboard' ? (
          <div 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
            title="Ke Dasbor Awal ASCEND Journal"
          >
            <AppLogo size="md" showBadgeDot={false} className="group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-['Montserrat',sans-serif] font-bold text-[15.5px] tracking-[0.14em] uppercase text-[#F59E0B] leading-none">
                  ASCEND
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" />
              </div>
              <span className={`font-['Montserrat',sans-serif] font-medium text-[10px] tracking-[0.3em] uppercase mt-1 ${
                isLight ? 'text-[#5EEAD4]' : 'text-cyan-400'
              }`}>
                JOURNAL
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
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

            <span className={`text-[14px] font-semibold truncate ${
              isLight ? 'text-teal-50' : 'text-slate-100'
            }`}>
              {navItems.find(item => item.id === activeTab)?.label || (
                activeTab === 'profile' ? 'Profil Pengguna' :
                activeTab === 'settings' ? 'Pengaturan' :
                activeTab === 'notifications' ? 'Pemberitahuan' :
                activeTab === 'admin-portal' ? 'Portal Administrator' :
                activeTab === 'admin-feedback' ? 'Penilaian Pengguna' : 'Fitur'
              )}
            </span>
          </div>
        )}
      </div>

      {/* 2. Navigasi Bagian Tengah: Tampilkan Semua Fitur Secara Langsung */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {/* Label Bagian "PILIHAN FITUR" (Tanpa Ikon/Lambang) */}
        <div className={`px-2.5 py-1.5 mb-1 text-[11px] font-bold tracking-[0.18em] uppercase font-mono ${
          isLight ? 'text-teal-400/80' : 'text-cyan-400/80'
        }`}>
          <span>PILIHAN FITUR</span>
        </div>

        {/* Daftar Modul Menu Utama */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={`w-full flex items-center px-3 py-2.5 space-x-3 text-left rounded-xl transition-all duration-150 cursor-pointer ${
                isActive 
                  ? isLight
                    ? 'bg-[#003B2F] text-white font-semibold border border-teal-500/40 shadow-xs'
                    : 'bg-[#131D2E] text-white font-semibold border border-cyan-500/40 shadow-xs' 
                  : isLight
                    ? 'text-teal-100 hover:text-white hover:bg-white/10 font-medium'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/50 font-medium'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 stroke-[2] ${
                isActive 
                  ? isLight ? 'text-teal-300' : 'text-cyan-400' 
                  : isLight ? 'text-teal-300' : 'text-slate-300'
              }`} />
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span 
                  className="text-[13px] tracking-wide truncate font-semibold"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isLight 
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' 
                      : 'bg-cyan-400 shadow-[0_0_8px_#22D3EE]'
                  }`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Pengaturan di Bagian Bawah */}
      <div className={`p-3 border-t ${isLight ? 'border-teal-500/20' : 'border-[#263449]'}`}>
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          title="Pengaturan"
          className={`w-full flex items-center px-3.5 py-2.5 space-x-3 text-left rounded-xl transition-all duration-150 cursor-pointer ${
            activeTab === 'settings'
              ? isLight
                ? 'bg-[#003B2F] text-white font-semibold border border-teal-500/40 shadow-xs'
                : 'bg-[#131D2E] text-white font-semibold border border-cyan-500/40 shadow-xs'
              : isLight
                ? 'text-teal-100 hover:text-white hover:bg-white/10 font-medium'
                : 'text-slate-200 hover:text-white hover:bg-slate-800/50 font-medium'
          }`}
        >
          <Settings className={`w-4.5 h-4.5 shrink-0 stroke-[2] ${
            activeTab === 'settings' 
              ? isLight ? 'text-teal-300' : 'text-cyan-400' 
              : isLight ? 'text-teal-300' : 'text-slate-300'
          }`} />
          <span 
            className="text-[13px] tracking-wide truncate font-semibold"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}
          >
            Pengaturan
          </span>
        </button>
      </div>
    </aside>
  );
};
