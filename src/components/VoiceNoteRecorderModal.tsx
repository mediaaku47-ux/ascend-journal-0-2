import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Check, 
  X, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { 
  VoiceRecorderController, 
  VoiceRecorderState, 
  formatAudioDuration
} from '../utils/voiceRecorder';

interface VoiceNoteRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishSaveDirectly: (result: { text: string; audioUrl?: string; duration: number }) => void;
  onApplyToForm?: (transcript: string) => void;
  theme?: 'dark' | 'light';
  title?: string;
}

export const VoiceNoteRecorderModal: React.FC<VoiceNoteRecorderModalProps> = ({
  isOpen,
  onClose,
  onFinishSaveDirectly,
  onApplyToForm,
  theme = 'dark',
  title = 'Catatan Suara Instan',
}) => {
  const isLight = theme === 'light';

  const [recorderState, setRecorderState] = useState<VoiceRecorderState>({
    isRecording: false,
    duration: 0,
    transcript: '',
    permissionStatus: 'idle',
    errorMessage: null,
  });

  const controllerRef = useRef<VoiceRecorderController | null>(null);

  // Inisialisasi controller
  useEffect(() => {
    controllerRef.current = new VoiceRecorderController((updated) => {
      setRecorderState((prev) => ({ ...prev, ...updated }));
    });

    return () => {
      controllerRef.current?.cancelRecording();
    };
  }, []);

  // Mulai merekam otomatis saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setRecorderState({
        isRecording: false,
        duration: 0,
        transcript: '',
        permissionStatus: 'idle',
        errorMessage: null,
      });

      // Beri sedikit jeda agar DOM render selesai lalu minta izin & mulai
      const t = setTimeout(() => {
        handleStart();
      }, 200);

      return () => clearTimeout(t);
    } else {
      controllerRef.current?.cancelRecording();
    }
  }, [isOpen]);

  const handleStart = async () => {
    if (!controllerRef.current) return;
    await controllerRef.current.startRecording();
  };

  const handleFinishSave = async () => {
    if (!controllerRef.current) return;
    const result = await controllerRef.current.stopRecording();
    onFinishSaveDirectly({
      text: result.transcript,
      audioUrl: result.audioUrl,
      duration: result.duration,
    });
    onClose();
  };

  const handleApplyToFormOnly = async () => {
    if (!controllerRef.current) return;
    const result = await controllerRef.current.stopRecording();
    if (onApplyToForm) {
      onApplyToForm(result.transcript);
    }
    onClose();
  };

  const handleCancel = () => {
    controllerRef.current?.cancelRecording();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-[28px] border shadow-2xl overflow-hidden relative transition-all duration-300 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-teal-900/10'
            : 'bg-[#0f172a] border-[#22334d] text-white shadow-cyan-950/40'
        }`}
      >
        {/* Glow Aksen Atas */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-400 via-sky-500 to-indigo-500" />

        {/* Header Modal */}
        <div className={`p-5 sm:p-6 pb-4 border-b flex items-center justify-between ${
          isLight ? 'border-slate-100 bg-slate-50/60' : 'border-white/10 bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
              recorderState.isRecording
                ? 'bg-rose-500/20 text-rose-500 border-rose-500/30 animate-pulse'
                : isLight
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-teal-500/15 border-teal-500/30 text-teal-400'
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{title}</span>
                {recorderState.isRecording && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                    Merekam
                  </span>
                )}
              </h3>
              <p className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                Bicara bebas tanpa mengetik, kata-kata Anda akan otomatis menjadi teks catatan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label="Tutup perekam"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200/70 text-slate-500' : 'hover:bg-white/10 text-white/60'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Utama */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* KASUS 1: IZIN DITOLAK ATAU ERROR PERANGKAT */}
          {recorderState.permissionStatus === 'denied' && (
            <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-start gap-2.5 font-bold">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm">Izin Mikrofon Diperlukan</h4>
                  <p className="mt-1 font-semibold leading-relaxed">
                    {recorderState.errorMessage || 'Perangkat atau peramban Anda belum mengizinkan akses mikrofon.'}
                  </p>
                </div>
              </div>

              <div className={`p-3 rounded-xl text-[11px] font-semibold leading-relaxed ${
                isLight ? 'bg-white/80 border border-amber-200/60' : 'bg-black/20 border border-amber-500/20'
              }`}>
                💡 <strong>Cara Mengizinkan:</strong> Klik ikon gembok / perizinan situs di bilah alamat (URL bar) browser Anda, aktifkan <strong>Mikrofon (Microphone)</strong>, lalu klik tombol coba lagi di bawah.
              </div>

              <button
                type="button"
                onClick={handleStart}
                className="w-full py-2.5 px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Minta Izin Lagi</span>
              </button>
            </div>
          )}

          {/* KASUS 2: PERANGKAT TIDAK MENDUKUNG */}
          {recorderState.permissionStatus === 'unsupported' && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              isLight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center gap-2 font-black text-sm">
                <MicOff className="w-4 h-4 text-rose-500" />
                <span>Mikrofon Tidak Didukung</span>
              </div>
              <p className="font-semibold leading-relaxed">
                Peramban Anda saat ini tidak mendukung antarmuka penangkapan audio perangkat. Gunakan peramban modern seperti Google Chrome, Safari, atau Microsoft Edge.
              </p>
            </div>
          )}

          {/* KASUS 3: SEDANG MEREKAM ATAU MENUNGGU IZIN */}
          {recorderState.permissionStatus !== 'denied' && recorderState.permissionStatus !== 'unsupported' && (
            <div className="space-y-4">
              {/* Visualizer Gelombang & Timer */}
              <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center gap-3 relative overflow-hidden transition-all ${
                isLight
                  ? 'bg-gradient-to-b from-teal-50/50 to-slate-50 border-teal-200/80'
                  : 'bg-gradient-to-b from-[#132035] to-[#0c1322] border-teal-500/25'
              }`}>
                {/* Efek Lingkaran Gelombang Suara Berdenyut */}
                <div className="relative flex items-center justify-center my-2">
                  {recorderState.isRecording && (
                    <>
                      <div className="absolute w-24 h-24 rounded-full bg-teal-500/20 animate-ping" />
                      <div className="absolute w-20 h-20 rounded-full bg-teal-500/30 animate-pulse" />
                    </>
                  )}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                    recorderState.isRecording
                      ? 'bg-gradient-to-tr from-teal-500 to-sky-500 text-white scale-110'
                      : 'bg-slate-300 text-slate-600'
                  }`}>
                    <Mic className="w-7 h-7" />
                  </div>
                </div>

                {/* Durasi Waktu Rekaman */}
                <div className="text-center">
                  <span className="font-mono text-3xl font-black tracking-wider text-teal-600 dark:text-teal-400">
                    {formatAudioDuration(recorderState.duration)}
                  </span>
                  <p className={`text-xs font-semibold mt-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                    {recorderState.isRecording
                      ? 'Bicaralah dengan jelas, sistem sedang merekam...'
                      : 'Menghubungkan ke mikrofon perangkat...'}
                  </p>
                </div>

                {/* Gelombang Visual Grafis Sederhana */}
                {recorderState.isRecording && (
                  <div className="flex items-center gap-1.5 h-6 mt-1">
                    {[40, 75, 90, 50, 100, 60, 85, 45, 95, 70, 55, 80].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-1 bg-teal-500 rounded-full transition-all duration-150 animate-pulse"
                        style={{
                          height: `${Math.max(20, (h * (recorderState.duration % 2 === 0 ? 1 : 0.7)))}%`,
                          animationDelay: `${idx * 80}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Teks Hasil Transkripsi Suara (Real-time Preview) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hasil Transkripsi Suara Anda:</span>
                  </span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    Bahasa Indonesia
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border min-h-[90px] max-h-44 overflow-y-auto custom-scrollbar text-xs leading-relaxed font-semibold transition-all ${
                  recorderState.transcript
                    ? isLight
                      ? 'bg-white border-slate-300 text-slate-900 shadow-inner'
                      : 'bg-black/30 border-teal-500/30 text-white shadow-inner'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-400 italic'
                    : 'bg-white/[0.02] border-white/10 text-white/40 italic'
                }`}>
                  {recorderState.transcript || 'Suara Anda akan otomatis muncul di sini saat Anda berbicara...'}
                </div>
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-white/60 hover:bg-white/10'
              }`}
            >
              Batal
            </button>

            {onApplyToForm && recorderState.transcript && (
              <button
                type="button"
                onClick={handleApplyToFormOnly}
                className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                }`}
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Salin ke Form</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleFinishSave}
              disabled={recorderState.permissionStatus === 'denied' || recorderState.permissionStatus === 'unsupported'}
              className={`px-6 py-3 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 text-white ${
                isLight
                  ? 'bg-[#003B2F] hover:bg-[#002e24] shadow-teal-900/20'
                  : 'bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-600 hover:from-teal-400 hover:via-sky-400 hover:to-indigo-500 shadow-teal-500/20'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Check className="w-4 h-4" />
              <span>Selesai &amp; Buat Catatan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
