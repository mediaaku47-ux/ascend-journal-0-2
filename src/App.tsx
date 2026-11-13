import { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { MainDashboard } from './components/MainDashboard';
import { authService, dbService } from './lib/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { UserProfile } from './types';
import { CheckCircle2 } from 'lucide-react';

const getFallbackDefaultUser = (): SupabaseUser => {
  let createdAt = '';
  try {
    createdAt = localStorage.getItem('ascend_account_created_at') || '';
    if (!createdAt || createdAt === '2026-01-01T00:00:00.000Z') {
      createdAt = new Date().toISOString();
      localStorage.setItem('ascend_account_created_at', createdAt);
    }
  } catch {
    createdAt = new Date().toISOString();
  }

  return {
    id: 'local-default-user',
    app_metadata: {},
    user_metadata: { full_name: 'Pengguna Ascend' },
    aud: 'authenticated',
    created_at: createdAt,
  } as SupabaseUser;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<SupabaseUser>(() => {
    try {
      const cached = localStorage.getItem('journalstream_current_user');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return getFallbackDefaultUser();
  });

  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('journalstream_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isAuthFlowOpen, setIsAuthFlowOpen] = useState<boolean>(() => {
    try {
      const hasCompleted = localStorage.getItem('journalstream_has_completed_welcome');
      return !hasCompleted;
    } catch {
      return true;
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Pengecekan sesi Supabase berjalan murni secara asynchronous di latar belakang tanpa menahan render
  useEffect(() => {
    let isMounted = true;

    const syncSessionInBackground = async () => {
      try {
        if (!isSupabaseConfigured()) return;

        const session = await authService.getSession().catch(() => null);
        if (!isMounted || !session?.user) return;

        setCurrentUser(session.user);
        try {
          localStorage.setItem('journalstream_current_user', JSON.stringify(session.user));
        } catch {}

        const profile = await dbService.ensureUserProfileInitialized(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name || session.user.user_metadata?.name
        ).catch(() => null);

        if (isMounted && profile) {
          setCurrentProfile(profile);
          try {
            localStorage.setItem('journalstream_user_profile', JSON.stringify(profile));
          } catch {}
        }
      } catch (err) {
        console.warn('Background session sync notice:', err);
      }
    };

    syncSessionInBackground();

    let unsubscribe = () => {};
    try {
      unsubscribe = authService.onAuthStateChange(async (user) => {
        if (!isMounted) return;
        if (user) {
          setCurrentUser(user);
          setIsAuthFlowOpen(false);
          try {
            localStorage.setItem('journalstream_current_user', JSON.stringify(user));
            localStorage.setItem('journalstream_has_completed_welcome', 'true');
          } catch {}
          try {
            const profile = await dbService.ensureUserProfileInitialized(
              user.id,
              user.email,
              user.user_metadata?.full_name || user.user_metadata?.name
            );
            if (isMounted && profile) {
              setCurrentProfile(profile);
              try {
                localStorage.setItem('journalstream_user_profile', JSON.stringify(profile));
              } catch {}
            }
          } catch (e) {
            console.warn('Gagal menyinkronkan profil saat auth berubah:', e);
          }
        }
      });
    } catch (e) {
      console.warn('onAuthStateChange notice:', e);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Callback setelah pengguna berhasil Login atau Daftar akun dari form
  const handleAuthSuccess = (user: SupabaseUser, initialProf?: UserProfile) => {
    setCurrentUser(user);
    setIsAuthFlowOpen(false);
    try {
      localStorage.setItem('journalstream_current_user', JSON.stringify(user));
      localStorage.setItem('journalstream_has_completed_welcome', 'true');
    } catch {}
    if (initialProf) {
      setCurrentProfile(initialProf);
      try {
        localStorage.setItem('journalstream_user_profile', JSON.stringify(initialProf));
      } catch {}
    }
    const displayName = user.user_metadata?.full_name || user.email || 'Pengguna';
    showToast(`Selamat datang, ${displayName}!`);
  };

  const handleContinueAsGuest = () => {
    setIsAuthFlowOpen(false);
    try {
      localStorage.setItem('journalstream_has_completed_welcome', 'true');
      let createdAt = localStorage.getItem('ascend_account_created_at');
      if (!createdAt || createdAt === '2026-01-01T00:00:00.000Z') {
        localStorage.setItem('ascend_account_created_at', new Date().toISOString());
      }
      if (!localStorage.getItem('ascend_theme')) {
        localStorage.setItem('ascend_theme', 'light');
      }
    } catch {}
    showToast('Selamat datang di Ascend Journal! (Mode Tamu)');
  };

  // Keluar dari akun (Logout)
  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setCurrentUser(getFallbackDefaultUser());
      setCurrentProfile(null);
      setIsAuthFlowOpen(true);
      try {
        localStorage.removeItem('journalstream_current_user');
        localStorage.removeItem('journalstream_has_completed_welcome');
      } catch {}
      showToast('Berhasil keluar dari akun. Sampai jumpa kembali!');
    }
  };

  return (
    <>
      {/* 1. Layar Sambutan & Auth Flow (Welcome Splash, Login, Register) */}
      {isAuthFlowOpen ? (
        <AuthScreen
          onAuthSuccess={handleAuthSuccess}
          showToast={showToast}
          onContinueAsGuest={handleContinueAsGuest}
        />
      ) : (
        /* 2. Komponen <MainDashboard /> LANGSUNG dirender tanpa loading progress bar */
        <MainDashboard
          currentUser={currentUser}
          initialProfile={currentProfile}
          onLogout={handleLogout}
        />
      )}

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-none">
          <div className="bg-slate-900/95 border border-emerald-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-100">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}
