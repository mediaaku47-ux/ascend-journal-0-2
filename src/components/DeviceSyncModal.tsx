import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Laptop, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle2,
  Share2,
  FileCode2,
  Database
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { Task, Habit, Transaction, QuickNote, UserProfile } from '../types';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  quickNotes: QuickNote[];
  totalBalance: number;
  onApplySyncData: (data: {
    userProfile?: UserProfile;
    tasks?: Task[];
    habits?: Habit[];
    transactions?: Transaction[];
    quickNotes?: QuickNote[];
    totalBalance?: number;
  }) => void;
  showToast: (msg: string) => void;
  onOpenSupabaseModal?: () => void;
  currentUser?: any;
  theme?: 'dark' | 'light';
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  tasks,
  habits,
  transactions,
  quickNotes,
  totalBalance,
  onApplySyncData,
  showToast,
  onOpenSupabaseModal,
  currentUser,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [copied, setCopied] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [applyError, setApplyError] = useState('');

  if (!isOpen) return null;

  // Prepare structured export object
  const exportPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    sourceDevice: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'laptop' : 'hp',
    userProfile,
    tasks,
    habits,
    transactions,
    quickNotes,
    totalBalance,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  // Copy to clipboard
  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = jsonString;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast('Kode data berhasil disalin ke papan klip!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      showToast('Gagal menyalin, silakan gunakan tombol Unduh File.');
    }
  };

  // Download JSON File
  const handleDownloadFile = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Journal_Data_${userProfile.name || 'User'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File data cadangan berhasil diunduh!');
  };

  // Paste from clipboard button
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setPasteInput(text.trim());
          setApplyError('');
          showToast('Kode berhasil ditempel dari clipboard!');
        } else {
          showToast('Clipboard masih kosong. Silakan salin kode dari laptop dulu.');
        }
      } else {
        showToast('Silakan tempel (paste) kode secara manual ke dalam kotak teks.');
      }
    } catch (err) {
      showToast('Izin clipboard tidak diberikan. Silakan tempel secara manual.');
    }
  };

  // Upload JSON File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setPasteInput(content);
        setApplyError('');
        showToast('File data berhasil dibaca! Klik "Terapkan Data".');
      } catch (err) {
        setApplyError('Gagal membaca isi file.');
      }
    };
    reader.readAsText(file);
  };

  // Process and apply imported data
  const handleApplyData = () => {
    if (!pasteInput.trim()) {
      setApplyError('Kotak kode masih kosong. Silakan tempelkan kode data atau unggah file.');
      return;
    }

    try {
      const parsed = JSON.parse(pasteInput.trim());
      
      // Basic validation
      if (!parsed.tasks && !parsed.habits && !parsed.userProfile && !parsed.transactions) {
        setApplyError('Format kode tidak dikenali sebagai data Journal.');
        return;
      }

      onApplySyncData({
        userProfile: parsed.userProfile,
        tasks: parsed.tasks,
        habits: parsed.habits,
        transactions: parsed.transactions,
        quickNotes: parsed.quickNotes,
        totalBalance: parsed.totalBalance,
      });

      try {
        triggerConfetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      showToast('Data berhasil disinkronisasi & diperbarui!');
      onClose();
    } catch (err) {
      setApplyError('Kode data tidak valid atau terpotong. Pastikan seluruh teks tersalin lengkap.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className={`${
        isLight
          ? 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
          : 'bg-[#111827] border border-[#263449] text-white shadow-2xl'
      } rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Modal Header */}
        <div className={`p-5 border-b ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-white/[0.02]'} flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 via-sky-500 to-indigo-500 p-0.5 shadow-md shadow-teal-500/20 flex items-center justify-center">
              <div className={`w-full h-full ${isLight ? 'bg-white text-teal-700' : 'bg-[#161620] text-teal-400'} rounded-[14px] flex items-center justify-center`}>
                <Share2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-950' : 'text-white'} flex items-center gap-2`}>
                <span>Sinkronisasi Antar Perangkat</span>
                <span className={`text-[10px] font-semibold ${isLight ? 'bg-teal-100 text-teal-900 border-teal-300' : 'bg-teal-500/20 text-teal-300 border-teal-500/30'} border px-2 py-0.5 rounded-full`}>
                  Laptop ⇄ HP
                </span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Transfer data antara Laptop dan HP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal sinkronisasi perangkat"
            className={`${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/50 hover:text-white hover:bg-white/10'} p-2 rounded-xl transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Rekomendasi Supabase Realtime Sync */}
        {onOpenSupabaseModal && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-teal-500/20 via-sky-500/15 to-indigo-500/20 border border-teal-500/40 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Sinkronisasi Supabase Cloud</span>
                  <span className="text-[10px] text-teal-300 font-normal">Tersedia</span>
                </div>
                <div className="text-[11px] text-white/70">
                  {currentUser ? 'Akun terhubung, data tersinkron otomatis.' : 'Sinkron HP ↔ Laptop otomatis via cloud.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSupabaseModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-sm"
            >
              {currentUser ? 'Lihat Status' : 'Gunakan Supabase'}
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-white/[0.01] p-1.5 gap-1.5 mt-2">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'send'
                ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md shadow-teal-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Kirim dari Laptop (Salin)</span>
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md shadow-teal-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Terima di HP (Tempel)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-sm">
          {activeTab === 'send' ? (
            <div className="space-y-4">
              {/* Ringkasan Data yang Siap Dipindah */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-xs font-semibold text-white/80 mb-2 flex items-center justify-between">
                  <span>Data yang Tersimpan di Perangkat Ini:</span>
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Lengkap
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    📋 <strong>{tasks.length}</strong> Agenda Kegiatan
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    🔥 <strong>{habits.length}</strong> Target Kebiasaan
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    💰 <strong>{transactions.length}</strong> Catatan Keuangan
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    ⚡ <strong>{userProfile.streakDays || 0} Hari</strong> Rekor Streak
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Utama */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 hover:from-teal-600 hover:via-sky-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Kode Data Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Seluruh Kode Data (1-Klik)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    <span>Unduh File .JSON</span>
                  </button>
                </div>
              </div>

              {/* Petunjuk Mudah 3 Langkah */}
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200/90 space-y-2">
                <div className="font-bold text-teal-300 flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4" />
                  <span>Cara memindahkan data ke HP Anda:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-white/80 pl-1">
                  <li>Klik tombol <strong>"Salin Seluruh Kode Data"</strong> di atas.</li>
                  <li>Kirimkan teks tersebut ke HP Anda (lewat chat WhatsApp ke nomor sendiri, Telegram, atau kirim email).</li>
                  <li>Buka Journal di browser HP Anda, klik menu <strong>Sinkronisasi</strong> ini lalu pilih tab <strong>"Terima di HP"</strong> dan klik <strong>Terapkan</strong>.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-white/70">
                Punya kode data yang dikirim dari laptop? Tempelkan teks kode tersebut di bawah ini:
              </div>

              <div className="relative">
                <textarea
                  rows={6}
                  value={pasteInput}
                  onChange={(e) => {
                    setPasteInput(e.target.value);
                    setApplyError('');
                  }}
                  placeholder="Tempelkan teks kode data dari laptop di sini..."
                  className="w-full text-xs font-mono p-3 bg-black/40 border border-white/15 rounded-2xl text-white/90 placeholder-white/30 focus:border-teal-400 focus:bg-black/60 outline-hidden transition-all resize-none"
                />
                
                {/* Tombol Tempel Cepat */}
                <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-teal-300 hover:text-teal-200 text-[11px] font-semibold flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Tempel Clipboard</span>
                  </button>
                </div>
              </div>

              {applyError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {applyError}
                </div>
              )}

              {/* Opsi Upload File */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
                <span className="text-white/60">Atau gunakan file .json yang dikirim ke HP:</span>
                <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium cursor-pointer transition-colors flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-teal-400" />
                  <span>Pilih File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Tombol Eksekusi Terapkan */}
              <button
                type="button"
                onClick={handleApplyData}
                disabled={!pasteInput.trim()}
                className={`w-full py-3.5 px-4 rounded-2xl ${
                  isLight 
                    ? 'bg-[#003B2F] hover:bg-[#002e24]' 
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600'
                } text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan Data ke HP Sekarang</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isLight ? 'border-slate-200 bg-slate-50/50 text-slate-500' : 'border-white/10 bg-white/[0.02] text-white/50'} flex items-center justify-between text-xs`}>
          <span>Semua data tersimpan aman di browser Anda.</span>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-xl ${isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60' : 'text-white/70 hover:text-white hover:bg-white/10'} transition-colors cursor-pointer`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
