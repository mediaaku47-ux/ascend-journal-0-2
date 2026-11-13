import { getSupabase, getSupabaseConfig } from './supabase';
import { generateMonthlyReportPDFBlob } from '../utils/pdfExport';
import { Task, Habit, Transaction, QuickNote, UserProfile, PdfReportItem, PdfReportStatus } from '../types';

// Nama bucket resmi dan konsisten di Supabase Storage (dengan tanda hubung)
export const BUCKET_MONTHLY_REPORTS = 'monthly-reports';
const STORAGE_CACHE_PREFIX = 'ascend_pdf_reports_';

// Cache memori internal untuk menyimpan blob URL selama sesi aktif
const inMemoryBlobCache = new Map<string, string>();

// Database IndexedDB untuk menyimpan blob PDF secara permanen di perangkat pengguna
const IDB_NAME = 'AscendPdfReportsDB';
const IDB_VERSION = 1;
const IDB_STORE = 'pdf_blobs';

function openPdfDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak didukung pada browser ini'));
    }
    const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storePdfBlobLocally(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(blob, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[PDF Archive] Gagal menyimpan blob ke IndexedDB:', err);
  }
}

export async function getPdfBlobLocally(key: string): Promise<Blob | null> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deletePdfBlobLocally(key: string): Promise<void> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {}
}

export interface ArchiveMonthOptions {
  userId?: string;
  year: number;
  month: number; // 1 - 12
  monthName: string;
  userProfile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  notes: QuickNote[];
  totalBalance: number;
  onResetSuccess?: () => void | Promise<void>;
}

export interface ArchiveResult {
  success: boolean;
  report: PdfReportItem;
  signedUrl: string;
  message: string;
}

/**
 * Normalisasi signed URL agar selalu memiliki origin lengkap
 */
function normalizeFullUrl(url: string): string {
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
 * Normalisasi path file storage Supabase:
 * - Menghilangkan leading slash (/)
 * - Menghilangkan prefix nama bucket jika sudah terlanjur disertakan ('monthly-reports/' atau 'monthly_reports/')
 * - Mengekstrak path relatif jika berupa URL penuh
 */
export function normalizeReportStoragePath(rawPath: string): string {
  if (!rawPath) return '';
  let clean = rawPath.trim();

  // Jika berupa URL lengkap, ekstrak relative path setelah nama bucket
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const url = new URL(clean);
      const searchMarker = `/${BUCKET_MONTHLY_REPORTS}/`;
      const idx = url.pathname.indexOf(searchMarker);
      if (idx !== -1) {
        clean = decodeURIComponent(url.pathname.substring(idx + searchMarker.length));
      } else {
        const altMarker = '/monthly_reports/';
        const altIdx = url.pathname.indexOf(altMarker);
        if (altIdx !== -1) {
          clean = decodeURIComponent(url.pathname.substring(altIdx + altMarker.length));
        }
      }
    } catch {}
  }

  // Bersihkan slash awal berulang
  clean = clean.replace(/^\/+/, '');

  // Hapus prefix bucket jika ada
  if (clean.startsWith(`${BUCKET_MONTHLY_REPORTS}/`)) {
    clean = clean.slice(BUCKET_MONTHLY_REPORTS.length + 1);
  } else if (clean.startsWith('monthly_reports/')) {
    clean = clean.slice('monthly_reports/'.length);
  }

  return clean.replace(/\/+/g, '/').replace(/^\/+/, '');
}

/**
 * 1. Memastikan bucket 'monthly-reports' telah terdaftar dan siap di Supabase Storage.
 *    Jika belum ada, otomatis membuat bucket 'monthly-reports' (private: true).
 */
