import React, { useState, useEffect } from 'react';
import { X, CheckSquare, TrendingUp, Wallet, StickyNote, Calendar, Mic, Camera } from 'lucide-react';
import { Task, Habit, Transaction, QuickNote } from '../types';
import { toISODateString, formatReadableDate, MONTH_NAMES_SHORT_ID } from '../utils/dateUtils';
import { triggerConfetti } from '../utils/confetti';
import { VoiceNoteRecorderModal } from './VoiceNoteRecorderModal';
import { ReceiptScannerModal } from './ReceiptScannerModal';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Task) => void;
  onAddHabit: (habit: Habit) => void;
  onAddTransaction: (tx: Transaction) => void;
  onAddNote: (note: QuickNote) => void;
  currencySymbol?: string;
  defaultDate?: string;
  initialType?: EntryType;
  theme?: 'dark' | 'light';
}

type EntryType = 'task' | 'habit' | 'transaction' | 'note';

export const NewEntryModal: React.FC<NewEntryModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  onAddHabit,
  onAddTransaction,
  onAddNote,
  currencySymbol = 'Rp',
  defaultDate,
  initialType,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [activeType, setActiveType] = useState<EntryType>(initialType || 'task');
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate || toISODateString(new Date()));

  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType || 'task');
    }
  }, [isOpen, initialType]);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskFlagged, setTaskFlagged] = useState(false);

  const [habitTitle, setHabitTitle] = useState('');
  const [habitTotalDays, setHabitTotalDays] = useState(7);

  const [txType, setTxType] = useState<'income' | 'expense' | 'savings_deposit' | 'savings_withdrawal'>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const txCategory = 'Pemasukan';

  const [noteText, setNoteText] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleSaveVoiceDirectly = (result: { text: string; audioUrl?: string; duration: number }) => {
    const formattedDate = formatReadableDate(selectedDate);
    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const cleanSnippet = result.text.replace(/\[.*?\]/g, '').trim().split(/\s+/).slice(0, 5).join(' ');
    const voiceTitle = cleanSnippet ? `🎙️ ${cleanSnippet}...` : `Catatan Suara`;

    onAddNote({
      id: `note-${now}`,
      title: voiceTitle,
      text: result.text,
      createdAt: `${formattedDate}, ${timeStr}`,
      date: selectedDate,
      timestamp: now,
      tags: ['Suara', 'Umum'],
      audioUrl: result.audioUrl,
      audioDuration: result.duration,
      isVoiceNote: true,
    });

    triggerConfetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#2dd4bf', '#38bdf8', '#818cf8'],
    });

    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'task') {
      if (!taskTitle.trim()) return;
      onAddTask({
        id: `task-${Date.now()}`,
        title: taskTitle.trim(),
        flagged: taskFlagged,
        days: {},
        createdAt: selectedDate,
      });
      setTaskTitle('');
      setTaskFlagged(false);
    } else if (activeType === 'habit') {
      if (!habitTitle.trim()) return;
      onAddHabit({
        id: `habit-${Date.now()}`,
        title: habitTitle.trim(),
        completedDays: 0,
        totalDays: habitTotalDays,
        color: '#ea580c',
        completedToday: false,
        completedDayIndices: [],
        completedDates: [],
        createdAt: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString(),
      });
      setHabitTitle('');
    } else if (activeType === 'transaction') {
      const amount = parseFloat(txAmount);
      if (!txTitle.trim() || isNaN(amount) || amount <= 0) return;
      let finalCategory = txCategory;
      if (!finalCategory || finalCategory === 'Pemasukan' || finalCategory === 'Pengeluaran' || finalCategory === 'Penarikan Saldo' || finalCategory === 'Isi Tabungan' || finalCategory === 'Tarik Tunai') {
        finalCategory = txType === 'income' 
          ? 'Pemasukan' 
          : txType === 'expense' 
          ? 'Pengeluaran' 
          : txType === 'savings_deposit'
          ? 'Isi Tabungan'
          : 'Tarik Tunai';
      }
      const isToday = selectedDate === toISODateString(new Date());
      let timestamp = Date.now();
      if (!isToday) {
        const d = new Date(`${selectedDate}T12:00:00`);
        timestamp = !isNaN(d.getTime()) ? d.getTime() : Date.now();
      }

      const parsedD = new Date(selectedDate);
      const day = parsedD.getDate();
      const month = MONTH_NAMES_SHORT_ID[parsedD.getMonth()];
      const formattedDate = !isNaN(day) && month ? `${day} ${month}` : formatReadableDate(selectedDate);

      onAddTransaction({
        id: `tx-${Date.now()}`,
        title: txTitle.trim(),
        amount: amount,
        type: txType,
        category: finalCategory,
        date: formattedDate,
        timestamp,
      });
      setTxTitle('');
      setTxAmount('');
    } else if (activeType === 'note') {
      if (!noteText.trim()) return;
      const formattedDate = formatReadableDate(selectedDate);
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      onAddNote({
        id: `note-${now}`,
        text: noteText.trim(),
        createdAt: `${formattedDate}, ${timeStr}`,
        date: selectedDate,
        timestamp: now,
        tags: ['Umum'],
      });
      setNoteText('');
    }

    triggerConfetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.6 }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div 
        id="modal-entri-baru"
        className={`${
          isLight 
            ? 'bg-white border border-slate-200 text-slate-900 shadow-2xl' 
            : 'bg-[#111827] border border-[#263449] text-white shadow-2xl'
        } rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 my-auto`}
      >
        {/* Header - Sesuai jenis entri masing-masing tanpa tab campur */}
        <div className={`flex justify-between items-center pb-3.5 sm:pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'} shrink-0 mb-3.5 sm:mb-4`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isLight ? 'bg-emerald-50 border border-emerald-100 text-[#003B2F]' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              {activeType === 'task' && <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {activeType === 'habit' && <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {activeType === 'transaction' && <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {activeType === 'note' && <StickyNote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div className="min-w-0">
              <h3 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-950' : 'text-white'} tracking-tight truncate`}>
                {activeType === 'task' && 'Tambah Agenda Baru'}
                {activeType === 'habit' && 'Tambah Kebiasaan Baru'}
                {activeType === 'transaction' && 'Catat Transaksi Keuangan'}
                {activeType === 'note' && 'Tulis Catatan / Refleksi'}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'} truncate`}>
                {activeType === 'task' && 'Buat tugas atau agenda kegiatan untuk hari ini'}
                {activeType === 'habit' && 'Bangun rutinitas dan kebiasaan positif harian'}
                {activeType === 'transaction' && 'Catat arus kas pemasukan, pengeluaran, atau tabungan'}
                {activeType === 'note' && 'Simpan catatan penting, ide, atau refleksi pribadi'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal entri baru"
            className={`${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'} p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ml-2`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Accurate Date Picker Field */}
          <div className={`p-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'} border rounded-2xl flex items-center justify-between gap-2`}>
            <div className="flex items-center space-x-2 min-w-0">
              <Calendar className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-emerald-400'} shrink-0`} />
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/80'} truncate`}>Tanggal Entri</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`text-xs ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500 [color-scheme:light]' 
                  : 'bg-white/10 border-white/15 text-white focus:border-emerald-500 [color-scheme:dark]'
              } border rounded-xl px-2.5 py-1.5 font-mono outline-hidden cursor-pointer shrink-0`}
            />
          </div>

          {activeType === 'task' && (
            <>
              <div>
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'} mb-1.5`}>
                  Nama Agenda / Tugas
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="cth: Tinjau Laporan Mingguan, Riset Kompetitor"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={`w-full text-sm p-3 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white' 
                      : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-500 focus:bg-white/10'
                  } border rounded-xl outline-hidden transition-all`}
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="flag-priority"
                  checked={taskFlagged}
                  onChange={(e) => setTaskFlagged(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="flag-priority" className={`text-xs ${isLight ? 'text-slate-700' : 'text-white/70'} font-medium cursor-pointer`}>
                  Tandai sebagai prioritas penting (ikon bendera merah)
                </label>
              </div>
            </>
          )}

          {activeType === 'habit' && (
            <>
              <div>
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'} mb-1.5`}>
                  Nama Kebiasaan
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="cth: Minum 2L Air, Jalan Pagi 15m, Menulis Jurnal"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  className={`w-full text-sm p-3 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white' 
                      : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-500 focus:bg-white/10'
                  } border rounded-xl outline-hidden transition-all`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'} mb-1.5`}>
                  Target Frekuensi
                </label>
                <select
                  value={habitTotalDays}
                  onChange={(e) => setHabitTotalDays(Number(e.target.value))}
                  className={`w-full text-sm p-3 ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-teal-500' 
                      : 'bg-[#1a1a24] border-white/15 text-white focus:border-emerald-500'
                  } border rounded-xl outline-hidden`}
                >
                  <option value={5}>5 Hari per minggu</option>
                  <option value={7}>7 Hari per minggu (Setiap hari)</option>
                  <option value={14}>14 Hari</option>
                  <option value={30}>30 Hari (1 Bulan)</option>
                </select>
              </div>
            </>
          )}

          {activeType === 'transaction' && (
            <>
              {/* Tombol Pintas Pindai Struk Belanja dengan Kamera/Foto */}
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(true)}
                className={`w-full py-2.5 px-3.5 rounded-2xl border flex items-center justify-between gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                  isLight
                    ? 'bg-emerald-50/80 border-emerald-300/80 text-emerald-950 hover:bg-emerald-100 shadow-xs'
                    : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-xl ${isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-slate-950'}`}>
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black tracking-tight">Foto Struk Belanja (AI Otomatis)</span>
                    <span className={`text-[10px] font-medium block ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      Memfoto nota/struk langsung tercatat ke pengeluaran
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-xl font-mono font-black ${
                  isLight ? 'bg-emerald-200 text-emerald-950' : 'bg-emerald-500/30 text-emerald-200'
                }`}>
                  Foto Struk
                </span>
              </button>

              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'} border rounded-2xl`}>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                    txType === 'income'
                      ? isLight ? 'bg-emerald-100 border border-emerald-400 text-emerald-900 shadow-xs' : 'bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/50 hover:text-white'
                  }`}
                >
                  + Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                    txType === 'expense'
                      ? isLight ? 'bg-rose-100 border border-rose-400 text-rose-900 shadow-xs' : 'bg-rose-500/30 border border-rose-500/50 text-rose-200 shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/50 hover:text-white'
                  }`}
                >
                  - Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('savings_deposit')}
                  className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                    txType === 'savings_deposit'
                      ? isLight ? 'bg-teal-100 border border-teal-400 text-teal-900 shadow-xs' : 'bg-teal-500/30 border border-teal-500/50 text-teal-200 shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/50 hover:text-white'
                  }`}
                >
                  + Isi Tabungan
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('savings_withdrawal')}
                  className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                    txType === 'savings_withdrawal'
                      ? isLight ? 'bg-amber-100 border border-amber-400 text-amber-900 shadow-xs' : 'bg-amber-500/30 border border-amber-500/50 text-amber-200 shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/50 hover:text-white'
                  }`}
                >
                  - Tarik Tunai
                </button>
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'} mb-1.5`}>
                  Keterangan
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={
                    txType === 'income'
                      ? 'cth: Gaji freelance, Dividen, Penjualan produk'
                      : txType === 'expense'
                      ? 'cth: Langganan software, Makan siang, Transport'
                      : txType === 'savings_deposit'
                      ? 'cth: Setor tabungan darurat, Beli laptop'
                      : 'cth: Tarik tunai tabungan untuk belanja'
                  }
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className={`w-full text-sm p-3 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white' 
                      : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10'
                  } border rounded-xl outline-hidden transition-all`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'} mb-1.5`}>
                  Jumlah Nominal ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  placeholder={currencySymbol === 'Rp' ? 'cth: 50000' : '0.00'}
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className={`w-full text-sm p-3 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white' 
                      : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10'
                  } border rounded-xl outline-hidden font-mono transition-all`}
                />
              </div>
            </>
          )}

          {activeType === 'note' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
                  Isi Catatan atau Refleksi
                </label>
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                    isLight
                      ? 'text-teal-800 bg-teal-50 border-teal-200 hover:bg-teal-100'
                      : 'text-teal-300 bg-teal-500/10 border-teal-500/25 hover:bg-teal-500/20'
                  }`}
                  title="Rekam suara untuk mengisi catatan secara instan tanpa mengetik"
                >
                  <Mic className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  <span>Bicara Tanpa Mengetik</span>
                </button>
              </div>
              <textarea
                rows={4}
                required
                autoFocus
                placeholder="Tuliskan catatan, ide, atau bicara langsung dengan suara..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className={`w-full text-sm p-3 ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white' 
                    : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-500 focus:bg-white/10'
                } border rounded-xl outline-hidden resize-none transition-all`}
              />
            </div>
          )}

          <div className={`flex justify-end space-x-2 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold ${isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/60 hover:text-white'} rounded-xl transition-colors cursor-pointer`}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs font-semibold text-white ${
                isLight 
                  ? 'bg-[#003B2F] hover:bg-[#002e24]' 
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/25'
              } rounded-xl shadow-md cursor-pointer transition-all`}
            >
              {activeType === 'task' && 'Simpan Agenda'}
              {activeType === 'habit' && 'Simpan Kebiasaan'}
              {activeType === 'transaction' && 'Simpan Transaksi'}
              {activeType === 'note' && 'Simpan Catatan'}
            </button>
          </div>
        </form>
      </div>

      <VoiceNoteRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onFinishSaveDirectly={handleSaveVoiceDirectly}
        onApplyToForm={(transcript) => setNoteText((prev) => (prev ? `${prev}\n${transcript}` : transcript))}
        theme={theme}
        title="Catatan Suara Instan"
      />

      <ReceiptScannerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSaveTransaction={(tx) => {
          onAddTransaction(tx);
          setIsReceiptModalOpen(false);
          onClose();
        }}
        currencySymbol={currencySymbol}
        theme={theme}
      />
    </div>
  );
};
