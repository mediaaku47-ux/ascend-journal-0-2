import React, { useState, useMemo, useEffect } from 'react';
import { Task, UserProfile } from '../../types';
import { AgendaTable } from '../AgendaTable';
import { CheckSquare, Plus, Flag, Search, CalendarClock, Archive, BellRing } from 'lucide-react';
import {
  getMonthClosingStatus,
  checkAndTriggerMonthClosingDeviceNotification,
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '../../utils/notifications';

interface AgendaViewProps {
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void | Promise<void>;
  userProfile: UserProfile;
  onOpenNewEntry: () => void;
  onOpenCloseMonthModal?: () => void;
  onShowToast?: (msg: string) => void;
  theme?: 'dark' | 'light';
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  tasks,
  onUpdateTasks,
  userProfile,
  onOpenNewEntry,
  onOpenCloseMonthModal,
  onShowToast,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'flagged'>('all');
  const [notifPerm, setNotifPerm] = useState(() => getNotificationPermissionStatus());

  const monthClosing = useMemo(
    () => getMonthClosingStatus(userProfile.monthName, userProfile.monthIndex, userProfile.year, tasks),
    [userProfile.monthName, userProfile.monthIndex, userProfile.year, tasks]
  );

  // Picu notifikasi langsung ke HP/perangkat pengguna saat akhir bulan jika izin sudah aktif
  useEffect(() => {
    if (monthClosing.isEndOfMonth) {
      void checkAndTriggerMonthClosingDeviceNotification(
        userProfile.monthName,
        userProfile.monthIndex,
        userProfile.year,
        tasks
      );
    }
  }, [monthClosing.isEndOfMonth, userProfile.monthName, userProfile.monthIndex, userProfile.year, tasks]);

  const handleEnableDeviceNotif = async () => {
    const res = await requestNotificationPermission();
    setNotifPerm(getNotificationPermissionStatus());
    if (res === 'granted') {
      await checkAndTriggerMonthClosingDeviceNotification(
        userProfile.monthName,
        userProfile.monthIndex,
        userProfile.year,
        tasks,
        true
      );
      onShowToast?.('Notifikasi HP diaktifkan! Pengingat akhir bulan telah dikirim ke perangkat Anda.');
    } else {
      onShowToast?.('Izin notifikasi HP ditolak atau belum diaktifkan di pengaturan browser.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || (filterType === 'flagged' && t.flagged);
    return matchesSearch && matchesFilter;
  });

  const handleUpdateTasks = async (newFilteredTasks: Task[]): Promise<void> => {
    if (filterType === 'all' && !searchQuery.trim()) {
      await onUpdateTasks(newFilteredTasks);
    } else {
      const updatedMap = new Map(newFilteredTasks.map((t) => [t.id, t]));
      const filteredIds = new Set(filteredTasks.map((t) => t.id));
      const merged = tasks
        .filter((t) => !filteredIds.has(t.id) || updatedMap.has(t.id))
        .map((t) => updatedMap.get(t.id) || t);
      await onUpdateTasks(merged);
    }
  };

  return (
    <div className="space-y-6 pb-32 md:pb-14 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
            <CheckSquare className="w-6 h-6 text-teal-500" />
            Agenda & Matriks Harian
          </h2>
          <p className={`text-sm mt-0.5 font-semibold ${isLight ? 'text-slate-700' : 'text-white/60'}`}>
            Kelola dan pantau seluruh agenda, rapat, dan tugas prioritas bulan {userProfile.monthName}.
          </p>
        </div>

        <button
          onClick={onOpenNewEntry}
          className={`${
            isLight 
              ? 'bg-[#003B2F] hover:bg-[#002e24]' 
              : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-700 hover:to-emerald-700'
          } text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-teal-500/20 hover:shadow-lg transition-all cursor-pointer active:scale-95`}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Agenda Baru</span>
        </button>
      </div>

      {/* Pemberitahuan Khusus Halaman Agenda: Peringatan Akhir Bulan / Bulan Akan Tutup */}
      {monthClosing.isEndOfMonth && (
        <div
          id="agenda-month-closing-notice"
          className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-sm ${
            isLight
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-amber-500/10 border-amber-400/35 text-amber-100'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isLight ? 'bg-amber-500 text-white' : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
            }`}>
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-black ${isLight ? 'text-amber-950' : 'text-amber-200'}`}>
                {monthClosing.title}
              </h3>
              <p className={`text-xs font-medium mt-0.5 leading-relaxed ${isLight ? 'text-amber-900/90' : 'text-amber-100/80'}`}>
                {monthClosing.body}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
              <button
                type="button"
                onClick={handleEnableDeviceNotif}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  isLight
                    ? 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-white/5 border-amber-400/30 text-amber-200 hover:bg-white/10'
                }`}
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Aktifkan Notif HP</span>
              </button>
            )}
            {onOpenCloseMonthModal && (
              <button
                type="button"
                onClick={onOpenCloseMonthModal}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
                  isLight
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Tutup Bulan & Arsip PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={`flex flex-col sm:flex-row gap-3 p-3 rounded-2xl border transition-all ${
        isLight 
          ? 'bg-white border border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]' 
          : 'bg-[#111827] border border-[#263449] shadow-md'
      }`}>
        <div className="relative flex-1">
          <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
          <input
            type="text"
            placeholder="Cari agenda atau tugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl outline-hidden transition-all font-medium ${
              isLight 
                ? 'bg-slate-50 border border-slate-200 focus:border-teal-500 text-slate-900 placeholder-slate-400 focus:bg-white' 
                : 'bg-white/5 border border-white/10 focus:border-sky-400 text-white placeholder-white/30'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterType === 'all'
                ? isLight 
                  ? 'bg-[#003B2F] text-white shadow-xs'
                  : 'bg-teal-600 text-white shadow-xs shadow-teal-600/30'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200 border border-slate-200'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            Semua ({tasks.length})
          </button>
          <button
            onClick={() => setFilterType('flagged')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              filterType === 'flagged'
                ? isLight 
                  ? 'bg-rose-100 border border-rose-400 text-rose-800' 
                  : 'bg-rose-500/30 border border-rose-500/50 text-rose-200'
                : isLight
                ? 'bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200 border border-slate-200'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Prioritas ({tasks.filter((t) => t.flagged).length})</span>
          </button>
        </div>
      </div>

      {/* The Core Table */}
      <AgendaTable
        tasks={filteredTasks}
        onUpdateTasks={handleUpdateTasks}
        monthName={userProfile.monthName}
        monthIndex={userProfile.monthIndex}
        year={userProfile.year}
        totalDaysInMonth={userProfile.totalDaysInMonth}
        onShowToast={onShowToast}
        theme={theme}
      />
    </div>
  );
};
