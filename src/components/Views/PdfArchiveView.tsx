import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Archive
} from 'lucide-react';
import { PdfReportItem, UserProfile, Task, Habit, Transaction, QuickNote } from '../../types';
import { fetchPdfReports, downloadPdfReportFile, deletePdfReport } from '../../lib/pdfArchiveService';
import { formatCurrency } from '../../utils/formatters';
import { PdfDocumentIcon } from '../PdfDocumentIcon';

interface PdfArchiveViewProps {
  userId?: string;
  userProfile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  notes: QuickNote[];
  totalBalance: number;
  onOpenCloseMonthModal: () => void;
  onShowToast?: (msg: string) => void;
  theme?: 'dark' | 'light';
}

export const PdfArchiveView: React.FC<PdfArchiveViewProps> = ({
  userId,
  userProfile,
  onOpenCloseMonthModal,
  onShowToast,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const [reports, setReports] = useState<PdfReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState<PdfReportItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const effectiveUserId = userId || 'guest_user';

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPdfReports(effectiveUserId);
      setReports(data);
    } catch (err) {
      console.warn('Gagal memuat arsip laporan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [effectiveUserId]);

  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (report: PdfReportItem) => {
    setDownloadingId(report.id);
    setDownloadError(null);
    try {
      await downloadPdfReportFile(report);
      onShowToast?.(`Membuka berkas ${report.fileName}...`);
    } catch (err: any) {
      const msg = err?.message || 'Gagal membuka berkas laporan.';
      setDownloadError(msg);
      onShowToast?.(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deletingReport) return;
    setIsDeleting(true);
    try {
      await deletePdfReport(deletingReport.id, deletingReport.storagePath, effectiveUserId);
      setReports((prev) => prev.filter((r) => r.id !== deletingReport.id));
      onShowToast?.(`Arsip "${deletingReport.fileName}" berhasil dihapus.`);
      setDeletingReport(null);
    } catch (err: any) {
      const msg = 'Gagal menghapus arsip: ' + (err?.message || 'Terjadi kesalahan');
      setDownloadError(msg);
      onShowToast?.(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const failedCount = reports.filter((r) => r.status === 'Gagal').length;

  const handleDeleteAllFailed = async () => {
    const failedList = reports.filter((r) => r.status === 'Gagal');
    if (failedList.length === 0) return;
    setIsDeleting(true);
    try {
      for (const item of failedList) {
        await deletePdfReport(item.id, item.storagePath, effectiveUserId);
      }
      setReports((prev) => prev.filter((r) => r.status !== 'Gagal'));
      onShowToast?.(`${failedList.length} riwayat arsip berstatus gagal berhasil dibersihkan.`);
    } catch (err: any) {
      onShowToast?.('Gagal membersihkan riwayat gagal: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter list
  const filteredReports = reports.filter((item) => {
    const matchesSearch = 
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.monthName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.periodYear.toString().includes(searchQuery);

    const matchesYear = selectedYear === 'all' || item.periodYear.toString() === selectedYear;

    return matchesSearch && matchesYear;
  });

  // Unique years for filter
  const availableYears = Array.from(new Set(reports.map((r) => r.periodYear))).sort((a, b) => b - a);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Tersedia':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Tersedia</span>
          </span>
        );
      case 'Kedaluwarsa':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Kedaluwarsa</span>
          </span>
        );
      case 'Sedang Diproses':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Sedang Diproses</span>
          </span>
        );
      case 'Gagal':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Gagal</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 border border-slate-500/30 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF Resmi';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* BANNER UTAMA ARSIP PDF & TOMBOL PENUTUPAN BULAN */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
        isLight
          ? 'bg-gradient-to-br from-teal-50 via-white to-emerald-50/50 border-teal-200/80 text-slate-900 shadow-sm'
          : 'bg-gradient-to-br from-[#0c1427] via-[#111C38] to-[#0A1020] border-[#263449] text-white shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-xl">
            <h3 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Buat Laporan Bulanan Diri Mu
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadReports}
              disabled={isLoading}
              aria-label="Perbarui Daftar Arsip"
              className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                isLight ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
              }`}
              title="Perbarui Daftar Arsip"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {reports.length > 0 && (
              <button
                type="button"
                onClick={onOpenCloseMonthModal}
                className={`px-5 py-3 rounded-2xl text-xs font-black text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 flex items-center gap-2 ${
                  isLight
                    ? 'bg-[#003B2F] hover:bg-[#002e24]'
                    : 'bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-700 hover:via-sky-700 hover:to-indigo-700'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>Tutup &amp; Arsipkan Bulan Ini</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pesan Error / Notifikasi Terkait Unduhan */}
      {downloadError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadError(null)}
            className="text-xs font-bold text-rose-400 hover:text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
            isLight ? 'text-slate-400' : 'text-white/40'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari arsip bulan atau nama berkas..."
            className={`w-full pl-9 pr-4 py-2.5 rounded-2xl border text-xs outline-none transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 focus:border-teal-500 shadow-2xs'
                : 'bg-[#111827] border-[#263449] text-white focus:border-cyan-400 shadow-md'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {failedCount > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllFailed}
              disabled={isDeleting}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
              }`}
              title="Bersihkan semua catatan arsip yang berstatus gagal"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Bersihkan {failedCount} Riwayat Gagal</span>
            </button>
          )}

          {availableYears.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tahun:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#141F36] border-[#263449] text-white'
                }`}
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr.toString()}>{yr}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* DAFTAR KARTU LAPORAN PDF */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true" aria-label="Memuat Arsip Laporan PDF">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className={`p-4.5 sm:p-5 rounded-3xl border space-y-3.5 ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#111827] border-[#263449] shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl shrink-0 ${isLight ? 'bg-slate-200/85 animate-shimmer-light' : 'bg-white/[0.08] animate-shimmer'}`} />
                  <div className="space-y-1.5">
                    <div className={`h-4 w-32 rounded-lg ${isLight ? 'bg-slate-200/85 animate-shimmer-light' : 'bg-white/[0.08] animate-shimmer'}`} />
                    <div className={`h-4 w-20 rounded-full ${isLight ? 'bg-slate-200/85 animate-shimmer-light' : 'bg-white/[0.08] animate-shimmer'}`} />
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-xl shrink-0 ${isLight ? 'bg-slate-200/85 animate-shimmer-light' : 'bg-white/[0.08] animate-shimmer'}`} />
              </div>
              <div className={`h-3.5 w-48 rounded-lg opacity-80 ${isLight ? 'bg-slate-200/85 animate-shimmer-light' : 'bg-white/[0.08] animate-shimmer'}`} />
              <div className="flex items-center justify-between pt-2">
                <div className={`h-3.5 w-24 rounded-lg ${isLight ? 'bg-slate-200/85 animate-shimmer-light' : 'bg-white/[0.08] animate-shimmer'}`} />
                <div className={`h-9 w-32 rounded-xl ${isLight ? 'bg-slate-200/85 animate-shimmer-light' : 'bg-white/[0.08] animate-shimmer'}`} />
              </div>
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className={`p-8 sm:p-10 text-center rounded-3xl border flex flex-col items-center justify-center ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#111827] border-[#263449] text-white/60'
        }`}>
          {/* Ilustrasi Asli Arsip PDF (Transparan & Ukuran Proporsional) */}
          <div className="w-full flex justify-center mb-4">
            <img
              src="/ascend-archive-illustration.png"
              alt="Ilustrasi Arsip Laporan PDF"
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              className="w-48 sm:w-56 md:w-64 h-auto max-h-56 object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-300"
            />
          </div>

          <h4 className={`text-base font-bold mb-5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Belum Ada Arsip Laporan Bulanan
          </h4>
          <button
            type="button"
            onClick={onOpenCloseMonthModal}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer transition-all ${
              isLight ? 'bg-[#003B2F] hover:bg-[#002e24]' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            Arsipkan Bulan Sekarang
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className={`p-10 text-center rounded-3xl border ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#111827] border-[#263449] text-white/60'
        }`}>
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <h4 className={`text-sm font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Tidak Ada Laporan yang Cocok
          </h4>
          <p className="text-xs opacity-70">
            Coba ubah kata kunci pencarian atau filter tahun/status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className={`p-4.5 sm:p-5 rounded-3xl border transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm hover:border-teal-400/50'
                  : 'bg-[#111827] border-[#263449] shadow-md hover:border-cyan-500/40 text-white'
              }`}
            >
              <div className="space-y-3">
                {/* Header Kartu: Ikon PDF + Status + Tombol Hapus */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 shrink-0 flex items-center justify-center select-none">
                      <PdfDocumentIcon className="w-11 h-11" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-black tracking-tight truncate ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {report.monthName} {report.periodYear}
                        </h4>
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingReport(report)}
                    className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 border ${
                      isLight
                        ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300 shadow-2xs'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40'
                    }`}
                    title="Hapus riwayat arsip ini"
                    aria-label={`Hapus ${report.fileName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>



                {report.errorLog && (
                  <div className="p-2.5 rounded-xl text-[11px] bg-rose-500/10 border border-rose-500/25 text-rose-400 leading-relaxed">
                    <strong className="block font-semibold">Info Kesalahan:</strong>
                    <span>{report.errorLog}</span>
                  </div>
                )}

                {/* Summary Chips jika tersedia */}
                {report.summaryData && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className={`p-2 rounded-xl text-center border ${
                      isLight ? 'bg-teal-50/50 border-teal-100' : 'bg-white/[0.02] border-white/5'
                    }`}>
                      <span className="block text-[9.5px] text-slate-500 dark:text-slate-400">Konsistensi</span>
                      <strong className="text-xs text-teal-600 dark:text-teal-400">{report.summaryData.consistencyRate ?? 0}%</strong>
                    </div>

                    <div className={`p-2 rounded-xl text-center border ${
                      isLight ? 'bg-teal-50/50 border-teal-100' : 'bg-white/[0.02] border-white/5'
                    }`}>
                      <span className="block text-[9.5px] text-slate-500 dark:text-slate-400">Pemasukan</span>
                      <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-mono truncate block">
                        +{formatCurrency(report.summaryData.totalIncome || 0, userProfile.currencySymbol)}
                      </strong>
                    </div>

                    <div className={`p-2 rounded-xl text-center border ${
                      isLight ? 'bg-teal-50/50 border-teal-100' : 'bg-white/[0.02] border-white/5'
                    }`}>
                      <span className="block text-[9.5px] text-slate-500 dark:text-slate-400">Pengeluaran</span>
                      <strong className="text-xs text-rose-500 dark:text-rose-400 font-mono truncate block">
                        -{formatCurrency(report.summaryData.totalExpense || 0, userProfile.currencySymbol)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Kartu: Tanggal & Ukuran + Tombol Hapus & Unduh / Buka */}
              <div className="pt-4 mt-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="block font-semibold">{formatFileSize(report.fileSize)}</span>
                  <span>{new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">


                  {/* Tombol Buka / Unduh (hanya untuk status yang bukan Gagal) */}
                  {report.status !== 'Gagal' && (
                    <button
                      type="button"
                      onClick={() => handleDownload(report)}
                      disabled={downloadingId === report.id}
                      className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                        isLight ? 'bg-[#003B2F] hover:bg-[#002e24]' : 'bg-teal-600 hover:bg-teal-500'
                      } disabled:opacity-40`}
                    >
                      {downloadingId === report.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengunduh...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Buka / Unduh</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS ARSIP (BEKERJA 100% AMAN DI DALAM IFRAME) */}
      {deletingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#111827] border-[#263449] text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold tracking-tight">Hapus Riwayat Arsip?</h4>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Apakah Anda yakin ingin menghapus arsip <strong className="font-semibold text-rose-500">{deletingReport.fileName}</strong>?
                {deletingReport.status === 'Gagal' 
                  ? ' Catatan riwayat gagal ini akan dibersihkan dari daftar.' 
                  : ' Berkas fisik dan riwayat laporan ini akan dihapus permanen.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingReport(null)}
                disabled={isDeleting}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
