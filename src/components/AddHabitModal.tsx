import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { X, Flame, Sparkles, Check, Target, Compass, Calendar } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: Habit) => void;
  theme?: 'dark' | 'light';
}

// Rekomendasi kebiasaan siap pakai
const HABIT_TEMPLATES = [
  { title: '💧 Minum Air 2 Liter', days: 7, color: '#0ea5e9', category: 'Kesehatan' },
  { title: '🏃 Olahraga 30 Menit', days: 14, color: '#ea580c', category: 'Kebugaran' },
  { title: '📖 Membaca Buku 15 Menit', days: 21, color: '#8b5cf6', category: 'Pengembangan Diri' },
  { title: '🧘 Meditasi Pagi', days: 7, color: '#10b981', category: 'Mindset' },
  { title: '💤 Tidur Tepat Waktu', days: 14, color: '#6366f1', category: 'Kesehatan' },
  { title: '💻 Belajar Keterampilan Baru', days: 30, color: '#f59e0b', category: 'Produktivitas' },
  { title: '🥗 Pola Makan Sehat', days: 21, color: '#10b981', category: 'Kesehatan' },
  { title: '✍️ Tulis Jurnal Refleksi', days: 7, color: '#ec4899', category: 'Mindset' },
];

const PRESET_DURATIONS = [
  { days: 7, label: '7 Hari', sub: '1 Minggu' },
  { days: 14, label: '14 Hari', sub: '2 Minggu' },
  { days: 21, label: '21 Hari', sub: 'Habit Loop' },
  { days: 30, label: '30 Hari', sub: '1 Bulan' },
  { days: 60, label: '60 Hari', sub: '2 Bulan' },
];

