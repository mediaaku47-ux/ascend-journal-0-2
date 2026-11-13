import React, { useState } from 'react';
import { 
  X, 
  Archive, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  CheckSquare, 
  Wallet, 
  ShieldCheck, 
  TrendingUp,
  Download
} from 'lucide-react';
import { Task, Habit, Transaction, QuickNote, UserProfile, PdfReportItem } from '../types';
import { archiveMonthAndReset, downloadPdfReportFile } from '../lib/pdfArchiveService';
import { triggerConfetti } from '../utils/confetti';
import { formatCurrency } from '../utils/formatters';

interface CloseMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userProfile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  notes: QuickNote[];
  totalBalance: number;
  onResetMonthData: () => Promise<void> | void;
  onArchiveCompleted?: (report: PdfReportItem) => void;
  theme?: 'dark' | 'light';
}

export const CloseMonthModal: React.FC<CloseMonthModalProps> = ({
  isOpen,
  onClose,
  userId,
  userProfile,
  tasks,
  habits,
  transactions,
  notes,
  totalBalance,
  onResetMonthData,
  onArchiveCompleted,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const [isProcessing, setIsProcessing] = useState(false);
  const [stepMessage, setStepMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedReport, setCompletedReport] = useState<PdfReportItem | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentYear = userProfile.year || new Date().getFullYear();
  const currentMonthIdx = userProfile.monthIndex ?? new Date().getMonth();
  const currentMonthNum = currentMonthIdx + 1;
  const currentMonthName = userProfile.monthName || 'Bulan Berjalan';

  // Hitung ringkasan data
  const totalTasks = tasks.length;
  const doneDaysCount = tasks.reduce((acc, t) => {
    return acc + Object.values(t.days).filter((d) => d === 'done').length;
  }, 0);
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const handleExecuteArchive = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setStepMessage('Membuat dokumen PDF resmi laporan produktivitas...');

    try {
      // 1. Eksekusi transaksi atomik (PDF dibuat -> diunggah ke Storage -> Metadata dicatat -> Reset data HANYA jika sukses)
      setStepMessage('Mengunggah berkas PDF ke Supabase Storage (monthly-reports)...');
      
      const result = await archiveMonthAndReset({
        userId,
        year: currentYear,
        month: currentMonthNum,
        monthName: currentMonthName,
        userProfile,
        tasks,
        habits,
        transactions,
        notes,
        totalBalance,
        onResetSuccess: async () => {
          setStepMessage('Memverifikasi berkas & mereset agenda untuk bulan baru...');
          await onResetMonthData();
        },
      });

      setCompletedReport(result.report);
      triggerConfetti();

      if (onArchiveCompleted) {
        onArchiveCompleted(result.report);
      }
    } catch (err: any) {
      console.error('Error saat menutup & mengarsipkan bulan:', err);
      setErrorMsg(err?.message || 'Gagal mengarsipkan laporan. Seluruh data Anda tetap aman.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#111827] border-[#263449] text-white'
        }`}
      >
        {/* Header Modal */}
        <div className={`px-6 py-4.5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50/60' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              isLight ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-teal-500/20 border-teal-500/30 text-teal-300'
            }`}>
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Tutup &amp; Arsipkan Bulan
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                Periode: <strong className={isLight ? 'text-teal-800' : 'text-teal-300'}>{currentMonthName} {currentYear}</strong>
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Modal Tutup Bulan"
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs custom-scrollbar">
          {completedReport ? (
            /* Tampilan Sukses */
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className={`text-lg font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Bulan Berhasil Ditutup &amp; Diarsipkan!
                </h4>
                <p className={`text-xs mt-1 max-w-sm mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  Dokumen PDF resmi <span className="font-semibold text-emerald-500">{completedReport.fileName}</span> telah berhasil diarsipkan dengan aman. Agenda Anda telah disiapkan bersih untuk awal bulan baru.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border text-left space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
              }`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Nama Dokumen:</span>
                  <span className="font-bold truncate max-w-[200px]">{completedReport.fileName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Ukuran Berkas:</span>
                  <span className="font-bold">{(completedReport.fileSize / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Tersedia &amp; Terverifikasi
                  </span>
                </div>
              </div>

              {downloadErr && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{downloadErr}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!completedReport) return;
                    setIsDownloadingPdf(true);
                    setDownloadErr(null);
                    try {
                      await downloadPdfReportFile(completedReport);
                    } catch (err: any) {
                      setDownloadErr(err?.message || 'Gagal membuka berkas laporan.');
                    } finally {
                      setIsDownloadingPdf(false);
                    }
                  }}
                  disabled={isDownloadingPdf}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Menyiapkan Berkas...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Unduh Berkas PDF Sekarang</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`py-3 px-5 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                  }`}
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            /* Tampilan Konfirmasi Penutupan Bulan */
            <>
              {/* Box Info Konfirmasi Periode & Jaminan Aman */}
              <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3 ${
                isLight ? 'bg-teal-50/80 border-teal-200 text-teal-950' : 'bg-teal-500/10 border-teal-500/25 text-teal-100'
              }`}>
                <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-xs">
                    Penutupan Periode: <span className={isLight ? 'text-teal-800' : 'text-teal-300'}>{currentMonthName} {currentYear}</span>
                  </span>
                  <p className="text-[11.5px] leading-relaxed opacity-90">
                    Data bulan <strong>{currentMonthName} {currentYear}</strong> akan diarsipkan ke PDF. Agenda baru di-reset setelah arsip sukses tersimpan.
                  </p>
                </div>
              </div>

              {/* Rekapitulasi Data yang Akan Diarsipkan */}
              <div className="space-y-2">
                <span className={`font-bold block ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  Ringkasan Data yang Akan Diarsipkan ke PDF:
                </span>

                <div className={`grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">Agenda &amp; Checklist</span>
                      <strong className="text-xs">{totalTasks} tugas ({doneDaysCount}x centang)</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">Pelacak Kebiasaan</span>
                      <strong className="text-xs">{habits.length} kebiasaan aktif</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">Total Pemasukan</span>
                      <strong className="text-xs text-emerald-500 font-mono">+{formatCurrency(totalIncome, userProfile.currencySymbol)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">Total Pengeluaran</span>
                      <strong className="text-xs text-rose-400 font-mono">-{formatCurrency(totalExpense, userProfile.currencySymbol)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Pesan Error jika terjadi kegagalan */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Loading State saat proses berjalan */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center gap-3 animate-in fade-in">
                  <Loader2 className="w-5 h-5 text-teal-400 animate-spin shrink-0" />
                  <span className="text-xs font-semibold text-teal-300">{stepMessage}</span>
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                    isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-white/60 hover:text-white hover:bg-white/10'
                  } disabled:opacity-40`}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleExecuteArchive}
                  disabled={isProcessing}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg cursor-pointer transition-all active:scale-95 flex items-center gap-2 ${
                    isLight ? 'bg-[#003B2F] hover:bg-[#002e24]' : 'bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-700 hover:via-sky-700 hover:to-indigo-700'
                  } disabled:opacity-50`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Mengarsipkan...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>Ya, Tutup &amp; Arsipkan {currentMonthName}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
