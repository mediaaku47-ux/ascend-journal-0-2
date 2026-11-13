import React, { useState } from 'react';
import { X, Download, Smartphone, Laptop, ExternalLink, CheckCircle2, Share, PlusSquare, MoreVertical, Copy, Check, Globe, QrCode, MessageCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppLogo } from './AppLogo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [deviceTab, setDeviceTab] = useState<'laptop' | 'android' | 'ios'>('laptop');
  const [copied, setCopied] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  // Clean URL without iframe query params
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shortUrl = 'tinyurl.com/272ruhox';
  const fullShortUrl = 'https://tinyurl.com/272ruhox';

  const handleCopyLink = () => {
    if (appUrl) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyShortLink = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setCopiedShort(true);
    setTimeout(() => setCopiedShort(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Buka aplikasi JournalStream: ${fullShortUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleNativeInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      // Direct navigation to clean origin in the same browser context or show guide
      setDeviceTab('laptop');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        id="modal-install-app"
        className="bg-[#121218]/95 backdrop-blur-3xl rounded-[32px] shadow-2xl w-full max-w-lg p-6 border border-white/15 relative text-white max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <AppLogo size="md" />
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Pasang Aplikasi</span>
                <span className="text-[10px] bg-sky-500/20 border border-sky-500/40 text-sky-300 px-2 py-0.5 rounded-full font-mono">
                  PWA
                </span>
              </h3>
              <p className="text-xs text-white/50">Dapat diinstal di Laptop, HP Android, &amp; iPhone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal pasang aplikasi"
            className="text-white/40 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link Pendek Paling Mudah Ditulis */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-transparent border border-sky-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
              <Globe className="w-4 h-4 text-sky-400" /> Tautan Pendek (Sangat Mudah Ditulis):
            </span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-mono font-bold">
              Mudah Diketik
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-sky-500/30 text-sm font-mono font-bold text-teal-300 tracking-wide select-all">
              {shortUrl}
            </div>
            <button
              onClick={handleCopyShortLink}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                copiedShort
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white shadow-md shadow-indigo-500/25'
              }`}
            >
              {copiedShort ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedShort ? 'Tersalin!' : 'Salin'}</span>
            </button>
          </div>

          {/* Tombol Bagikan WhatsApp & Tampilkan QR Code */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Kirim ke WhatsApp</span>
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-400" />
              <span>{showQR ? 'Tutup QR Code' : 'Scan QR HP'}</span>
            </button>
          </div>

          {/* QR Code Container jika dibuka */}
          {showQR && (
            <div className="pt-2 flex flex-col items-center justify-center p-4 bg-black/60 rounded-2xl border border-white/10 text-center animate-in fade-in duration-200">
              <div className="p-2 bg-white rounded-2xl shadow-lg mb-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullShortUrl)}&margin=1`}
                  alt="QR Code JournalStream"
                  className="w-40 h-40 object-contain"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-white/80 font-medium">Arahkan kamera HP Anda ke kode QR di atas</p>
              <p className="text-[11px] text-white/50">Tautan akan otomatis terbuka di browser Chrome HP Anda tanpa mengetik.</p>
            </div>
          )}
        </div>

        {/* Tautan Asli Lengkap */}
        <div className="mb-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-white/70">
            <span>Tautan Asli Browser:</span>
            <button
              onClick={handleCopyLink}
              className="text-[11px] text-sky-300 hover:text-sky-200 font-medium flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Tersalin' : 'Salin Asli'}</span>
            </button>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-white/50 truncate select-all">
            {appUrl}
          </div>
        </div>

        {/* Quick Install Action / Status Banner */}
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-transparent border border-sky-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-0.5">
                {isInstalled ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Aplikasi Sudah Terpasang!
                  </span>
                ) : isInstallable ? (
                  <span className="text-sky-300 flex items-center gap-1">
                    <Download className="w-4 h-4" /> Siap Dipasang Langsung
                  </span>
                ) : (
                  <span className="text-white">Pemasangan ke Layar Utama</span>
                )}
              </div>
              <p className="text-[11px] text-white/60">
                Jalankan aplikasi di layar penuh seperti aplikasi asli tanpa bilah URL browser.
              </p>
            </div>

            {isInstallable && (
              <button
                onClick={handleNativeInstall}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Pasang Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* Device Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl mb-4 text-xs font-semibold">
          <button
            onClick={() => setDeviceTab('laptop')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              deviceTab === 'laptop'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Laptop / PC</span>
          </button>
          <button
            onClick={() => setDeviceTab('android')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              deviceTab === 'android'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>HP Android</span>
          </button>
          <button
            onClick={() => setDeviceTab('ios')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              deviceTab === 'ios'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-300" />
            <span>iPhone (iOS)</span>
          </button>
        </div>

        {/* Device Step-by-Step Instructions */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
          {deviceTab === 'laptop' && (
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-sky-400" />
                <span>Petunjuk di Laptop / Komputer (Chrome atau Edge):</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-white/80 leading-relaxed">
                <li>
                  Buka aplikasi melalui tautan di <strong>Google Chrome</strong> (atau browser yang sedang Anda gunakan).
                </li>
                <li>
                  <strong>Di Google Chrome:</strong> Klik ikon monitor dengan panah ke bawah (<Download className="w-3 h-3 inline text-sky-400" />) di ujung kanan bilah alamat (URL bar) → klik <strong>"Pasang" (Install)</strong>.
                </li>
                <li>
                  <strong>Di Microsoft Edge:</strong> Klik ikon aplikasi/monitor kecil di ujung kanan bilah alamat atau klik menu titik tiga (⋯) pojok kanan atas → pilih <strong>"Aplikasi" (Apps)</strong> → klik <strong>"Instal JournalStream sebagai aplikasi"</strong>.
                </li>
                <li>
                  Aplikasi akan langsung muncul di desktop dan taskbar laptop Anda, siap ditekan dan dibuka kapan saja tanpa browser bar!
                </li>
              </ol>

              <div className="mt-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 text-[11px] text-sky-200/90 leading-relaxed">
                <strong>💡 Solusi jika sempat terbuka di Edge & tidak bisa ditekan:</strong> Hal tersebut terjadi jika Windows otomatis membuka tab Edge baru di luar sesi login browser utama Anda. Cukup gunakan browser yang sedang Anda buka sekarang (Chrome), atau ikuti langkah pasang di atas agar aplikasi berjalan mulus dan responsif.
              </div>
            </div>
          )}

          {deviceTab === 'android' && (
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-teal-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span>Petunjuk di HP Android (Google Chrome):</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-white/80 leading-relaxed">
                <li>
                  Buka tautan website aplikasi di browser <strong>Google Chrome</strong> di HP Anda.
                </li>
                <li>
                  Ketuk tombol <strong>menu titik tiga (<MoreVertical className="w-3 h-3 inline" />)</strong> di pojok kanan atas layar HP.
                </li>
                <li>
                  Pilih menu <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong> atau <strong>"Pasang Aplikasi" (Install App)</strong>.
                </li>
                <li>
                  Ketuk <strong>"Pasang" / "Tambah"</strong>. Ikon aplikasi akan langsung ada di daftar aplikasi HP Android Anda dan dapat dibuka kapan pun!
                </li>
              </ol>
            </div>
          )}

          {deviceTab === 'ios' && (
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Petunjuk di iPhone / iPad (Safari):</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-white/80 leading-relaxed">
                <li>
                  Buka website aplikasi menggunakan browser resmi bawaan iPhone, yaitu <strong>Safari</strong>.
                </li>
                <li>
                  Ketuk tombol <strong>Bagikan (Share)</strong> (<Share className="w-3 h-3 inline text-blue-400" />) di bilah bawah Safari.
                </li>
                <li>
                  Gulir ke bawah pada menu opsi, lalu ketuk <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong> (<PlusSquare className="w-3 h-3 inline text-emerald-400" />).
                </li>
                <li>
                  Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas. Ikon aplikasi siap digunakan seperti aplikasi App Store!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Open in New Tab Button (Essential for iframes) */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-xs text-sky-300 hover:text-sky-200 hover:underline flex items-center justify-center gap-1.5 font-medium cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Langsung di Tab Penuh</span>
          </a>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