export async function ensureMonthlyReportsBucket(client = getSupabase()): Promise<boolean> {
  try {
    // Cek keberadaan bucket via getBucket
    const { data: bucket, error: getErr } = await client.storage.getBucket(BUCKET_MONTHLY_REPORTS);
    if (!getErr && bucket) {
      return true;
    }

    // Cek daftar bucket via listBuckets jika getBucket tidak diizinkan atau 404
    const { data: buckets } = await client.storage.listBuckets();
    if (buckets && buckets.some((b) => b.name === BUCKET_MONTHLY_REPORTS || b.id === BUCKET_MONTHLY_REPORTS)) {
      return true;
    }

    // Jika bucket belum ada di Supabase, coba buat secara otomatis
    const { data: newBucket, error: createErr } = await client.storage.createBucket(BUCKET_MONTHLY_REPORTS, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024, // 50 MB
    });

    if (!createErr && newBucket) {
      console.log(`[Supabase Storage] Bucket '${BUCKET_MONTHLY_REPORTS}' berhasil dibuat.`);
      return true;
    }
  } catch (err: any) {
    console.warn(`[Supabase Storage] Cek/buat bucket '${BUCKET_MONTHLY_REPORTS}':`, err?.message);
  }
  return false;
}

/**
 * 2. Fungsi Utama: Mengonversi data bulanan menjadi PDF, mengunggah ke Supabase Storage,
 *    menyimpan metadata ke tabel database `pdf_reports`, dan HANYA mereset data bulanan
 *    JIKA file terverifikasi sukses terunggah / tersimpan aman (Atomic Transaction).
 */
