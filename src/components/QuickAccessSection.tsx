import React, { useState } from 'react';
import { 
  Mic, 
  CheckSquare, 
  Zap, 
  Camera,
  X, 
  Sparkles, 
  TrendingDown,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { NavTab, Task, TargetItem, QuickNote, Transaction } from '../types';
import { getRealToday, toISODateString, formatReadableDate } from '../utils/dateUtils';
import { triggerConfetti } from '../utils/confetti';
import { VoiceNoteRecorderModal } from './VoiceNoteRecorderModal';
import { ReceiptScannerModal } from './ReceiptScannerModal';

interface QuickAccessSectionProps {
  onNavigateToTab: (tab: NavTab) => void;
  tasks?: Task[];
  targets?: TargetItem[];
  notes?: QuickNote[];
  currentDay?: number;
  theme?: 'dark' | 'light';
  className?: string;
  onSaveNote?: (note: QuickNote) => void;
  onAddTransaction?: (tx: Transaction) => void;
  onOpenNewEntry?: (type?: 'task' | 'habit' | 'transaction' | 'note') => void;
  currencySymbol?: string;
}

export const QuickAccessSection: React.FC<QuickAccessSectionProps> = ({
  onNavigateToTab,
  tasks = [],
  targets = [],
  notes = [],
  currentDay,
  theme = 'dark',
  className = '',
  onSaveNote,
  onAddTransaction,
  onOpenNewEntry,
  currencySymbol = 'Rp',
}) => {
  const isLight = theme === 'light';
  const realToday = getRealToday();
  const effectiveDay = currentDay || realToday.day;

  const doneTasksToday = tasks.filter((t) => t.days[effectiveDay] === 'done').length;
  const totalTasksToday = tasks.length;

  // State Modal Perekam Suara
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // State Modal Kamera Struk AI
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // State Modal Transaksi Cepat
  const [isQuickTxOpen, setIsQuickTxOpen] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txTitle, setTxTitle] = useState<string>('');
  const [txCategory, setTxCategory] = useState<string>('Makanan & Minuman');
  const [quickToast, setQuickToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setQuickToast(msg);
    setTimeout(() => {
      setQuickToast(null);
    }, 3200);
  };

  // Handler simpan transaksi hasil pemindaian struk dengan AI
  const handleSaveScannedReceipt = (newTx: Transaction) => {
    if (onAddTransaction) {
      onAddTransaction(newTx);
    } else {
      try {
        const stored = localStorage.getItem('journalstream_transactions');
        const list = stored ? JSON.parse(stored) : [];
        localStorage.setItem('journalstream_transactions', JSON.stringify([newTx, ...list]));
      } catch (e) {
        console.warn('Gagal simpan transaksi ke storage lokal:', e);
      }
    }

    triggerConfetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#0284c7', '#38bdf8', '#10b981'],
    });

    showNotification(`Struk ${newTx.title} (${currencySymbol} ${newTx.amount.toLocaleString('id-ID')}) dicatat!`);
  };

  // Handler simpan rekaman suara langsung ke catatan
  const handleSaveVoiceNote = (result: { text: string; audioUrl?: string; duration: number }) => {
    const now = Date.now();
    const todayIso = toISODateString(new Date());
    const formattedDate = formatReadableDate(todayIso);
    const timeStr = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const cleanSnippet = result.text.replace(/\[.*?\]/g, '').trim().split(/\s+/).slice(0, 5).join(' ');
    const voiceTitle = cleanSnippet ? `🎙️ ${cleanSnippet}...` : `Catatan Rekaman Suara`;

    const newNote: QuickNote = {
      id: `note-${now}`,
      title: voiceTitle,
      text: result.text || 'Catatan audio rekaman suara tanpa transkripsi teks.',
      createdAt: `${formattedDate}, ${timeStr}`,
      date: todayIso,
      timestamp: now,
      tags: ['Suara', 'Audio', 'Cepat'],
      audioUrl: result.audioUrl,
      audioDuration: result.duration,
      isVoiceNote: true,
    };

    if (onSaveNote) {
      onSaveNote(newNote);
    } else {
      try {
        const stored = localStorage.getItem('journalstream_notes');
        const list = stored ? JSON.parse(stored) : [];
        localStorage.setItem('journalstream_notes', JSON.stringify([newNote, ...list]));
      } catch (e) {
        console.warn('Gagal simpan suara ke storage lokal:', e);
      }
    }

    triggerConfetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f43f5e', '#ec4899', '#06b6d4'],
    });

    showNotification('Catatan rekaman suara berhasil disimpan!');
  };

  // Handler simpan transaksi cepat
  const handleSaveQuickTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(txAmount.replace(/[^0-9]/g, ''));
    if (!cleanAmount || cleanAmount <= 0) return;

    const now = Date.now();
    const defaultTitle = txType === 'expense' 
      ? (txCategory ? `${txCategory}` : 'Pengeluaran Cepat')
      : (txCategory ? `${txCategory}` : 'Pemasukan Cepat');

    const newTx: Transaction = {
      id: `tx-${now}`,
      type: txType,
      title: txTitle.trim() || defaultTitle,
      amount: cleanAmount,
      category: txCategory || (txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'),
      date: toISODateString(new Date()),
      timestamp: now,
    };

    if (onAddTransaction) {
      onAddTransaction(newTx);
    } else {
      try {
        const stored = localStorage.getItem('journalstream_transactions');
        const list = stored ? JSON.parse(stored) : [];
        localStorage.setItem('journalstream_transactions', JSON.stringify([newTx, ...list]));
      } catch (e) {
        console.warn('Gagal simpan transaksi ke storage lokal:', e);
      }
    }

    triggerConfetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#34d399', '#059669'],
    });

    showNotification(`${txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'} ${currencySymbol} ${cleanAmount.toLocaleString('id-ID')} dicatat!`);

    // Reset & tutup
    setTxAmount('');
    setTxTitle('');
    setIsQuickTxOpen(false);
  };

  const handleOpenAgenda = () => {
    onNavigateToTab('agenda');
  };

  // Presets nominal cepat
  const quickAmountPresets = [10000, 20000, 50000, 100000, 200000, 500000];

  // Presets kategori cepat
  const expenseCategories = ['Makanan & Minuman', 'Transport / Bensin', 'Belanja Harian', 'Tagihan & Pulsa', 'Kebutuhan Rumah', 'Lainnya'];
  const incomeCategories = ['Gaji & Upah', 'Penjualan Bisnis', 'Bonus & Tips', 'Hadiah / Uang Masuk', 'Investasi', 'Lainnya'];

  return (
    <>
      <section 
        aria-label="Akses Cepat"
        className={`relative select-none transition-colors duration-200 ${className}`}
      >
        {/* Header Akses Cepat */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <h2 
              className={`text-xs sm:text-sm font-bold tracking-tight uppercase ${
                isLight ? 'text-slate-800' : 'text-slate-200'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Akses Cepat
            </h2>
          </div>

          {quickToast && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 animate-in fade-in slide-in-from-top-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{quickToast}</span>
            </div>
          )}
        </div>

        {/* Grid 3 Kartu Akses Cepat */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          
          {/* KARTU 1: CATAT DENGAN REKAMAN SUARA */}
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer border min-h-[118px] sm:min-h-[124px] select-none shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
              isLight
                ? 'bg-gradient-to-b from-white via-rose-50/20 to-rose-50/40 hover:from-white hover:to-rose-100/40 border-rose-200/80 hover:border-rose-300 text-slate-900'
                : 'bg-gradient-to-b from-[#131d2e] to-[#0d1522] hover:from-[#17243a] hover:to-[#101b2c] border-[#223147] hover:border-rose-500/40 text-slate-100 shadow-black/20'
            }`}
            title="Catat dengan Rekaman Suara"
          >
            {/* Top Border Subtle Highlight */}
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300 ${
              isLight
                ? 'bg-gradient-to-r from-transparent via-rose-400 to-transparent opacity-60 group-hover:opacity-100'
                : 'bg-gradient-to-r from-transparent via-rose-500/80 to-transparent opacity-40 group-hover:opacity-100'
            }`} />

            {/* Ambient Background Corner Glow on Hover */}
            <div className={`pointer-events-none absolute -right-6 -bottom-6 w-20 h-20 rounded-full blur-xl transition-opacity duration-300 ${
              isLight
                ? 'bg-rose-400/10 group-hover:bg-rose-400/20'
                : 'bg-rose-500/10 group-hover:bg-rose-500/20'
            }`} />

            {/* Baris Atas: Ikon + Badge Status */}
            <div className="flex items-center justify-between w-full relative z-10 mb-2">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs ${
                isLight 
                  ? 'bg-rose-500 text-white shadow-rose-500/20 group-hover:scale-105 group-hover:bg-rose-600' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 group-hover:bg-rose-500/25 group-hover:text-rose-300 group-hover:border-rose-400/60 group-hover:scale-105'
              }`}>
                <Mic className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>

              <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                isLight
                  ? 'bg-rose-100/80 text-rose-700 border border-rose-200'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
              }`}>
                Audio
              </span>
            </div>

            {/* Baris Bawah: Judul & Keterangan */}
            <div className="relative z-10 w-full mt-auto">
              <span className={`block text-xs sm:text-[13px] font-bold tracking-tight leading-snug truncate ${
                isLight ? 'text-slate-900 group-hover:text-rose-700' : 'text-slate-100 group-hover:text-white'
              }`}>
                Rekam Suara
              </span>
              <p className={`text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 line-clamp-1 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Bicara & transkrip
              </p>
            </div>
          </button>

          {/* KARTU 2: CHECKLIST HARI INI */}
          <button
            type="button"
            onClick={handleOpenAgenda}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer border min-h-[118px] sm:min-h-[124px] select-none shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
              isLight
                ? 'bg-gradient-to-b from-white via-teal-50/20 to-teal-50/40 hover:from-white hover:to-teal-100/40 border-teal-200/80 hover:border-teal-300 text-slate-900'
                : 'bg-gradient-to-b from-[#131d2e] to-[#0d1522] hover:from-[#17243a] hover:to-[#101b2c] border-[#223147] hover:border-teal-500/40 text-slate-100 shadow-black/20'
            }`}
            title="Lihat Checklist Agenda Hari Ini"
          >
            {/* Top Border Subtle Highlight */}
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300 ${
              isLight
                ? 'bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-60 group-hover:opacity-100'
                : 'bg-gradient-to-r from-transparent via-teal-400/80 to-transparent opacity-40 group-hover:opacity-100'
            }`} />

            {/* Ambient Background Corner Glow on Hover */}
            <div className={`pointer-events-none absolute -right-6 -bottom-6 w-20 h-20 rounded-full blur-xl transition-opacity duration-300 ${
              isLight
                ? 'bg-teal-400/10 group-hover:bg-teal-400/20'
                : 'bg-teal-500/10 group-hover:bg-teal-500/20'
            }`} />

            {/* Baris Atas: Ikon + Badge Status */}
            <div className="flex items-center justify-between w-full relative z-10 mb-2">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs ${
                isLight 
                  ? 'bg-teal-600 text-white shadow-teal-600/20 group-hover:scale-105 group-hover:bg-teal-700' 
                  : 'bg-teal-500/15 text-teal-300 border border-teal-500/30 group-hover:bg-teal-500/25 group-hover:text-teal-200 group-hover:border-teal-400/60 group-hover:scale-105'
              }`}>
                <CheckSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>

              <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                isLight
                  ? 'bg-teal-100/80 text-teal-800 border border-teal-200'
                  : 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
              }`}>
                {totalTasksToday > 0 ? `${doneTasksToday}/${totalTasksToday}` : 'Agenda'}
              </span>
            </div>

            {/* Baris Bawah: Judul & Keterangan */}
            <div className="relative z-10 w-full mt-auto">
              <span className={`block text-xs sm:text-[13px] font-bold tracking-tight leading-snug truncate ${
                isLight ? 'text-slate-900 group-hover:text-teal-700' : 'text-slate-100 group-hover:text-white'
              }`}>
                Checklist Harian
              </span>
              <p className={`text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 line-clamp-1 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {totalTasksToday > 0 ? `${doneTasksToday} agenda selesai` : 'Cek agenda harian'}
              </p>
            </div>
          </button>

          {/* KARTU 3: KAMERA STRUK AI */}
          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer border min-h-[118px] sm:min-h-[124px] select-none shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
              isLight
                ? 'bg-gradient-to-b from-white via-emerald-50/20 to-emerald-50/40 hover:from-white hover:to-emerald-100/40 border-emerald-200/80 hover:border-emerald-300 text-slate-900'
                : 'bg-gradient-to-b from-[#13231e] to-[#0c1814] hover:from-[#182b25] hover:to-[#10201a] border-[#1e382f] hover:border-emerald-500/40 text-slate-100 shadow-black/20'
            }`}
            title="Scan Struk Belanja dengan Kamera AI"
          >
            {/* Top Border Subtle Highlight */}
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300 ${
              isLight
                ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60 group-hover:opacity-100'
                : 'bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent opacity-40 group-hover:opacity-100'
            }`} />

            {/* Ambient Background Corner Glow on Hover */}
            <div className={`pointer-events-none absolute -right-6 -bottom-6 w-20 h-20 rounded-full blur-xl transition-opacity duration-300 ${
              isLight
                ? 'bg-emerald-400/10 group-hover:bg-emerald-400/20'
                : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
            }`} />

            {/* Baris Atas: Ikon + Badge Status */}
            <div className="flex items-center justify-between w-full relative z-10 mb-2">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs relative ${
                isLight 
                  ? 'bg-emerald-700 text-white shadow-emerald-700/20 group-hover:scale-105 group-hover:bg-emerald-800' 
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500/25 group-hover:text-emerald-300 group-hover:border-emerald-400/60 group-hover:scale-105'
              }`}>
                <Camera className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>

              <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                isLight
                  ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
              }`}>
                Struk
              </span>
            </div>

            {/* Baris Bawah: Judul & Keterangan */}
            <div className="relative z-10 w-full mt-auto">
              <span className={`block text-xs sm:text-[13px] font-bold tracking-tight leading-snug truncate ${
                isLight ? 'text-slate-900 group-hover:text-emerald-800' : 'text-slate-100 group-hover:text-emerald-300'
              }`}>
                Kamera AI
              </span>
              <p className={`text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 line-clamp-1 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Foto &amp; catat struk
              </p>
            </div>
          </button>

        </div>
      </section>

      {/* Modal Perekam Suara Langsung */}
      <VoiceNoteRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onFinishSaveDirectly={handleSaveVoiceNote}
        theme={theme}
        title="Catat Suara Cepat"
      />

      {/* Modal Kamera Struk AI */}
      <ReceiptScannerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSaveTransaction={handleSaveScannedReceipt}
        currencySymbol={currencySymbol}
        theme={theme}
      />

      {/* Modal Dialog Catat Transaksi Cepat */}
      {isQuickTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-[24px] border shadow-2xl overflow-hidden relative transition-all duration-300 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-emerald-950/10'
                : 'bg-[#0f172a] border-[#22334d] text-white shadow-emerald-950/40'
            }`}
          >
            {/* Glow Strip Aksen Atas */}
            <div className={`absolute top-0 inset-x-0 h-1.5 transition-all duration-300 ${
              txType === 'expense'
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-400'
                : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-400'
            }`} />

            {/* Header Modal */}
            <div className={`p-5 pb-3 border-b flex items-center justify-between ${
              isLight ? 'border-slate-100 bg-slate-50/60' : 'border-white/10 bg-white/[0.02]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs ${
                  txType === 'expense'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}>
                  <Zap className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Catat Transaksi Cepat
                  </h3>
                  <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Input transaksi kas dalam hitungan detik
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickTxOpen(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-200/70 text-slate-500' : 'hover:bg-white/10 text-white/60'
                }`}
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Input Transaksi Cepat */}
            <form onSubmit={handleSaveQuickTransaction} className="p-5 space-y-4">
              
              {/* Pilihan Jenis: Pengeluaran vs Pemasukan */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#162032] border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategory('Makanan & Minuman');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    txType === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Pengeluaran</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategory('Gaji & Upah');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    txType === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Pemasukan</span>
                </button>
              </div>

              {/* Input Nominal Transaksi */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Nominal ({currencySymbol})
                </label>
                <div className="relative">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold ${
                    isLight ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                    autoFocus
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-base sm:text-lg font-black tracking-tight font-mono outline-hidden border transition-all ${
                      isLight
                        ? 'bg-white border-slate-300 focus:border-emerald-500 text-slate-900 focus:ring-2 focus:ring-emerald-500/20'
                        : 'bg-[#141f33] border-slate-700 focus:border-emerald-400 text-white focus:ring-2 focus:ring-emerald-400/20'
                    }`}
                  />
                </div>

                {/* Preset Chips Nominal Cepat */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickAmountPresets.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTxAmount(amt.toString())}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                        parseInt(txAmount, 10) === amt
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          : 'bg-[#182337] hover:bg-[#1e2e47] border-slate-700 text-slate-300'
                      }`}
                    >
                      {currencySymbol} {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Keterangan / Deskripsi Singkat */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder={txType === 'expense' ? 'Misal: Kopi, bensin motor, makan siang' : 'Misal: Gaji bulanan, penjualan'}
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold outline-hidden border transition-all ${
                    isLight
                      ? 'bg-white border-slate-300 focus:border-emerald-500 text-slate-900'
                      : 'bg-[#141f33] border-slate-700 focus:border-emerald-400 text-white'
                  }`}
                />
              </div>

              {/* Kategori Cepat */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Kategori
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(txType === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTxCategory(cat)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        txCategory === cat
                          ? txType === 'expense'
                            ? 'bg-rose-500/20 text-rose-500 border-rose-500/40 font-bold'
                            : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 font-bold'
                          : isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                          : 'bg-[#141f33] border-slate-700/80 text-slate-400 hover:bg-[#1a2842]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tombol Aksi Simpan */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={!txAmount || parseFloat(txAmount) <= 0}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 text-white ${
                    txType === 'expense'
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Simpan Transaksi Kilat</span>
                </button>

                {onOpenNewEntry && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickTxOpen(false);
                      onOpenNewEntry('transaction');
                    }}
                    className={`py-2 px-3 rounded-lg text-[11px] font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Buka Formulir Lengkap &amp; Scan Struk →</span>
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};
