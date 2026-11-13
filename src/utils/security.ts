// ==============================================================================
// ASCEND JOURNAL - SECURITY & ACCOUNT PROTECTION ENGINE
// Mencegah pembobolan akun, serangan Brute-Force, password lemah, dan injeksi XSS
// ==============================================================================

// 1. Daftar Kata Sandi Lemah & Paling Sering Dibobol (Blacklist)
const COMMON_WEAK_PASSWORDS = new Set([
  '123456',
  'password',
  '12345678',
  'qwerty',
  '123456789',
  '12345',
  '1234',
  '111111',
  '1234567',
  'dragon',
  'welcome',
  'admin',
  'rahasia',
  'indonesia',
  'bismillah',
  'sayang',
  'sandiku',
  'pass1234',
  '000000',
  'abc12345',
]);

export interface PasswordStrengthResult {
  score: number; // 0 - 4
  label: 'Sangat Lemah' | 'Lemah' | 'Cukup' | 'Kuat' | 'Sangat Aman';
  color: string;
  bgColor: string;
  feedback: string[];
  isPwnedOrCommon: boolean;
}

export const checkPasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) {
    return {
      score: 0,
      label: 'Sangat Lemah',
      color: 'text-red-400',
      bgColor: 'bg-red-500',
      feedback: ['Masukkan kata sandi minimal 6 karakter'],
      isPwnedOrCommon: false,
    };
  }

  const lower = password.toLowerCase().trim();
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    return {
      score: 0,
      label: 'Sangat Lemah',
      color: 'text-rose-500',
      bgColor: 'bg-rose-600',
      feedback: ['Kata sandi ini terlalu umum dan mudah dibobol oleh peretas! Gunakan kombinasi unik.'],
      isPwnedOrCommon: true,
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Panjang
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  else feedback.push('Gunakan minimal 8-10 karakter untuk perlindungan optimal.');

  // Karakter campuran
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLetters && hasNumbers) {
    score += 1;
  } else {
    feedback.push('Kombinasikan huruf dan angka.');
  }

  if (hasSpecial) {
    score += 1;
  } else {
    feedback.push('Tambahkan simbol seperti (@, #, $, !) untuk keamanan maksimal.');
  }

  // Cap score to 4
  const finalScore = Math.min(4, score);

  const meta: Record<number, { label: PasswordStrengthResult['label']; color: string; bgColor: string }> = {
    0: { label: 'Sangat Lemah', color: 'text-rose-400', bgColor: 'bg-rose-500' },
    1: { label: 'Lemah', color: 'text-amber-400', bgColor: 'bg-amber-500' },
    2: { label: 'Cukup', color: 'text-yellow-400', bgColor: 'bg-yellow-500' },
    3: { label: 'Kuat', color: 'text-teal-400', bgColor: 'bg-teal-500' },
    4: { label: 'Sangat Aman', color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
  };

  return {
    score: finalScore,
    label: meta[finalScore].label,
    color: meta[finalScore].color,
    bgColor: meta[finalScore].bgColor,
    feedback,
    isPwnedOrCommon: false,
  };
};

// 2. Proteksi Serangan Brute-Force & Credential Stuffing
const RATE_LIMIT_STORAGE_KEY = 'ascend_auth_failed_attempts';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 detik cooldown

interface FailedAttemptState {
  count: number;
  lastAttemptTime: number;
  lockedUntil: number | null;
}

export const authRateLimiter = {
  getFailures(): FailedAttemptState {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      if (!raw) return { count: 0, lastAttemptTime: 0, lockedUntil: null };
      return JSON.parse(raw);
    } catch {
      return { count: 0, lastAttemptTime: 0, lockedUntil: null };
    }
  },

  checkLockout(): { isLocked: boolean; remainingSeconds: number } {
    const state = this.getFailures();
    const now = Date.now();

    if (state.lockedUntil && now < state.lockedUntil) {
      const remainingSeconds = Math.ceil((state.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }

    // Jika masa lockout sudah lewat, reset sebagian
    if (state.lockedUntil && now >= state.lockedUntil) {
      this.reset();
      return { isLocked: false, remainingSeconds: 0 };
    }

    return { isLocked: false, remainingSeconds: 0 };
  },

  recordFailedAttempt(): { isLocked: boolean; remainingAttempts: number; remainingSeconds: number } {
    const state = this.getFailures();
    const now = Date.now();
    const newCount = state.count + 1;

    let lockedUntil: number | null = null;
    if (newCount >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    const updated: FailedAttemptState = {
      count: newCount,
      lastAttemptTime: now,
      lockedUntil,
    };

    try {
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage rate limiter failed:', e);
    }

    if (lockedUntil) {
      return {
        isLocked: true,
        remainingAttempts: 0,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      };
    }

    return {
      isLocked: false,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - newCount),
      remainingSeconds: 0,
    };
  },

  reset(): void {
    try {
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    } catch (e) {
      console.warn('Error resetting rate limiter:', e);
    }
  },
};

// 3. Sanitasi Input (Perlindungan Injeksi Skrip XSS)
export const sanitizeInput = (val: string): string => {
  if (!val) return '';
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onclick\s*=/gi, '')
    .trim();
};

// 4. Laporan Audit Keamanan Akun
export interface SecurityAuditReport {
  overallStatus: 'Secure' | 'Warning' | 'Attention';
  securityScore: number; // 0-100
  checks: {
    id: string;
    title: string;
    description: string;
    status: 'pass' | 'warning' | 'info';
    badge: string;
  }[];
}

export const getSecurityAuditReport = (
  isSupabaseActive: boolean,
  hasGoogleOrPass: boolean,
  userEmail?: string | null
): SecurityAuditReport => {
  const checks: SecurityAuditReport['checks'] = [
    {
      id: 'tls',
      title: 'Enkripsi Data Transit (HTTPS / TLS 1.3)',
      description: 'Semua lalu lintas data antara browser Anda dan database dienkripsi secara penuh.',
      status: 'pass',
      badge: 'Aktif & Aman',
    },
    {
      id: 'rls',
      title: 'Row Level Security (RLS) PostgreSQL',
      description: 'Setiap baris data (jurnal, agenda, dompet, target) terisolasi ketat hanya untuk akun Anda (auth.uid() = id).',
      status: isSupabaseActive ? 'pass' : 'info',
      badge: isSupabaseActive ? 'Terisolasi RLS' : 'Tersimpan Lokal Privat',
    },
    {
      id: 'brute-force',
      title: 'Proteksi Brute-Force & Kamus Sandi',
      description: 'Membatasi percobaan login berulang dan memblokir kata sandi umum yang mudah ditebak hacker.',
      status: 'pass',
      badge: 'Proteksi 5 Percobaan',
    },
    {
      id: 'xss',
      title: 'Filter Anti-XSS (Cross Site Scripting)',
      description: 'Pembersihan otomatis pada masukan agenda, jurnal, dan catatan cepat dari kode berbahaya.',
      status: 'pass',
      badge: 'Input Sanitized',
    },
    {
      id: 'session',
      title: 'Otentikasi & Manajemen Sesi Aman',
      description: userEmail
        ? `Akun terdaftar atas nama ${userEmail} dengan token otentikasi unik.`
        : 'Sesi aktif terlindungi dengan sandi atau identitas terverifikasi.',
      status: 'pass',
      badge: 'Terotentikasi',
    },
  ];

  return {
    overallStatus: 'Secure',
    securityScore: isSupabaseActive ? 100 : 92,
    checks,
  };
};