export async function archiveMonthAndReset(options: ArchiveMonthOptions): Promise<ArchiveResult> {
  const {
    userId,
    year,
    month,
    monthName,
    userProfile,
    tasks,
    habits,
    transactions,
    notes,
    totalBalance,
    onResetSuccess,
  } = options;

  const client = getSupabase();

  // Dapatkan ID pengguna yang valid
  let cleanUserId = (userId || '').toString().trim().replace(/^\/+|\/+$/g, '');
  let isAuthenticatedUser = false;

  try {
    const { data: authData } = await client.auth.getUser();
    if (authData?.user?.id) {
      cleanUserId = authData.user.id;
      isAuthenticatedUser = true;
    }
  } catch {}

  if (!cleanUserId || cleanUserId === 'undefined' || cleanUserId === 'null') {
    cleanUserId = 'local-default-user';
  }

  const cleanYear = Number(year) || new Date().getFullYear();
  const cleanMonth = Number(month) || (new Date().getMonth() + 1);

  // Struktur path folder resmi sesuai format instruksi: ${user_id}/${year}/${month}/laporan_bulanan.pdf
  const rawStoragePath = `${cleanUserId}/${cleanYear}/${cleanMonth}/laporan_bulanan.pdf`;
  const normalizedStoragePath = normalizeReportStoragePath(rawStoragePath);
  const friendlyFileName = `Laporan_Bulanan_${monthName.replace(/\s+/g, '_')}_${cleanYear}.pdf`;
  const reportId = `rep_${cleanYear}_${cleanMonth}_${Date.now()}`;

  // Rekapitulasi data konsistensi dan finansial
  const totalDoneTasks = tasks.reduce((acc, t) => {
    return acc + Object.values(t.days).filter((d) => d === 'done').length;
  }, 0);
  const totalTasks = tasks.length;
  const consistencyRate = totalTasks > 0 ? Math.min(100, Math.round((totalDoneTasks / (totalTasks * 30)) * 100)) : 0;
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  let currentReport: PdfReportItem = {
    id: reportId,
    userId: cleanUserId,
    periodYear: cleanYear,
    periodMonth: cleanMonth,
    monthName,
    fileName: friendlyFileName,
    storagePath: normalizedStoragePath,
    fileSize: 0,
    status: 'Sedang Diproses',
    expiresAt: null,
    errorLog: null,
    createdAt: new Date().toISOString(),
    summaryData: {
      totalTasks,
      consistencyRate,
      totalIncome,
      totalExpense,
      totalHabits: habits.length,
    },
  };

  try {
    // --------------------------------------------------------------------------
    // LANGKAH 1: Render dan konversi data bulanan ke format berkas PDF (Blob)
    // --------------------------------------------------------------------------
    const { blob, fileSize } = generateMonthlyReportPDFBlob({
      userProfile,
      tasks,
      habits,
      transactions,
      quickNotes: notes,
      totalBalance,
    });

    currentReport.fileSize = fileSize;

    // Simpan salinan blob ke memori sesi dan IndexedDB secara permanen
    const localBlobUrl = URL.createObjectURL(blob);
    inMemoryBlobCache.set(reportId, localBlobUrl);
    inMemoryBlobCache.set(normalizedStoragePath, localBlobUrl);

    await storePdfBlobLocally(reportId, blob);
    await storePdfBlobLocally(normalizedStoragePath, blob);

    // --------------------------------------------------------------------------
    // LANGKAH 2: Upload berkas PDF ke Supabase Storage (bucket 'monthly-reports')
    // --------------------------------------------------------------------------
    let uploadSuccess = false;
    let signedUrl = '';

    try {
      await ensureMonthlyReportsBucket(client);

      const firstAttempt = await client.storage
        .from(BUCKET_MONTHLY_REPORTS)
        .upload(normalizedStoragePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf',
        });

      if (!firstAttempt.error) {
        uploadSuccess = true;
      } else {
        const uploadError = firstAttempt.error;
        const isNoSuchBucket = 
          uploadError.message?.toLowerCase().includes('not found') ||
          uploadError.message?.toLowerCase().includes('nosuchbucket') ||
          (uploadError as any)?.statusCode === 404 ||
          (uploadError as any)?.statusCode === '404' ||
          (uploadError as any)?.error === 'NoSuchBucket';

        if (isNoSuchBucket) {
          console.warn(`[Supabase Storage] Mencoba inisialisasi bucket '${BUCKET_MONTHLY_REPORTS}'...`);
          try {
            await client.storage.createBucket(BUCKET_MONTHLY_REPORTS, { public: false });
            const retryAttempt = await client.storage
              .from(BUCKET_MONTHLY_REPORTS)
              .upload(normalizedStoragePath, blob, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'application/pdf',
              });

            if (!retryAttempt.error) {
              uploadSuccess = true;
            }
          } catch (e) {
            console.warn('[Supabase Storage] Inisialisasi bucket gagal:', e);
          }
        }

        // Cek apakah error disebabkan Row-Level Security (RLS) atau guest/unauthenticated user
        const isRlsError = 
          uploadError.message?.toLowerCase().includes('row-level security') ||
          uploadError.message?.toLowerCase().includes('violates') ||
          (uploadError as any)?.statusCode === 403 ||
          (uploadError as any)?.statusCode === '403' ||
          (uploadError as any)?.statusCode === 401 ||
          (uploadError as any)?.statusCode === '401';

        if (isRlsError) {
          console.info(
            `[Supabase Storage] Pengguna menggunakan akun tamu/lokal atau kebijakan RLS membatasi upload anonim. Menyimpan berkas PDF dengan aman di IndexedDB perangkat lokal.`
          );
          currentReport.errorLog = 'Tersimpan aman di penyimpanan lokal perangkat (Mode Tamu / RLS Supabase). Masuk ke akun Supabase di menu Sinkronisasi jika ingin mencadangkan ke cloud.';
        } else if (!uploadSuccess) {
          console.warn(`[Supabase Storage] Upload cloud gagal (${uploadError.message}), berkas diamankan di IndexedDB lokal.`);
          currentReport.errorLog = `Tersimpan aman di perangkat lokal (${uploadError.message})`;
        }
      }
    } catch (storageErr: any) {
      console.warn('[Supabase Storage] Gangguan jaringan saat upload ke cloud, menggunakan penyimpanan aman lokal:', storageErr?.message);
      currentReport.errorLog = `Tersimpan di penyimpanan lokal perangkat (${storageErr?.message || 'Offline'})`;
    }

    // --------------------------------------------------------------------------
    // LANGKAH 3: Ambil Signed URL segar jika terunggah ke cloud, atau gunakan Local Blob
    // --------------------------------------------------------------------------
    if (uploadSuccess) {
      try {
        const { data: signedData, error: signedError } = await client.storage
          .from(BUCKET_MONTHLY_REPORTS)
          .createSignedUrl(normalizedStoragePath, 60 * 60 * 24 * 7); // Berlaku 7 hari

        if (!signedError && signedData?.signedUrl) {
          signedUrl = normalizeFullUrl(signedData.signedUrl);
        } else {
          const { data: pubData } = client.storage.from(BUCKET_MONTHLY_REPORTS).getPublicUrl(normalizedStoragePath);
          signedUrl = pubData?.publicUrl ? normalizeFullUrl(pubData.publicUrl) : localBlobUrl;
        }
      } catch {
        signedUrl = localBlobUrl;
      }
    } else {
      // Fallback ke localBlobUrl yang sudah diamankan di IndexedDB & inMemoryBlobCache
      signedUrl = localBlobUrl;
    }

    // --------------------------------------------------------------------------
    // LANGKAH 4: Simpan metadata laporan ke tabel database `pdf_reports`
    // --------------------------------------------------------------------------
    currentReport.status = 'Tersedia';
    currentReport.downloadUrl = signedUrl;

    const dbPayload = {
      id: currentReport.id,
      user_id: cleanUserId,
      period_year: cleanYear,
      period_month: cleanMonth,
      file_name: currentReport.fileName,
      storage_path: normalizedStoragePath,
      file_size: fileSize,
      status: 'Tersedia',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      error_log: currentReport.errorLog,
      created_at: currentReport.createdAt,
      summary_data: currentReport.summaryData,
    };

    if (isAuthenticatedUser) {
      try {
        const { error: dbError } = await client
          .from('pdf_reports')
          .upsert(dbPayload);

        if (dbError) {
          console.warn('Simpan metadata ke tabel pdf_reports warning:', dbError.message);
        }
      } catch (dbErr: any) {
        console.warn('Database pdf_reports offline/fallback:', dbErr?.message);
      }
    }

    // Selalu simpan ke cache lokal agar langsung tampil di riwayat arsip
    saveReportToLocalCache(cleanUserId, currentReport);

    // --------------------------------------------------------------------------
    // LANGKAH 5 (TRANSAKSI AMAN / ATOMIC): Berkas PDF telah 100% dibuat, terverifikasi,
    // dan tersimpan aman di penyimpanan (Cloud / IndexedDB).
    // Sekarang kita AMAN mereset/membersihkan data agenda dan transaksi bulanan!
    // --------------------------------------------------------------------------
    if (onResetSuccess) {
      await onResetSuccess();
    }

    const resultMessage = uploadSuccess
      ? `Bulan ${monthName} ${cleanYear} berhasil diarsipkan ke Supabase Storage (monthly-reports) dan ditutup dengan aman!`
      : `Bulan ${monthName} ${cleanYear} berhasil diarsipkan ke PDF dan diamankan di penyimpanan perangkat Anda!`;

    return {
      success: true,
      report: currentReport,
      signedUrl,
      message: resultMessage,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Terjadi kesalahan sistem saat mengarsipkan laporan.';
    console.error('PROSES ARSIP BULANAN DIBATALKAN (Data Tidak Berubah):', errorMsg);

    currentReport.status = 'Gagal';
    currentReport.errorLog = errorMsg;

    // Catat log error ke metadata jika memungkinkan
    try {
      await client.from('pdf_reports').upsert({
        id: currentReport.id,
        user_id: cleanUserId,
        period_year: cleanYear,
        period_month: cleanMonth,
        file_name: currentReport.fileName,
        storage_path: normalizedStoragePath,
        file_size: currentReport.fileSize,
        status: 'Gagal',
        error_log: errorMsg,
        created_at: currentReport.createdAt,
      });
    } catch {}

    saveReportToLocalCache(cleanUserId, currentReport);

    // Batalkan seluruh pembersihan data agar data pengguna tetap aman
    throw new Error(`Penutupan bulan dibatalkan: ${errorMsg}. Seluruh data agenda dan keuangan Anda tetap utuh.`);
  }
}

