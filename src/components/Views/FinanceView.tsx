import React, { useState } from 'react';
import { Transaction, UserProfile, TransactionType } from '../../types';
import { FinancialSummaryCard } from '../FinancialSummaryCard';
import { WalletIllustration } from '../WalletIllustration';
import {
  Wallet,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  Calendar,
  Search,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
  Download,
  Camera,
} from 'lucide-react';
import { ReceiptScannerModal } from '../ReceiptScannerModal';
import { formatCurrency } from '../../utils/formatters';
import {
  formatTransactionDisplayDate,
  toISODateString,
  MONTH_NAMES_SHORT_ID,
} from '../../utils/dateUtils';
import { triggerConfetti } from '../../utils/confetti';
import { generateTransactionReceiptPDF } from '../../utils/transactionReceiptPdf';

interface FinanceViewProps {
  transactions: Transaction[];
  totalBalance: number;
  savingsBalance?: number;
  incomeToday: number;
  expenseToday: number;
  withdrawalToday?: number;
  userProfile: UserProfile;
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenNewEntry: () => void;
  onUpdateSavingsBalance?: (newSavings: number) => void;
  onUpdateTotalBalance?: (newBal: number) => void;
  onNavigateToDashboard?: () => void;
  theme?: 'dark' | 'light';
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  totalBalance,
  savingsBalance = 0,
  incomeToday,
  expenseToday,
  withdrawalToday = 0,
  userProfile,
  onAddTransaction,
  onDeleteTransaction,
  onOpenNewEntry,
  onUpdateSavingsBalance,
  onUpdateTotalBalance,
  onNavigateToDashboard,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  // Sub-navigasi tab di halaman keuangan
  const [activeSubTab, setActiveSubTab] = useState<'savings' | 'cashflow' | 'all'>('savings');

  // Filter & pencarian untuk tabel semua transaksi

  const [allTxFilter, setAllTxFilter] = useState<'all' | 'income' | 'expense' | 'savings_deposit' | 'savings_withdrawal'>('all');
  const [allTxSearch, setAllTxSearch] = useState('');

