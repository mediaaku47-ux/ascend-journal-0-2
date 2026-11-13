import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task, Habit, Transaction, QuickNote, UserProfile } from '../types';
import { getRealToday, getDaysInMonth, formatTransactionDisplayDate } from './dateUtils';

interface PDFExportOptions {
  userProfile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  quickNotes: QuickNote[];
  totalBalance: number;
}

/**
 * Generate an official Monthly Productivity Report jsPDF document
 */
export const generateMonthlyReportPDFDoc = ({
  userProfile,
  tasks,
  habits,
  transactions,
  quickNotes,
  totalBalance,
}: PDFExportOptions): { doc: jsPDF; fileName: string } => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const realToday = getRealToday();
  const currentMonthName = userProfile.monthName || realToday.monthName;
  const currentYear = userProfile.year || realToday.year;
  const monthIdx = userProfile.monthIndex ?? realToday.monthIndex;
  const totalDays = userProfile.totalDaysInMonth || getDaysInMonth(currentYear, monthIdx);
  const currency = userProfile.currencySymbol || 'Rp';

  // Format currency
  const formatMoney = (amount: number) => {
    return `${currency} ${amount.toLocaleString('id-ID')}`;
  };

  // Compute Task stats
  let totalDoneTasks = 0;
  let totalAssignedSlots = 0;
  tasks.forEach((t) => {
    Object.entries(t.days).forEach(([_, val]) => {
      if (val === 'done') totalDoneTasks++;
      if (val === 'done' || val === 'missed') totalAssignedSlots++;
    });
  });

  const consistencyRate = totalAssignedSlots > 0
    ? Math.round((totalDoneTasks / totalAssignedSlots) * 100)
    : (totalDoneTasks > 0 ? 90 : 0);

  // Compute Habit stats
  let totalHabitDone = 0;
  let totalHabitTarget = 0;
  habits.forEach((h) => {
    totalHabitDone += h.completedDays;
    totalHabitTarget += h.totalDays;
  });
  const habitRate = totalHabitTarget > 0 ? Math.round((totalHabitDone / totalHabitTarget) * 100) : 0;

  // Compute Financial totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  const primaryColor = [234, 88, 12]; // Orange-600 #ea580c
  const darkColor = [24, 24, 32];     // Dark slate #181820
  const grayLight = [245, 245, 247];  // Light slate #f5f5f7
  const textMuted = [100, 116, 139];  // Slate 500

  // 1. Top Decorative Header Banner
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 38, 'F');

  // Accent Orange Line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 38, 210, 2.5, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('JournalStream', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(253, 186, 116); // light orange
  doc.text('SISTEM JURNAL PRODUKTIVITAS & EVALUASI DIRI', 14, 23);

  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFontSize(8);
  doc.text(`Dicetak pada: ${realToday.fullFormattedDate}`, 14, 30);

  // Document Title on Top Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('LAPORAN RESMI BULANAN', 196, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(253, 186, 116);
  doc.text(`PERIODE: ${currentMonthName.toUpperCase()}`, 196, 23, { align: 'right' });

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.text(`Pengguna: ${userProfile.name}`, 196, 30, { align: 'right' });

  // 2. Executive Summary Metrics Cards
  const cardY = 46;
  const cardHeight = 22;
  const cardWidth = 43;
  const gap = 5;
  const startX = 14;

  const metrics = [
    { label: 'Tingkat Konsistensi', val: `${consistencyRate}%`, sub: `${totalDoneTasks} Tugas Tuntas` },
    { label: 'Momentum Produktif', val: `${userProfile.streakDays || 0} Hari`, sub: 'Rantai Hari Aktif' },
    { label: 'Agenda Konsisten', val: `${habitRate}%`, sub: `${totalHabitDone}/${totalHabitTarget} Hari` },
    { label: 'Saldo / Tabungan', val: formatMoney(totalBalance), sub: `Arus Bersih: ${formatMoney(netSavings)}` },
  ];

  metrics.forEach((m, idx) => {
    const x = startX + idx * (cardWidth + gap);
    // Background card
    doc.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'F');

    // Top border accent
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(x, cardY, cardWidth, 1.2, 'F');

    // Label
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(m.label.toUpperCase(), x + 3, cardY + 5.5);

    // Value
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(m.val, x + 3, cardY + 12.5);

    // Subtitle
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(m.sub, x + 3, cardY + 18);
  });

  let currentY = cardY + cardHeight + 8;

  // 3. Section: Agenda & Tugas Bulanan Table
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Evaluasi Agenda & Rutinitas Bulanan', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Daftar seluruh agenda yang dipantau sepanjang bulan ${currentMonthName}:`, 14, currentY + 4.5);

  const taskRows = tasks.map((task, i) => {
    let doneDaysCount = 0;
    let missedDaysCount = 0;
    Object.entries(task.days).forEach(([_, st]) => {
      if (st === 'done') doneDaysCount++;
      if (st === 'missed') missedDaysCount++;
    });

    const activeTotal = doneDaysCount + missedDaysCount;
    const taskRate = activeTotal > 0 ? `${Math.round((doneDaysCount / activeTotal) * 100)}%` : '-';
    const statusText = doneDaysCount > 0 
      ? (doneDaysCount >= Math.min(15, totalDays) ? 'Sangat Baik' : 'Progres') 
      : 'Belum Mulai';

    return [
      (i + 1).toString(),
      task.title + (task.flagged ? ' ⭐ (Prioritas)' : ''),
      task.category || 'Umum',
      `${doneDaysCount} hari`,
      `${missedDaysCount} hari`,
      taskRate,
      statusText,
    ];
  });

  if (taskRows.length === 0) {
    taskRows.push(['-', 'Belum ada data agenda yang dimasukkan', '-', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY + 7,
    head: [['No', 'Nama Agenda / Tugas', 'Kategori', 'Selesai', 'Terlewat', 'Tingkat', 'Status']],
    body: taskRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Get Y position after Task Table
  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Section: Pelacakan Kebiasaan (Habits)
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Agenda Sangat Konsisten & Pelacakan Kebiasaan', 14, currentY);

  const habitRows = habits.map((h, i) => {
    const rate = h.totalDays > 0 ? Math.round((h.completedDays / h.totalDays) * 100) : 0;
    const evalText = rate >= 80 ? 'Target Tercapai 🏆' : rate >= 50 ? 'Sedang Berjalan' : 'Perlu Ditingkatkan';
    return [
      (i + 1).toString(),
      h.title,
      `${h.completedDays} / ${h.totalDays} hari`,
      `${rate}%`,
      evalText,
    ];
  });

  if (habitRows.length === 0) {
    habitRows.push(['-', 'Belum ada pelacak kebiasaan yang dimasukkan', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY + 5,
    head: [['No', 'Nama Kebiasaan / Habit', 'Pencapaian', 'Persentase', 'Evaluasi']],
    body: habitRows,
    theme: 'striped',
    headStyles: {
      fillColor: [16, 185, 129], // Emerald 500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 33, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need to add a page or continue
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Section: Ringkasan Rekonsiliasi Finansial
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. Rekapitulasi Finansial Bulanan', 14, currentY);

  const txRows = transactions.slice(0, 15).map((t, i) => [
    (i + 1).toString(),
    formatTransactionDisplayDate(t),
    t.title,
    t.category || 'Umum',
    t.type === 'income' ? 'Pemasukan' : 
    t.type === 'savings_deposit' ? 'Isi Tabungan' : 
    (t.type === 'savings_withdrawal' || t.type === 'withdrawal') ? 'Tarik Tunai' : 'Pengeluaran',
    `${(t.type === 'income' || t.type === 'savings_deposit') ? '+' : '-'} ${formatMoney(t.amount)}`,
  ]);

  if (txRows.length === 0) {
    txRows.push(['-', '-', 'Belum ada data transaksi keuangan tercatat', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY + 5,
    head: [['No', 'Tanggal', 'Keterangan Transaksi', 'Kategori', 'Tipe', 'Jumlah']],
    body: txRows,
    theme: 'striped',
    headStyles: {
      fillColor: [217, 119, 6], // Amber 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 70 },
      3: { cellWidth: 30 },
      4: { cellWidth: 23, halign: 'center' },
      5: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // 6. Section: Catatan Prioritas & Evaluasi
  if (quickNotes.length > 0) {
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. Catatan Prioritas & Evaluasi Reflektif', 14, currentY);

    const noteRows = quickNotes.map((n, i) => [
      (i + 1).toString(),
      n.text,
      n.tags?.join(', ') || '-',
      n.createdAt || '-',
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['No', 'Catatan / Refleksi', 'Tag / Kategori', 'Waktu']],
      body: noteRows,
      theme: 'striped',
      headStyles: {
        fillColor: [99, 102, 241], // Indigo 500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 110 },
        2: { cellWidth: 35 },
        3: { cellWidth: 28, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Check if signature section fits
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  // 7. Verification & Sign-off Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 32, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('LEMBAR PENGESAHAN & KOMITMEN PRIBADI', 20, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Laporan ini menjadi bukti evaluasi produktivitas berkala yang disahkan secara mandiri.', 20, currentY + 13);
  doc.text(`Status: Terverifikasi oleh sistem JournalStream pada ${realToday.fullFormattedDate}`, 20, currentY + 18);

  // Signature line on right
  doc.setDrawColor(148, 163, 184);
  doc.line(135, currentY + 24, 185, currentY + 24);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`( ${userProfile.name} )`, 160, currentY + 28, { align: 'center' });

  // 8. Add Footer & Page Numbers to All Pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 287, 196, 287);

    doc.text('JournalStream • Dokumen Resmi Produktivitas & Manajemen Waktu', 14, 292);
    doc.text(`Halaman ${i} dari ${totalPages}`, 196, 292, { align: 'right' });
  }

  // Return doc and sanitized filename
  const cleanMonthName = currentMonthName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Produktivitas_${cleanMonthName}_${userProfile.name.replace(/\s+/g, '_')}.pdf`;
  return { doc, fileName };
};

/**
 * Generate and trigger direct download of the PDF in browser
 */
export const exportMonthlyReportPDF = (options: PDFExportOptions): void => {
  const { doc, fileName } = generateMonthlyReportPDFDoc(options);
  doc.save(fileName);
};

/**
 * Generate PDF as binary Blob for upload to Supabase Storage / storage
 */
export const generateMonthlyReportPDFBlob = (options: PDFExportOptions): { blob: Blob; fileName: string; fileSize: number } => {
  const { doc, fileName } = generateMonthlyReportPDFDoc(options);
  const blob = doc.output('blob');
  return { blob, fileName, fileSize: blob.size };
};