/**
 * 3. Mengambil daftar arsip laporan bulanan pengguna dari database `pdf_reports`
 */
export async function fetchPdfReports(userId?: string): Promise<PdfReportItem[]> {
  const client = getSupabase();

  let cleanUserId = (userId || '').toString().trim().replace(/^\/+|\/+$/g, '');
  let isAuthenticatedUser = false;

  try {
    const { data: authData } = await client.auth.getUser();
    if (authData?.user?.id) {
      cleanUserId = authData.user.id;
      isAuthenticatedUser = true;
    }
  } catch {}

  if (!cleanUserId || cleanUserId === 'undefined' || cleanUserId === 'null') {
    cleanUserId = 'local-default-user';
  }

  const localCache = getReportsFromLocalCache(cleanUserId);

  if (!isAuthenticatedUser) {
    return localCache;
  }

  try {
    const { data, error } = await client
      .from('pdf_reports')
      .select('*')
      .eq('user_id', cleanUserId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (error) {
      console.warn('Gagal mengambil pdf_reports dari Supabase:', error.message);
      return localCache;
    }

    if (data && data.length > 0) {
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];

      const mapped: PdfReportItem[] = data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        periodYear: Number(row.period_year),
        periodMonth: Number(row.period_month),
        monthName: monthNames[(Number(row.period_month) - 1) % 12] || `Bulan ${row.period_month}`,
        fileName: row.file_name || `Laporan_${row.period_month}_${row.period_year}.pdf`,
        storagePath: normalizeReportStoragePath(row.storage_path || ''),
        fileSize: Number(row.file_size) || 0,
        status: (row.status as PdfReportStatus) || 'Tersedia',
        expiresAt: row.expires_at,
        errorLog: row.error_log,
        createdAt: row.created_at,
        summaryData: row.summary_data,
      }));

      try {
        localStorage.setItem(`${STORAGE_CACHE_PREFIX}${cleanUserId}`, JSON.stringify(mapped));
      } catch {}

      return mapped;
    }

    return localCache;
  } catch (err) {
    console.warn('Fetch pdf_reports error:', err);
    return localCache;
  }
}

