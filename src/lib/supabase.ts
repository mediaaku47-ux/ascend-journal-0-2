import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Primary and fallback storage keys for Supabase project credentials
export const STORAGE_KEY_URL = 'journalstream_supabase_url';
export const STORAGE_KEY_ANON = 'journalstream_supabase_anon_key';

const FALLBACK_URL_KEYS = [
  'journalstream_supabase_url',
  'supabase_project_url',
  'supabase_url',
  'supabaseUrl',
  'VITE_SUPABASE_URL',
];

const FALLBACK_KEY_KEYS = [
  'journalstream_supabase_anon_key',
  'supabase_public_key',
  'supabase_anon_key',
  'supabase_key',
  'supabaseAnonKey',
  'VITE_SUPABASE_ANON_KEY',
];

// Fallback kredensial default proyek Supabase milik pengguna
export const DEFAULT_SUPABASE_URL = "https://nbfnspscgwktzfzagzxt.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZm5zcHNjZ3drdHpmemFnenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTc1NzYsImV4cCI6MjEwNDM3MzU3Nn0.paTo_87gXkr1BZ2CrLzAXZVR9qL8hDdYRzA6IG8tlkE";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isFromEnv: boolean;
}

// Clean and normalize Supabase URL to pure base origin without subpaths (/rest/v1, /auth/v1, etc.)
export const normalizeSupabaseUrl = (url: string): string => {
  if (!url) return '';
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  try {
    const parsed = new URL(clean);
    // Jika pengguna secara tidak sengaja menempelkan URL dashboard Supabase
    if (parsed.hostname === 'supabase.com' || parsed.hostname === 'app.supabase.com') {
      const parts = parsed.pathname.split('/');
      const projectIndex = parts.indexOf('project');
      if (projectIndex !== -1 && parts[projectIndex + 1]) {
        return `https://${parts[projectIndex + 1]}.supabase.co`;
      }
    }
    // Supabase project base URL WAJIB berupa origin murni tanpa subpath (seperti /rest/v1 atau /auth/v1).
    // Subpath tambahan pada URL dasar adalah penyebab utama error "Invalid path specified in request URL".
    return parsed.origin;
  } catch {
    return clean.replace(/\/+$/, '');
  }
};

// Validasi format Supabase URL resmi
export const isValidSupabaseUrl = (url: string): boolean => {
  if (!url) return false;
  const clean = url.trim();
  if (
    clean.includes('your-project') || 
    clean.includes('placeholder') || 
    clean.includes('example.com')
  ) {
    return false;
  }
  try {
    const parsed = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
    const host = parsed.hostname.toLowerCase();
    return (
      (host.includes('.') || host === 'localhost') && 
      host.length >= 4 && 
      !/^\d+$/.test(host)
    );
  } catch {
    return false;
  }
};

// Validasi Supabase Anon Key (JWT atau publishable key dengan panjang minimal 20 karakter)
export const isValidSupabaseKey = (key: string): boolean => {
  if (!key) return false;
  const clean = key.trim();
  if (
    clean.includes('your-anon-key') || 
    clean.includes('placeholder') || 
    clean.includes('example') ||
    clean.includes('...') ||
    clean.includes('…') ||
    clean.endsWith('..')
  ) {
    return false;
  }

  // Format Supabase JWT (eyJhbGciOi...)
  if (clean.startsWith('eyJ')) {
    const parts = clean.split('.');
    // JWT WAJIB memiliki 3 segmen lengkap (header.payload.signature)
    if (parts.length !== 3) return false;
    return parts[0].length >= 10 && parts[1].length >= 10 && parts[2].length >= 20;
  }

  // Format Supabase Publishable Key baru (sb_publishable_... / sbp_...)
  if (clean.startsWith('sb_') || clean.startsWith('sbp_')) {
    return clean.length >= 30;
  }

  return clean.length >= 30;
};

let lastConfigError = '';
export const getLastConfigError = (): string => lastConfigError;

