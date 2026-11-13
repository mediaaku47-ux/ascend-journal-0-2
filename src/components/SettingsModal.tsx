import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  X, 
  RefreshCw, 
  HelpCircle
} from 'lucide-react';
import { MONTH_NAMES_ID, getDaysInMonth, getYearOptions } from '../utils/dateUtils';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { SecurityAuditModal } from './SecurityAuditModal';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  getNotificationSettings, 
  saveNotificationSettings, 
  sendHabitTestNotification,
  DeviceNotificationSettings 
} from '../utils/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenResetModal: () => void;
  onExportData: () => void;
  onExportPDF: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSync?: () => void;
  onReplaySplash?: () => void;
  onSimulateReminder?: () => void;
  currentUser?: SupabaseUser | null;
  onOpenSupabaseModal?: () => void;
  isSupabaseConfigured?: boolean;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  onOpenHelp?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onOpenResetModal,
  onExportData,
  onExportPDF,
  onImportData,
  onOpenSync,
  onReplaySplash,
  onSimulateReminder,
  currentUser,
  onOpenSupabaseModal,
  isSupabaseConfigured = false,
  onLogout,
  onOpenProfile,
  onOpenHelp,
  theme = 'light',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';
  const [name, setName] = useState(userProfile.name);
  const [greetingSubtitle, setGreetingSubtitle] = useState(userProfile.greetingSubtitle);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(userProfile.monthIndex ?? 2);
  const [selectedYear, setSelectedYear] = useState(userProfile.year || 2026);
  const [currencySymbol, setCurrencySymbol] = useState(userProfile.currencySymbol);
  const [streakDays] = useState(userProfile.streakDays);
  const [showShortcutInfo, setShowShortcutInfo] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  // Preferensi Notifikasi & Izin Resmi Perangkat
  const [notifSettings, setNotifSettings] = useState<DeviceNotificationSettings>(getNotificationSettings());
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermissionStatus());
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const isHabitNotifActive = notifSettings.enabled && notifSettings.habitReminders;

  const handleToggleHabitNotification = () => {
    const nextVal = !isHabitNotifActive;
    const updated = {
      ...notifSettings,
      enabled: nextVal,
      habitReminders: nextVal,
    };
    const saved = saveNotificationSettings(updated);
    setNotifSettings(saved);
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermissionStatus());
    if (res === 'granted') {
      setNotifFeedback('Izin notifikasi perangkat berhasil diaktifkan.');
      setTimeout(() => setNotifFeedback(null), 3000);
    }
  };

  const handleTestDeviceNotification = async () => {
    if (!isHabitNotifActive) {
      setNotifFeedback('Sakelar pengingat sedang dinonaktifkan. Aktifkan sakelar di atas terlebih dahulu.');
      setTimeout(() => setNotifFeedback(null), 4000);
      return;
    }
    setIsTestingNotif(true);
    setNotifFeedback(null);
    try {
      const ok = await sendHabitTestNotification('Rutinitas Kebiasaan', '4 jam 50 menit');
      setPermissionStatus(getNotificationPermissionStatus());
      if (ok) {
        setNotifFeedback('Notifikasi pengingat kebiasaan (5 jam & 3 jam) berhasil terkirim ke HP / Laptop Anda!');
      } else {
        setNotifFeedback('Gagal mengirim notifikasi. Periksa izin perangkat Anda.');
      }
    } catch (err: any) {
      setNotifFeedback(err?.message || 'Gagal mengirim notifikasi.');
    } finally {
      setIsTestingNotif(false);
      setTimeout(() => setNotifFeedback(null), 4000);
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const daysInM = getDaysInMonth(selectedYear, selectedMonthIdx);
    const mName = `${MONTH_NAMES_ID[selectedMonthIdx]} ${selectedYear}`;

    onUpdateProfile({
      ...userProfile,
      name,
      greetingTitle: `Selamat Datang, ${name}`,
      greetingSubtitle,
      monthIndex: selectedMonthIdx,
      year: selectedYear,
      monthName: mName,
      totalDaysInMonth: daysInM,
      currencySymbol,
      streakDays: Number(streakDays) || 0,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="modal-pengaturan"
        onClick={(e) => e.stopPropagation()}
        className={`${
          isLight
            ? 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-[#111827] border border-[#263449] text-white shadow-2xl'
        } rounded-3xl w-full max-w-md p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto flex flex-col custom-scrollbar`}
      >
        <div className={`flex justify-between items-center pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'} shrink-0`}>
          <div>
            <h3 className={`text-xl font-bold ${isLight ? 'text-slate-950' : 'text-white'} tracking-tight flex items-center gap-2`}>
              <span>Pengaturan ASCEND</span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'} mt-0.5`}>Preferensi akun dan aplikasi</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Pengaturan"
            className={`${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'} p-1.5 rounded-xl transition-colors cursor-pointer`}
            title="Tutup Pengaturan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Profile & Password Card */}
        {onOpenProfile && (
          <div className={`mt-4 p-3.5 rounded-2xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/10'} border flex items-center justify-between gap-3`}>
            <div className="min-w-0">
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} truncate`}>
                {userProfile.name || 'Pengguna'}
              </h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'} truncate`}>
                Profil, sandi &amp; notifikasi
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-teal-300 border border-teal-500/30 transition-all cursor-pointer whitespace-nowrap"
            >
              Kelola
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 my-5">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Nama Pengguna
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-sky-400 focus:bg-white/10 outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Teks Sambutan Subtitle
            </label>
            <input
              type="text"
              value={greetingSubtitle}
              onChange={(e) => setGreetingSubtitle(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30 focus:border-sky-400 focus:bg-white/10 outline-hidden transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Bulan Jurnal
              </label>
              <select
                value={selectedMonthIdx}
                onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
                className="w-full text-sm px-3.5 py-2.5 bg-[#1a1a24] border border-white/15 rounded-xl text-white focus:border-sky-400 outline-hidden cursor-pointer"
              >
                {MONTH_NAMES_ID.map((mName, idx) => (
                  <option key={mName} value={idx}>
                    {mName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Tahun
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full text-sm px-3.5 py-2.5 bg-[#1a1a24] border border-white/15 rounded-xl text-white focus:border-sky-400 outline-hidden font-mono cursor-pointer"
              >
                {getYearOptions(userProfile.year || 2026).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              Mata Uang Jurnal
            </label>
            <select
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-[#1a1a24] border border-white/15 rounded-xl text-white focus:border-sky-400 outline-hidden cursor-pointer"
            >
              <option value="Rp">Rp (IDR - Rupiah)</option>
              <option value="$">$ (USD - Dolar)</option>
              <option value="€">€ (EUR - Euro)</option>
              <option value="£">£ (GBP - Pound)</option>
              <option value="¥">¥ (JPY - Yen)</option>
            </select>
          </div>

          {/* Mode Tampilan Tema (Terang / Gelap) */}
          {onToggleTheme && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Tema Tampilan</span>
                  <span className="text-[10px] text-teal-300 bg-teal-500/15 px-1.5 py-0.5 rounded-full border border-teal-500/30">
                    {theme === 'light' ? 'Terang' : 'Gelap'}
                  </span>
                </h4>
                <p className="text-[11px] text-white/50 leading-tight mt-0.5">
                  Pilih antara Mode Gelap atau Mode Terang
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-teal-300 border border-teal-500/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>{theme === 'light' ? 'Mode Terang' : 'Mode Gelap'}</span>
              </button>
            </div>
          )}

          {/* Pintasan Layar (Shortcut) Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Pintasan Layar Utama (Shortcut PWA)</span>
                  <span className="text-[10px] text-sky-300 bg-sky-500/15 px-1.5 py-0.5 rounded-full border border-sky-500/30">HD</span>
                </h4>
                <p className="text-[11px] text-white/50 leading-tight">Pasang sebagai aplikasi di Desktop &amp; HP</p>
              </div>
              
              {isInstallable ? (
                <button
                  type="button"
                  onClick={install}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/30 transition-all cursor-pointer"
                >
                  Pasang
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowShortcutInfo(!showShortcutInfo)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-sky-300 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Petunjuk</span>
                </button>
              )}
            </div>

            {showShortcutInfo && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/80">
                <p className="font-medium text-sky-300">
                  Buka menu browser (titik tiga ⋮ atau Bagikan), lalu pilih <strong>Tambahkan ke Layar Utama</strong>.
                </p>
              </div>
            )}
          </div>

          {/* PENGATURAN NOTIFIKASI & PENGINGAT PERANGKAT */}
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Notifikasi & Pengingat Perangkat
                </h4>
                <p className="text-[11px] text-white/60 mt-0.5">
                  Notifikasi resmi browser/OS (HP & laptop) untuk pengingat agenda dan jurnal malam.
                </p>
              </div>

              {/* Status Izin Badge */}
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : permissionStatus === 'denied'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}>
                {permissionStatus === 'granted' 
                  ? 'Izin Aktif' 
                  : permissionStatus === 'denied' 
                  ? 'Izin Diblokir' 
                  : 'Izin Belum Diberikan'}
              </span>
            </div>

            {/* Prompt izin jika belum aktif */}
            {permissionStatus !== 'granted' && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <p className="font-semibold text-white">Izin Perangkat Diperlukan</p>
                  <p className="text-[11px] text-white/70">
                    {permissionStatus === 'denied'
                      ? 'Buka izin notifikasi peramban Anda.'
                      : 'Aktifkan izin notifikasi perangkat Anda.'}
                  </p>
                </div>
                {permissionStatus !== 'denied' && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition-colors cursor-pointer"
                  >
                    Izinkan Sekarang
                  </button>
                )}
              </div>
            )}

            {/* SATU SAKELAR TUNGGAL RESMI */}
            <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white">Pengingat Kebiasaan &amp; Streak (5 Jam &amp; 3 Jam Sebelum Jam 12)</p>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isHabitNotifActive
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-white/10 text-white/50 border border-white/10'
                  }`}>
                    {isHabitNotifActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleHabitNotification}
                aria-label="Aktifkan pengingat kebiasaan"
                className={`w-12 h-6 min-w-[48px] max-w-[48px] shrink-0 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                  isHabitNotifActive ? 'bg-teal-500' : 'bg-white/20'
                }`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${
                  isHabitNotifActive ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Tombol Uji Notifikasi & Feedback */}
            <div className="pt-2 flex items-center justify-between gap-2.5">
              <div className="text-[11px]">
                {notifFeedback && (
                  <span className="text-teal-300 font-semibold">{notifFeedback}</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleTestDeviceNotification}
                disabled={isTestingNotif}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-98 text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer whitespace-nowrap"
              >
                {isTestingNotif ? 'Mengirim Uji Coba...' : 'Uji Notifikasi Perangkat'}
              </button>
            </div>
          </div>

          {/* Backup & Data Management Controls */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">

            {onOpenHelp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHelp();
                }}
                className="w-full text-xs text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 p-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold cursor-pointer transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Pusat Bantuan & Panduan Aplikasi</span>
              </button>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResetModal();
                }}
                className="w-full text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 p-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Hapus Data / Reset & Ulang dari Awal</span>
              </button>
            </div>
          </div>

          <div className={`flex justify-end space-x-2 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'} rounded-xl cursor-pointer transition-colors`}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs font-semibold text-white ${
                isLight 
                  ? 'bg-[#003B2F] hover:bg-[#002e24]' 
                  : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600'
              } rounded-xl shadow-md cursor-pointer transition-all`}
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>

      <SecurityAuditModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        isSupabaseConfigured={isSupabaseConfigured}
        userEmail={currentUser?.email}
        userName={userProfile.name}
      />
    </div>
  );
};
