import React from 'react';
import { 
  Megaphone, 
  Calendar, 
  ExternalLink, 
  Sparkles,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { AppAnnouncement, UserProfile } from '../../types';
import { User } from '@supabase/supabase-js';
import { NotificationIllustration } from '../NotificationIllustration';

interface NotificationsViewProps {
  announcements?: AppAnnouncement[];
  userProfile: UserProfile;
  currentUser?: User | null;
  onNavigateToDashboard: () => void;
  onOpenAnnouncementsAdmin?: () => void;
  onSimulateReminder?: () => void;
  onShowToast?: (msg: string) => void;
  theme?: 'dark' | 'light';
}

export const READ_ANNOUNCEMENTS_STORAGE_KEY = 'ascend_read_announcements_ids';

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  announcements = [],
  onNavigateToDashboard,
  onSimulateReminder,
  theme = 'light',
}) => {
  const isLight = theme === 'light';
  const activeAnnouncements = announcements.filter(a => a.isActive);

  // Otomatis tandai seluruh pemberitahuan aktif sebagai dibaca saat pengguna membuka halaman ini
  React.useEffect(() => {
    if (activeAnnouncements.length > 0) {
      const allActiveIds = activeAnnouncements.map((a) => a.id);
      try {
        const stored = localStorage.getItem(READ_ANNOUNCEMENTS_STORAGE_KEY);
        const currentRead = stored ? JSON.parse(stored) : [];
        const hasUnread = allActiveIds.some((id) => !currentRead.includes(id));
        if (hasUnread) {
          const updated = Array.from(new Set([...currentRead, ...allActiveIds]));
          localStorage.setItem(READ_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event('ascend-announcements-read-updated'));
        }
      } catch (e) {
        console.warn('Gagal memperbarui status baca:', e);
      }
    }
  }, [activeAnnouncements]);

  const getAnnouncementBadge = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          label: 'Peringatan',
          classes: isLight 
            ? 'bg-amber-100 text-amber-800 border-amber-300' 
            : 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          iconBoxClasses: isLight
            ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300 text-amber-700 shadow-amber-200/50'
            : 'bg-gradient-to-br from-amber-500/25 to-amber-600/10 border-amber-500/40 text-amber-300',
        };
      case 'update':
        return {
          icon: Sparkles,
          label: 'Pembaruan',
          classes: isLight 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          iconBoxClasses: isLight
            ? 'bg-gradient-to-br from-emerald-100 to-teal-50 border-emerald-300 text-emerald-700 shadow-emerald-200/50'
            : 'bg-gradient-to-br from-emerald-500/25 to-teal-600/10 border-emerald-500/40 text-emerald-300',
        };
      case 'event':
        return {
          icon: Calendar,
          label: 'Acara',
          classes: isLight 
            ? 'bg-purple-100 text-purple-800 border-purple-300' 
            : 'bg-purple-500/20 text-purple-300 border-purple-400/40',
          iconBoxClasses: isLight
            ? 'bg-gradient-to-br from-purple-100 to-violet-50 border-purple-300 text-purple-700 shadow-purple-200/50'
            : 'bg-gradient-to-br from-purple-500/25 to-violet-600/10 border-purple-500/40 text-purple-300',
        };
      default:
        return {
          icon: Megaphone,
          label: 'Informasi',
          classes: isLight 
            ? 'bg-sky-100 text-sky-800 border-sky-300' 
            : 'bg-sky-500/20 text-sky-300 border-sky-400/40',
          iconBoxClasses: isLight
            ? 'bg-gradient-to-br from-sky-100 to-blue-50 border-sky-300 text-sky-700 shadow-sky-200/50'
            : 'bg-gradient-to-br from-sky-500/25 to-blue-600/10 border-sky-500/40 text-sky-300',
        };
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className={`w-full pb-32 sm:pb-24 transition-colors duration-200 ${
      isLight ? 'bg-transparent text-slate-900' : 'bg-transparent text-white'
    }`}>
      <div className="max-w-4xl mx-auto space-y-4 pt-1 sm:pt-2">
        {/* Konten Pemberitahuan Langsung di Halaman */}
        {activeAnnouncements.length === 0 ? (
          /* Tampilan saat belum ada pemberitahuan dengan gaya kartu fitur rapi */
          <div className={`p-8 sm:p-12 rounded-3xl border text-center flex flex-col items-center justify-center space-y-4 shadow-xs ${
            isLight 
              ? 'bg-white border-slate-200/90 text-slate-800' 
              : 'bg-[#111827]/80 border-white/10 text-white'
          }`}>
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs ${
              isLight 
                ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 text-teal-700' 
                : 'bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-300'
            }`}>
              <Megaphone className="w-7 h-7 -rotate-12" />
            </div>

            <div className="relative flex items-center justify-center my-1">
              <NotificationIllustration
                theme={theme}
                className="w-[130px] sm:w-[150px] md:w-[170px] h-auto max-w-full object-contain"
              />
            </div>

            <div className="space-y-1.5 text-center max-w-sm">
              <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                Belum Ada Pemberitahuan
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                Seluruh pembaruan, notifikasi sistem, dan pengumuman fitur akan tampil langsung di sini.
              </p>
            </div>
          </div>
        ) : (
          /* Daftar Pemberitahuan Format Fitur dengan Ikon Rapi */
          <div className="w-full space-y-3.5 text-left">
            {activeAnnouncements.map((ann) => {
              const badge = getAnnouncementBadge(ann.type);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={ann.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md group ${
                    isLight 
                      ? 'bg-white border-slate-200/90 text-slate-800 hover:border-teal-400/60' 
                      : 'bg-[#111827] border-white/10 text-white hover:border-teal-500/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Kotak Ikon Fitur Menonjol di Sisi Kiri */}
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-transform duration-200 group-hover:scale-105 ${badge.iconBoxClasses}`}>
                      <BadgeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    {/* Isi Informasi Pemberitahuan */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.classes}`}>
                            <span>{badge.label}</span>
                          </span>
                          {ann.isPinned && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-400/40">
                              Disematkan
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(ann.createdAt)}</span>
                        </div>
                      </div>

                      <h4 className={`text-sm sm:text-base font-bold mb-1.5 leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {ann.title}
                      </h4>
                      
                      <p className={`text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        {ann.message}
                      </p>

                      {(ann.actionUrl || ann.authorName) && (
                        <div className={`pt-3 mt-3 border-t flex items-center justify-between text-xs flex-wrap gap-2 ${
                          isLight ? 'border-slate-100' : 'border-white/5'
                        }`}>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {ann.authorName ? `Penerbit: ${ann.authorName}` : 'Penerbit: Tim Pembuat Aplikasi'}
                          </span>
                          {ann.actionUrl && (
                            <a
                              href={ann.actionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/25 transition-all cursor-pointer"
                            >
                              <span>{ann.actionLabel || 'Buka Tautan'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