  // State Modal Transaksi Tabungan (Isi / Tarik)
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [savingsModalMode, setSavingsModalMode] = useState<'deposit' | 'withdrawal'>('deposit');
  const [savingsTitle, setSavingsTitle] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsDate, setSavingsDate] = useState<string>(toISODateString(new Date()));
  const [affectsCash, setAffectsCash] = useState<boolean>(true);

  // State Modal Kalibrasi Saldo Tabungan
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState(false);
  const [calibratedSavingsInput, setCalibratedSavingsInput] = useState('');

  // State Modal Pindai Struk Belanja dengan AI
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);

  // State Modal Pindah Tabungan ke Saldo Belanja (Kas Terkini)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('Pindah Tabungan ke Saldo Belanja');

  // Handler Pindah Tabungan ke Saldo Belanja
  const handleTransferSavingsToCash = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > (savingsBalance ?? 0)) {
      alert('Nominal melebihi saldo tabungan yang tersedia.');
      return;
    }

    const todayIso = toISODateString(new Date());
    const selectedD = new Date(todayIso);
    const day = selectedD.getDate();
    const month = MONTH_NAMES_SHORT_ID[selectedD.getMonth()];
    const formattedDate = `${day} ${month}`;

    const newTx: Transaction = {
      id: `tx-transfer-${Date.now()}`,
      title: transferNote.trim() || 'Pindah Tabungan ke Saldo Belanja',
      amount: amount,
      type: 'savings_withdrawal',
      category: 'Pindah ke Kas Belanja',
      date: formattedDate,
      timestamp: Date.now(),
      affectsCash: true,
    };

    onAddTransaction(newTx);
    setIsTransferModalOpen(false);
    setTransferAmount('');

    triggerConfetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#059669', '#10b981', '#34d399'],
    });
  };

  // Unduh Bukti Transaksi Resmi PDF
  const handleDownloadReceipt = (tx: Transaction) => {
    const isTabungan = tx.type === 'savings_deposit' || tx.type === 'savings_withdrawal';
    let typeLabel = 'Transaksi Kas';
    if (tx.type === 'income') typeLabel = 'Pemasukan Kas';
    else if (tx.type === 'expense') typeLabel = 'Pengeluaran Kas';
    else if (tx.type === 'savings_deposit') typeLabel = 'Isi Saldo Tabungan';
    else if (tx.type === 'savings_withdrawal') typeLabel = 'Tarik Saldo Tabungan';
    else if (tx.type === 'withdrawal') typeLabel = 'Penarikan Kas';

    generateTransactionReceiptPDF({
      id: tx.id || `TX-${Date.now()}`,
      userName: userProfile.name || 'Pengguna ASCEND',
      category: isTabungan ? 'Tabungan' : 'Kas',
      type: typeLabel,
      title: tx.title || (isTabungan ? 'Tabungan Simpanan' : 'Kas Utama'),
      amount: tx.amount,
      currencySymbol: userProfile.currencySymbol || 'Rp',
      dateTime: formatTransactionDisplayDate(tx),
      balanceBefore: 0,
      balanceAfter: isTabungan ? (savingsBalance ?? 0) : totalBalance,
    });
  };

  // Perhitungan khusus Tabungan
  const savingsTransactions = transactions.filter(
    (t) => t.type === 'savings_deposit' || t.type === 'savings_withdrawal' || t.type === 'withdrawal'
  );

  const totalSavingsDeposits = transactions
    .filter((t) => t.type === 'savings_deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavingsWithdrawals = transactions
    .filter((t) => t.type === 'savings_withdrawal' || t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  // Transaksi Arus Kas Utama (Pemasukan & Pengeluaran)
  const cashflowTransactions = transactions.filter(
    (t) => t.type === 'income' || t.type === 'expense'
  );



  // Semua Transaksi
  const filteredAll = transactions
    .filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(allTxSearch.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(allTxSearch.toLowerCase()));
      let matchFilter = true;
      if (allTxFilter === 'all') {
        matchFilter = true;
      } else if (allTxFilter === 'savings_withdrawal') {
        matchFilter = t.type === 'savings_withdrawal' || t.type === 'withdrawal';
      } else {
        matchFilter = t.type === allTxFilter;
      }
      return matchSearch && matchFilter;
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Handle pembukaan modal tabungan
  const handleOpenSavingsModal = (mode: 'deposit' | 'withdrawal') => {
    setSavingsModalMode(mode);
    setSavingsTitle(mode === 'deposit' ? 'Tabungan Bulanan' : 'Keperluan Mendesak');
    setSavingsAmount('');
    setSavingsDate(toISODateString(new Date()));
    setAffectsCash(false);
    setIsSavingsModalOpen(true);
  };

  // Handle submit transaksi tabungan
  const handleSubmitSavingsTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(savingsAmount);
    if (!savingsTitle.trim() || isNaN(amount) || amount <= 0) return;

    const isToday = savingsDate === toISODateString(new Date());
    const selectedD = new Date(savingsDate);
    const day = selectedD.getDate();
    const month = MONTH_NAMES_SHORT_ID[selectedD.getMonth()];
    const formattedDate = !isNaN(day) && month ? `${day} ${month}` : 'Hari ini';

    let timestamp = Date.now();
    if (!isToday) {
      const d = new Date(`${savingsDate}T12:00:00`);
      timestamp = !isNaN(d.getTime()) ? d.getTime() : Date.now();
    }

    const txType: TransactionType = savingsModalMode === 'deposit' ? 'savings_deposit' : 'savings_withdrawal';
    const category = savingsModalMode === 'deposit' ? 'Isi Tabungan' : 'Tarik Tunai';

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: savingsTitle.trim(),
      amount: amount,
      type: txType,
      category: category,
      date: formattedDate,
      timestamp,
      affectsCash: affectsCash,
    };

    onAddTransaction(newTx);
    setIsSavingsModalOpen(false);

    triggerConfetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.6 },
      colors: savingsModalMode === 'deposit' ? ['#059669', '#10b981', '#34d399'] : ['#f59e0b', '#d97706', '#fbbf24'],
    });
  };

  // Handle kalibrasi saldo tabungan awal
  const handleSaveCalibratedSavings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(calibratedSavingsInput);
    if (!isNaN(parsed) && parsed >= 0 && onUpdateSavingsBalance) {
      onUpdateSavingsBalance(parsed);
      setIsCalibrateModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Utama Keuangan & Tabungan */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Keuangan &amp; Tabungan
            </h2>
          </div>
          <p className={`text-sm mt-1 font-medium ${isLight ? 'text-slate-700' : 'text-white/60'}`}>
            Kelola saldo belanja dan tabungan terpisah
          </p>
        </div>

        {/* Quick action: HANYA 1 Tombol Foto Struk AI (Model Tampilan Menyesuaikan) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsReceiptScannerOpen(true)}
            className={`w-full sm:w-auto text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border ${
              isLight
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-500/50 shadow-emerald-900/15'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 border-emerald-400/40 shadow-emerald-500/25'
            }`}
            title="Pindai Struk Belanja dengan Kamera HP atau Dokumen Foto"
          >
            <Camera className="w-4.5 h-4.5 stroke-[2.3]" />
            <span>Foto Struk (AI)</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Switcher (Tabungan vs Kas vs Semua) */}
      <div className={`flex items-center p-1 sm:p-1.5 border rounded-2xl gap-1 sm:gap-1.5 w-full min-w-0 overflow-x-auto no-scrollbar transition-all ${
        isLight ? 'bg-slate-100/95 border-slate-300 shadow-xs' : 'bg-[#111827] border border-[#263449] shadow-md backdrop-blur-xl'
      }`}>
        <button
          onClick={() => setActiveSubTab('savings')}
          className={`flex-1 min-w-0 shrink-0 sm:shrink flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer relative select-none ${
            activeSubTab === 'savings'
              ? (isLight ? 'bg-white text-emerald-950 border border-emerald-400 shadow-sm z-20' : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs z-20')
              : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-white/70 border border-transparent z-10' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent z-10')
          }`}
        >
          <span className="truncate whitespace-nowrap min-w-0 font-bold">
            <span className="sm:hidden">Tabungan</span>
            <span className="hidden sm:inline">Tabungan &amp; Simpanan</span>
          </span>
          <span className={`shrink-0 ml-0.5 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            isLight ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-500/20 text-emerald-300'
          }`}>
            {savingsTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('cashflow')}
          className={`flex-1 min-w-0 shrink-0 sm:shrink flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer relative select-none ${
            activeSubTab === 'cashflow'
              ? (isLight ? 'bg-white text-teal-950 border border-teal-400 shadow-sm z-20' : 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-300 border border-teal-500/40 shadow-xs z-20')
              : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-white/70 border border-transparent z-10' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent z-10')
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span className="truncate whitespace-nowrap min-w-0 font-bold">
            <span className="sm:hidden">Arus Kas</span>
            <span className="hidden sm:inline">Arus Kas Dompet</span>
          </span>
          <span className={`shrink-0 ml-0.5 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            isLight ? 'bg-teal-100 text-teal-900' : 'bg-teal-500/20 text-teal-300'
          }`}>
            {cashflowTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('all')}
          className={`flex-1 min-w-0 shrink-0 sm:shrink flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer relative select-none ${
            activeSubTab === 'all'
              ? (isLight ? 'bg-white text-purple-950 border border-purple-400 shadow-sm z-20' : 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border border-purple-500/40 shadow-xs z-20')
              : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-white/70 border border-transparent z-10' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent z-10')
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="truncate whitespace-nowrap min-w-0 font-bold">
            <span className="sm:hidden">Semua</span>
            <span className="hidden sm:inline">Semua Transaksi</span>
          </span>
          <span className={`shrink-0 ml-0.5 inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            isLight ? 'bg-purple-100 text-purple-900' : 'bg-purple-500/20 text-purple-300'
          }`}>
            {transactions.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAMPILAN FITUR TABUNGAN & SIMPANAN                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'savings' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Card Hero Saldo Tabungan Utama */}
          <div 
            className={`border rounded-[20px] p-5 sm:p-6 relative overflow-hidden group transition-all duration-300 ${
              isLight
                ? 'bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 border-slate-200/90 text-slate-900 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06)] hover:shadow-lg'
                : 'bg-gradient-to-br from-[#0F172A] via-[#111A2E] to-[#0D1524] border-slate-800 text-white shadow-xl hover:border-slate-700/80'
            }`}
          >
            {/* Header Card Tabungan */}
            <div className={`flex justify-between items-center mb-4 relative z-10 pb-3 border-b ${isLight ? 'border-slate-200/70' : 'border-slate-800'} gap-2`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                  isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                }`}>
                  <PiggyBank className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className={`font-black text-xs uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    Dana Tabungan
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onUpdateSavingsBalance && (
                  <button
                    type="button"
                    onClick={() => {
                      setCalibratedSavingsInput(String(savingsBalance));
                      setIsCalibrateModalOpen(true);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isLight 
                        ? 'border-slate-200 text-slate-500 hover:text-emerald-800 hover:bg-slate-100' 
                        : 'border-slate-700 text-slate-400 hover:text-emerald-300 hover:bg-white/10'
                    }`}
                    title="Kalibrasi Saldo Tabungan"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Total Balance Display and Illustration */}
            <div className="mb-5 relative z-10 flex items-center justify-between gap-4">
              <div>
                <span className={`text-xs block mb-1 font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Total Saldo Tabungan
                </span>
                <div className={`text-3xl md:text-4xl font-black tracking-tight break-words font-mono ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                  {formatCurrency(savingsBalance, userProfile.currencySymbol)}
                </div>
              </div>
              <div className="shrink-0 hidden sm:flex items-center justify-end">
                <WalletIllustration 
                  theme={theme}
                  className="w-[110px] sm:w-[135px] md:w-[155px] max-h-[75px] sm:max-h-[95px]"
                />
              </div>
            </div>

            {/* Sub-stats: Total Masuk (Disimpan) & Total Ditarik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 mb-4">
              {/* Total Setoran Card */}
              <div className={`rounded-xl p-3 border flex items-center justify-between ${
                isLight ? 'bg-emerald-50/70 border-emerald-200/80 text-slate-900' : 'bg-[#131D31] border-slate-700/60 text-white'
              }`}>
                <div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                    <ArrowDown className="w-3 h-3 stroke-[3]" />
                    <span>Total Dana Masuk</span>
                  </div>
                  <div className={`text-base font-black font-mono ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    +{formatCurrency(totalSavingsDeposits, userProfile.currencySymbol)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSavingsModal('deposit')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    isLight 
                      ? 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800 shadow-xs' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                  <span>Isi</span>
                </button>
              </div>

              {/* Total Penarikan Card */}
              <div className={`rounded-xl p-3 border flex items-center justify-between ${
                isLight ? 'bg-amber-50/70 border-amber-200/80 text-slate-900' : 'bg-[#131D31] border-slate-700/60 text-white'
              }`}>
                <div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                    <ArrowUp className="w-3 h-3 stroke-[3]" />
                    <span>Total Penarikan</span>
                  </div>
                  <div className={`text-base font-black font-mono ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                    -{formatCurrency(totalSavingsWithdrawals, userProfile.currencySymbol)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSavingsModal('withdrawal')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    isLight 
                      ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-xs' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                  <span>Tarik</span>
                </button>
              </div>
            </div>

            {/* Quick Action Bar: Pindah ke Saldo Belanja */}
            <div className={`pt-3 border-t flex items-center justify-end ${
              isLight ? 'border-slate-200/70' : 'border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setTransferAmount('');
                  setIsTransferModalOpen(true);
                }}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400/50'
                }`}
                title="Pindahkan saldo tabungan ke kas belanja harian"
              >
                <Wallet className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Pindah ke Kas Belanja</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAMPILAN ARUS KAS DOMPET UTAMA                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'cashflow' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Card Ringkasan Finansial Arus Kas */}
          <FinancialSummaryCard
            totalBalance={totalBalance}
            incomeToday={incomeToday}
            expenseToday={expenseToday}
            withdrawalToday={withdrawalToday}
            currencySymbol={userProfile.currencySymbol}
            transactions={transactions}
            onAddTransaction={onAddTransaction}
            theme={theme}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAMPILAN SEMUA TRANSAKSI                                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'all' && (
        <div 
          className={`border rounded-[24px] p-5 md:p-6 space-y-4 relative overflow-hidden transition-all duration-300 ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06)] text-slate-900'
              : 'bg-[#0F172A] border-slate-800 text-white shadow-xl'
          }`}
        >
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b ${
            isLight ? 'border-slate-100' : 'border-slate-800'
          }`}>
            <div>
              <h3 className={`text-base font-black tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                <Layers className={`w-4 h-4 shrink-0 ${isLight ? 'text-purple-700' : 'text-purple-400'}`} />
                <span>Buku Besar Transaksi Lengkap</span>
              </h3>
              <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Mutasi kas dan tabungan</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isLight ? 'text-slate-500' : 'text-white/40'
                }`} />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={allTxSearch}
                  onChange={(e) => setAllTxSearch(e.target.value)}
                  className={`text-xs pl-8 pr-3 py-2 border rounded-xl w-full outline-hidden transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-purple-600'
                      : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-purple-400'
                  }`}
                />
                {allTxSearch && (
                  <button
                    onClick={() => setAllTxSearch('')}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer ${
                      isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className={`flex items-center gap-1.5 p-1 border rounded-xl overflow-x-auto no-scrollbar ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
              }`}>
                <button
                  onClick={() => setAllTxFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${
                    allTxFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : (isLight ? 'text-slate-700 hover:text-slate-950' : 'text-white/60 hover:text-white')
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setAllTxFilter('income')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${
                    allTxFilter === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : (isLight ? 'text-slate-700 hover:text-slate-950' : 'text-white/60 hover:text-white')
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  onClick={() => setAllTxFilter('expense')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${
                    allTxFilter === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : (isLight ? 'text-slate-700 hover:text-slate-950' : 'text-white/60 hover:text-white')
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  onClick={() => setAllTxFilter('savings_deposit')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${
                    allTxFilter === 'savings_deposit'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : (isLight ? 'text-slate-700 hover:text-slate-950' : 'text-white/60 hover:text-white')
                  }`}
                >
                  Isi Tabungan
                </button>
                <button
                  onClick={() => setAllTxFilter('savings_withdrawal')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${
                    allTxFilter === 'savings_withdrawal'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : (isLight ? 'text-slate-700 hover:text-slate-950' : 'text-white/60 hover:text-white')
                  }`}
                >
                  Tarik Tunai
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Card List View (< md): Anti-overlapping & touch friendly */}
          <div className="block md:hidden space-y-2.5">
            {filteredAll.length === 0 ? (
              <div className={`text-center py-10 px-4 rounded-2xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/[0.02] border-white/5 text-white/40'
              }`}>
                <Layers className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs font-semibold">Tidak ada transaksi yang cocok.</p>
              </div>
            ) : (
              filteredAll.map((tx) => {
                const isInc = tx.type === 'income';
                const isSavDep = tx.type === 'savings_deposit';
                const isSavWith = tx.type === 'savings_withdrawal' || tx.type === 'withdrawal';

                return (
                  <div
                    key={tx.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border ${
                          isInc
                            ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                            : isSavDep
                            ? (isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-500/20 text-teal-400 border-teal-500/30')
                            : isSavWith
                            ? (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30')
                            : (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/30')
                        }`}>
                          {isInc ? <ArrowDown className="w-4 h-4" /> : isSavDep ? <ArrowUpRight className="w-4 h-4" /> : isSavWith ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm break-words ${isLight ? 'text-slate-950' : 'text-white'}`}>{tx.title}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`text-[11px] font-mono flex items-center gap-1 font-bold ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                              <Calendar className="w-3 h-3 opacity-60" />
                              {formatTransactionDisplayDate(tx)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                              isInc
                                ? (isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300')
                                : isSavDep
                                ? (isLight ? 'bg-teal-100 border-teal-300 text-teal-900' : 'bg-teal-500/10 border-teal-500/30 text-teal-300')
                                : isSavWith
                                ? (isLight ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300')
                                : (isLight ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-rose-500/10 border-rose-500/30 text-rose-300')
                            }`}>
                              {isSavDep ? 'Isi Tabungan' : isSavWith ? 'Tarik Tunai' : tx.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(tx)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            isLight ? 'text-slate-400 hover:text-teal-600 hover:bg-teal-50' : 'text-white/40 hover:text-teal-400 hover:bg-white/5'
                          }`}
                          title="Unduh Bukti Transaksi (PDF)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus transaksi "${tx.title}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            isLight ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-white/40 hover:text-rose-400 hover:bg-white/5'
                          }`}
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                      <span className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-white/50'}`}>Nominal:</span>
                      <span className={`text-base font-black font-mono tracking-tight ${
                        isInc || isSavDep
                          ? (isLight ? 'text-emerald-800' : 'text-emerald-400')
                          : isSavWith
                          ? (isLight ? 'text-amber-800' : 'text-amber-400')
                          : (isLight ? 'text-rose-800' : 'text-rose-400')
                      }`}>
                        {isInc || isSavDep ? '+' : '-'}{formatCurrency(tx.amount, userProfile.currencySymbol)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-white/50'
                }`}>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3">Tipe / Kategori</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                {filteredAll.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`text-center py-8 font-medium ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                      Tidak ada transaksi yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredAll.map((tx) => {
                    const isInc = tx.type === 'income';
                    const isSavDep = tx.type === 'savings_deposit';
                    const isSavWith = tx.type === 'savings_withdrawal' || tx.type === 'withdrawal';

                    return (
                      <tr key={tx.id} className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.03]'
                      }`}>
                        <td className={`py-3 px-3 font-mono whitespace-nowrap text-[11px] font-bold ${
                          isLight ? 'text-slate-700' : 'text-white/70'
                        }`}>
                          {formatTransactionDisplayDate(tx)}
                        </td>
                        <td className={`py-3 px-3 font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{tx.title}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full border font-bold text-[10px] ${
                              isInc
                                ? (isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300')
                                : isSavDep
                                ? (isLight ? 'bg-teal-100 border-teal-300 text-teal-900' : 'bg-teal-500/10 border-teal-500/30 text-teal-300')
                                : isSavWith
                                ? (isLight ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300')
                                : (isLight ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-rose-500/10 border-rose-500/30 text-rose-300')
                            }`}
                          >
                            {isSavDep ? 'Isi Tabungan' : isSavWith ? 'Tarik Tunai' : tx.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono">
                          <span
                            className={
                              isInc || isSavDep
                                ? (isLight ? 'text-emerald-800' : 'text-emerald-400')
                                : isSavWith
                                ? (isLight ? 'text-amber-800' : 'text-amber-400')
                                : (isLight ? 'text-rose-800' : 'text-rose-400')
                            }
                          >
                            {isInc || isSavDep ? '+' : '-'}
                            {formatCurrency(tx.amount, userProfile.currencySymbol)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(tx)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isLight ? 'text-slate-400 hover:text-teal-600 hover:bg-teal-50' : 'text-white/30 hover:text-teal-400 hover:bg-white/5'
                              }`}
                              title="Unduh Bukti Transaksi (PDF)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus transaksi "${tx.title}"?`)) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isLight ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-white/30 hover:text-rose-400 hover:bg-white/5'
                              }`}
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TRANSAKSI TABUNGAN (ISI / TARIK TUNAI)                               */}
      {/* ========================================================================= */}
      {isSavingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div
            id="modal-transaksi-tabungan"
            className={`rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col p-5 sm:p-6 border relative animate-in fade-in zoom-in-95 duration-150 my-auto ${
              isLight
                ? 'bg-white text-slate-950 border-slate-300 shadow-2xl'
                : 'bg-[#121218]/95 backdrop-blur-3xl border-white/15 text-white'
            }`}
          >
            {/* Header Modal */}
            <div className={`flex justify-between items-center pb-3 sm:pb-4 border-b shrink-0 ${
              isLight ? 'border-slate-200' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                    savingsModalMode === 'deposit'
                      ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                      : (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30')
                  }`}
                >
                  {savingsModalMode === 'deposit' ? <PiggyBank className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className={`text-base sm:text-lg font-black tracking-tight truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {savingsModalMode === 'deposit' ? 'Isi / Tambah Tabungan' : 'Tarik Tunai Tabungan'}
                  </h3>
                  <p className={`text-[11px] sm:text-xs truncate font-medium ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                    {savingsModalMode === 'deposit'
                      ? 'Setor dana ke tabungan simpanan'
                      : 'Cairkan uang tunai dari tabungan simpanan'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSavingsModalOpen(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ml-2 ${
                  isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Indicator inside modal */}
            <div className={`p-1.5 border rounded-2xl my-3 sm:my-4 shrink-0 ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10'
            }`}>
              <button
                type="button"
                className={`w-full py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-center text-white shadow-md ${
                  savingsModalMode === 'deposit'
                    ? 'bg-emerald-600 shadow-emerald-700/20'
                    : 'bg-amber-600 shadow-amber-700/20'
                }`}
              >
                {savingsModalMode === 'deposit' ? (
                  <>
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">+ Isi Tabungan</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">- Tarik Tunai</span>
                  </>
                )}
              </button>
            </div>

            {/* Form with scrollable body */}
            <form onSubmit={handleSubmitSavingsTx} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Keterangan */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  {savingsModalMode === 'deposit' ? 'Tujuan / Keterangan Tabungan' : 'Keperluan Tarik Tunai'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={
                    savingsModalMode === 'deposit'
                      ? 'cth: Tabungan Darurat, Beli Rumah, Investasi'
                      : 'cth: Tarik tunai ATM, Kebutuhan mendesak'
                  }
                  value={savingsTitle}
                  onChange={(e) => setSavingsTitle(e.target.value)}
                  className={`w-full text-sm p-3 border rounded-xl outline-hidden transition-all font-medium ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
                      : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-400 focus:bg-white/10'
                  }`}
                />
              </div>

              {/* Nominal Input */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 flex justify-between items-center ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  <span>Jumlah Nominal ({userProfile.currencySymbol})</span>
                  {savingsModalMode === 'withdrawal' && (
                    <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                      Maksimal: {formatCurrency(savingsBalance, userProfile.currencySymbol)}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  placeholder="0"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  className={`w-full text-base font-black font-mono p-3 border rounded-xl outline-hidden transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
                      : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-400 focus:bg-white/10'
                  }`}
                />

                {/* Warning if withdrawal exceeds savings balance */}
                {savingsModalMode === 'withdrawal' &&
                  parseFloat(savingsAmount) > savingsBalance && (
                    <p className={`text-[11px] mt-1.5 flex items-center gap-1 font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Nominal melebihi saldo tabungan ({formatCurrency(savingsBalance, userProfile.currencySymbol)}). Saldo akan jadi Rp 0.</span>
                    </p>
                  )}
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 flex items-center justify-between ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  <span>Tanggal Transaksi</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSavingsDate(toISODateString(new Date()))}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                        isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      Hari Ini
                    </button>
                  </div>
                </label>
                <div className="relative">
                  <Calendar className={`w-4 h-4 absolute left-3 top-3.5 pointer-events-none ${isLight ? 'text-slate-500' : 'text-white/40'}`} />
                  <input
                    type="date"
                    required
                    value={savingsDate}
                    onChange={(e) => setSavingsDate(e.target.value)}
                    className={`w-full text-sm pl-10 pr-3 py-2.5 border rounded-xl font-medium outline-hidden transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-emerald-600 [color-scheme:light]'
                        : 'bg-white/5 border-white/15 text-white focus:border-emerald-400 [color-scheme:dark]'
                    }`}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSavingsModalOpen(false)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isLight
                      ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'border-white/15 bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    savingsModalMode === 'deposit'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/25'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-700/25'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {savingsModalMode === 'deposit' ? 'Simpan Setoran' : 'Konfirmasi Tarik'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KALIBRASI SALDO TABUNGAN AWAL                                       */}
      {/* ========================================================================= */}
      {isCalibrateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className={`rounded-3xl shadow-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto p-5 sm:p-6 border relative animate-in fade-in zoom-in-95 duration-150 my-auto ${
            isLight
              ? 'bg-white text-slate-950 border-slate-300 shadow-2xl'
              : 'bg-[#121218]/95 backdrop-blur-3xl border-white/15 text-white'
          }`}>
            <div className={`flex justify-between items-center pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <h3 className={`text-base font-black flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                <SlidersHorizontal className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                Kalibrasi Saldo Tabungan
              </h3>
              <button
                onClick={() => setIsCalibrateModalOpen(false)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCalibratedSavings} className="space-y-4 mt-4">
              <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                Atur saldo awal tabungan Anda.
              </p>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Saldo Tabungan ({userProfile.currencySymbol})
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={calibratedSavingsInput}
                  onChange={(e) => setCalibratedSavingsInput(e.target.value)}
                  className={`w-full text-base font-mono font-black p-3 border rounded-xl outline-hidden ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 focus:border-emerald-600'
                      : 'bg-white/5 border-white/15 text-white focus:border-emerald-400'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCalibrateModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                    isLight
                      ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer shadow-md"
                >
                  Simpan Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PINDAH TABUNGAN KE SALDO BELANJA (KAS TERKINI)                     */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className={`rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6 border relative animate-in fade-in zoom-in-95 duration-150 my-auto ${
            isLight
              ? 'bg-white text-slate-950 border-slate-300 shadow-2xl'
              : 'bg-[#121218]/95 backdrop-blur-3xl border-white/15 text-white'
          }`}>
            <div className={`flex justify-between items-start pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                  isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    Pindah ke Saldo Belanja
                  </h3>
                  <p className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                    Cairkan tabungan ke saldo kas belanja aktif
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className={`p-1.5 rounded-xl cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-slate-950 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Saldo Tabungan vs Saldo Kas Saat Ini */}
            <div className="grid grid-cols-2 gap-2 my-4">
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/25'
              }`}>
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  Tabungan Tersedia
                </span>
                <span className={`text-sm font-black font-mono block mt-0.5 ${isLight ? 'text-emerald-950' : 'text-emerald-200'}`}>
                  {formatCurrency(savingsBalance, userProfile.currencySymbol)}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-teal-50/70 border-teal-200' : 'bg-teal-500/10 border-teal-500/25'
              }`}>
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${isLight ? 'text-teal-800' : 'text-teal-400'}`}>
                  Saldo Kas Belanja
                </span>
                <span className={`text-sm font-black font-mono block mt-0.5 ${isLight ? 'text-teal-950' : 'text-teal-200'}`}>
                  {formatCurrency(totalBalance, userProfile.currencySymbol)}
                </span>
              </div>
            </div>

            <form onSubmit={handleTransferSavingsToCash} className="space-y-4">
              {/* Nominal Input */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 flex justify-between items-center ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  <span>Nominal yang Ingin Dipindah</span>
                  <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                    Maks: {formatCurrency(savingsBalance, userProfile.currencySymbol)}
                  </span>
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                    {userProfile.currencySymbol}
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    max={savingsBalance}
                    step="any"
                    placeholder="0"
                    autoFocus
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className={`w-full text-base font-black font-mono pl-12 pr-3 py-3 border rounded-xl outline-hidden transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
                        : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-400 focus:bg-white/10'
                    }`}
                  />
                </div>

                {/* Quick percentage buttons */}
                {savingsBalance > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[0.25, 0.5, 0.75, 1].map((pct) => {
                      const calculated = Math.round(savingsBalance * pct);
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setTransferAmount(String(calculated))}
                          className={`text-[10px] py-1.5 px-1 border rounded-lg font-mono font-bold text-center transition-all cursor-pointer ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          {pct === 1 ? 'Semua (100%)' : `${pct * 100}%`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="cth: Pindah Tabungan untuk Belanja Bulanan"
                  className={`w-full text-sm p-3 border rounded-xl outline-hidden transition-all font-medium ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
                      : 'bg-white/5 border-white/15 text-white placeholder-white/30 focus:border-emerald-400 focus:bg-white/10'
                  }`}
                />
              </div>

              {/* Simulasi Saldo Setelah Transfer */}
              {parseFloat(transferAmount) > 0 && (
                <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={isLight ? 'text-slate-600' : 'text-white/60'}>Sisa Tabungan Nanti:</span>
                    <span className="font-mono font-bold text-emerald-500">
                      {formatCurrency(Math.max(0, savingsBalance - parseFloat(transferAmount)), userProfile.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isLight ? 'text-slate-600' : 'text-white/60'}>Saldo Belanja Baru:</span>
                    <span className="font-mono font-bold text-teal-500 dark:text-teal-400">
                      {formatCurrency(totalBalance + parseFloat(transferAmount), userProfile.currencySymbol)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isLight
                      ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'border-white/15 bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > savingsBalance}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-700/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Pindahkan Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pindai Struk Belanja dengan AI Gemini OCR */}
      <ReceiptScannerModal
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        onSaveTransaction={onAddTransaction}
        currencySymbol={userProfile.currencySymbol}
        theme={theme}
      />
    </div>
  );
};