export const getSupabaseConfig = (): SupabaseConfig => {
  // 1. Kredensial dari Environment Variables (Vite / Netlify Deployment)
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL : '').trim();
  const envAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY : '').trim();

  if (isValidSupabaseUrl(envUrl) && isValidSupabaseKey(envAnonKey)) {
    return {
      url: normalizeSupabaseUrl(envUrl),
      anonKey: envAnonKey,
      isFromEnv: true,
    };
  }

  // 2. Cek penyimpanan lokal (kredensial yang dimasukkan pengguna lewat UI jika belum diatur di env)
  if (typeof window !== 'undefined') {
    let storedUrl = '';
    for (const k of FALLBACK_URL_KEYS) {
      const val = localStorage.getItem(k);
      if (val && isValidSupabaseUrl(val)) {
        storedUrl = val.trim();
        break;
      }
    }

    let storedKey = '';
    for (const k of FALLBACK_KEY_KEYS) {
      const val = localStorage.getItem(k);
      if (val && isValidSupabaseKey(val)) {
        storedKey = val.trim();
        break;
      }
    }

    if (storedUrl && storedKey) {
      return {
        url: normalizeSupabaseUrl(storedUrl),
        anonKey: storedKey,
        isFromEnv: false,
      };
    }
  }

  // 3. Fallback default tertanam (proyek Supabase pengguna)
  if (
    DEFAULT_SUPABASE_URL && 
    DEFAULT_SUPABASE_ANON_KEY && 
    isValidSupabaseUrl(DEFAULT_SUPABASE_URL) && 
    isValidSupabaseKey(DEFAULT_SUPABASE_ANON_KEY)
  ) {
    return {
      url: normalizeSupabaseUrl(DEFAULT_SUPABASE_URL),
      anonKey: DEFAULT_SUPABASE_ANON_KEY,
      isFromEnv: false,
    };
  }

  // Jika URL proyek valid tapi Anon Key belum valid atau terpotong (...)
  if (DEFAULT_SUPABASE_URL && isValidSupabaseUrl(DEFAULT_SUPABASE_URL)) {
    return {
      url: normalizeSupabaseUrl(DEFAULT_SUPABASE_URL),
      anonKey: '',
      isFromEnv: false,
    };
  }

  return {
    url: '',
    anonKey: '',
    isFromEnv: false,
  };
};

export const saveCustomSupabaseConfig = (url: string, anonKey: string): boolean => {
  lastConfigError = '';
  try {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = anonKey.trim();

    if (!isValidSupabaseUrl(cleanUrl)) {
      lastConfigError = 'Supabase URL harus berupa URL valid (contoh: https://xyz.supabase.co)';
      return false;
    }
    if (!isValidSupabaseKey(cleanKey)) {
      if (cleanKey.includes('...') || cleanKey.includes('…') || cleanKey.endsWith('..')) {
        lastConfigError = 'Anon Key yang Anda masukkan terpotong (...). Harap salin seluruh string Anon Key dari Supabase Dashboard tanpa tanda titik tiga.';
      } else {
        lastConfigError = 'Supabase Anon Key tidak valid. Pastikan format JWT lengkap (3 bagian dipisahkan titik) dari Supabase Dashboard.';
      }
      return false;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_ANON, cleanKey);
      // Backup keys untuk kompatibilitas lintas komponen
      localStorage.setItem('supabase_url', cleanUrl);
      localStorage.setItem('supabase_anon_key', cleanKey);
    }

    // Reset client instance agar pemanggilan berikutnya menggunakan project baru
    cachedClient = null;
    cachedUrl = '';
    cachedKey = '';
    return true;
  } catch (err: any) {
    lastConfigError = err?.message || 'Gagal menyimpan konfigurasi Supabase.';
    console.error('Failed to save custom supabase config:', err);
    return false;
  }
};

export const clearCustomSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    for (const k of FALLBACK_URL_KEYS) localStorage.removeItem(k);
    for (const k of FALLBACK_KEY_KEYS) localStorage.removeItem(k);
  }
  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
};

export const isSupabaseConfigured = (): boolean => {
  const config = getSupabaseConfig();
  return isValidSupabaseUrl(config.url) && isValidSupabaseKey(config.anonKey);
};

// Singleton Client Instance
let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export const getSupabase = (): SupabaseClient => {
  const config = getSupabaseConfig();
  const validUrl = config.url && config.url.startsWith('http') 
    ? config.url 
    : 'https://placeholder.supabase.co';
  const validKey = config.anonKey || 'placeholder-anon-key-ascend-journal-2026';

  // Jika URL atau Key berubah (misal pengguna baru saja menyimpan konfigurasi), recreate client
  if (cachedClient && (cachedUrl !== validUrl || cachedKey !== validKey)) {
    cachedClient = null;
  }

  if (cachedClient) return cachedClient;

  cachedUrl = validUrl;
  cachedKey = validKey;

  cachedClient = createClient(validUrl, validKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'ascend_journal_supabase_auth_token',
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return cachedClient;
};

// Proxy export agar pemanggilan `supabase.*` selalu diarahkan ke client aktif terkini
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

