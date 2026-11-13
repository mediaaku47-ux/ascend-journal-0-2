import React, { useState } from 'react';
import { Transaction } from '../types';
import { ArrowDown, ArrowUp, Plus, Wallet, Calendar, X, ArrowDownLeft } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { toISODateString, MONTH_NAMES_SHORT_ID } from '../utils/dateUtils';
import { triggerConfetti } from '../utils/confetti';
import { WalletIllustration } from './WalletIllustration';

interface FinancialSummaryCardProps {
  totalBalance: number;
  incomeToday: number;
  expenseToday: number;
  withdrawalToday?: number;
  currencySymbol?: string;
  transactions?: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onUpdateBalance?: (newBalance: number) => void;
  theme?: 'dark' | 'light';
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  totalBalance,
  incomeToday,
  expenseToday,
  withdrawalToday = 0,
  currencySymbol = 'Rp',
  transactions = [],
  onAddTransaction,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [showQuickTxModal, setShowQuickTxModal] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense' | 'withdrawal'>('income');
  const [txTitle, setTxTitle] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState<string>(toISODateString(new Date()));

  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(txAmount);
    if (!txTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    let defaultCat = txCategory.trim();
    if (!defaultCat) {
      if (txType === 'income') defaultCat = 'Pemasukan';
      else if (txType === 'expense') defaultCat = 'Pengeluaran';
      else defaultCat = 'Penarikan Tunai';
    }

    const isToday = txDate === toISODateString(new Date());
    const selectedD = new Date(txDate);
    const day = selectedD.getDate();
    const month = MONTH_NAMES_SHORT_ID[selectedD.getMonth()];
    const formattedDate = !isNaN(day) && month ? `${day} ${month}` : 'Hari ini';

    let timestamp = Date.now();
    if (!isToday) {
      const d = new Date(`${txDate}T12:00:00`);
      timestamp = !isNaN(d.getTime()) ? d.getTime() : Date.now();
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: txTitle.trim(),
      amount: parsedAmount,
      type: txType,
      category: defaultCat,
      date: formattedDate,
      timestamp,
    };

    onAddTransaction(newTx);
    setTxTitle('');
    setTxCategory('');
    setTxAmount('');
    setTxDate(toISODateString(new Date()));
    setShowQuickTxModal(false);

    if (txType === 'income') {
      triggerConfetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#006c49', '#6cf8bb', '#2170e4']
      });
    }
  };

  return (
    <div 
      id="ringkasan-finansial-card"
      className={`${
        isLight
          ? 'bg-white border-slate-200/90 text-slate-900 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06)] hover:shadow-lg'
          : 'bg-[#0F172A] border-slate-800 text-white shadow-xl hover:border-slate-700/80'
      } border rounded-[20px] sm:rounded-[22px] p-4 sm:p-5 md:p-6 relative group transition-all duration-300 w-full max-w-full box-border`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 relative z-10 pb-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'} gap-2 sm:gap-3 w-full min-w-0`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
            isLight ? 'bg-teal-50 border-teal-200/80 text-teal-800' : 'bg-[#131D31] border-slate-700/70 text-teal-400'
          }`}>
            <Wallet className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h3 className={`font-bold text-xs uppercase tracking-wider min-w-0 truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            Ringkasan Finansial
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowQuickTxModal(true)}
          className={`text-xs px-3 sm:px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 whitespace-nowrap shadow-xs ${
            isLight
              ? 'bg-[#003B2F] hover:bg-[#002e24] text-white border-[#003B2F]'
              : 'text-teal-300 hover:text-white bg-[#131D31] hover:bg-[#1A2640] border-slate-700/80'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* Total Balance Display and Visual Element */}
      <div className="mb-5 relative z-10 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <span className={`text-xs block mb-1 font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Saldo Terkini</span>
          <div className={`text-2xl xs:text-3xl sm:text-4xl font-black tracking-tight break-words font-mono ${isLight ? 'text-slate-950' : 'text-white'}`}>
            {formatCurrency(totalBalance, currencySymbol)}
          </div>
        </div>
        <div className="shrink-0 hidden xs:flex items-center justify-end">
          <WalletIllustration 
            theme={theme}
            className="w-[95px] sm:w-[130px] md:w-[150px] max-h-[70px] sm:max-h-[90px]"
          />
        </div>
      </div>

      {/* Income & Expense Two-Column Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 relative z-10">
        {/* Income Card */}
        <div 
          onClick={() => {
            setTxType('income');
            setTxTitle('');
            setTxCategory('');
            setShowQuickTxModal(true);
          }}
          className={`${
            isLight
              ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200/90 text-slate-900 shadow-2xs'
              : 'bg-[#131D31] hover:bg-[#18253D] border-slate-700/60 hover:border-emerald-500/40 text-white'
          } rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border transition-all cursor-pointer group/income flex flex-col justify-between relative overflow-hidden`}
          title="Klik untuk catat pemasukan baru"
        >
          <div className={`flex items-center space-x-1.5 mb-1.5 relative z-10 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
            <ArrowDown className="w-3.5 h-3.5 stroke-[3] shrink-0" />
            <span className="text-[11px] font-bold tracking-wider uppercase">Pemasukan Hari Ini</span>
          </div>
          <div className={`text-base md:text-lg font-black font-mono break-words relative z-10 ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
            +{formatCurrency(incomeToday, currencySymbol)}
          </div>
        </div>

        {/* Expense Card */}
        <div 
          onClick={() => {
            setTxType('expense');
            setTxTitle('');
            setTxCategory('');
            setShowQuickTxModal(true);
          }}
          className={`${
            isLight
              ? 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200/90 text-slate-900 shadow-2xs'
              : 'bg-[#131D31] hover:bg-[#18253D] border-slate-700/60 hover:border-rose-500/40 text-white'
          } rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border transition-all cursor-pointer group/expense flex flex-col justify-between relative overflow-hidden`}
          title="Klik untuk catat pengeluaran baru"
        >
          <div className={`flex items-center space-x-1.5 mb-1.5 relative z-10 ${isLight ? 'text-rose-800' : 'text-rose-400'}`}>
            <ArrowUp className="w-3.5 h-3.5 stroke-[3] shrink-0" />
            <span className="text-[11px] font-bold tracking-wider uppercase">Pengeluaran Hari Ini</span>
          </div>
          <div className={`text-base md:text-lg font-black font-mono break-words relative z-10 ${isLight ? 'text-rose-950' : 'text-rose-300'}`}>
            -{formatCurrency(expenseToday, currencySymbol)}
          </div>
        </div>
      </div>

      {/* Quick Add Transaction Modal with Anti-Overlap & Mobile-Safe Spacing */}
      {showQuickTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className={`${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              : 'bg-[#121218]/95 border-white/15 text-white shadow-2xl backdrop-blur-3xl'
          } rounded-3xl w-full max-w-lg p-5 sm:p-6 border relative my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150`}>
            {/* Modal Header with Close Button */}
            <div className={`flex justify-between items-center pb-3 mb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'} shrink-0`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  txType === 'income' 
                    ? (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                    : txType === 'expense' 
                    ? (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/30')
                    : (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30')
                }`}>
                  {txType === 'income' ? <ArrowDown className="w-4 h-4 stroke-[2.5]" /> : txType === 'expense' ? <ArrowUp className="w-4 h-4 stroke-[2.5]" /> : <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                </div>
                <div className="min-w-0">
                  <h4 className={`text-base sm:text-lg font-bold tracking-tight truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    Catat Transaksi Finansial
                  </h4>
                  <p className={`text-[11px] truncate ${isLight ? 'text-slate-600 font-medium' : 'text-white/50'}`}>
                    {txType === 'income' ? 'Pemasukan kas operasional' : txType === 'expense' ? 'Pengeluaran kas operasional' : 'Penarikan dana tunai'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickTxModal(false)}
                className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Tutup form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitTx} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Type toggle: 3 clear options with non-wrapping labels */}
              <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxTitle('');
                    setTxCategory('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    txType === 'income'
                      ? (isLight ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 shadow-xs')
                      : (isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/50 hover:text-white')
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                  <span className="truncate">Pemasukan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxTitle('');
                    setTxCategory('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    txType === 'expense'
                      ? (isLight ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-500/30 border border-rose-500/50 text-rose-200 shadow-xs')
                      : (isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/50 hover:text-white')
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                  <span className="truncate">Pengeluaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('withdrawal');
                    setTxTitle('');
                    setTxCategory('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    txType === 'withdrawal'
                      ? (isLight ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-500/30 border border-amber-500/50 text-amber-200 shadow-xs')
                      : (isLight ? 'text-slate-600 hover:text-slate-950' : 'text-white/50 hover:text-white')
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                  <span className="truncate">Penarikan</span>
                </button>
              </div>

              {/* Title & Category Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                    Keterangan Transaksi
                  </label>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Wajib diisi</span>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={
                    txType === 'income'
                      ? 'cth: Gaji bulanan, Freelance project'
                      : txType === 'expense'
                      ? 'cth: Makan siang, Kopi, Belanja dapur'
                      : 'cth: Tarik tunai ATM, Belanja kebutuhan'
                  }
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className={`w-full text-sm p-3 rounded-xl outline-hidden transition-all font-semibold ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white'
                      : 'bg-white/5 border border-white/15 text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10'
                  }`}
                />
              </div>

              {/* Date input with Anti-Overlap Presets */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold flex items-center justify-between ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>Tanggal Transaksi</span>
                  </span>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Tgl & Waktu</span>
                </label>

                {/* Date Input Full-Width */}
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className={`w-full text-xs sm:text-sm p-2.5 rounded-xl outline-hidden transition-all font-mono font-bold ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-950 focus:border-teal-500'
                      : 'bg-white/5 border border-white/15 text-white focus:border-teal-400 focus:bg-white/10 [color-scheme:dark]'
                  }`}
                />

                {/* Date Quick Preset Buttons (Non-squeezed row) */}
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setTxDate(toISODateString(new Date()))}
                    className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      txDate === toISODateString(new Date())
                        ? (isLight ? 'bg-teal-100 border-teal-400 text-teal-900' : 'bg-teal-500/20 border-teal-500/50 text-teal-300')
                        : (isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-white/60 hover:text-white')
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      setTxDate(toISODateString(y));
                    }}
                    className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      (() => {
                        const y = new Date();
                        y.setDate(y.getDate() - 1);
                        return txDate === toISODateString(y);
                      })()
                        ? (isLight ? 'bg-sky-100 border-sky-400 text-sky-900' : 'bg-sky-500/20 border-sky-500/50 text-sky-300')
                        : (isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-white/60 hover:text-white')
                    }`}
                  >
                    Kemarin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 2);
                      setTxDate(toISODateString(y));
                    }}
                    className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      (() => {
                        const y = new Date();
                        y.setDate(y.getDate() - 2);
                        return txDate === toISODateString(y);
                      })()
                        ? (isLight ? 'bg-purple-100 border-purple-400 text-purple-900' : 'bg-purple-500/20 border-purple-500/50 text-purple-300')
                        : (isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-white/60 hover:text-white')
                    }`}
                  >
                    2 Hari Lalu
                  </button>
                </div>
              </div>

              {/* Amount input & Quick Nominal Chips */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white/70'}`}>
                  Jumlah Nominal
                </label>
                <div className="relative">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black font-mono ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="0"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className={`w-full text-base font-black font-mono pl-11 pr-4 py-3 rounded-xl outline-hidden transition-all ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-950 placeholder-slate-400 focus:border-teal-500 focus:bg-white'
                        : 'bg-white/5 border border-white/15 text-white placeholder-white/30 focus:border-teal-400 focus:bg-white/10'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-2.5 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'} shrink-0`}>
                <button
                  type="button"
                  onClick={() => setShowQuickTxModal(false)}
                  className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700'
                      : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 px-5 text-xs font-black text-white ${
                    isLight ? 'bg-[#003B2F] hover:bg-[#002e24]' : 'bg-teal-600 hover:bg-teal-500'
                  } active:scale-95 rounded-xl shadow-md transition-all cursor-pointer text-center`}
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
