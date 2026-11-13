import React from 'react';
import { X, CheckSquare, TrendingUp, Wallet, StickyNote, HelpCircle, ShieldCheck } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, theme = 'dark' }) => {
  const isLight = theme === 'light';
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div 
        id="modal-bantuan"
        className={`${
          isLight
            ? 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-[#111827] border border-[#263449] text-white shadow-2xl'
        } rounded-3xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar`}
      >
        <div className={`flex justify-between items-center pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-2xl ${isLight ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'} border flex items-center justify-center`}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isLight ? 'text-slate-950' : 'text-white'} tracking-tight`}>Panduan Jurnal</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'} mt-0.5`}>Fitur dan tips produktivitas harian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup panduan jurnal"
            className={`${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'} p-1.5 rounded-xl transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`space-y-3.5 my-5 text-xs ${isLight ? 'text-slate-700' : 'text-white/70'} leading-relaxed`}>
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
            <h4 className={`font-bold text-sm ${isLight ? 'text-teal-900' : 'text-emerald-300'} mb-1.5 flex items-center gap-2`}>
              <CheckSquare className="w-4 h-4 text-teal-500" />
              1. Agenda Harian & Matriks Konsistensi
            </h4>
            <p className={isLight ? 'text-slate-600' : 'text-white/60'}>
              Klik pada kotak tanggal (1–31) untuk mengubah status agenda Anda:
              <br />• <strong className="text-emerald-600 dark:text-emerald-300">Klik 1x</strong>: Centang Hijau (✓) - Selesai
              <br />• <strong className="text-rose-600 dark:text-rose-300">Klik 2x</strong>: Silang Merah (✗) - Terlewat
              <br />• <strong className={isLight ? 'text-slate-800' : 'text-white/80'}>Klik 3x</strong>: Kosongkan kembali
              <br />Persentase konsistensi di sebelah kanan akan dihitung secara otomatis dan real-time.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
            <h4 className={`font-bold text-sm ${isLight ? 'text-teal-900' : 'text-emerald-300'} mb-1.5 flex items-center gap-2`}>
              <TrendingUp className="w-4 h-4 text-teal-500" />
              2. Pelacak Kebiasaan & Streak
            </h4>
            <p className={isLight ? 'text-slate-600' : 'text-white/60'}>
              Pantau target kebiasaan mingguan Anda. Klik bar progres atau tombol + untuk menambah jumlah hari penyelesaian. Raih target mingguan untuk merayakan pencapaian!
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
            <h4 className={`font-bold text-sm ${isLight ? 'text-teal-900' : 'text-teal-300'} mb-1.5 flex items-center gap-2`}>
              <Wallet className="w-4 h-4 text-teal-500" />
              3. Ringkasan Finansial Harian (Rupiah)
            </h4>
            <p className={isLight ? 'text-slate-600' : 'text-white/60'}>
              Catat pemasukan dan pengeluaran harian dengan nominal Rupiah (Rp). Saldo total dan ringkasan hari ini akan langsung terbarui secara akurat.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
            <h4 className={`font-bold text-sm ${isLight ? 'text-teal-900' : 'text-teal-300'} mb-1.5 flex items-center gap-2`}>
              <StickyNote className="w-4 h-4 text-teal-500" />
              4. Catatan Cepat & Jurnal Refleksi
            </h4>
            <p className={isLight ? 'text-slate-600' : 'text-white/60'}>
              Tuliskan ide spontan atau catatan rapat di kolom Catatan Cepat. Gunakan shortcut <kbd className={`px-1.5 py-0.5 ${isLight ? 'bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/10 border-white/15 text-white/80'} border rounded`}>Ctrl+Enter</kbd> untuk menyimpan seketika.
            </p>
          </div>

          <div className={`${isLight ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'} p-3.5 rounded-2xl flex items-center gap-2.5 text-[11px] border`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Data tersimpan aman dan terenkripsi.</span>
          </div>
        </div>

        <div className={`flex justify-end pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 text-xs font-semibold text-white ${
              isLight
                ? 'bg-[#003B2F] hover:bg-[#002e24]'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/25'
            } rounded-xl shadow-md cursor-pointer transition-all`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
