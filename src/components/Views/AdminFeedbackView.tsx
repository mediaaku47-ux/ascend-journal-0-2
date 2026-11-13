import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  MessageSquare, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../../types';
import { dbService, isSupabaseConfigured } from '../../lib/supabaseService';

export interface UserFeedbackRecord {
  id: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  rating: number;
  suggestions: string;
  tags?: string[];
  submittedAt?: string;
  updatedAt?: string;
  firstAppOpenAt?: string;
}

interface AdminFeedbackViewProps {
  currentUser?: User | null;
  userProfile: UserProfile;
  onShowToast?: (message: string) => void;
  onNavigateToDashboard?: () => void;
  theme?: 'dark' | 'light';
}

export const AdminFeedbackView: React.FC<AdminFeedbackViewProps> = ({
  currentUser,
  userProfile,
  onShowToast,
  onNavigateToDashboard,
}) => {
  const [feedbacks, setFeedbacks] = useState<UserFeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Muat data feedback dari database Supabase
  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const data = await dbService.fetchAllUserFeedbacks();
        
        // Tambahkan feedback lokal pengguna saat ini jika ada & belum masuk list
        if (userProfile.feedback && userProfile.feedback.rating) {
          const exists = data.some((d) => d.id === (currentUser?.id || 'local-admin'));
          if (!exists) {
            data.unshift({
              id: currentUser?.id || 'local-admin',
              email: currentUser?.email || 'admin@ascend.app',
              fullName: userProfile.name || 'Admin',
              avatarUrl: userProfile.avatarUrl,
              rating: userProfile.feedback.rating,
              suggestions: userProfile.feedback.suggestions || '',
              tags: userProfile.feedback.tags || [],
              submittedAt: userProfile.feedback.submittedAt || new Date().toISOString(),
              updatedAt: userProfile.feedback.updatedAt,
              firstAppOpenAt: userProfile.firstAppOpenAt,
            });
          }
        }
        setFeedbacks(data);
      } else {
        // Jika Supabase belum dikonfigurasi, gunakan data dari local user feedback
        const localList: UserFeedbackRecord[] = [];
        if (userProfile.feedback && userProfile.feedback.rating) {
          localList.push({
            id: currentUser?.id || 'local-user',
            email: currentUser?.email || 'kamalizudin36@gmail.com',
            fullName: userProfile.name || 'Pengguna Utama',
            avatarUrl: userProfile.avatarUrl,
            rating: userProfile.feedback.rating,
            suggestions: userProfile.feedback.suggestions || '',
            tags: userProfile.feedback.tags || [],
            submittedAt: userProfile.feedback.submittedAt || new Date().toISOString(),
            firstAppOpenAt: userProfile.firstAppOpenAt,
          });
        }
        setFeedbacks(localList);
      }
    } catch (err) {
      console.warn('Error loading admin feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [currentUser?.id, userProfile.feedback]);

  // Statistik Agregat
  const stats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) {
      return {
        total: 0,
        average: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        lowStars: 0,
        topTags: [] as { tag: string; count: number }[],
      };
    }

    let sum = 0;
    let fiveStars = 0;
    let fourStars = 0;
    let threeStars = 0;
    let lowStars = 0;
    const tagCountMap: Record<string, number> = {};

    feedbacks.forEach((fb) => {
      sum += fb.rating;
      if (fb.rating === 5) fiveStars++;
      else if (fb.rating === 4) fourStars++;
      else if (fb.rating === 3) threeStars++;
      else lowStars++;

      if (Array.isArray(fb.tags)) {
        fb.tags.forEach((t) => {
          tagCountMap[t] = (tagCountMap[t] || 0) + 1;
        });
      }
    });

    const average = (sum / total).toFixed(1);
    const topTags = Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      total,
      average: Number(average),
      fiveStars,
      fourStars,
      threeStars,
      lowStars,
      topTags,
    };
  }, [feedbacks]);

  // Filter & Sort
  const filteredFeedbacks = useMemo(() => {
    return feedbacks
      .filter((item) => {
        // Filter rating
        if (selectedRatingFilter !== 'all' && item.rating !== selectedRatingFilter) {
          return false;
        }
        // Filter tag
        if (selectedTagFilter !== 'all' && (!item.tags || !item.tags.includes(selectedTagFilter))) {
          return false;
        }
        // Filter pencarian (nama, email, teks saran)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.fullName.toLowerCase().includes(q);
          const matchEmail = (item.email || '').toLowerCase().includes(q);
          const matchSuggestion = item.suggestions.toLowerCase().includes(q);
          const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchEmail && !matchSuggestion && !matchTag) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return b.rating - a.rating;
        if (sortBy === 'lowest') return a.rating - b.rating;
        // Default newest
        const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [feedbacks, selectedRatingFilter, selectedTagFilter, searchQuery, sortBy]);

  // Ekspor feedback ke CSV
  const handleExportCSV = () => {
    if (feedbacks.length === 0) {
      if (onShowToast) onShowToast('Tidak ada data penilaian untuk diekspor.');
      return;
    }

    const headers = ['ID Pengguna', 'Nama Lengkap', 'Email', 'Bintang (Rating)', 'Label/Tags', 'Saran & Masukan', 'Waktu Kirim'];
    const rows = feedbacks.map((f) => [
      `"${f.id}"`,
      `"${f.fullName.replace(/"/g, '""')}"`,
      `"${f.email || ''}"`,
      f.rating,
      `"${(f.tags || []).join(', ')}"`,
      `"${f.suggestions.replace(/"/g, '""')}"`,
      `"${f.submittedAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Penilaian_Pengguna_Ascend_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast('Data penilaian pengguna berhasil diekspor ke CSV!');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-[1240px] mx-auto">
      {/* Header Banner Mode Administrator */}
      <div 
        style={{
          boxShadow: 'inset 0 -35px 50px -15px rgba(245, 158, 11, 0.40), inset 0 -70px 85px -35px rgba(245, 158, 11, 0.18), 0 20px 40px -10px rgba(0, 0, 0, 0.7)',
        }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#0d101a]/95 to-[#131224]/95 border border-amber-500/35 p-6 md:p-8 backdrop-blur-xl shadow-xl"
      >
        {/* Inward Glow dari Bawah ke Atas (Cahaya ke Dalam) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-amber-500/22 via-amber-500/6 to-transparent rounded-b-3xl z-0" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Panel Administrator</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-[11px]">
                {currentUser?.email || 'Akun Admin'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Penilaian & Saran Pengguna</span>
              <span className="text-amber-400">⭐</span>
            </h1>
            <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
              Pantau kepuasan pengguna, ulasan bintang 1–5, masukan fitur, dan saran pengembangan yang dikirimkan oleh pengguna setelah menggunakan aplikasi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                loadFeedbacks();
                if (onShowToast) onShowToast('Memperbarui data penilaian...');
              }}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Segarkan data dari Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Muat Ulang</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-98"
              title="Unduh data dalam format file CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Kartu Metrik Ringkasan (Aggregate Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rata-Rata Bintang */}
        <div 
          style={{
            boxShadow: 'inset 0 -20px 30px -8px rgba(245, 158, 11, 0.35), 0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          }}
          className="p-5 rounded-2xl bg-[#14120c]/90 border border-amber-500/30 backdrop-blur-xl relative overflow-hidden group"
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-amber-500/18 to-transparent rounded-b-2xl z-0" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Rata-Rata Bintang</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-white tracking-tight">
              {stats.average > 0 ? stats.average : '0.0'}
            </span>
            <span className="text-xs text-amber-400 font-bold">/ 5.0</span>
          </div>
          <div className="mt-2 flex items-center gap-1 relative z-10">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(stats.average)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-white/20'
                }`}
              />
            ))}
            <span className="text-[11px] text-white/40 ml-2">Kepuasan Pengguna</span>
          </div>
        </div>

        {/* Total Ulasan Masuk */}
        <div 
          style={{
            boxShadow: 'inset 0 -20px 30px -8px rgba(14, 165, 233, 0.35), 0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          }}
          className="p-5 rounded-2xl bg-[#0a1420]/90 border border-sky-500/30 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-sky-500/18 to-transparent rounded-b-2xl z-0" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Total Penilaian</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-white tracking-tight">{stats.total}</span>
            <span className="text-xs text-white/40">Pengguna</span>
          </div>
          <p className="mt-2 text-[11px] text-white/50 flex items-center gap-1.5 relative z-10">
            <MessageSquare className="w-3 h-3 text-sky-400" />
            <span>Tersimpan di Supabase user_profiles</span>
          </p>
        </div>

        {/* Bintang 5 (Paling Puas) */}
        <div 
          style={{
            boxShadow: 'inset 0 -20px 30px -8px rgba(16, 185, 129, 0.35), 0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          }}
          className="p-5 rounded-2xl bg-[#0a1814]/90 border border-emerald-500/30 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-500/18 to-transparent rounded-b-2xl z-0" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Puas Sempurna (5 ⭐)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-white tracking-tight">{stats.fiveStars}</span>
            <span className="text-xs text-emerald-400 font-semibold">
              {stats.total > 0 ? `${Math.round((stats.fiveStars / stats.total) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-white/50 relative z-10">Memberi bintang 5 penuh</p>
        </div>

        {/* Butuh Perbaikan (Bintang 1 - 3) */}
        <div 
          style={{
            boxShadow: 'inset 0 -20px 30px -8px rgba(244, 63, 94, 0.35), 0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          }}
          className="p-5 rounded-2xl bg-[#1a0c10]/90 border border-rose-500/30 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-rose-500/18 to-transparent rounded-b-2xl z-0" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Perlu Evaluasi (≤3 ⭐)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-white tracking-tight">
              {stats.threeStars + stats.lowStars}
            </span>
            <span className="text-xs text-rose-400 font-semibold">Masukan Penting</span>
          </div>
          <p className="mt-2 text-[11px] text-white/50 relative z-10">Prioritas saran pengembangan</p>
        </div>
      </div>

      {/* Top Tags & Label Populer dari Pengguna */}
      {stats.topTags.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0f1118]/60 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Aspek yang Sering Disebut Pengguna:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {stats.topTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? 'all' : tag)}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedTagFilter === tag
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                }`}
              >
                <span>{tag}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-white/80 font-bold">
                  {count}
                </span>
              </button>
            ))}
            {selectedTagFilter !== 'all' && (
              <button
                onClick={() => setSelectedTagFilter('all')}
                className="text-[11px] text-white/40 hover:text-white underline cursor-pointer ml-1"
              >
                Reset Filter Tag
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar Filter & Pencarian */}
      <div className="p-4 rounded-2xl bg-[#0f1118]/90 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, atau kata saran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Rating Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-white/40 mr-1 hidden sm:inline">Bintang:</span>
          {(['all', 5, 4, 3, 2, 1] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRatingFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                selectedRatingFilter === r
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {r === 'all' ? 'Semua' : `${r} ⭐`}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <ArrowUpDown className="w-3.5 h-3.5 text-white/40" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
          >
            <option value="newest" className="bg-[#0f1118] text-white">Terbaru</option>
            <option value="highest" className="bg-[#0f1118] text-white">Bintang Tertinggi (5→1)</option>
            <option value="lowest" className="bg-[#0f1118] text-white">Bintang Terendah (1→5)</option>
          </select>
        </div>
      </div>

      {/* List Kartu Feedback Pengguna */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f1118]/60 border border-white/10">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-white/60">Mengambil data ulasan dan penilaian pengguna dari Supabase...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0f1118]/60 border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Star className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Belum Ada Penilaian yang Sesuai</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto mb-4">
            {feedbacks.length === 0
              ? 'Pengguna belum mengirimkan penilaian bintang atau saran melalui dialog evaluasi 24 jam atau menu profil.'
              : 'Tidak ditemukan penilaian yang cocok dengan filter atau kata kunci pencarian Anda.'}
          </p>
          {(selectedRatingFilter !== 'all' || selectedTagFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRatingFilter('all');
                setSelectedTagFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-white/40 px-1">
            <span>Menampilkan {filteredFeedbacks.length} dari {feedbacks.length} total penilaian</span>
            <span>Real-time dari public.user_profiles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedbacks.map((fb) => (
              <div
                key={fb.id}
                style={{
                  boxShadow: 'inset 0 -22px 32px -8px rgba(245, 158, 11, 0.28), 0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                }}
                className="p-5 rounded-2xl bg-[#0f1118]/95 border border-white/10 hover:border-amber-500/40 transition-all shadow-md hover:shadow-xl flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Inward Glow dari Bawah ke Atas (Cahaya ke Dalam) */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-amber-500/16 via-amber-500/4 to-transparent rounded-b-2xl z-0" />

                <div className="relative z-10">
                  {/* Top user info & rating badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {fb.avatarUrl ? (
                        <img
                          src={fb.avatarUrl}
                          alt={fb.fullName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-white/15"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-white/15 flex items-center justify-center text-white font-bold text-sm">
                          {fb.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {fb.fullName}
                        </h4>
                        {fb.email && (
                          <p className="text-[11px] text-white/50">{fb.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Rating Stars Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-300">{fb.rating}.0</span>
                    </div>
                  </div>

                  {/* Stars visual */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= fb.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/10'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-semibold text-white/40 ml-2">
                      {fb.rating === 5 ? 'Sangat Puas' :
                       fb.rating === 4 ? 'Puas' :
                       fb.rating === 3 ? 'Cukup' :
                       fb.rating === 2 ? 'Kurang Puas' : 'Perlu Banyak Peningkatan'}
                    </span>
                  </div>

                  {/* Tags */}
                  {fb.tags && fb.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {fb.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggestions / Feedback Text */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/80 leading-relaxed italic mb-3">
                    {fb.suggestions ? (
                      `"${fb.suggestions}"`
                    ) : (
                      <span className="text-white/30 not-italic">Tidak menyertakan saran teks tambahan.</span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Timestamp & Metadata */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40 relative z-10">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-white/30" />
                    <span>
                      {fb.submittedAt
                        ? new Date(fb.submittedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Waktu tidak tercatat'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/30 truncate max-w-[120px]" title={fb.id}>
                    ID: {fb.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
