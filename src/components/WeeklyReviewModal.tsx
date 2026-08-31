import React, { useMemo } from 'react';
import { Habit } from '../types';
import { getWeeklyReviewData } from '../utils';
import { MaterialIcon } from './MaterialIcon';
import confetti from 'canvas-confetti';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  isDarkMode?: boolean;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  habits,
  isDarkMode = true,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  const report = useMemo(() => getWeeklyReviewData(habits), [habits]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Rekap Pekan Lalu"
      onClick={onClose}
    >
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl modal-card relative max-h-[90vh] flex flex-col overflow-hidden ${
          isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)`
            : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 mb-5 shrink-0 ${isDarkMode ? 'border-[#20202e]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8338ec]/20 border border-[#8338ec]/30 flex items-center justify-center text-[#a78bfa]">
              <MaterialIcon name="bar_chart" size={24} color="#8338ec" />
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Rekap Pekan Lalu
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {report.lastWeekStartStr}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup rekap"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${
              isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1e1e2c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pr-0.5">
          {/* Main Score Hero Card */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border relative overflow-hidden ${
              isDarkMode
                ? 'bg-gradient-to-br from-[#181828] to-[#12121d] border-[#8338ec]/40'
                : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8338ec] block mb-2.5">
              Konsistensi Pekan Lalu
            </span>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {report.score}%
              </span>
              {report.trendDiff !== null && (
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                    report.trendDiff >= 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                  }`}
                >
                  <span>{report.trendDiff >= 0 ? '↑' : '↓'}</span>
                  <span>{Math.abs(report.trendDiff)}% dibanding pekan sebelumnya</span>
                </span>
              )}
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed mt-2.5 max-w-[46ch] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {report.score >= 80
                ? 'Pekan lalu berjalan sangat konsisten. Pertahankan ritmenya minggu ini.'
                : report.score >= 50
                ? 'Capaian cukup baik. Fokus jaga 1–2 kebiasaan utama agar tetap stabil.'
                : 'Awal baru pekan ini. Mulai dari target yang paling ringan terlebih dahulu.'}
            </p>
          </div>

          {/* 2 Focus Cards: Best Habit vs Needs Attention */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
            {/* Best Habit */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
                isDarkMode ? 'bg-[#151522] border-[#222234]' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 mb-2.5">
                  <span>⭐ Paling konsisten</span>
                </span>
                {report.bestHabit ? (
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none shrink-0">{report.bestHabit.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-extrabold text-base tracking-tight leading-snug truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                        {report.bestHabit.name}
                      </h4>
                      <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Selesai <span className="font-semibold text-emerald-600">{report.bestHabit.rate}%</span> dari jadwal
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Belum ada data pekan lalu.</p>
                )}
              </div>
            </div>

            {/* Needs Attention */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
                isDarkMode ? 'bg-[#151522] border-[#222234]' : 'bg-zinc-50 border-zinc-200'
              }`}
            >
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 mb-2.5">
                  <span>🎯 Butuh perhatian</span>
                </span>
                {report.needsAttentionHabit ? (
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none shrink-0">{report.needsAttentionHabit.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-extrabold text-base tracking-tight leading-snug truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                        {report.needsAttentionHabit.name}
                      </h4>
                      <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Tercapai <span className="font-semibold text-amber-600">{report.needsAttentionHabit.rate}%</span> (coba kurangi target)
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Semua kebiasaan tuntas 100% pekan lalu.</p>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown per Habit */}
          <div>
            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider mb-2.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Rincian Performa Pekan Lalu
            </h4>
            <div className="space-y-2">
              {report.habitBreakdown.map((h) => (
                <div
                  key={h.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#0f0f16] border-[#1e1e28]' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none">{h.emoji}</span>
                    <span className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {h.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {h.completedDays}/{h.scheduledDays} hari
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                      h.rate >= 80
                        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                        : h.rate >= 50
                        ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                        : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                    }`}>
                      {h.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`pt-4 mt-4 border-t flex items-center justify-end gap-2 shrink-0 ${isDarkMode ? 'border-[#20202e]' : 'border-zinc-200'}`}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-full text-xs font-bold transition-all shadow-sm"
          >
            Tutup Rekap
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReviewModal;
