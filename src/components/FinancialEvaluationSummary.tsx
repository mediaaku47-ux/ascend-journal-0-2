import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Wallet, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Share2, 
  Download, 
  BookmarkCheck, 
  Check, 
  Receipt,
  Archive
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialEvaluationSummaryProps {
  transactions: Transaction[];
  totalBalance: number; // Kas Operasional (Dompet)
  savingsBalance?: number; // Saldo Tabungan Simpanan
  incomeToday?: number;
  expenseToday?: number;
  currencySymbol?: string;
  userName?: string;
  onOpenCloseMonthModal?: () => void;
  theme?: 'dark' | 'light';
}

type PeriodType = 'weekly' | 'monthly' | 'all';

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: {
    bg: string;
    text: string;
    bar: string;
    hex: string;
  };
}

const CATEGORY_COLOR_PALETTE: { [key: string]: { bg: string; text: string; bar: string; hex: string } } = {
  'Makanan & Minuman': { bg: 'bg-amber-500/15', text: 'text-amber-500 dark:text-amber-400', bar: 'bg-amber-500', hex: '#f59e0b' },
  'Makanan': { bg: 'bg-amber-500/15', text: 'text-amber-500 dark:text-amber-400', bar: 'bg-amber-500', hex: '#f59e0b' },
  'Kebutuhan Sehari-hari': { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', hex: '#10b981' },
  'Belanja': { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', hex: '#10b981' },
  'Transportasi': { bg: 'bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500', hex: '#0ea5e9' },
  'Transport': { bg: 'bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500', hex: '#0ea5e9' },
  'Pendidikan': { bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500', hex: '#6366f1' },
  'Hiburan': { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500', hex: '#a855f7' },
  'Tagihan & Utilitas': { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500', hex: '#f43f5e' },
  'Tagihan': { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500', hex: '#f43f5e' },
  'Kesehatan': { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500', hex: '#14b8a6' },
  'Investasi': { bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400', bar: 'bg-cyan-500', hex: '#06b6d4' },
  'Pencairan Tabungan': { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500', hex: '#f97316' },
  'Penarikan Kas': { bg: 'bg-yellow-500/15', text: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-500', hex: '#eab308' },
  'Lainnya': { bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-400', bar: 'bg-slate-400', hex: '#64748b' },
};

const FALLBACK_COLORS = [
  { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500', hex: '#ec4899' },
  { bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500', hex: '#8b5cf6' },
  { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500', hex: '#3b82f6' },
  { bg: 'bg-lime-500/15', text: 'text-lime-600 dark:text-lime-400', bar: 'bg-lime-500', hex: '#84cc16' },
];

/**
 * Normalisasi cerdas kategori transaksi untuk menampilkan peruntukan penggunaan uang
 */
function normalizeExpenseCategory(tx: Transaction): string {
  const explicitCat = (tx.category || '').trim();
  const lowerCat = explicitCat.toLowerCase();

  // Jika sudah memiliki kategori spesifik
  if (explicitCat && !['pengeluaran', 'umum', 'transaksi', 'kas', 'keluar'].includes(lowerCat)) {
    return explicitCat;
  }

  // Jika kategori masih generik, lakukan deteksi cerdas berdasarkan judul
  const title = (tx.title || '').toLowerCase();
  if (title.includes('makan') || title.includes('minum') || title.includes('kopi') || title.includes('resto') || title.includes('cafe') || title.includes('snack') || title.includes('food') || title.includes('sarapan') || title.includes('lunch') || title.includes('dinner')) {
    return 'Makanan & Minuman';
  }
  if (title.includes('transport') || title.includes('bensin') || title.includes('bbm') || title.includes('grab') || title.includes('gojek') || title.includes('ojek') || title.includes('parkir') || title.includes('tol') || title.includes('kereta') || title.includes('bus')) {
    return 'Transportasi';
  }
  if (title.includes('belanja') || title.includes('supermarket') || title.includes('pasar') || title.includes('beli') || title.includes('mall') || title.includes('shopee') || title.includes('tokopedia') || title.includes('sabun') || title.includes('dapur')) {
    return 'Kebutuhan Sehari-hari';
  }
  if (title.includes('sekolah') || title.includes('kuliah') || title.includes('kursus') || title.includes('buku') || title.includes('pendidikan') || title.includes('spp') || title.includes('seminar') || title.includes('belajar')) {
    return 'Pendidikan';
  }
  if (title.includes('hiburan') || title.includes('nonton') || title.includes('bioskop') || title.includes('game') || title.includes('wisata') || title.includes('liburan') || title.includes('hobi') || title.includes('netflix') || title.includes('spotify')) {
    return 'Hiburan';
  }
  if (title.includes('listrik') || title.includes('air') || title.includes('pdam') || title.includes('pln') || title.includes('wifi') || title.includes('internet') || title.includes('pulsa') || title.includes('tagihan') || title.includes('kontrakan') || title.includes('sewa')) {
    return 'Tagihan & Utilitas';
  }
  if (title.includes('sehat') || title.includes('obat') || title.includes('dokter') || title.includes('klinik') || title.includes('medis') || title.includes('apotek') || title.includes('rumah sakit')) {
    return 'Kesehatan';
  }
  if (tx.type === 'savings_withdrawal') {
    return 'Pencairan Tabungan';
  }
  if (tx.type === 'withdrawal') {
    return 'Penarikan Kas';
  }

  return explicitCat || 'Kebutuhan Lainnya';
}

export const FinancialEvaluationSummary: React.FC<FinancialEvaluationSummaryProps> = ({
  transactions = [],
  totalBalance,
  savingsBalance = 0,
  incomeToday = 0,
  expenseToday = 0,
  currencySymbol = 'Rp',
  userName = 'Pengguna ASCEND',
  onOpenCloseMonthModal,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [activeChartType, setActiveChartType] = useState<'donut' | 'bar'>('donut');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(() => {
    return localStorage.getItem('ascend_last_saved_summary_time');
  });

  // 1. Perhitungan Saldo Kas & Tabungan serta Persentasenya
  const kasAmount = Math.max(0, totalBalance);
  const tabunganAmount = Math.max(0, savingsBalance);
  const combinedTotalBalance = kasAmount + tabunganAmount;

  const kasPercentage = combinedTotalBalance > 0 
    ? Number(((kasAmount / combinedTotalBalance) * 100).toFixed(1)) 
    : 50;
  const tabunganPercentage = combinedTotalBalance > 0 
    ? Number(((tabunganAmount / combinedTotalBalance) * 100).toFixed(1)) 
    : 50;

  // 2. Filter Transaksi Berdasarkan Periode
  const filteredTransactions = useMemo(() => {
    if (selectedPeriod === 'all') return transactions;

    const now = new Date();
    const nowTime = now.getTime();
    const daysLimit = selectedPeriod === 'weekly' ? 7 : 30;
    const timeThreshold = nowTime - (daysLimit * 24 * 60 * 60 * 1000);

    return transactions.filter((tx) => {
      if (tx.timestamp) {
        return tx.timestamp >= timeThreshold;
      }
      // Fallback parsing date string jika timestamp tidak ada
      return true;
    });
  }, [transactions, selectedPeriod]);

  // 3. Analisis Pengeluaran & Pemasukan Periode Terpilih
  const { 
    totalExpensePeriod, 
    totalIncomePeriod, 
    categoryBreakdown,
    totalTransactionCount 
  } = useMemo(() => {
    let expenseSum = 0;
    let incomeSum = 0;
    const catMap: Record<string, { amount: number; count: number }> = {};

    filteredTransactions.forEach((tx) => {
      const isExpense = tx.type === 'expense' || tx.type === 'withdrawal' || tx.type === 'savings_withdrawal';
      const isIncome = tx.type === 'income' || tx.type === 'savings_deposit';

      if (isExpense) {
        expenseSum += tx.amount;
        const catName = normalizeExpenseCategory(tx);
        if (!catMap[catName]) {
          catMap[catName] = { amount: 0, count: 0 };
        }
        catMap[catName].amount += tx.amount;
        catMap[catName].count += 1;
      } else if (isIncome) {
        incomeSum += tx.amount;
      }
    });

    const breakdown: CategoryBreakdown[] = Object.entries(catMap)
      .map(([cat, val], idx) => {
        const percentage = expenseSum > 0 ? Number(((val.amount / expenseSum) * 100).toFixed(1)) : 0;
        const color = CATEGORY_COLOR_PALETTE[cat] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
        return {
          category: cat,
          amount: val.amount,
          percentage,
          count: val.count,
          color,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpensePeriod: expenseSum,
      totalIncomePeriod: incomeSum,
      categoryBreakdown: breakdown,
      totalTransactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Label teks periode
  const periodLabel = selectedPeriod === 'weekly' 
    ? '7 Hari Terakhir' 
    : selectedPeriod === 'monthly' 
    ? '30 Hari Terakhir' 
    : 'Semua Riwayat Transaksi';

  // 4. Perhitungan Donut Chart SVG Segments
  const circumference = 2 * Math.PI * 38; // Radius 38 => Keliling ~238.76
  const chartSlices = useMemo(() => {
    if (categoryBreakdown.length === 0 || totalExpensePeriod === 0) return [];
    
    let currentOffset = 0;
    return categoryBreakdown.map((item) => {
      const strokeLength = (item.percentage / 100) * circumference;
      const strokeDasharray = `${strokeLength} ${circumference}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += strokeLength;
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [categoryBreakdown, totalExpensePeriod, circumference]);

  // 5. Aksi: Simpan Ringkasan
  const handleSaveSummary = () => {
    const now = new Date();
    const timeFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const summaryPayload = {
      savedAt: timeFormatted,
      period: periodLabel,
      totalBalance: combinedTotalBalance,
      kasAmount,
      kasPercentage,
      tabunganAmount,
      tabunganPercentage,
      totalExpensePeriod,
      totalIncomePeriod,
      categoryBreakdown,
    };

    localStorage.setItem('ascend_saved_financial_summary', JSON.stringify(summaryPayload));
    localStorage.setItem('ascend_last_saved_summary_time', timeFormatted);
    setLastSavedTimestamp(timeFormatted);
    
    setActionFeedback('Ringkasan finansial berhasil disimpan!');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // 6. Aksi: Bagikan Ringkasan
  const handleShareSummary = async () => {
    let breakdownText = '';
    if (categoryBreakdown.length > 0) {
      breakdownText = categoryBreakdown
        .map((c, i) => `${i + 1}. ${c.category}: ${currencySymbol} ${c.amount.toLocaleString('id-ID')} (${c.percentage}%)`)
        .join('\n');
    } else {
      breakdownText = 'Belum ada pengeluaran tercatat pada periode ini.';
    }

    const shareContent = 
      `📊 RINGKASAN FINANSIAL ASCEND\n` +
      `Periode: ${periodLabel}\n\n` +
      `💰 KONDISI SALDO SAAT INI:\n` +
      `• Total Saldo: ${currencySymbol} ${combinedTotalBalance.toLocaleString('id-ID')}\n` +
      `• Saldo Kas: ${currencySymbol} ${kasAmount.toLocaleString('id-ID')} (${kasPercentage}%)\n` +
      `• Saldo Tabungan: ${currencySymbol} ${tabunganAmount.toLocaleString('id-ID')} (${tabunganPercentage}%)\n\n` +
      `📉 RINCIAN PENGGUNAAN UANG (${currencySymbol} ${totalExpensePeriod.toLocaleString('id-ID')}):\n` +
      `${breakdownText}\n\n` +
      `📈 Pemasukan Periode: ${currencySymbol} ${totalIncomePeriod.toLocaleString('id-ID')}\n\n` +
      `Dicatat resmi melalui ASCEND Productivity & Financial System.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ringkasan Finansial ASCEND (${periodLabel})`,
          text: shareContent,
        });
        setActionFeedback('Ringkasan berhasil dibagikan!');
        setTimeout(() => setActionFeedback(null), 3000);
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }

    // Fallback: Salin ke Clipboard
    try {
      await navigator.clipboard.writeText(shareContent);
      setActionFeedback('Ringkasan disalin ke papan klip!');
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      setActionFeedback('Gagal membagikan ringkasan.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // 7. Aksi: Unduh Laporan PDF Resmi
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 18;

      // Header Laporan
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('ASCEND - LAPORAN RINGKASAN FINANSIAL', 14, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Periode: ${periodLabel} | Dicetak: ${new Date().toLocaleDateString('id-ID')} | Pengguna: ${userName}`, 14, currentY + 5.5);

      currentY = 38;

      // Seksi 1: Status Saldo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Kondisi & Proporsi Saldo Saat Ini', 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Komponen Saldo', 'Nominal', 'Persentase']],
        body: [
          ['Total Saldo Keseluruhan', `${currencySymbol} ${combinedTotalBalance.toLocaleString('id-ID')}`, '100.0%'],
          ['Saldo Kas Operasional (Dompet)', `${currencySymbol} ${kasAmount.toLocaleString('id-ID')}`, `${kasPercentage}%`],
          ['Saldo Tabungan & Simpanan', `${currencySymbol} ${tabunganAmount.toLocaleString('id-ID')}`, `${tabunganPercentage}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] }, // teal-600
        styles: { fontSize: 9.5 },
      });

      // @ts-expect-error - jspdf-autotable mutates lastAutoTable
      currentY = doc.lastAutoTable.finalY + 12;

      // Seksi 2: Arus Keuangan Periode
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. Ringkasan Arus Dana (${periodLabel})`, 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Arus Keuangan', 'Nominal', 'Keterangan']],
        body: [
          ['Total Pengeluaran (Uang Keluar)', `${currencySymbol} ${totalExpensePeriod.toLocaleString('id-ID')}`, 'Uang yang telah digunakan'],
          ['Total Pemasukan (Uang Masuk)', `${currencySymbol} ${totalIncomePeriod.toLocaleString('id-ID')}`, 'Pemasukan & setor simpanan'],
          ['Arus Kas Bersih (Net Cashflow)', `${currencySymbol} ${(totalIncomePeriod - totalExpensePeriod).toLocaleString('id-ID')}`, totalIncomePeriod >= totalExpensePeriod ? 'Surplus (Sehat)' : 'Defisit (Perhatikan batas)'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }, // sky-500
        styles: { fontSize: 9.5 },
      });

      // @ts-expect-error - jspdf-autotable mutates lastAutoTable
      currentY = doc.lastAutoTable.finalY + 12;

      // Seksi 3: Rincian Penggunaan Uang per Kategori
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Rincian Alokasi Penggunaan Uang Berdasarkan Kategori', 14, currentY);
      currentY += 6;

      const categoryTableRows = categoryBreakdown.length > 0 
        ? categoryBreakdown.map((c, idx) => [
            String(idx + 1),
            c.category,
            `${c.count} Transaksi`,
            `${currencySymbol} ${c.amount.toLocaleString('id-ID')}`,
            `${c.percentage}%`,
          ])
        : [['-', 'Belum ada data pengeluaran', '-', `${currencySymbol} 0`, '0%']];

      autoTable(doc, {
        startY: currentY,
        head: [['No', 'Kategori Kebutuhan', 'Frekuensi', 'Jumlah Nominal', 'Porsi Pengeluaran']],
        body: categoryTableRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // indigo-600
        styles: { fontSize: 9 },
        foot: [['', 'Total Pengeluaran Teranalisis', `${filteredTransactions.length} Transaksi`, `${currencySymbol} ${totalExpensePeriod.toLocaleString('id-ID')}`, '100%']],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
      });

      // @ts-expect-error - jspdf-autotable mutates lastAutoTable
      currentY = doc.lastAutoTable.finalY + 12;

      // Catatan & Evaluasi Keuangan
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `* Laporan ini dianalisis otomatis dari ${filteredTransactions.length} transaksi yang tersimpan di sistem ASCEND. Gunakan evaluasi ini untuk menjaga rasio tabungan ideal minimal 20% dari total pendapatan harian.`,
        14,
        currentY,
        { maxWidth: pageWidth - 28 }
      );

      // Simpan File PDF
      const filenamePeriod = selectedPeriod === 'weekly' ? 'Mingguan' : selectedPeriod === 'monthly' ? 'Bulanan' : 'Keseluruhan';
      doc.save(`Ringkasan-Finansial-ASCEND-${filenamePeriod}-${Date.now()}.pdf`);

      setActionFeedback('Dokumen PDF berhasil diunduh!');
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      setActionFeedback('Gagal membuat dokumen PDF.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  return (
    <div className="w-full space-y-6 transition-all duration-300 relative pt-2">
      {/* HEADER RINGKASAN: Judul, Periode Filter & Tombol Aksi */}
      <div className={`relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
            isLight
              ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-xs'
              : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
          }`}>
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Ringkasan Finansial
              </h3>
            </div>
            <p className={`text-xs mt-0.5 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              Evaluasi proporsi saldo kas, tabungan, dan alokasi penggunaan anggaran
            </p>
          </div>
        </div>

        {/* Pilihan Periode Filter & Toolbar Aksi */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tab Periode */}
          <div className={`flex items-center p-1 rounded-2xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <button
              type="button"
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'weekly'
                  ? isLight
                    ? 'bg-[#003B2F] text-white shadow-xs font-black'
                    : 'bg-teal-500 text-white shadow-md font-black'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'monthly'
                  ? isLight
                    ? 'bg-[#003B2F] text-white shadow-xs font-black'
                    : 'bg-teal-500 text-white shadow-md font-black'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'all'
                  ? isLight
                    ? 'bg-[#003B2F] text-white shadow-xs font-black'
                    : 'bg-teal-500 text-white shadow-md font-black'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Keseluruhan
            </button>
          </div>

          {/* Tombol Aksi Dokumen */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSaveSummary}
              title="Simpan Hasil Ringkasan Finansial"
              className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <BookmarkCheck className="w-4 h-4 text-teal-500" />
              <span className="hidden sm:inline">Simpan Ringkasan</span>
            </button>

            <button
              type="button"
              onClick={handleShareSummary}
              title="Bagikan Ringkasan"
              className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Share2 className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              title="Unduh Laporan Ringkasan PDF"
              className={`p-2 rounded-xl ${
                isLight ? 'bg-[#003B2F] hover:bg-[#002e24]' : 'bg-teal-600 hover:bg-teal-500'
              } text-white flex items-center gap-1 text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer hover:scale-105 active:scale-95`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>

            {onOpenCloseMonthModal && (
              <button
                type="button"
                onClick={onOpenCloseMonthModal}
                title="Tutup & Arsipkan Bulan Ini ke Supabase"
                className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                }`}
              >
                <Archive className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Arsipkan Bulan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NOTIFIKASI TOAST FEEDBACK */}
      {actionFeedback && (
        <div className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold animate-in fade-in slide-in-from-top-2 ${
          isLight 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
        }`}>
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* SEKSI 1: STATUS KONDISI SALDO SAAT INI (Total, Kas & Tabungan + Persentase) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
            isLight ? 'text-slate-950' : 'text-slate-300'
          }`}>
            <Wallet className={`w-3.5 h-3.5 ${isLight ? 'text-teal-700' : 'text-teal-400'}`} />
            Kondisi Saldo Saat Ini
          </h4>
          {lastSavedTimestamp && (
            <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Tersimpan: {lastSavedTimestamp}
            </span>
          )}
        </div>

        {/* 3 Kartu Saldo Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card Total Saldo */}
          <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${
            isLight 
              ? 'bg-slate-50/70 border-slate-200 shadow-xs' 
              : 'bg-[#131D31] border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Total Saldo Keseluruhan
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
              }`}>
                100%
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight mt-1 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {formatCurrency(combinedTotalBalance, currencySymbol)}
            </div>
          </div>

          {/* Card Saldo Kas */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-slate-50/70 border-slate-200 shadow-xs' : 'bg-[#131D31] border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Jumlah Saldo Kas
              </span>
              <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
                isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
              }`}>
                {kasPercentage}%
              </span>
            </div>
            <div className={`text-lg sm:text-xl font-black font-mono tracking-tight mt-1 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {formatCurrency(kasAmount, currencySymbol)}
            </div>
          </div>

          {/* Card Saldo Tabungan */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-slate-50/70 border-slate-200 shadow-xs' : 'bg-[#131D31] border-slate-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Jumlah Tabungan
              </span>
              <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
                isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {tabunganPercentage}%
              </span>
            </div>
            <div className={`text-lg sm:text-xl font-black font-mono tracking-tight mt-1 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {formatCurrency(tabunganAmount, currencySymbol)}
            </div>
          </div>
        </div>

        {/* Visual Bar Proporsi Kas vs Tabungan */}
        <div className={`p-3 rounded-2xl border space-y-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'
        }`}>
          <div className="flex justify-between items-center text-xs font-bold">
            <span className={`flex items-center gap-1 ${isLight ? 'text-sky-950 font-black' : 'text-sky-400 font-bold'}`}>
              Kas ({kasPercentage}%)
            </span>
            <span className={`flex items-center gap-1 ${isLight ? 'text-emerald-950 font-black' : 'text-emerald-400 font-bold'}`}>
              Tabungan ({tabunganPercentage}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${kasPercentage}%` }} 
              className="h-full bg-sky-500 transition-all duration-500" 
              title={`Kas: ${kasPercentage}%`}
            />
            <div 
              style={{ width: `${tabunganPercentage}%` }} 
              className="h-full bg-emerald-500 transition-all duration-500" 
              title={`Tabungan: ${tabunganPercentage}%`}
            />
          </div>
        </div>
      </div>

      {/* SEKSI 2: ANALISIS PENGGUNAAN UANG BERDASARKAN KATEGORI & GRAFIK VISUAL */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-slate-950' : 'text-slate-300'
            }`}>
              <Receipt className="w-3.5 h-3.5 text-rose-500" />
              Rincian Penggunaan Uang Berdasarkan Kebutuhan
            </h4>
            <p className={`text-xs mt-0.5 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              Total Uang Keluar Periode Ini: <strong className={`font-mono font-black ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{formatCurrency(totalExpensePeriod, currencySymbol)}</strong>
            </p>
          </div>

          {/* Toggle Jenis Diagram: Lingkaran (Donut) vs Batang (Bar) */}
          <div className={`flex items-center p-0.5 rounded-xl border self-start sm:self-auto ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <button
              type="button"
              onClick={() => setActiveChartType('donut')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all cursor-pointer ${
                activeChartType === 'donut'
                  ? isLight ? 'bg-white text-slate-950 shadow-xs font-black' : 'bg-teal-500 text-white shadow-xs font-black'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilkan Diagram Lingkaran"
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Lingkaran</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartType('bar')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all cursor-pointer ${
                activeChartType === 'bar'
                  ? isLight ? 'bg-white text-slate-950 shadow-xs font-black' : 'bg-teal-500 text-white shadow-xs font-black'
                  : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilkan Diagram Batang"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Batang</span>
            </button>
          </div>
        </div>

        {/* KONTEN GRAFIK & RINCIAN KATEGORI */}
        {categoryBreakdown.length === 0 ? (
          <div className={`p-8 rounded-2xl border text-center space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-[#111827] border border-[#263449]'
          }`}>
            <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              Belum ada transaksi pengeluaran pada periode {periodLabel.toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Sisi Kiri: Diagram Lingkaran / Donut Visual (5 Cols on LG) */}
            <div className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col items-center justify-center relative ${
              isLight ? 'bg-slate-50/70 border-slate-200 shadow-xs' : 'bg-[#111827] border border-[#263449]'
            }`}>
              {activeChartType === 'donut' ? (
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center my-2">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Lingkaran Dasar Background */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="currentColor"
                      strokeWidth="11"
                      className={isLight ? 'text-slate-200 fill-none' : 'text-white/10 fill-none'}
                    />
                    {/* Segmen-segmen Donut Berwarna */}
                    {chartSlices.map((slice, i) => (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={slice.color.hex}
                        strokeWidth={hoveredCategory === slice.category ? '13' : '11'}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        strokeLinecap="butt"
                        fill="none"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(slice.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    ))}
                  </svg>

                  {/* Teks Tengah Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                    <span className={`text-[10px] uppercase font-black ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      {hoveredCategory || 'Pengeluaran'}
                    </span>
                    <span className={`text-base sm:text-lg font-black font-mono leading-tight ${
                      isLight ? 'text-slate-950' : 'text-white'
                    }`}>
                      {hoveredCategory
                        ? formatCurrency(
                            categoryBreakdown.find((c) => c.category === hoveredCategory)?.amount || 0,
                            currencySymbol
                          )
                        : formatCurrency(totalExpensePeriod, currencySymbol)}
                    </span>
                    <span className={`text-[11px] font-black mt-0.5 ${isLight ? 'text-teal-900' : 'text-teal-400'}`}>
                      {hoveredCategory
                        ? `${categoryBreakdown.find((c) => c.category === hoveredCategory)?.percentage}%`
                        : `${categoryBreakdown.length} Kategori`}
                    </span>
                  </div>
                </div>
              ) : (
                /* Mode Batang Alternatif di Kolom Kiri */
                <div className="w-full space-y-3 py-2">
                  <span className={`text-xs font-black uppercase tracking-wider block text-center mb-1 ${
                    isLight ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    Diagram Batang Proporsi Kategori
                  </span>
                  {categoryBreakdown.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-bold truncate max-w-[60%] ${isLight ? 'text-slate-950' : 'text-white'}`}>{item.category}</span>
                        <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{item.percentage}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${item.percentage}%` }}
                          className={`h-full ${item.color.bar} transition-all duration-500`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className={`text-[11px] text-center mt-2 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Arahkan kursor atau sentuh untuk melihat rincian per kategori
              </p>
            </div>

            {/* Sisi Kanan: Daftar Rincian Kategori (Nominal + Persentase Lengkap) (7 Cols on LG) */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {categoryBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredCategory(item.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      hoveredCategory === item.category
                        ? isLight
                          ? 'bg-slate-100 border-teal-400 shadow-sm'
                          : 'bg-white/10 border-teal-400 shadow-lg'
                        : isLight
                        ? 'bg-white border-slate-200/90 hover:border-slate-300'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Titik Warna Kategori */}
                        <div
                          style={{ backgroundColor: item.color.hex }}
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        />
                        <div className="truncate">
                          <span className={`text-xs sm:text-sm font-black truncate block ${isLight ? 'text-slate-950' : 'text-white'}`}>
                            {item.category}
                          </span>
                          <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            {item.count} transaksi dicatat
                          </span>
                        </div>
                      </div>

                      {/* Nominal & Persentase */}
                      <div className="text-right shrink-0">
                        <div className={`text-xs sm:text-sm font-black font-mono ${isLight ? 'text-slate-950' : 'text-white'}`}>
                          {formatCurrency(item.amount, currencySymbol)}
                        </div>
                        <span
                          style={{ color: item.color.hex }}
                          className="text-xs font-black font-mono inline-block"
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Kategori */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-2.5 overflow-hidden">
                      <div
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color.hex,
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER INFORMASI TAMBAHAN EVALUASI */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-white/[0.02] border-white/10 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <span>
            Pemasukan periode ini: <strong className={`font-mono font-black ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>+{formatCurrency(totalIncomePeriod, currencySymbol)}</strong> ({totalTransactionCount} transaksi)
          </span>
        </div>
        <div className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
          Status Alokasi: <span className={`font-black ${isLight ? 'text-teal-900' : 'text-teal-400'}`}>{tabunganPercentage >= 20 ? 'Sehat (Simpanan >= 20%)' : 'Perlu Tambah Simpanan'}</span>
        </div>
      </div>
    </div>
  );
};
