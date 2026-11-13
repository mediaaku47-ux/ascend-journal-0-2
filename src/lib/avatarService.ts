import { getSupabase, getSupabaseConfig } from './supabase';

export interface UploadAvatarResult {
  filePath: string;
  signedUrl: string;
}

const BUCKET_NAME = 'profiles';
const FALLBACK_BUCKET = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

/**
 * Optimasi dan kompresi gambar di sisi browser sebelum diunggah
 */
export async function compressAvatarFile(file: File | Blob, maxWidth = 1000, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * 1. Mengunggah foto profil ke Supabase Storage (Private Bucket 'profiles')
 *    dan memperbarui kolom `avatar_url` pada tabel `user_profiles`.
 */
export async function uploadUserAvatar(
  userId: string,
  file: File | Blob
): Promise<UploadAvatarResult> {
  if (!userId) {
    throw new Error('ID Pengguna tidak ditemukan. Silakan login terlebih dahulu.');
  }

  // Validasi tipe file jika File instance
  if (file instanceof File && file.type && !ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format file tidak didukung. Harap pilih gambar JPEG, PNG, atau WebP.');
  }

  // Validasi ukuran
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file terlalu besar. Maksimal 5 MB.');
  }

  const client = getSupabase();
  const fileExt = (file instanceof File && file.name)
    ? file.name.split('.').pop()?.toLowerCase() || 'jpg'
    : 'jpg';
  const cleanExt = fileExt.replace(/[^a-z0-9]/g, '') || 'jpg';
  
  // Format unik: userId/avatar_timestamp.ext
  const fileName = `avatar_${Date.now()}.${cleanExt}`;
  const filePath = `${userId}/${fileName}`;

  // Kompres file agar cepat dan hemat bandwidth
  const optimizedBlob = await compressAvatarFile(file, 800, 0.88);
  const uploadPayload = optimizedBlob;

  try {
    // 1. Coba upload ke private bucket 'profiles'
    let targetBucket = BUCKET_NAME;
    let uploadRes = await client.storage
      .from(targetBucket)
      .upload(filePath, uploadPayload, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg',
      });

    // Jika bucket 'profiles' belum dibuat di Supabase, coba fallback ke 'avatars'
    if (uploadRes.error && uploadRes.error.message?.toLowerCase().includes('not found')) {
      targetBucket = FALLBACK_BUCKET;
      uploadRes = await client.storage
        .from(targetBucket)
        .upload(filePath, uploadPayload, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });
    }

    if (uploadRes.error) {
      console.warn('Supabase storage upload error:', uploadRes.error.message);
      throw uploadRes.error;
    }

    // 2. Ambil Signed URL (karena bucket private, berlaku 24 jam = 86400 detik)
    const { data: signedData, error: signedError } = await client.storage
      .from(targetBucket)
      .createSignedUrl(filePath, 86400);

    let displayUrl = signedData?.signedUrl;

    // Jika pembuatan signed URL gagal, coba fallback ke getPublicUrl
    if (!displayUrl || signedError) {
      const { data: pubData } = client.storage.from(targetBucket).getPublicUrl(filePath);
      displayUrl = pubData?.publicUrl || filePath;
    }

    // 3. Simpan path file ke kolom avatar_url di tabel user_profiles
    await client
      .from('user_profiles')
      .update({
        avatar_url: filePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return {
      filePath,
      signedUrl: displayUrl,
    };
  } catch (storageErr: any) {
    console.warn('Storage upload gagal, beralih ke fallback Base64 dataURL:', storageErr?.message);

    // Fallback Darurat: Jika bucket storage belum diizinkan atau kuota penuh,
    // simpan dataURL terkompresi langsung ke kolom avatar_url agar user tetap bisa mengganti foto!
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;
        try {
          await client
            .from('user_profiles')
            .update({
              avatar_url: base64Url,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        } catch (dbErr) {
          console.warn('Gagal update avatar base64 ke database:', dbErr);
        }
        resolve({
          filePath: 'local_base64',
          signedUrl: base64Url,
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(optimizedBlob);
    });
  }
}

function normalizeFullSignedUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const config = getSupabaseConfig();
  const baseUrl = config.url ? config.url.replace(/\/+$/, '') : '';
  const relative = url.startsWith('/') ? url : `/${url}`;
  return baseUrl ? `${baseUrl}${relative}` : url;
}

/**
 * 2. Mengambil Signed URL aman dari private bucket Supabase Storage
 * @param pathOrUrl Path file yang tersimpan (misal: 'usr_123/avatar_123.jpg') atau URL langsung
 * @param expiresIn Durasi masa berlaku dalam detik (default 24 jam = 86400 detik)
 */
export async function getAvatarSignedUrl(
  pathOrUrl: string,
  expiresIn: number = 86400
): Promise<string> {
  if (!pathOrUrl) return '';

  // Jika sudah berupa data URL base64 atau blob URL
  if (pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl;
  }

  // Jika URL http/https lengkap
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    // Jika URL tersebut memiliki query token signed url atau bukan dari supabase storage
    if (pathOrUrl.includes('token=') || !pathOrUrl.includes('/storage/v1/object/')) {
      return pathOrUrl;
    }
  }

  const client = getSupabase();
  let cleanPath = pathOrUrl.trim().replace(/^\/+/, '');

  if (cleanPath.startsWith(`${BUCKET_NAME}/`)) {
    cleanPath = cleanPath.slice(BUCKET_NAME.length + 1);
  } else if (cleanPath.startsWith(`${FALLBACK_BUCKET}/`)) {
    cleanPath = cleanPath.slice(FALLBACK_BUCKET.length + 1);
  }

  try {
    // 1. Coba dari bucket 'profiles'
    const { data: signedData, error } = await client.storage
      .from(BUCKET_NAME)
      .createSignedUrl(cleanPath, expiresIn);

    if (!error && signedData?.signedUrl) {
      return normalizeFullSignedUrl(signedData.signedUrl);
    }

    // 2. Coba fallback dari bucket 'avatars'
    const { data: fallbackSigned, error: fbError } = await client.storage
      .from(FALLBACK_BUCKET)
      .createSignedUrl(cleanPath, expiresIn);

    if (!fbError && fallbackSigned?.signedUrl) {
      return normalizeFullSignedUrl(fallbackSigned.signedUrl);
    }

    // 3. Fallback ke getPublicUrl
    const { data: pubData } = client.storage.from(BUCKET_NAME).getPublicUrl(cleanPath);
    if (pubData?.publicUrl && !pubData.publicUrl.includes('undefined')) {
      return normalizeFullSignedUrl(pubData.publicUrl);
    }
  } catch (err) {
    console.warn('Gagal membuat signed URL avatar:', err);
  }

  // Jika gagal, jangan kembalikan relative path karena akan memicu broken image
  return pathOrUrl.startsWith('http') ? pathOrUrl : '';
}

/**
 * 3. Menghapus foto profil dari tabel database dan storage
 */
export async function removeUserAvatar(userId: string, currentFilePath?: string): Promise<void> {
  const client = getSupabase();

  // 1. Hapus referensi di tabel user_profiles
  await client
    .from('user_profiles')
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // 2. Hapus file fisik di storage jika berupa path
  if (currentFilePath && !currentFilePath.startsWith('data:') && !currentFilePath.startsWith('http')) {
    try {
      await client.storage.from(BUCKET_NAME).remove([currentFilePath]);
      await client.storage.from(FALLBACK_BUCKET).remove([currentFilePath]);
    } catch (e) {
      console.warn('Gagal menghapus file avatar di storage:', e);
    }
  }
}