const COLOR_OPTIONS = [
  { value: '#ea580c', name: 'Api Jingga', ring: 'ring-orange-500' },
  { value: '#10b981', name: 'Zamrud Hijau', ring: 'ring-emerald-500' },
  { value: '#0ea5e9', name: 'Biru Langit', ring: 'ring-sky-500' },
  { value: '#8b5cf6', name: 'Ungu Violet', ring: 'ring-purple-500' },
  { value: '#ec4899', name: 'Merah Muda', ring: 'ring-pink-500' },
  { value: '#f59e0b', name: 'Emas Amber', ring: 'ring-amber-500' },
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAddHabit,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDays, setCustomDays] = useState<string>('21');
  const [selectedColor, setSelectedColor] = useState<string>('#ea580c');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSelectedDuration(7);
      setIsCustomDuration(false);
      setCustomDays('21');
      setSelectedColor('#ea580c');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalDays = isCustomDuration ? (parseInt(customDays, 10) || 7) : selectedDuration;

  const handleSelectTemplate = (tpl: typeof HABIT_TEMPLATES[0]) => {
    // Hilangkan emoji di awal jika user mau, atau biarkan lengkap
    setTitle(tpl.title);
    setSelectedDuration(tpl.days);
    setIsCustomDuration(false);
    setSelectedColor(tpl.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validatedDays = Math.max(1, Math.min(365, totalDays));

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: title.trim(),
      completedDays: 0,
      totalDays: validatedDays,
      color: selectedColor,
      completedToday: false,
      completedDayIndices: [],
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    onAddHabit(newHabit);

    triggerConfetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
      colors: [selectedColor, '#2dd4bf', '#f59e0b'],
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-tambah-kebiasaan"
        className={`${
          isLight
            ? 'bg-white border-slate-200/90 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
            : 'bg-[#131924] border-slate-800 text-white shadow-2xl shadow-black/60'
        } rounded-3xl w-full max-w-xl border p-5 sm:p-7 relative animate-in fade-in zoom-in-95 duration-200 my-auto`}
      >
        {/* Header Khusus Tambah Kebiasaan */}
        <div className={`flex justify-between items-start pb-4 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform"
              style={{
                backgroundColor: `${selectedColor}20`,
                borderColor: `${selectedColor}40`,
                borderWidth: 1,
              }}
            >
              <Flame className="w-6 h-6 animate-pulse" style={{ color: selectedColor }} />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Tambah Kebiasaan Baru
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                Tentukan target streak dan bangun rutinitas konsisten setiap hari
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal tambah kebiasaan"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {/* 1. Nama Kebiasaan */}
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Nama Kebiasaan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Tidur tepat waktu, Minum 2L air, Olahraga..."
                autoFocus
                required
                className={`w-full px-4 py-3 rounded-2xl text-sm font-semibold border transition-all outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'
                    : 'bg-[#0f141d] border-slate-700/80 text-white focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* Template Pilihan Cepat */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspirasi Kebiasaan Populer</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {HABIT_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                    title === tpl.title
                      ? isLight
                        ? 'bg-[#003B2F] text-white border-[#003B2F] shadow-xs'
                        : 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/60'
                      : 'bg-slate-800/40 hover:bg-slate-800 text-slate-300 border-slate-700/50'
                  }`}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Durasi Hari */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                <Calendar className="w-3.5 h-3.5 text-teal-500" />
                <span>Target Durasi Hari</span>
              </label>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                isLight ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}>
                {totalDays} Hari Target
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_DURATIONS.map((preset) => {
                const isSelected = !isCustomDuration && selectedDuration === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setIsCustomDuration(false);
                      setSelectedDuration(preset.days);
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? isLight
                          ? 'bg-[#003B2F] text-white border-[#003B2F] shadow-md shadow-[#003B2F]/20'
                          : 'bg-gradient-to-br from-teal-500/30 to-emerald-500/20 text-white border-teal-400 shadow-md shadow-teal-500/10'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-[#0f141d] hover:bg-slate-800/60 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black">{preset.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                      {preset.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Opsi Kustom Hari */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsCustomDuration(!isCustomDuration)}
                className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isCustomDuration 
                    ? 'text-teal-500' 
                    : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{isCustomDuration ? 'Gunakan Durasi Kustom' : 'Atur durasi hari sendiri (kustom)...'}</span>
              </button>

              {isCustomDuration && (
                <div className="mt-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Contoh: 10, 45, 90"
                    className={`w-32 px-3 py-2 rounded-xl text-sm font-bold border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                        : 'bg-[#0f141d] border-slate-700 text-white focus:border-teal-400'
                    }`}
                  />
                  <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Hari (Kartu otomatis membagi dalam mingguan)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Aksen Warna Api / Kartu */}
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Warna Aksen Kebiasaan
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = selectedColor === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center relative ${
                      isSelected ? 'scale-110 ring-2 ring-offset-2 ' + c.ring : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pratinjau Mini Kartu */}
          <div 
            className={`p-4 rounded-2xl border relative overflow-hidden transition-all duration-300 ${
              isLight ? 'bg-slate-50/90' : 'bg-[#0f141d]/90'
            }`}
            style={{
              borderColor: `${selectedColor}55`,
              boxShadow: isLight
                ? `0 0 22px -2px ${selectedColor}30, 0 8px 24px rgba(0,0,0,0.05), inset 0 1px 0 ${selectedColor}40`
                : `0 0 28px -2px ${selectedColor}40, 0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 ${selectedColor}50`,
              background: isLight
                ? `linear-gradient(180deg, ${selectedColor}10 0%, #f8fafc 40%)`
                : `linear-gradient(180deg, ${selectedColor}1E 0%, #0f141d 40%)`,
            }}
          >
            {/* Garis Aksen Atas: Menggunakan gradasi dan pendaran warna aksen */}
            <div 
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1.5 z-20 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, ${selectedColor}40 0%, ${selectedColor} 50%, ${selectedColor}40 100%)`,
                boxShadow: `0 0 12px ${selectedColor}, 0 2px 6px ${selectedColor}88`,
              }}
            />

            {/* Semburan warna lembut di bagian atas */}
            <div 
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
              style={{
                background: `radial-gradient(120% 100% at 50% 0%, ${selectedColor}25 0%, transparent 100%)`,
              }}
            />

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 relative z-10 pt-1">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" style={{ color: selectedColor }} />
                <span>Pratinjau Kartu Baru</span>
              </span>
              <span 
                className="px-2 py-0.5 rounded-full border text-[10px] font-mono font-black"
                style={{
                  backgroundColor: `${selectedColor}18`,
                  borderColor: `${selectedColor}50`,
                  color: selectedColor,
                }}
              >
                0/{totalDays} Hari Target
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="truncate pr-3">
                <p className={`font-black text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {title.trim() || 'Nama kebiasaan Anda...'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Target: {totalDays} hari ({Math.max(1, Math.ceil(totalDays / 7))} minggu)
                </p>
              </div>
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-xs"
                style={{
                  backgroundColor: `${selectedColor}18`,
                  borderColor: `${selectedColor}40`,
                }}
              >
                <Flame className="w-4 h-4" style={{ color: selectedColor }} />
              </div>
            </div>
            {/* Mini Progress Bar Statistik Berwarna */}
            <div className={`w-full h-3 rounded-full mt-3 p-0.5 border overflow-hidden ${
              isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div 
                className="h-full rounded-full transition-all duration-300 relative overflow-hidden"
                style={{ 
                  width: '35%', 
                  background: `linear-gradient(90deg, ${selectedColor}CC, ${selectedColor})`,
                  boxShadow: `0 0 10px ${selectedColor}88, inset 0 1px 0 rgba(255,255,255,0.4)`
                }}
              />
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className={`flex items-center justify-end gap-3 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!title.trim()}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                !title.trim()
                  ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400'
                  : isLight
                  ? 'bg-[#003B2F] hover:bg-[#002e24] text-white shadow-[#003B2F]/20'
                  : 'bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-600 text-white shadow-teal-500/20'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Simpan Kebiasaan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
