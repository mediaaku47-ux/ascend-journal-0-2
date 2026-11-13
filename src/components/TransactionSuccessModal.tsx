import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Send, 
  X, 
  Wallet, 
  PiggyBank,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { TransactionReceiptData, generateTransactionReceiptPDF } from '../utils/transactionReceiptPdf';

interface TransactionSuccessModalProps {
  receipt: TransactionReceiptData | null;
  onClose: () => void;
  isLight?: boolean;
  autoCloseSeconds?: number;
}

export const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({
  receipt,
  onClose,
  isLight = false,
  autoCloseSeconds = 15,
}) => {
  const [isProcessingShare, setIsProcessingShare] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [, setSecondsRemaining] = useState(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-close timer dengan pause saat hover / interaksi
  useEffect(() => {
    if (!receipt) return;
    setSecondsRemaining(autoCloseSeconds);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (isPaused) return prev;
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [receipt, isPaused, onClose, autoCloseSeconds]);

  if (!receipt) return null;

  // Format nominal uang sesuai data yang sudah ada
  const formattedAmount = `${receipt.currencySymbol} ${Math.abs(receipt.amount).toLocaleString('id-ID')}`;
  const formattedBefore = `${receipt.currencySymbol} ${receipt.balanceBefore.toLocaleString('id-ID')}`;
  const formattedAfter = `${receipt.currencySymbol} ${receipt.balanceAfter.toLocaleString('id-ID')}`;

  // Pisahkan Tanggal dan Waktu secara rapi jika tersedia format gabungan
  let datePart = receipt.dateTime;
  let timePart = '';
  if (receipt.dateTime.includes(',')) {
    const parts = receipt.dateTime.split(',');
    datePart = parts[0]?.trim() || receipt.dateTime;
    timePart = parts.slice(1).join(',').trim();
  } else if (receipt.dateTime.includes('|')) {
    const parts = receipt.dateTime.split('|');
    datePart = parts[0]?.trim() || receipt.dateTime;
    timePart = parts.slice(1).join('|').trim();
  }

  const receiptPlainText = 
    `========================================\n` +
    `             ASCEND JOURNAL             \n` +
    `        BUKTI TRANSAKSI ELEKTRONIK       \n` +
    `========================================\n` +
    `TANGGAL   : ${datePart}\n` +
    (timePart ? `WAKTU     : ${timePart}\n` : '') +
    `PENGGUNA  : ${receipt.userName || 'Pengguna ASCEND'}\n` +
    `JENIS     : ${receipt.type}\n` +
    `KATEGORI  : ${receipt.category}\n` +
    (receipt.title ? `KET.      : ${receipt.title}\n` : '') +
    `----------------------------------------\n` +
    `SALDO AWAL: ${formattedBefore}\n` +
    `NOMINAL   : ${formattedAmount}\n` +
    `----------------------------------------\n` +
    `TOTAL     : ${formattedAmount}\n` +
    `SISA SALDO: ${formattedAfter}\n` +
    `========================================\n` +
    `  *** SIMPAN STRUK SEBAGAI BUKTI SAH *** \n` +
    `========================================`;

  // Salin teks struk format kode
  const handleCopyText = async () => {
    setIsPaused(true);
    try {
      await navigator.clipboard.writeText(receiptPlainText);
      setShareFeedback('Teks struk berhasil disalin!');
      setTimeout(() => setShareFeedback(null), 2500);
    } catch {
      setShareFeedback('Gagal menyalin teks.');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  // Fungsi Bagikan Struk (Web Share API atau unduh PDF resmi)
  const handleShare = async () => {
    setIsPaused(true);
    setIsProcessingShare(true);
    setShareFeedback(null);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bukti Transaksi ASCEND - ${receipt.title || receipt.type}`,
          text: receiptPlainText,
        });
        setShareFeedback('Bukti berhasil dibagikan!');
        setTimeout(() => setShareFeedback(null), 3000);
        setIsProcessingShare(false);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setIsProcessingShare(false);
          return;
        }
      }
    }

    try {
      generateTransactionReceiptPDF(receipt);
      setShareFeedback('Bukti transaksi PDF berhasil diunduh!');
      setTimeout(() => setShareFeedback(null), 3500);
    } catch {
      setShareFeedback('Gagal menyiapkan bukti.');
      setTimeout(() => setShareFeedback(null), 2500);
    } finally {
      setIsProcessingShare(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="w-full max-w-[360px] sm:max-w-[390px] my-auto py-2 flex flex-col items-center animate-in zoom-in-95 fade-in duration-200"
      >
        {/* KARTU STRUK KOTAK ASLI (RECTANGULAR FLAT PAPER BOX - ZERO CURVES) */}
        <div className="w-full bg-[#FAF9F5] text-slate-900 rounded-none shadow-2xl relative border-2 border-slate-300 font-mono">
          {/* Header Struk: Status Barcode & Tombol Tutup */}
          <div className="pt-4 px-5 sm:px-6 pb-3">
            <div className="flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-700 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>[ LUNAS / BERHASIL ]</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-none text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Tutup"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nama Toko / Header POS Struk */}
            <div className="text-center mb-4">
              <div className="font-mono font-black text-base sm:text-lg tracking-wider text-slate-900 uppercase">
                ASCEND JOURNAL
              </div>
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                ================================
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                BUKTI TRANSAKSI ELEKTRONIK
              </div>
            </div>

            {/* SEKSI 1: Rincian Data Monospace / Kode */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-500 shrink-0">TANGGAL</span>
                <span className="font-semibold text-slate-900 text-right">
                  {datePart}
                </span>
              </div>

              {timePart && (
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-slate-500 shrink-0">WAKTU</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {timePart}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-500 shrink-0">PENGGUNA</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[60%]">
                  {receipt.userName || 'Pengguna ASCEND'}
                </span>
              </div>

              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-500 shrink-0">JENIS</span>
                <span className="font-semibold text-slate-900 text-right">
                  {receipt.type}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500 shrink-0">KATEGORI</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 border border-emerald-300 text-[11px] rounded-none">
                  {receipt.category === 'Tabungan' ? (
                    <PiggyBank className="w-3 h-3 text-emerald-700" />
                  ) : (
                    <Wallet className="w-3 h-3 text-emerald-700" />
                  )}
                  <span>[{receipt.category.toUpperCase()}]</span>
                </span>
              </div>

              {receipt.title && (
                <div className="flex justify-between items-start gap-2 pt-0.5">
                  <span className="text-slate-500 shrink-0">KET.</span>
                  <span className="text-slate-800 text-right break-words max-w-[65%] font-medium">
                    {receipt.title}
                  </span>
                </div>
              )}
            </div>

            {/* Garis Putus-Putus Pembatas Monospace */}
            <div className="border-b-2 border-dashed border-slate-300 my-3" />

            {/* SEKSI 2: Rincian Nominal & Saldo */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500">SALDO SEBELUM</span>
                <span className="text-slate-700 font-semibold text-right">
                  {formattedBefore}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-800 font-bold">NOMINAL</span>
                <span className="text-slate-900 font-black text-right">
                  {formattedAmount}
                </span>
              </div>
            </div>

            {/* Garis Tebal Solid Sebelum Total */}
            <div className="border-b-2 border-slate-900 my-2.5" />

            {/* SEKSI 3: Total & Saldo Akhir */}
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                  TOTAL BAYAR
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-700 text-right">
                  {formattedAmount}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 text-xs pt-1.5 border-t border-dashed border-slate-200">
                <span className="text-slate-500">SALDO AKHIR</span>
                <span className="font-bold text-emerald-800 text-right">
                  {formattedAfter}
                </span>
              </div>
            </div>

            {/* Footer Kasir Tanpa ID / Barcode */}
            <div className="mt-3.5 pt-2 border-t-2 border-dashed border-slate-300 text-center font-mono">
              <p className="text-[9.5px] font-mono text-slate-500 uppercase tracking-wider">
                *** SIMPAN STRUK INI SEBAGAI BUKTI SAH ***
              </p>
            </div>
          </div>

          {/* Garis Sobekan Kertas Struk Kotak Otentik (Zero Curves, Flat Straight Box Edge) */}
          <div className="border-t-2 border-dashed border-slate-300 py-1.5 px-3 bg-slate-100/80 text-center font-mono text-[9px] uppercase tracking-widest text-slate-500 select-none">
            - - - - - SOBEK / POTONG DISINI - - - - -
          </div>
        </div>

        {/* Notifikasi Toast Feedback */}
        {shareFeedback && (
          <div className="mt-2.5 px-3.5 py-1.5 rounded-none bg-emerald-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

        {/* TOMBOL AKSI: SALIN, BAGIKAN & SELESAI (Kotak Sempurna & Tema Hijau) */}
        <div className="w-full space-y-2 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-mono font-bold py-2.5 px-2 rounded-none flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-[0.99] text-xs uppercase tracking-wider"
              title="Salin teks struk ke clipboard"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-700" />
              <span>SALIN STRUK</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={isProcessingShare}
              className="w-full bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-mono font-bold py-2.5 px-2 rounded-none flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-[0.99] text-xs uppercase tracking-wider disabled:opacity-70"
            >
              <Send className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isProcessingShare ? 'PROSES...' : 'BAGIKAN'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold py-3 px-4 rounded-none flex items-center justify-center shadow-md shadow-emerald-700/25 transition-all cursor-pointer active:scale-[0.99] text-xs sm:text-sm uppercase tracking-wider"
          >
            SELESAI (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
