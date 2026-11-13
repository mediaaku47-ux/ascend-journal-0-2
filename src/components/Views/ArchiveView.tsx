import React from 'react';
import { Task, Habit, Transaction, QuickNote, UserProfile } from '../../types';
import { Archive } from 'lucide-react';
import { PdfArchiveView } from './PdfArchiveView';

interface ArchiveViewProps {
  userId?: string;
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  notes: QuickNote[];
  userProfile: UserProfile;
  totalBalance?: number;
  onExportData?: () => void;
  onExportPDF?: () => void;
  onOpenResetModal?: () => void;
  onOpenCloseMonthModal?: () => void;
  onShowToast?: (msg: string) => void;
  theme?: 'dark' | 'light';
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  userId,
  tasks,
  habits,
  transactions,
  notes,
  userProfile,
  totalBalance = 0,
  onOpenCloseMonthModal,
  onShowToast,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <div className="space-y-6 pb-28 md:pb-12 animate-in fade-in duration-200">
      {/* HEADER UTAMA ARSIP */}
      <div className={`pb-4 border-b ${
        isLight ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div>
          <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${
            isLight ? 'text-slate-950' : 'text-white'
          }`}>
            <Archive className={`w-6 h-6 ${isLight ? 'text-teal-600' : 'text-sky-400'}`} />
            Arsip &amp; Riwayat Laporan
          </h2>
          <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${
            isLight ? 'text-slate-600' : 'text-white/60'
          }`}>
            Pusat arsip laporan PDF bulanan resmi di cloud.
          </p>
        </div>
      </div>

      {/* KONTEN ARSIP PDF BULANAN SUPABASE STORAGE */}
      <PdfArchiveView
        userId={userId}
        userProfile={userProfile}
        tasks={tasks}
        habits={habits}
        transactions={transactions}
        notes={notes}
        totalBalance={totalBalance}
        onOpenCloseMonthModal={onOpenCloseMonthModal || (() => {})}
        onShowToast={onShowToast}
        theme={theme}
      />
    </div>
  );
};
