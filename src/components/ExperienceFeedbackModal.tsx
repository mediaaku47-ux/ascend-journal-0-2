import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Sparkles, 
  MessageSquareHeart, 
  Check, 
  X, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  ThumbsUp,
  HeartHandshake
} from 'lucide-react';
import { AppFeedback } from '../types';
import { triggerConfetti } from '../utils/confetti';

interface ExperienceFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFeedback?: AppFeedback;
  onSaveFeedback: (feedback: AppFeedback) => void;
  is24HourTrigger?: boolean;
  firstAppOpenAt?: string;
  accountCreatedAt?: string;
  onShowToast?: (msg: string) => void;
}

const RATING_DESCRIPTIONS: Record<number, { title: string; desc: string; emoji: string; color: string }> = {
  1: {
    title: 'Perlu Banyak Perbaikan',
    desc: 'Bantu kami mengetahui apa yang masih kurang agar kami dapat memperbaikinya.',
    emoji: '😞',
    color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
  2: {
    title: 'Cukup',
    desc: 'Ada beberapa hal yang perlu ditingkatkan untuk pengalaman yang lebih baik.',
    emoji: '😐',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  3: {
    title: 'Bagus & Bermanfaat',
    desc: 'Aplikasi sudah berguna dan membantu kegiatan harian.',
    emoji: '🙂',
    color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  },
  4: {
    title: 'Sangat Bagus',
    desc: 'Fitur-fiturnya sangat membantu produktivitas dan mudah digunakan.',
    emoji: '😊',
    color: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
  },
  5: {
    title: 'Luar Biasa & Sangat Suka!',
    desc: 'Pengalaman penggunaan istimewa dan sangat direkomendasikan!',
    emoji: '🤩',
    color: 'text-amber-300 border-amber-400/40 bg-amber-400/15',
  },
};

const QUICK_SUGGESTION_TAGS = [
  '✨ Tampilan Bersih & Nyaman',
  '⚡ Performa Kencang & Responsif',
  '📅 Agenda Harian Sangat Praktis',
  '🔥 Pelacak Kebiasaan Efektif',
  '💰 Pencatatan Keuangan Teratur',
  '💡 Tambahkan Widget Ringkasan',
  '🔒 Keamanan & Sinkronisasi Baik',
  '🎨 Tambahkan Opsi Tema Warna',
];

export const ExperienceFeedbackModal: React.FC<ExperienceFeedbackModalProps> = ({
  isOpen,
  onClose,
  initialFeedback,
  onSaveFeedback,
  is24HourTrigger = false,
  firstAppOpenAt,
  accountCreatedAt,
  onShowToast,
}) => {
  // Step 1 = Berikan Bintang Dulu, Step 2 = Lalu Berikan Saran
  const [step, setStep] = useState<1 | 2>(1);
  const [rating, setRating] = useState<number>(initialFeedback?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string>(initialFeedback?.suggestions || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFeedback?.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialFeedback) {
        setRating(initialFeedback.rating || 5);
        setSuggestions(initialFeedback.suggestions || '');
        setSelectedTags(initialFeedback.tags || []);
        // If already has feedback, open on step 2 or 1
        setStep(initialFeedback.rating ? 2 : 1);
      } else {
        setRating(5);
        setSuggestions('');
        setSelectedTags([]);
        setStep(1);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, initialFeedback]);

  if (!isOpen) return null;

  // Hitung durasi jam berdasarkan awal membuat akun
  const effectiveCreationTime = accountCreatedAt || firstAppOpenAt;
  let hoursCount = 24;
  if (effectiveCreationTime) {
    const elapsed = Math.floor((Date.now() - new Date(effectiveCreationTime).getTime()) / (1000 * 60 * 60));
    hoursCount = Math.max(elapsed, 1);
  }

  const activeStar = hoverRating || rating;
  const currentDesc = RATING_DESCRIPTIONS[activeStar] || RATING_DESCRIPTIONS[5];

  const handleSelectStar = (num: number) => {
    setRating(num);
  };

  const handleNextToSuggestions = () => {
    if (rating < 1) {
      setRating(5);
    }
    setStep(2);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const exists = prev.includes(tag);
      const next = exists ? prev.filter((t) => t !== tag) : [...prev, tag];
      
      // Also add to suggestions textarea if not already mentioned
      if (!exists) {
        setSuggestions((curr) => {
          const cleanTag = tag.replace(/^[^\w\s]+/, '').trim();
          if (!curr.trim()) return cleanTag;
          if (!curr.includes(cleanTag)) return `${curr.trim()}\n• ${cleanTag}`;
          return curr;
        });
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;

    setIsSubmitting(true);

    const newFeedback: AppFeedback = {
      rating,
      suggestions: suggestions.trim(),
      tags: selectedTags,
      submittedAt: initialFeedback?.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    triggerConfetti({
      particleCount: 45,
      spread: 70,
      colors: ['#f59e0b', '#38bdf8', '#10b981', '#ec4899'],
    });

    setTimeout(() => {
      onSaveFeedback(newFeedback);
      if (onShowToast) {
        onShowToast('Terima kasih banyak atas bintang dan saran Anda! 🙏');
      }
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-[#0d1527]/95 border border-white/15 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-b from-amber-500/10 via-sky-500/5 to-transparent">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-orange-500/20 to-sky-500/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md shadow-amber-500/20 shrink-0">
              <Star className="w-6 h-6 fill-amber-400 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {is24HourTrigger ? 'Evaluasi 24 Jam' : 'Ulasan Pengalaman'}
                </span>
                {is24HourTrigger && (
                  <span className="text-[11px] font-mono text-white/50 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    {hoursCount} jam aktif
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Bintang & Saran Pengalaman
              </h2>
            </div>
          </div>

          {/* 2-Step Progress Indicator */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex-1 py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                step === 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span>Berikan Bintang Dulu</span>
            </button>

            <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />

            <button
              type="button"
              onClick={handleNextToSuggestions}
              className={`flex-1 py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                step === 2
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                  : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <span>Lalu Berikan Saran</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* ================= STEP 1: BERIKAN BINTANG DULU ================= */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="text-center space-y-1">
                <p className="text-sm text-white/70">
                  {is24HourTrigger
                    ? 'Anda telah menggunakan aplikasi selama 24 jam! Silakan beri nilai bintang terlebih dahulu:'
                    : 'Bagaimana kepuasan Anda selama menggunakan aplikasi ini? Silakan berikan bintang:'}
                </p>
                <p className="text-xs text-amber-400/80 font-medium">
                  Langkah 1: Berikan bintang dulu, kemudian tuliskan saran di langkah berikutnya.
                </p>
              </div>

              {/* Big Interactive Star Rating */}
              <div className="flex flex-col items-center justify-center py-4 bg-white/[0.03] rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= activeStar;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => handleSelectStar(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 sm:p-2 rounded-2xl transition-all duration-150 transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        title={`Beri ${starVal} Bintang`}
                        aria-label={`${starVal} Bintang`}
                      >
                        <Star
                          className={`w-9 h-9 sm:w-11 sm:h-11 transition-all duration-200 ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                              : 'text-white/20 hover:text-amber-400/50'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Star Feedback Label */}
                <div className="mt-4 text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs sm:text-sm font-semibold transition-all ${currentDesc.color}`}>
                    <span className="text-base">{currentDesc.emoji}</span>
                    <span>{activeStar} / 5 Bintang — {currentDesc.title}</span>
                  </div>
                  <p className="text-xs text-white/50 max-w-sm mt-1.5 px-2">
                    {currentDesc.desc}
                  </p>
                </div>
              </div>

              {/* Action: Next to Step 2 */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Nanti Saja
                </button>

                <button
                  type="button"
                  onClick={handleNextToSuggestions}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500 hover:from-amber-400 hover:to-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <span>Lalu Berikan Saran</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: LALU BERIKAN SARAN ================= */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Selected Rating Summary Badge */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white">
                    {rating} / 5 Bintang ({RATING_DESCRIPTIONS[rating]?.title})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline flex items-center gap-1"
                >
                  <span>Ubah Bintang</span>
                </button>
              </div>

              {/* Quick Tags Suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-sky-400" />
                  <span>Pilih Cepat Masukan (Opsional):</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTION_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-500/25 border-teal-500/50 text-teal-200 shadow-xs'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {tag} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea for detailed suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquareHeart className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tuliskan Saran & Masukan Anda:</span>
                  </span>
                  <span className="text-[11px] text-white/40 font-normal">
                    {suggestions.length} karakter
                  </span>
                </label>
                <textarea
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Ceritakan pengalaman Anda, fitur yang paling disukai, atau masukan hal apa yang ingin ditambahkan ke aplikasi ini..."
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-2xl bg-white/[0.04] border border-white/15 text-white text-xs sm:text-sm placeholder-white/30 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all custom-scrollbar resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Nanti Saja
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Kirim Bintang & Saran'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[11px] text-white/40">
          <span className="flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
            <span>Saran dan bintang Anda tersimpan rapi di profil Anda.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
