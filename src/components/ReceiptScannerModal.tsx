import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  RotateCw, 
  Receipt, 
  Loader2
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { triggerConfetti } from '../utils/confetti';
import { toISODateString, MONTH_NAMES_SHORT_ID, formatReadableDate } from '../utils/dateUtils';

interface ScannedReceiptData {
  amount: number;
  description: string;
  category: string;
  date: string | null;
  merchant: string;
  items?: string[];
  rawTotalText?: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: Transaction) => void;
  currencySymbol?: string;
  theme?: 'dark' | 'light';
}

const CATEGORIES = [
  'Makanan & Minuman',
  'Kebutuhan Sehari-hari',
  'Belanja',
  'Transportasi',
  'Tagihan & Utilitas',
  'Kesehatan',
  'Pendidikan',
  'Hiburan',
  'Lainnya',
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveTransaction,
  currencySymbol = 'Rp',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedReceiptData | null>(null);

  // Form edit states (setelah di-scan, user tetap bisa mengoreksi jika perlu)
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedAmount, setEditedAmount] = useState<string>('');
  const [editedCategory, setEditedCategory] = useState<string>('Kebutuhan Sehari-hari');
  const [editedDate, setEditedDate] = useState<string>(toISODateString(new Date()));

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setImagePreview(null);
      setIsScanning(false);
      setScanError(null);
      setScannedResult(null);
      setEditedTitle('');
      setEditedAmount('');
    }
  }, [isOpen]);

  // Handle stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture photo from live camera
  const capturePhotoFromLiveCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    setImagePreview(dataUrl);
    processReceiptImage(dataUrl, 'image/jpeg');
  };

  // Handle selected file from input (camera or file gallery)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      processReceiptImage(result, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Send image to backend Gemini API
  const processReceiptImage = async (base64Url: string, detectedMimeType: string) => {
    setIsScanning(true);
    setScanError(null);
    setScannedResult(null);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Url,
          mimeType: detectedMimeType,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Gagal memindai struk.');
      }

      const data: ScannedReceiptData = json.data;
      setScannedResult(data);

      // Isi form koreksi dengan hasil scan AI
      setEditedTitle(data.description || data.merchant || 'Pengeluaran Struk');
      setEditedAmount(data.amount ? String(data.amount) : '');
      setEditedCategory(
        CATEGORIES.includes(data.category) ? data.category : 'Kebutuhan Sehari-hari'
      );
      if (data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        setEditedDate(data.date);
      } else {
        setEditedDate(toISODateString(new Date()));
      }
    } catch (err: any) {
      console.error('Receipt Scan Error:', err);
      setScanError(
        err.message || 'Gagal menganalisis struk. Pastikan foto struk terlihat jelas dan terang.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Submit and save transaction
  const handleSaveExpense = () => {
    const amountNum = parseFloat(editedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Nominal pengeluaran harus berupa angka yang valid.');
      return;
    }

    if (!editedTitle.trim()) {
      alert('Keterangan pengeluaran tidak boleh kosong.');
      return;
    }

    const parsedD = new Date(editedDate);
    const day = parsedD.getDate();
    const month = MONTH_NAMES_SHORT_ID[parsedD.getMonth()];
    const formattedDate = !isNaN(day) && month ? `${day} ${month}` : formatReadableDate(editedDate);

    const isToday = editedDate === toISODateString(new Date());
    let timestamp = Date.now();
    if (!isToday) {
      const d = new Date(`${editedDate}T12:00:00`);
      timestamp = !isNaN(d.getTime()) ? d.getTime() : Date.now();
    }

    const newTx: Transaction = {
      id: `tx-receipt-${Date.now()}`,
      title: editedTitle.trim(),
      amount: amountNum,
      type: 'expense',
      category: editedCategory,
      date: formattedDate,
      timestamp,
    };

    onSaveTransaction(newTx);

    triggerConfetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#059669', '#10b981', '#34d399'],
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-[28px] border transition-all overflow-hidden relative shadow-2xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0F172A] border-slate-800 text-white'
        }`}
      >
        {/* Header Modal */}
        <div
          className={`flex items-center justify-between p-4 sm:p-5 border-b shrink-0 ${
            isLight ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800 bg-[#131D31]/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${
                isLight
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Pindai Struk Belanja
                </h3>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Foto nota atau struk kasir, data pengeluaran dicatat otomatis
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                : 'border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. TAMPILAN AWAL: BELUM ADA FOTO & KAMERA BELUM AKTIF */}
          {!imagePreview && !isCameraActive && (
            <div className="space-y-4 text-center">
              <div
                className={`border-2 border-dashed rounded-none p-6 sm:p-8 flex flex-col items-center justify-center gap-4 transition-all font-mono ${
                  isLight
                    ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60'
                    : 'border-emerald-500/30 bg-emerald-950/15 hover:bg-emerald-950/25'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-none border flex items-center justify-center shadow-md ${
                    isLight
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-emerald-500 text-slate-950 border-emerald-400'
                  }`}
                >
                  <Receipt className="w-7 h-7 stroke-[2.2]" />
                </div>

                <div className="max-w-sm space-y-1">
                  <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider">
                    [ PINDAI STRUK BELANJA ]
                  </h4>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Posisikan struk kasir di tempat datar &amp; terang
                  </p>
                </div>

                {/* Tombol Opsi: Kamera HP / Galeri / Live Viewfinder */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (cameraInputRef.current) {
                        cameraInputRef.current.click();
                      }
                    }}
                    className="p-3.5 rounded-none flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]"
                  >
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    <span>FOTO KAMERA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className={`p-3.5 rounded-none border-2 flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      isLight
                        ? 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
                        : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>UNGGAH FOTO</span>
                  </button>
                </div>
              </div>

              {cameraError && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-medium text-left flex items-start gap-2.5 ${
                    isLight
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* 2. TAMPILAN LIVE VIEWFINDER KAMERA */}
          {isCameraActive && (
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden border border-emerald-500/40 bg-black aspect-4/3 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Panduan Batas Struk (Overlay Guide) */}
                <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-emerald-400/70 rounded-2xl flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[11px] font-mono font-bold text-emerald-300 bg-black/50 px-2 py-0.5 rounded-md self-start">
                    Posisikan Struk di Dalam Kotak Ini
                  </div>
                  <div className="w-full h-0.5 bg-emerald-400/40 animate-pulse" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhotoFromLiveCamera}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/25 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Jepret Foto Struk</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className={`px-4 py-3.5 rounded-2xl border font-bold text-xs cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-800'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* 3. TAMPILAN PREVIEW FOTO & ANIMASI SCANNING */}
          {imagePreview && (
            <div className="space-y-4">
              <div className={`relative rounded-2xl overflow-hidden border ${
                isLight ? 'border-slate-200 bg-slate-100' : 'border-[#263449] bg-[#0A101D]'
              } max-h-52 sm:max-h-60 flex items-center justify-center`}>
                <img
                  src={imagePreview}
                  alt="Foto Struk"
                  className="w-full h-full object-contain max-h-52 sm:max-h-60"
                />

                {/* Efek Garis Laser Pemindai AI */}
                {isScanning && (
                  <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xs flex flex-col items-center justify-center p-4">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
                    <div className="flex flex-col items-center gap-2 text-center p-4 rounded-2xl bg-black/75 border border-emerald-500/40 text-white shadow-2xl">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-xs font-black text-emerald-300">
                        AI Sedang Menganalisis Struk...
                      </p>
                      <p className="text-[11px] text-white/70">
                        Mengekstrak total pembayaran, tanggal, dan kategori
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Ambil Ulang */}
              <div className="flex justify-between items-center text-xs">
                <span
                  className={`text-[11px] font-medium ${
                    isLight ? 'text-slate-600' : 'text-white/60'
                  }`}
                >
                  {isScanning
                    ? 'Memproses dengan Gemini AI...'
                    : 'Foto struk berhasil dimuat.'}
                </span>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => {
                    setImagePreview(null);
                    setScannedResult(null);
                    setScanError(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Foto Ulang</span>
                </button>
              </div>

              {/* Tampilan Error jika gagal scan */}
              {scanError && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    isLight
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>Gagal membaca data struk otomatis:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{scanError}</p>
                  <p className="text-[11px] font-semibold">
                    Anda tetap dapat mengisi atau menyesuaikan rincian pengeluaran pada formulir di bawah ini.
                  </p>
                </div>
              )}

              {/* 4. FORM KONFIRMASI HASIL SCAN (KARTU STRUK KOTAK ASLI MONOSPACE) */}
              <div
                className={`p-4 sm:p-5 rounded-none border-2 border-dashed space-y-3.5 font-mono ${
                  isLight
                    ? 'bg-[#FAF9F5] border-slate-300 text-slate-900 shadow-sm'
                    : 'bg-[#111827] border-emerald-500/30 text-white'
                }`}
              >
                <div className={`flex items-center justify-between pb-2 border-b-2 border-dashed ${
                  isLight ? 'border-slate-300' : 'border-white/10'
                }`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>[ DATA STRUK TERBACA ]</span>
                  </h4>
                  {scannedResult?.rawTotalText && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-none border font-bold bg-emerald-100 text-emerald-900 border-emerald-300">
                      RAW: {scannedResult.rawTotalText}
                    </span>
                  )}
                </div>

                {/* Input Nominal Pengeluaran */}
                <div>
                  <label
                    className={`block text-xs font-bold mb-1 uppercase tracking-wider ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}
                  >
                    NOMINAL PENGELUARAN ({currencySymbol}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      min="1"
                      placeholder="0"
                      value={editedAmount}
                      onChange={(e) => setEditedAmount(e.target.value)}
                      className={`w-full p-2.5 text-base sm:text-lg font-black font-mono border-2 rounded-none outline-hidden transition-all ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-950 focus:border-emerald-600'
                          : 'bg-white/5 border-white/20 text-white focus:border-emerald-400'
                      }`}
                    />
                    {editedAmount && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-600 pointer-events-none">
                        {formatCurrency(parseFloat(editedAmount) || 0, currencySymbol)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Input Keterangan / Toko */}
                <div>
                  <label
                    className={`block text-xs font-bold mb-1 uppercase tracking-wider ${
                      isLight ? 'text-slate-700' : 'text-white/80'
                    }`}
                  >
                    KETERANGAN / TOKO *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Alfamart - Belanja Bulanan"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className={`w-full p-2.5 text-xs sm:text-sm font-mono border-2 rounded-none outline-hidden transition-all ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-950 focus:border-emerald-600'
                        : 'bg-white/5 border-white/20 text-white focus:border-emerald-400'
                    }`}
                  />
                </div>

                {/* Grid Kategori & Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-xs font-bold mb-1 uppercase tracking-wider ${
                        isLight ? 'text-slate-700' : 'text-white/80'
                      }`}
                    >
                      KATEGORI
                    </label>
                    <select
                      value={editedCategory}
                      onChange={(e) => setEditedCategory(e.target.value)}
                      className={`w-full p-2 text-xs border-2 rounded-none outline-hidden font-mono font-bold transition-all ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-950 focus:border-emerald-600'
                          : 'bg-[#1a2333] border-white/20 text-white focus:border-emerald-400'
                      }`}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-bold mb-1 uppercase tracking-wider ${
                        isLight ? 'text-slate-700' : 'text-white/80'
                      }`}
                    >
                      TANGGAL TRANSAKSI
                    </label>
                    <input
                      type="date"
                      value={editedDate}
                      onChange={(e) => setEditedDate(e.target.value)}
                      className={`w-full p-2 text-xs border-2 rounded-none outline-hidden font-mono transition-all ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-950 focus:border-emerald-600 [color-scheme:light]'
                          : 'bg-white/5 border-white/20 text-white focus:border-emerald-400 [color-scheme:dark]'
                      }`}
                    />
                  </div>
                </div>

                {/* Rincian Barang yang Terdeteksi */}
                {scannedResult?.items && scannedResult.items.length > 0 && (
                  <div className="pt-2 border-t border-dashed border-slate-300">
                    <span
                      className={`text-[11px] font-bold block mb-1.5 uppercase tracking-wider ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      BARANG TERTERA DI STRUK ({scannedResult.items.length} ITEM):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {scannedResult.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-none border border-dashed font-mono bg-slate-100 border-slate-300 text-slate-800"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Simpan Transaksi Kotak Monospace */}
              <button
                type="button"
                disabled={isScanning || !editedAmount || parseFloat(editedAmount) <= 0}
                onClick={handleSaveExpense}
                className="w-full py-3.5 px-4 rounded-none font-mono font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>CATAT KE PENGELUARAN SEKARANG</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
