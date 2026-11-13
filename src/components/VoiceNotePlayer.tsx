import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Mic } from 'lucide-react';
import { formatAudioDuration } from '../utils/voiceRecorder';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  isLight?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  duration = 0,
  isLight = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Gagal memutar audio:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`mt-2.5 p-2 sm:p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all ${
        isLight
          ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
          : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-100'
      }`}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Tombol Play/Pause */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Jeda rekaman suara' : 'Putar rekaman suara'}
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95 ${
          isPlaying
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : isLight
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Baris Gelombang / Scrubber */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
          <span className="flex items-center gap-1 font-mono">
            <Mic className="w-3 h-3 text-emerald-500" />
            <span>Catatan Suara</span>
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {formatAudioDuration(currentTime)} / {formatAudioDuration(totalDuration || duration)}
          </span>
        </div>

        <div className="relative w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min="0"
            max={totalDuration || duration || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 hidden sm:block" />
    </div>
  );
};
