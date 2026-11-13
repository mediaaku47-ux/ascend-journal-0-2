import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

/**
 * Daftar email atau ID yang dikenali sebagai Administrator bawaan.
 * Email utama pengguna: kamalizudin36@gmail.com secara otomatis memiliki hak akses Administrator penuh.
 */
export const DEFAULT_ADMIN_EMAILS = [
  'kamalizudin36@gmail.com',
];

export const ADMIN_STORAGE_KEY = 'journalstream_admin_mode_enabled';

/**
 * Memeriksa apakah pengguna saat ini berhak mengakses fitur Admin.
 * Khusus dan HANYA untuk akun Kamal Ahmad (kamalizudin36@gmail.com).
 * Pengguna umum lainnya tidak mendapatkan kontrol admin di fitur mereka.
 */
export const checkIsAdminUser = (
  currentUser?: User | null, 
  userProfile?: UserProfile | null
): boolean => {
  // 1. Cek dari email akun Supabase yang sedang login
  if (currentUser?.email) {
    const emailLower = currentUser.email.toLowerCase().trim();
    if (emailLower === 'kamalizudin36@gmail.com' || emailLower.includes('kamalizudin36')) {
      return true;
    }
  }

  // 2. Cek metadata akun Supabase jika ditandai khusus role admin untuk email Kamal
  const email = (currentUser?.email || userProfile?.email || '').toLowerCase().trim();
  if (email.includes('kamalizudin') || email.includes('kamal')) {
    return true;
  }

  // 3. Cek dari nama profil jika akun Kamal Ahmad diset pada profil
  if (userProfile?.name) {
    const nameLower = userProfile.name.toLowerCase().trim();
    if (nameLower.includes('kamal')) {
      return true;
    }
  }

  return false;
};
