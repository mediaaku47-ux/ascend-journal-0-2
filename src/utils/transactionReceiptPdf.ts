import { jsPDF } from 'jspdf';

export interface TransactionReceiptData {
  id: string; // Internal id (tidak ditampilkan di bukti PDF sesuai permintaan)
  userName: string;
  category: 'Tabungan' | 'Kas';
  type: string;
  title: string;
  amount: number;
  currencySymbol: string;
  dateTime: string;
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
}

/**
 * Format mata uang untuk struk PDF bank resmi
 */
function formatReceiptMoney(amount: number, currency: string = 'Rp'): string {
  const formatted = Math.abs(amount).toLocaleString('id-ID');
  return `${currency} ${formatted}`;
}

/**
 * Generate dan unduh Bukti Transaksi Bank Resmi ASCEND dalam format PDF
 * - Desain formal, rapi, bersih ala struk / e-receipt perbankan resmi
 * - Tanpa Nomor ID / ID Transaksi sama sekali
 * - Menonjolkan informasi penting: nama, jenis transaksi, kategori, tanggal & waktu,
 *   saldo sebelum & setelah transaksi, serta total nominal transaksi.
 */
export function generateTransactionReceiptPDF(data: TransactionReceiptData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // 148 mm x 210 mm
  });

  const currency = data.currencySymbol || 'Rp';
  const isDeposit =
    data.type.toLowerCase().includes('isi') ||
    data.type.toLowerCase().includes('pemasukan') ||
    data.type.toLowerCase().includes('tambah') ||
    data.type.toLowerCase().includes('deposit');

  const pageWidth = 148;
  const leftX = 16;
  const rightX = pageWidth - 16; // 132 mm
  const centerX = pageWidth / 2; // 74 mm

  let currentY = 18;

  // 1. HEADER RESMI STRUK BANK ASCEND
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900 formal
  doc.text('ASCEND', centerX, currentY, { align: 'center' });

  currentY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('BUKTI TRANSAKSI ELEKTRONIK', centerX, currentY, { align: 'center' });

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('SISTEM PENGELOLAAN KEUANGAN & SALDO', centerX, currentY, { align: 'center' });

  // Garis Pemisah Ganda (Formal Bank Header Divider)
  currentY += 5;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.6);
  doc.line(leftX, currentY, rightX, currentY);

  currentY += 1.2;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.line(leftX, currentY, rightX, currentY);

  // 2. STATUS TRANSAKSI
  currentY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text('STATUS: TRANSAKSI BERHASIL', centerX, currentY, { align: 'center' });

  currentY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(leftX, currentY, rightX, currentY);

  // 3. NOMINAL TRANSAKSI MENONJOL (HIGHLIGHT BOX)
  currentY += 5;
  doc.setFillColor(248, 250, 252); // slate-50 bersih
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftX, currentY, rightX - leftX, 21, 2, 2, 'FD');

  const boxCenterY = currentY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('JUMLAH TRANSAKSI', centerX, boxCenterY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  if (isDeposit) {
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`+ ${formatReceiptMoney(data.amount, currency)}`, centerX, boxCenterY + 7, { align: 'center' });
  } else {
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`- ${formatReceiptMoney(data.amount, currency)}`, centerX, boxCenterY + 7, { align: 'center' });
  }

  currentY += 25;

  // 4. DETAIL TRANSAKSI TERSUSUN JELAS (TABEL DUA KOLOM STRUK BANK)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('RINCIAN TRANSAKSI', leftX, currentY);

  currentY += 3;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(leftX, currentY, rightX, currentY);

  // Baris-baris rincian data formal
  const details: Array<{ label: string; value: string; isBoldValue?: boolean; highlightColor?: number[] }> = [
    { label: 'Tanggal & Waktu', value: data.dateTime },
    { label: 'Nama Pengguna', value: data.userName || 'Pengguna ASCEND', isBoldValue: true },
    { label: 'Kategori Akun', value: data.category === 'Tabungan' ? 'Tabungan Simpanan' : 'Kas Utama' },
    { label: 'Jenis Transaksi', value: data.type, isBoldValue: true },
    { label: 'Keterangan / Judul', value: data.title || '-' },
    { label: 'Saldo Awal (Sebelum)', value: formatReceiptMoney(data.balanceBefore, currency) },
    { 
      label: 'Nominal Mutasi', 
      value: `${isDeposit ? '+' : '-'} ${formatReceiptMoney(data.amount, currency)}`,
      isBoldValue: true,
      highlightColor: isDeposit ? [5, 150, 105] : [225, 29, 72]
    },
    { 
      label: 'Saldo Akhir (Setelah)', 
      value: formatReceiptMoney(data.balanceAfter, currency), 
      isBoldValue: true,
      highlightColor: [15, 23, 42]
    },
  ];

  currentY += 3;
  const rowHeight = 6.2;
  const labelX = leftX + 2;
  const valueX = rightX - 2;

  details.forEach((row, idx) => {
    const rowY = currentY + (idx * rowHeight);

    // Garis pemisah tipis antar baris
    if (idx > 0) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(leftX, rowY - 1.8, rightX, rowY - 1.8);
    }

    // Label di kiri
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(row.label, labelX, rowY);

    // Titik dua sejajar
    doc.text(':', leftX + 48, rowY);

    // Nilai di kanan
    doc.setFont('helvetica', row.isBoldValue ? 'bold' : 'normal');
    doc.setFontSize(8);
    if (row.highlightColor) {
      doc.setTextColor(row.highlightColor[0], row.highlightColor[1], row.highlightColor[2]);
    } else {
      doc.setTextColor(30, 41, 59); // slate-800
    }
    doc.text(row.value, valueX, rowY, { align: 'right' });
  });

  currentY += (details.length * rowHeight) + 2;

  // Garis Pemisah Penutup
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(leftX, currentY, rightX, currentY);

  // 5. BAGIAN PENUTUP SEDERHANA & FORMAL
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Catatan Resmi:', leftX, currentY);

  currentY += 4;
  doc.text('• Bukti transaksi ini merupakan dokumen sah yang diterbitkan secara elektronik oleh sistem ASCEND.', leftX, currentY);
  currentY += 3.8;
  doc.text('• Saldo akun telah disesuaikan secara otomatis dan tercatat pada buku kas pribadi Anda.', leftX, currentY);

  currentY += 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(leftX, currentY, rightX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Terima kasih telah menggunakan ASCEND.', centerX, currentY, { align: 'center' });

  // Nama file rapi tanpa ID transaksi
  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filename = `Bukti_Transaksi_${data.category}_${dateStamp}.pdf`;
  doc.save(filename);
}