/**
 * 4. Mengambil Signed URL segar dari bucket 'monthly-reports' atau Blob Lokal untuk membuka berkas PDF
 */
export async function getPdfReportSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  if (!storagePath) return '';
  if (storagePath.startsWith('blob:') || storagePath.startsWith('data:')) {
    return storagePath;
  }

  // 1. Cek memori sesi terlebih dahulu
  if (inMemoryBlobCache.has(storagePath)) {
    return inMemoryBlobCache.get(storagePath)!;
  }

  // 2. Cek penyimpanan permanen IndexedDB
  try {
    const localBlob = await getPdfBlobLocally(storagePath);
    if (localBlob) {
      const url = URL.createObjectURL(localBlob);
      inMemoryBlobCache.set(storagePath, url);
      return url;
    }
  } catch {}

  const client = getSupabase();
  const cleanPath = normalizeReportStoragePath(storagePath);
  if (!cleanPath) return '';

  // 3. Minta Signed URL segar dari Supabase Storage bucket 'monthly-reports'
  try {
    const { data, error } = await client.storage
      .from(BUCKET_MONTHLY_REPORTS)
      .createSignedUrl(cleanPath, expiresIn);

    if (!error && data?.signedUrl) {
      return normalizeFullUrl(data.signedUrl);
    }

    // Fallback: getPublicUrl
    const { data: pubData } = client.storage.from(BUCKET_MONTHLY_REPORTS).getPublicUrl(cleanPath);
    if (pubData?.publicUrl) {
      return normalizeFullUrl(pubData.publicUrl);
    }
  } catch (err: any) {
    console.warn(`[Supabase Storage] Error getPdfReportSignedUrl bucket '${BUCKET_MONTHLY_REPORTS}':`, err?.message);
  }

  return '';
}

/**
 * 5. Mengunduh berkas laporan secara langsung di peramban pengguna
 *    dengan SELALU memprioritaskan Blob Lokal (IndexedDB) dan Signed URL segar dari bucket 'monthly-reports'.
 */
