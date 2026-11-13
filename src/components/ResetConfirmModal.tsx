import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  X, 
  CheckSquare, 
  TrendingUp, 
  Wallet, 
  StickyNote
} from 'lucide-react';

export type ResetActionType = 
  | 'wipe_all' 
  | 'reset_to_sample' 
  | 'clear_tasks' 
  | 'clear_habits' 
  | 'clear_transactions' 
  | 'clear_notes';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWipeAll: () => void;
  onResetToSample: () => void;
  onClearTasks: () => void;
  onClearHabits: () => void;
  onClearTransactions: () => void;
  onClearNotes: () => void;
  theme?: 'dark' | 'light';
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onWipeAll,
  onResetToSample,
  onClearTasks,
  onClearHabits,
  onClearTransactions,
  onClearNotes,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [selectedAction, setSelectedAction] = useState<ResetActionType | null>(null);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (!selectedAction) return;

    switch (selectedAction) {
      case 'wipe_all':
        onWipeAll();
        break;
      case 'reset_to_sample':
        onResetToSample();
        break;
      case 'clear_tasks':
        onClearTasks();
        break;
      case 'clear_habits':
        onClearHabits();
        break;
      case 'clear_transactions':
        onClearTransactions();
        break;
      case 'clear_notes':
        onClearNotes();
        break;
    }

    setSelectedAction(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div 
        id="modal-hapus-reset-data"
        className={`${
          isLight
            ? 'bg-white border border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-[#111827] border border-[#263449] text-white shadow-2xl'
        } rounded-3xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar`}
      >
        {/* Header */}
        <div className={`flex justify-between items-center pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl ${isLight ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-rose-500/20 border-rose-500/30 text-rose-300'} border flex items-center justify-center`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isLight ? 'text-slate-950' : 'text-white'} tracking-tight`}>Hapus & Reset Data</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'} mt-0.5`}>Pilih data yang ingin dihapus atau direset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal hapus dan reset data"
            className={`${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'} p-1.5 rounded-xl transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Selection Options */}
        {!selectedAction ? (
          <div className="space-y-3.5 my-5">
            <p className="text-xs text-white/60">
              Pilih opsi pengelolaan atau penghapusan data yang ingin Anda terapkan:
            </p>

            {/* Option 1: Full Wipe / Start from Scratch */}
            <button
              onClick={() => setSelectedAction('wipe_all')}
              className="w-full text-left p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all group cursor-pointer flex items-start space-x-3.5"
            >
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 group-hover:scale-105 transition-transform shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-rose-200">Kosongkan Semua Data (Mulai dari Nol)</h4>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-200">
                    Reset Total
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Menghapus seluruh agenda, kebiasaan, catatan, dan transaksi keuangan. Saldo akan diatur ke Rp 0 untuk lembaran baru.
                </p>
              </div>
            </button>

            {/* Option 2: Reset to Sample Data (Rupiah) */}
            <button
              onClick={() => setSelectedAction('reset_to_sample')}
              className="w-full text-left p-4 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all group cursor-pointer flex items-start space-x-3.5"
            >
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 group-hover:scale-105 transition-transform shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-sky-200">Kembalikan ke Data Contoh (Rupiah)</h4>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-sky-500/30 text-sky-200">
                    Data Awal
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Memulihkan seluruh agenda, kebiasaan, catatan cepat, dan transaksi default dengan nominal Rupiah (Rp).
                </p>
              </div>
            </button>

            {/* Specific partial deletes */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-2.5">
                Hapus Data Berdasarkan Kategori
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedAction('clear_tasks')}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <CheckSquare className="w-4 h-4 text-sky-400 group-hover:text-rose-400 transition-colors" />
                  <span className="text-xs font-medium text-white/80">Hapus Semua Agenda</span>
                </button>

                <button
                  onClick={() => setSelectedAction('clear_habits')}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <TrendingUp className="w-4 h-4 text-sky-400 group-hover:text-rose-400 transition-colors" />
                  <span className="text-xs font-medium text-white/80">Hapus Semua Kebiasaan</span>
                </button>

                <button
                  onClick={() => setSelectedAction('clear_transactions')}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <Wallet className="w-4 h-4 text-teal-400 group-hover:text-rose-400 transition-colors" />
                  <span className="text-xs font-medium text-white/80">Hapus Transaksi & Saldo</span>
                </button>

                <button
                  onClick={() => setSelectedAction('clear_notes')}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <StickyNote className="w-4 h-4 text-indigo-400 group-hover:text-rose-400 transition-colors" />
                  <span className="text-xs font-medium text-white/80">Hapus Semua Catatan</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="space-y-4 my-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Konfirmasi Tindakan</h4>
                <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                  {selectedAction === 'wipe_all' && (
                    'Anda akan menghapus SEMUA data (agenda, kebiasaan, transaksi, catatan, dan saldo). Tindakan ini tidak dapat dibatalkan.'
                  )}
                  {selectedAction === 'reset_to_sample' && (
                    'Semua data yang telah Anda ubah akan digantikan dengan data contoh default dalam format Rupiah.'
                  )}
                  {selectedAction === 'clear_tasks' && (
                    'Semua agenda dan daftar tugas checklist bulan ini akan dikosongkan.'
                  )}
                  {selectedAction === 'clear_habits' && (
                    'Semua pelacak kebiasaan dan progresnya akan dikosongkan.'
                  )}
                  {selectedAction === 'clear_transactions' && (
                    'Semua riwayat transaksi keuangan akan dihapus dan total saldo akan diatur ke Rp 0.'
                  )}
                  {selectedAction === 'clear_notes' && (
                    'Semua catatan cepat dan riwayat refleksi akan dihapus.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2.5 text-xs font-semibold text-white/60 hover:text-white rounded-xl cursor-pointer transition-colors"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleExecute}
                className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer ${
                  selectedAction === 'reset_to_sample'
                    ? 'bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 shadow-indigo-500/20'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {selectedAction === 'reset_to_sample' ? 'Ya, Terapkan Data Contoh' : 'Ya, Hapus Data Sekarang'}
              </button>
            </div>
          </div>
        )}

        {!selectedAction && (
          <div className="flex justify-end pt-3 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-white/60 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
