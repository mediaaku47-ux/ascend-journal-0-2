import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  CheckSquare, 
  CheckCircle2, 
  Landmark, 
  StickyNote, 
  Target, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { NavTab, Task, Habit, QuickNote, Transaction, TargetItem } from '../types';

export interface GlobalSearchResultItem {
  id: string;
  type: 'agenda' | 'habits' | 'notes' | 'finance' | 'targets' | 'feature';
  title: string;
  subtitle: string;
  tab: NavTab;
  badge: string;
  badgeColor: string;
}

interface GlobalSearchBarProps {
  tasks?: Task[];
  habits?: Habit[];
  notes?: QuickNote[];
  transactions?: Transaction[];
  targets?: TargetItem[];
  onNavigateToTab: (tab: NavTab) => void;
  theme?: 'dark' | 'light';
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  tasks = [],
  habits = [],
  notes = [],
  transactions = [],
  targets = [],
  onNavigateToTab,
  theme = 'light',
  placeholder = 'Cari agenda, kebiasaan, catatan, transaksi, target...',
  className = '',
  autoFocus = false,
}) => {
  const isLight = theme === 'light';
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format currency helper
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID').format(Math.max(0, Math.round(val)));
  };

  // Navigable app features list
  const appFeatures: Array<{ name: string; tab: NavTab; desc: string }> = [
    { name: 'Dasbor Awal', tab: 'dashboard', desc: 'Ringkasan produktivitas harian' },
    { name: 'Agenda Harian', tab: 'agenda', desc: 'Daftar rencana & checklist tugas' },
    { name: 'Pelacak Kebiasaan', tab: 'habits', desc: 'Konsistensi & rutinitas harian' },
    { name: 'Keuangan & Kas', tab: 'finance', desc: 'Pencatatan kas masuk & keluar' },
    { name: 'Perkembangan', tab: 'progress', desc: 'Statistik, grafik XP, & level diri' },
    { name: 'Target & Gol', tab: 'targets', desc: 'Sasaran jangka pendek & panjang' },
    { name: 'Catatan & Memo', tab: 'notes', desc: 'Ide, catatan cepat, & memo' },
    { name: 'Arsip & Riwayat', tab: 'archive', desc: 'Riwayat data masa lalu' },
    { name: 'Pemberitahuan & Update', tab: 'notifications', desc: 'Siaran pengumuman & berita' },
    { name: 'Pengaturan', tab: 'settings', desc: 'Preferensi sistem & sinkronisasi' },
    { name: 'Profil Pengguna', tab: 'profile', desc: 'Kelola foto profil & identitas' },
  ];

  // Real-time live filtering without requiring Enter
  const searchResults = useMemo<GlobalSearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: GlobalSearchResultItem[] = [];

    // 1. App Features matching query
    appFeatures.forEach((feat) => {
      if (feat.name.toLowerCase().includes(q) || feat.desc.toLowerCase().includes(q)) {
        items.push({
          id: `feat-${feat.tab}`,
          type: 'feature',
          title: feat.name,
          subtitle: feat.desc,
          tab: feat.tab,
          badge: 'Fitur',
          badgeColor: isLight 
            ? 'bg-teal-50 text-teal-700 border-teal-200' 
            : 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        });
      }
    });

    // 2. Tasks / Agenda
    tasks.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q))) {
        items.push({
          id: `task-${t.id}`,
          type: 'agenda',
          title: t.title,
          subtitle: t.category ? `Kategori: ${t.category}` : 'Agenda harian',
          tab: 'agenda',
          badge: 'Agenda',
          badgeColor: isLight 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        });
      }
    });

    // 3. Habits
    habits.forEach((h) => {
      if (h.title.toLowerCase().includes(q)) {
        items.push({
          id: `habit-${h.id}`,
          type: 'habits',
          title: h.title,
          subtitle: `${h.completedDays}/${h.totalDays} hari selesai`,
          tab: 'habits',
          badge: 'Kebiasaan',
          badgeColor: isLight 
            ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        });
      }
    });

    // 4. Quick Notes
    notes.forEach((n) => {
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchText = (n.text || '').toLowerCase().includes(q);
      const matchTags = (n.tags || []).some(t => t.toLowerCase().includes(q));
      if (matchTitle || matchText || matchTags) {
        items.push({
          id: `note-${n.id}`,
          type: 'notes',
          title: n.title || (n.text ? n.text.slice(0, 40) : 'Catatan'),
          subtitle: n.text ? n.text.slice(0, 70) : 'Catatan cepat',
          tab: 'notes',
          badge: 'Catatan',
          badgeColor: isLight 
            ? 'bg-amber-50 text-amber-700 border-amber-200' 
            : 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        });
      }
    });

    // 5. Transactions
    transactions.forEach((tr) => {
      const matchTitle = tr.title.toLowerCase().includes(q);
      const matchCategory = (tr.category || '').toLowerCase().includes(q);
      const matchAmount = tr.amount.toString().includes(q);
      if (matchTitle || matchCategory || matchAmount) {
        const sign = tr.type === 'income' ? '+Rp ' : '-Rp ';
        items.push({
          id: `tx-${tr.id}`,
          type: 'finance',
          title: tr.title,
          subtitle: `${sign}${formatRupiah(tr.amount)} • ${tr.category || 'Kas'}`,
          tab: 'finance',
          badge: 'Keuangan',
          badgeColor: isLight 
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        });
      }
    });

    // 6. Targets
    targets.forEach((tg) => {
      const matchTitle = tg.title.toLowerCase().includes(q);
      const matchCategory = (tg.category || '').toLowerCase().includes(q);
      if (matchTitle || matchCategory) {
        items.push({
          id: `target-${tg.id}`,
          type: 'targets',
          title: tg.title,
          subtitle: `${tg.currentCount || 0}/${tg.targetCount || 1} ${tg.unit || ''} • ${tg.category || 'Target'}`,
          tab: 'targets',
          badge: 'Target',
          badgeColor: isLight 
            ? 'bg-violet-50 text-violet-700 border-violet-200' 
            : 'bg-violet-500/15 text-violet-300 border-violet-500/30',
        });
      }
    });

    return items;
  }, [query, tasks, habits, notes, transactions, targets, isLight]);

  const handleSelectResult = (tab: NavTab) => {
    onNavigateToTab(tab);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const getResultIcon = (type: GlobalSearchResultItem['type']) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />;
      case 'agenda':
        return <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'habits':
        return <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'notes':
        return <StickyNote className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'finance':
        return <Landmark className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'targets':
        return <Target className="w-4 h-4 text-violet-400 shrink-0" />;
      default:
        return <Search className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <div 
        className={`w-full flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4.5 py-2.5 sm:py-2.5 rounded-full border transition-all duration-200 ${
          isLight
            ? 'bg-slate-100 hover:bg-slate-100/90 border-slate-300/80 hover:border-teal-400 shadow-xs focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'
            : 'bg-[#111827] border border-[#263449] hover:border-cyan-500/60 shadow-md focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20'
        }`}
      >
        {/* Ikon Pencarian: dibuat kecil, rapi, dan proporsional */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isLight 
            ? 'bg-white text-teal-600 shadow-xs border border-slate-200/80' 
            : 'bg-[#111726] text-cyan-300'
        }`}>
          <Search className="w-3.5 h-3.5 stroke-[2.3]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`flex-1 bg-transparent text-xs sm:text-sm font-medium outline-hidden min-w-0 ${
            isLight 
              ? 'text-slate-900 placeholder:text-slate-500' 
              : 'text-white placeholder:text-slate-500'
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        />

        {/* Clear Button */}
        {query.trim().length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isLight 
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/80' 
                : 'text-slate-500 hover:text-white hover:bg-slate-800'
            }`}
            title="Hapus pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Real-time Results Dropdown Popup */}
      {isOpen && query.trim().length > 0 && (
        <div 
          className={`absolute left-0 right-0 top-full mt-2 rounded-2xl border shadow-xl z-50 overflow-hidden max-h-[420px] flex flex-col backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-900 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.1)]' 
              : 'bg-[#111827] border border-[#263449] text-white'
          }`}
        >
          {/* Header Info Pencarian */}
          <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-medium shrink-0 ${
            isLight ? 'bg-teal-50/50 border-slate-100 text-slate-600' : 'bg-[#111726]/60 border-slate-800 text-slate-400'
          }`}>
            <span className="flex items-center gap-1.5">
              <span>Hasil pencarian real-time untuk</span>
              <span className={`font-bold ${isLight ? 'text-teal-700' : 'text-cyan-300'}`}>"{query}"</span>
            </span>
            <span className="text-[11px] font-mono">
              {searchResults.length} ditemukan
            </span>
          </div>

          {/* List Hasil Pencarian */}
          <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1">
            {searchResults.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Search className={`w-8 h-8 mx-auto mb-2 opacity-30 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <p className={`text-xs sm:text-sm font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Tidak ditemukan hasil untuk "{query}"
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Coba kata kunci lain seperti nama tugas, agenda, kebiasaan, catatan, atau transaksi.
                </p>
              </div>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectResult(item.tab)}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer group ${
                    isLight 
                      ? 'hover:bg-teal-50/80 active:bg-teal-100/60' 
                      : 'hover:bg-[#131D2E] active:bg-[#162338]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-[#111726] border-slate-800'
                    }`}>
                      {getResultIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isLight ? 'text-slate-900 group-hover:text-teal-700' : 'text-white group-hover:text-cyan-300'
                          }`}
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {item.title}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isLight ? 'text-teal-600' : 'text-cyan-400'
                  }`} />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
