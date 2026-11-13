import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  CheckCircle2, 
  Check, 
  UserCheck
} from 'lucide-react';
import { getSecurityAuditReport } from '../utils/security';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupabaseConfigured: boolean;
  userEmail?: string | null;
  userName?: string | null;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  isSupabaseConfigured,
  userEmail,
  userName,
}) => {
  if (!isOpen) return null;

  const report = getSecurityAuditReport(isSupabaseConfigured, true, userEmail);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#101726] border border-white/15 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/30 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 shadow-lg shadow-teal-500/10">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Pusat Keamanan Akun</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {report.securityScore}/100 Aman
                </span>
              </div>
              <p className="text-xs text-white/60">
                Proteksi data &amp; privasi akun
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-sky-500/15 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status: Akun Terlindungi &amp; Terenkripsi</span>
            </div>
            <p className="text-[11px] text-white/75 leading-relaxed">
              Data pribadi, jurnal, agenda, dan catatan finansial Anda terisolasi aman dan terenkripsi.
            </p>
          </div>

          {/* Audit Checks Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Pemeriksaan Keamanan Aktif
            </h4>
            <div className="space-y-2">
              {report.checks.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex items-start gap-3"
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-teal-300 shrink-0 border border-white/10">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5 leading-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Akun yang Sedang Masuk */}
          {userEmail && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-white/80">
                <UserCheck className="w-4 h-4 text-teal-400" />
                <div>
                  <p className="font-semibold text-white">{userName || 'Pengguna Terverifikasi'}</p>
                  <p className="text-[11px] text-white/50">{userEmail}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Sesi Aktif
              </span>
            </div>
          )}

          {/* Tips Keamanan Tambahan */}
          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-1.5 text-[11px]">
            <p className="font-semibold text-sky-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Tips Tambahan Menjaga Akun:</span>
            </p>
            <ul className="list-disc pl-4 space-y-1 text-white/70">
              <li>Jangan pernah membagikan kata sandi atau kode token kepada siapa pun.</li>
              <li>Jika menggunakan laptop atau HP bersama, selalu klik <strong>Keluar (Log Out)</strong> setelah selesai.</li>
              <li>Gunakan kata sandi dengan kombinasi huruf besar, kecil, angka, dan simbol.</li>
            </ul>
          </div>

          {/* Tombol Tutup */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-teal-500/20"
          >
            Tutup Audit Keamanan
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
