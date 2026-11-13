import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadUserAvatar, getAvatarSignedUrl, removeUserAvatar } from '../lib/avatarService';

export interface AvatarUploaderProps {
  userId?: string;
  currentAvatarUrl?: string;
  userName?: string;
  onAvatarUpdated: (newAvatarUrl: string, filePath?: string) => void;
  onAvatarRemoved?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showControls?: boolean;
  showRemoveButton?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  userId,
  currentAvatarUrl,
  userName = 'Pengguna',
  onAvatarUpdated,
  onAvatarRemoved,
  size = 'md',
  showControls = true,
  showRemoveButton = true,
  theme = 'dark',
  className = '',
}) => {
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resolusi Signed URL jika `currentAvatarUrl` adalah path relatif di storage
  useEffect(() => {
    let active = true;

    async function resolveCurrentAvatar() {
      if (!currentAvatarUrl) {
        setDisplayUrl('');
        return;
      }

      // Jika sudah berupa dataUrl atau URL http lengkap
      if (currentAvatarUrl.startsWith('data:') || currentAvatarUrl.startsWith('blob:')) {
        setDisplayUrl(currentAvatarUrl);
        return;
      }

      if (currentAvatarUrl.startsWith('http')) {
        setDisplayUrl(currentAvatarUrl);
        return;
      }

      // Jika berupa path di Supabase Storage (misal: 'userId/avatar_123.jpg')
      try {
        const signed = await getAvatarSignedUrl(currentAvatarUrl, 86400);
        if (active && signed) {
          setDisplayUrl(signed);
        }
      } catch {
        if (active) setDisplayUrl(currentAvatarUrl);
      }
    }

    resolveCurrentAvatar();

    return () => {
      active = false;
    };
  }, [currentAvatarUrl]);

  // Bersihkan pesan notifikasi setelah 4 detik
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Handler pemilihan file gambar dari perangkat
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Harap pilih file gambar (JPG, PNG, atau WebP).' });
      return;
    }

    // Validasi ukuran (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Ukuran file melebihi 5 MB. Harap pilih gambar lebih kecil.' });
      return;
    }

    // Preview instan lokal di UI
    const previewUrl = URL.createObjectURL(file);
    setDisplayUrl(previewUrl);
    setIsUploading(true);

    try {
      const effectiveUserId = userId || 'guest_user';
      const result = await uploadUserAvatar(effectiveUserId, file);

      // Tampilkan Signed URL resmi dari Supabase
      setDisplayUrl(result.signedUrl);
      setStatusMessage({ type: 'success', text: 'Foto profil berhasil diperbarui!' });

      onAvatarUpdated(result.signedUrl, result.filePath);
    } catch (err: any) {
      console.error('Upload avatar gagal:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal mengunggah foto profil. Silakan coba lagi.',
      });
      // Kembalikan ke foto sebelumnya jika gagal
      setDisplayUrl(currentAvatarUrl || '');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handler menghapus foto profil
  const handleRemove = async () => {
    if (!window.confirm('Hapus foto profil ini dan kembali ke avatar inisial nama?')) {
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      if (userId) {
        await removeUserAvatar(userId, currentAvatarUrl);
      }
      setDisplayUrl('');
      setStatusMessage({ type: 'success', text: 'Foto profil telah dihapus.' });
      if (onAvatarRemoved) {
        onAvatarRemoved();
      } else {
        onAvatarUpdated('');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Gagal menghapus foto profil.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Dimensi ukuran avatar
  const sizeMap = {
    sm: {
      wrapper: 'w-12 h-12',
      button: 'w-5 h-5 -bottom-0.5 -right-0.5',
      icon: 'w-3 h-3',
      initial: 'text-sm font-bold',
    },
    md: {
      wrapper: 'w-20 h-20 sm:w-24 sm:h-24',
      button: 'w-7 h-7 -bottom-1 -right-1',
      icon: 'w-3.5 h-3.5',
      initial: 'text-2xl font-bold',
    },
    lg: {
      wrapper: 'w-28 h-28 sm:w-32 sm:h-32',
      button: 'w-8 h-8 bottom-0 right-0',
      icon: 'w-4 h-4',
      initial: 'text-3xl font-extrabold',
    },
    xl: {
      wrapper: 'w-36 h-36 sm:w-40 sm:h-40',
      button: 'w-9 h-9 bottom-1 right-1',
      icon: 'w-4.5 h-4.5',
      initial: 'text-4xl font-extrabold',
    },
  }[size];

  const firstLetter = (userName || 'P').charAt(0).toUpperCase();

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Kontainer Avatar Bulat */}
      <div className={`relative group ${sizeMap.wrapper}`}>
        <div
          className={`w-full h-full rounded-full overflow-hidden border-2 transition-all duration-200 shadow-md flex items-center justify-center ${
            isLight
              ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
              : 'border-emerald-400 bg-slate-800 ring-2 ring-emerald-500/30'
          }`}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={userName}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={() => {
                // Jika gambar gagal dimuat (misal token kadaluwarsa), fallback ke inisial
                setDisplayUrl('');
              }}
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center font-bold tracking-tight ${sizeMap.initial} ${
                isLight ? 'bg-teal-600 text-white' : 'bg-emerald-600/90 text-white'
              }`}
            >
              {firstLetter}
            </div>
          )}
        </div>

        {/* Loading Overlay saat sedang mengunggah */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center z-20 animate-in fade-in">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Tombol Kamera di Pojok Bawah Avatar */}
        {showControls && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Pilih foto profil"
            title="Ganti Foto Profil"
            className={`absolute ${sizeMap.button} rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer transition-transform active:scale-90 hover:scale-110 disabled:opacity-50 z-10 border-2 ${
              isLight
                ? 'bg-[#003B2F] hover:bg-[#002e24] border-white'
                : 'bg-emerald-500 hover:bg-emerald-400 border-[#090D16]'
            }`}
          >
            <Camera className={sizeMap.icon} />
          </button>
        )}

        {/* Input file tersembunyi */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Kontrol Aksi Tambahan (Hapus Foto) */}
      {showControls && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
              isLight
                ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Pilih Foto</span>
          </button>

          {showRemoveButton && displayUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              aria-label="Hapus Foto Profil"
              className={`p-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 text-rose-500 hover:bg-rose-500/10 border ${
                isLight ? 'border-rose-200' : 'border-rose-500/20'
              }`}
              title="Hapus Foto Profil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Pesan Status Sukses atau Error */}
      {statusMessage && (
        <div
          className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? isLight
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : isLight
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