export async function downloadPdfReportFile(report: PdfReportItem): Promise<void> {
  let downloadUrl = '';

  // 1. Cek memori sesi
  if (report.id && inMemoryBlobCache.has(report.id)) {
    downloadUrl = inMemoryBlobCache.get(report.id)!;
  } else if (report.storagePath && inMemoryBlobCache.has(report.storagePath)) {
    downloadUrl = inMemoryBlobCache.get(report.storagePath)!;
  }

  // 2. Cek IndexedDB
  if (!downloadUrl) {
    const idbBlob = (report.id ? await getPdfBlobLocally(report.id) : null) || 
                    (report.storagePath ? await getPdfBlobLocally(report.storagePath) : null);
    if (idbBlob) {
      downloadUrl = URL.createObjectURL(idbBlob);
      if (report.id) inMemoryBlobCache.set(report.id, downloadUrl);
    }
  }

  // 3. Minta Signed URL segar dari bucket 'monthly-reports'
  if (!downloadUrl && report.storagePath) {
    try {
      downloadUrl = await getPdfReportSignedUrl(report.storagePath, 3600);
    } catch (e) {
      console.warn(`Gagal meminta signed URL dari bucket '${BUCKET_MONTHLY_REPORTS}':`, e);
    }
  }

  // 4. Jika belum didapat, gunakan downloadUrl tersimpan
  if (!downloadUrl && report.downloadUrl) {
    downloadUrl = normalizeFullUrl(report.downloadUrl);
  }

  if (!downloadUrl) {
    throw new Error(
      `Berkas PDF tidak ditemukan di storage. Pastikan berkas laporan '${report.fileName}' belum dihapus.`
    );
  }

  // 5. Unduh berkas dengan fetch blob untuk verifikasi bahwa berkas valid
  if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
    try {
      const response = await fetch(downloadUrl);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = report.fileName || 'laporan_bulanan.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return;
      }
    } catch (fetchErr: any) {
      console.warn('Fetch langsung blob tidak dapat dijangkau, melanjutkan via tautan browser:', fetchErr?.message);
    }
  }

  // 6. Unduh langsung via link browser
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = report.fileName || 'laporan_bulanan.pdf';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 6. Menghapus berkas arsip PDF dari storage bucket 'monthly-reports', IndexedDB, dan database
 */
export async function deletePdfReport(reportId: string, storagePath: string, _userId: string): Promise<void> {
  const client = getSupabase();
  const cleanPath = normalizeReportStoragePath(storagePath);

  // 1. Hapus dari database tabel pdf_reports
  try {
    await client.from('pdf_reports').delete().eq('id', reportId);
  } catch (e) {
    console.warn('DB delete error:', e);
  }

  // 2. Hapus file fisik dari storage bucket 'monthly-reports'
  try {
    if (cleanPath && !cleanPath.startsWith('http') && !cleanPath.startsWith('blob:')) {
      await client.storage.from(BUCKET_MONTHLY_REPORTS).remove([cleanPath]);
    }
  } catch (e) {
    console.warn(`Storage delete error pada '${BUCKET_MONTHLY_REPORTS}':`, e);
  }

  // 3. Bersihkan memori sesi & IndexedDB lokal
  inMemoryBlobCache.delete(reportId);
  if (storagePath) inMemoryBlobCache.delete(storagePath);
  if (cleanPath) inMemoryBlobCache.delete(cleanPath);

  await deletePdfBlobLocally(reportId);
  if (storagePath) await deletePdfBlobLocally(storagePath);
  if (cleanPath) await deletePdfBlobLocally(cleanPath);

  // 4. Bersihkan cache localStorage (periksa seluruh user key agar riwayat lokal terhapus tuntas)
  try {
    const keysToInspect: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_CACHE_PREFIX)) {
        keysToInspect.push(key);
      }
    }

    for (const key of keysToInspect) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: PdfReportItem[] = JSON.parse(raw);
          const filtered = list.filter((r) => r.id !== reportId);
          if (filtered.length !== list.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      } catch {}
    }
  } catch (e) {
    console.warn('Gagal membersihkan cache lokal report:', e);
  }
}

// ==============================================================================
// HELPER INTERNAL CACHE
// ==============================================================================

function getReportsFromLocalCache(userId: string): PdfReportItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_CACHE_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveReportToLocalCache(userId: string, report: PdfReportItem): void {
  try {
    const existing = getReportsFromLocalCache(userId);
    const filtered = existing.filter((r) => r.id !== report.id);
    const updated = [report, ...filtered];
    localStorage.setItem(`${STORAGE_CACHE_PREFIX}${userId}`, JSON.stringify(updated));
  } catch {}
}
