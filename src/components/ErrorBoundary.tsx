import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.removeItem('journalstream_active_user');
      localStorage.removeItem('journalstream_session');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b12] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-lg shadow-rose-500/10">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Terjadi Kendala Memuat Layar</h2>
          <p className="text-xs text-white/60 max-w-sm mb-6 leading-relaxed">
            Aplikasi mengalami kendala teknis sementara. Anda dapat memuat ulang halaman untuk melanjutkan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Aplikasi</span>
            </button>
            <button
              type="button"
              onClick={this.handleClearAndReload}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs border border-white/10 cursor-pointer transition-all"
            >
              <span>Bersihkan Cache &amp; Buka Kembali</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
