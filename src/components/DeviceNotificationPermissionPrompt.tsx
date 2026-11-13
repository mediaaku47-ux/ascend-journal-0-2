import React, { useState, useEffect } from 'react';
import { Bell, X, ShieldCheck } from 'lucide-react';
import { 
  getNotificationPermissionStatus, 
  isWebNotificationSupported, 
  hasDismissedPermissionPrompt, 
  setDismissedPermissionPrompt, 
  requestNotificationPermission,
  sendDeviceNotification
} from '../utils/notifications';

interface DeviceNotificationPermissionPromptProps {
  onPermissionChanged?: (status: 'granted' | 'denied' | 'default') => void;
  isLight?: boolean;
}

export const DeviceNotificationPermissionPrompt: React.FC<DeviceNotificationPermissionPromptProps> = ({
  onPermissionChanged,
  isLight = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Cek apakah browser mendukung Web Notification
    if (!isWebNotificationSupported()) {
      return;
    }

    const currentPerm = getNotificationPermissionStatus();
    // Hanya tampilkan jika status permission masih 'default' dan pengguna belum pernah menolak prompt ini
    if (currentPerm === 'default' && !hasDismissedPermissionPrompt()) {
      // Berikan delay 1.5 detik setelah halaman terbuka agar tidak mengganggu inisialisasi awal
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  const handleAllow = async () => {
    setIsProcessing(true);
    try {
      const perm = await requestNotificationPermission();
      if (onPermissionChanged) {
        onPermissionChanged(perm as any);
      }

      if (perm === 'granted') {
        // Kirim konfirmasi notifikasi pertama kali
        await sendDeviceNotification('🔔 Pengingat ASCEND Berhasil Diaktifkan!', {
          body: 'Notifikasi perangkat Anda aktif. Anda akan menerima pengingat agenda harian sebelum pukul 22.00 dan jurnal malam.',
          tag: 'ascend-welcome-notification'
        });
      }
    } finally {
      setIsProcessing(false);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setDismissedPermissionPrompt(true);
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 max-w-sm w-[calc(100%-2rem)] md:w-96 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-3xl shadow-2xl border backdrop-blur-2xl relative transition-all ${
        isLight 
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60' 
          : 'bg-[#12131d]/95 border-white/15 text-white shadow-black/80'
      }`}>
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label="Tutup & Tolak Sementara"
          className={`absolute top-3.5 right-3.5 p-1.5 rounded-full transition-colors cursor-pointer ${
            isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
          }`}
          title="Tutup & Tolak Sementara"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>

          <div className="pr-5">
            <h4 className="text-xs font-bold tracking-tight">
              Aktifkan Pengingat Perangkat (HP / Laptop)
            </h4>
            <p className={`text-[11px] leading-relaxed mt-1 ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              Dapatkan pengingat agenda harian sebelum pukul 22.00 dan peringatan batas pengisian jurnal langsung di HP atau laptop Anda.
            </p>
          </div>
        </div>

        <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-2 ${
          isLight ? 'border-slate-100' : 'border-white/10'
        }`}>
          <div className="flex items-center gap-1 text-[10px] text-teal-400/80 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Izin resmi browser</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              Nanti Saja
            </button>

            <button
              type="button"
              onClick={handleAllow}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              {isProcessing ? 'Memproses...' : 'Izinkan Notifikasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
