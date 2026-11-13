import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Trash2, 
  Edit3, 
  Send, 
  Sparkles, 
  Calendar, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  X,
  RefreshCw,
  Clock,
  Check
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { UserProfile, AppAnnouncement, AnnouncementType } from '../types';
import { dbService } from '../lib/supabaseService';

interface AdminAnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  userProfile?: UserProfile;
  onShowToast?: (msg: string) => void;
  onAnnouncementsUpdated?: (list: AppAnnouncement[]) => void;
}

const CATEGORIES: { id: AnnouncementType; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  { id: 'info', label: 'Informasi', icon: Info, color: 'sky' },
  { id: 'update', label: 'Pembaruan', icon: Sparkles, color: 'emerald' },
  { id: 'warning', label: 'Peringatan', icon: AlertTriangle, color: 'amber' },
  { id: 'event', label: 'Acara', icon: Calendar, color: 'purple' },
];

export const AdminAnnouncementsModal: React.FC<AdminAnnouncementsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onShowToast,
  onAnnouncementsUpdated,
}) => {
  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State: HANYA Judul, Kategori, dan Isi Pesan
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [message, setMessage] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Muat daftar pengumuman saat modal dibuka
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.fetchAnnouncements(false);
      setAnnouncements(data);
      if (onAnnouncementsUpdated) {
        onAnnouncementsUpdated(data);
      }
    } catch (err) {
      console.warn('Gagal memuat pengumuman admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setType('info');
    setDeleteConfirmId(null);
  };

  // Muat data notifikasi ke form untuk diperbarui
  const handleEdit = (ann: AppAnnouncement) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setMessage(ann.message);
    setType(ann.type);
    setDeleteConfirmId(null);
    
    // Scroll form ke tampilan teratas
    const formEl = document.getElementById('admin-announcement-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Kirim / Perbarui Pemberitahuan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      onShowToast?.('Judul dan isi pesan pemberitahuan wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const existing = editingId ? announcements.find((a) => a.id === editingId) : null;
      
      const record: AppAnnouncement = {
        id: editingId || `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        message: message.trim(),
        type,
        isActive: true, // Otomatis aktif tersiar
        isPinned: existing?.isPinned ?? false,
        // Penerbit langsung otomatis "Tim Pembuat Aplikasi"
        authorName: 'Tim Pembuat Aplikasi',
        authorEmail: currentUser?.email || undefined,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbService.upsertAnnouncement(record);

      onShowToast?.(
        editingId 
          ? 'Pemberitahuan berhasil diperbarui!' 
          : 'Pemberitahuan baru berhasil disiarkan ke seluruh pengguna!'
      );

      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('Gagal menyimpan pengumuman:', err);
      onShowToast?.(`Gagal menyimpan: ${err?.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus Pemberitahuan Kembali (Langsung & Tanpa Dialog Browser window.confirm yang Terblokir iframe)
  const executeDelete = async (id: string) => {
    try {
      // 1. Optimistic Update: langsung hilangkan dari layar
      const updatedList = announcements.filter((a) => a.id !== id);
      setAnnouncements(updatedList);
      if (onAnnouncementsUpdated) {
        onAnnouncementsUpdated(updatedList);
      }
      if (editingId === id) {
        resetForm();
      }
      setDeleteConfirmId(null);

      // 2. Hapus dari database / local cache
      await dbService.deleteAnnouncement(id);
      onShowToast?.('Pemberitahuan berhasil dihapus kembali.');

      // 3. Sinkronkan ulang data
      await loadData();
    } catch (err: any) {
      console.error('Gagal menghapus pemberitahuan:', err);
      onShowToast?.('Gagal menghapus pemberitahuan.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0f172a] border border-white/15 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Megaphone className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Pembuatan &amp; Kelola Pemberitahuan
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <p className="text-xs text-white/50">
                Penerbit otomatis: <strong className="text-teal-300">Tim Pembuat Aplikasi</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup panel pengumuman administrator"
            className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="space-y-6 overflow-y-auto p-5 sm:p-6 flex-1 custom-scrollbar">
          {/* FORMULIR PEMBUATAN / PEMBARUAN PEMBERITAHUAN */}
          <form 
            id="admin-announcement-form"
            onSubmit={handleSubmit} 
            className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
              editingId 
                ? 'bg-sky-500/10 border-sky-500/30 shadow-lg shadow-sky-500/5' 
                : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-400" />
                <span>{editingId ? 'Perbarui Pemberitahuan' : 'Buat Pemberitahuan Baru'}</span>
              </span>

              {editingId && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  Sedang Mengedit
                </span>
              )}
            </div>

            {/* 1. KATEGORI PEMBERITAHUAN */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Kategori Pemberitahuan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = type === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setType(cat.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/25 border-teal-400 text-teal-200 shadow-sm ring-1 ring-teal-400/30'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. JUDUL PEMBERITAHUAN */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Judul Pemberitahuan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pembaruan Fitur & Jadwal Pemeliharaan"
                required
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            {/* 3. ISI PEMBERITAHUAN */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Isi Pemberitahuan
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Tuliskan isi pesan pemberitahuan yang ingin disampaikan ke seluruh pengguna..."
                required
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal-400 transition-colors resize-y leading-relaxed"
              />
            </div>

            {/* Tombol Aksi Formulir */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal Edit
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : editingId ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Simpan Perubahan</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Siarkan Pemberitahuan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* DAFTAR PEMBERITAHUAN YANG SUDAH DISIARKAN */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-teal-400" />
                <span>Pemberitahuan Yang Telah Disiarkan ({announcements.length})</span>
              </h4>

              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-white/50 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
                <span>Memuat daftar pemberitahuan...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-xs text-white/50">
                Belum ada pemberitahuan yang disiarkan. Buat pemberitahuan baru di atas!
              </div>
            ) : (
              <div className="space-y-2.5">
                {announcements.map((ann) => {
                  const cat = CATEGORIES.find((c) => c.id === ann.type) || CATEGORIES[0];
                  const Icon = cat.icon;
                  const isBeingEdited = editingId === ann.id;

                  return (
                    <div
                      key={ann.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isBeingEdited
                          ? 'bg-sky-500/15 border-sky-400 shadow-md'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              <span>{cat.label}</span>
                            </span>

                            <span className="text-[10px] text-white/40 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(ann.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <h5 className="text-sm font-bold text-white tracking-tight pt-0.5">
                            {ann.title}
                          </h5>

                          <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                            {ann.message}
                          </p>

                          <div className="text-[11px] text-teal-300/80 pt-1 font-medium">
                            Dari: {ann.authorName || 'Tim Pembuat Aplikasi'}
                          </div>
                        </div>

                        {/* Tombol Perbarui & Hapus Notifikasi */}
                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                          {/* Tombol Perbarui */}
                          <button
                            type="button"
                            onClick={() => {
                              handleEdit(ann);
                              setDeleteConfirmId(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                            title="Perbarui pemberitahuan ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Perbarui</span>
                          </button>

                          {/* Tombol Hapus dengan Konfirmasi Inline Langsung (Tanpa Dialog window.confirm) */}
                          {deleteConfirmId === ann.id ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                              <span className="text-[11px] text-rose-300 font-bold whitespace-nowrap">Hapus?</span>
                              <button
                                type="button"
                                onClick={() => executeDelete(ann.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                              >
                                Ya
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold cursor-pointer transition-all"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(ann.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title="Hapus pemberitahuan ini kembali"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
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

        {/* Footer Modal */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-3 border-t border-white/10 shrink-0 text-xs text-white/50">
          <span>Setiap siaran langsung tersinkronisasi ke seluruh akun pengguna.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
