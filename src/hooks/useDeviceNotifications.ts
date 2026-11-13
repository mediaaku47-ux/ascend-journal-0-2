import { useState, useEffect, useCallback } from 'react';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  sendTestNotification,
  getNotificationSettings,
  saveNotificationSettings,
  DeviceNotificationSettings
} from '../utils/notifications';
import { Task, Habit, QuickNote } from '../types';

interface UseDeviceNotificationsProps {
  tasks?: Task[];
  habits?: Habit[];
  quickNotes?: QuickNote[];
}

export function useDeviceNotifications({
  tasks = [],
  habits = [],
  quickNotes = []
}: UseDeviceNotificationsProps = {}) {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [settings, setSettings] = useState<DeviceNotificationSettings>(getNotificationSettings());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Periksa status izin saat inisialisasi
  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus());
    setSettings(getNotificationSettings());
  }, []);

  // Meminta izin notifikasi browser secara resmi
  const requestPermission = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermissionStatus());
    return res;
  }, []);

  // Perbarui pengaturan notifikasi
  const updateSettings = useCallback((newSettings: Partial<DeviceNotificationSettings>) => {
    const updated = saveNotificationSettings(newSettings);
    setSettings(updated);
  }, []);

  // Kirim notifikasi uji coba ke perangkat
  const testNotification = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const success = await sendTestNotification();
      if (success) {
        setTestResult('Notifikasi berhasil dikirim ke perangkat Anda!');
      } else {
        const currentPerm = getNotificationPermissionStatus();
        if (currentPerm === 'denied') {
          setTestResult('Izin notifikasi diblokir oleh peramban. Silakan buka izin di setelan browser.');
        } else {
          setTestResult('Gagal mengirim notifikasi. Pastikan izin telah diberikan pada perangkat.');
        }
      }
    } catch (err: any) {
      setTestResult(err?.message || 'Terjadi kesalahan saat menguji notifikasi.');
    } finally {
      setIsTesting(false);
      setPermissionStatus(getNotificationPermissionStatus());
    }
  }, []);

  // Tidak ada pengingat dobel: Pengingat kebiasaan ditangani secara presisi oleh HabitTrackerCard (5 jam & 3 jam sebelum jam 12 malam)
  // sesuai izin aktif dan sakelar notifikasi pengguna.

  return {
    permissionStatus,
    settings,
    isTesting,
    testResult,
    requestPermission,
    updateSettings,
    testNotification,
  };
}
