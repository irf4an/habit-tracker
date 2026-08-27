import React, { useState } from 'react';
import { Habit } from '../types';
import { calculateBadges } from '../achievements';
import { FluentOutlineIcon } from './FluentOutlineIcon';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  isDarkMode?: boolean;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  habits,
  isDarkMode = true,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { badges, unlockedCount, totalCount, level, levelTitle, totalXp } = calculateBadges(habits);

  const filteredBadges = badges.filter((b) => {
    if (activeFilter === 'unlocked') return b.unlocked;
    if (activeFilter === 'locked') return !b.unlocked;
    return true;
  });

  const LEVELS_XP = [0, 150, 400, 750, 1200, 1800, 2500, 3500, 5000, 7500, Infinity];
  const nextLevelXp = LEVELS_XP[level] ?? LEVELS_XP[LEVELS_XP.length - 1];
  const curLevelXp = LEVELS_XP[level - 1] ?? 0;
  const span = Math.max(1, nextLevelXp - curLevelXp);
  const levelProgress = Math.min(100, Math.round(((totalXp - curLevelXp) / span) * 100));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md modal-overlay" role="dialog" aria-modal="true" aria-label="Pencapaian dan lencana" onClick={onClose}>
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl modal-card relative max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'}`}
        style={{
          boxShadow: isDarkMode ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)` : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Header with Fluent Trophy & Dismiss */}
        <div className={`flex items-center justify-between border-b pb-4 mb-5 ${isDarkMode ? 'border-[#20202e]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FluentOutlineIcon name="trophy" size={24} color="#f59e0b" />
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Koleksi Lencana Kamu ✨
              </h2>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Tiap centang kecil adalah kemenangan. Yuk lihat udah sejauh apa kamu! 🎉
              </p>
            </div>
          </div>

          <button type="button" aria-label="Tutup pencapaian" onClick={onClose} className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1e1e2c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
            <FluentOutlineIcon name="dismiss" size={20} />
          </button>
        </div>
        <div className={`p-4 rounded-2xl border mb-6 relative overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-r from-indigo-950/40 via-[#181826] to-[#12121c] border-[#8338ec]/35'
            : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-zinc-50 border-indigo-200'
        }`}>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#8338ec] flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-[#8338ec]/40">
                Lv.{level}
              </div>
              <div>
                <div className="text-xs font-mono text-[#8338ec] font-semibold tracking-wide">
                  KAMU SEKARANG
                </div>
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{levelTitle}</h3>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{totalXp} XP</span>
              <span className={`text-xs block ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                {unlockedCount} / {totalCount} Badges
              </span>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden border ${isDarkMode ? 'bg-[#0d0d14] border-[#242436]' : 'bg-zinc-200 border-zinc-300'}`}>
            <div
              className="bg-[#8338ec] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(131,56,236,0.5)]"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: `Semua (${badges.length})` },
              { id: 'unlocked', label: `Kebuka 🎉 (${unlockedCount})` },
              { id: 'locked', label: `Dikunci 🔒 (${totalCount - unlockedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1 rounded-xl text-xs transition-all cursor-pointer border ${
                  activeFilter === f.id
                    ? 'bg-[#8338ec] text-white border-[#8338ec] font-semibold shadow-md shadow-[#8338ec]/25'
                    : isDarkMode
                    ? 'bg-[#161622] border-[#252536] text-zinc-400 hover:text-zinc-200'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredBadges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                badge.unlocked
                  ? isDarkMode
                    ? 'bg-[#151522] border-[#8338ec]/40 shadow-lg shadow-indigo-950/20'
                    : 'bg-purple-50/50 border-purple-200 shadow-sm'
                  : isDarkMode
                  ? 'bg-[#0e0e14] border-[#1f1f2c] opacity-60'
                  : 'bg-zinc-100 border-zinc-200 opacity-60'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  badge.unlocked
                    ? 'bg-[#8338ec]/20 border border-[#8338ec]/40 shadow-inner'
                    : isDarkMode
                    ? 'bg-[#181824] border border-[#242434] grayscale'
                    : 'bg-zinc-200 border border-zinc-300 grayscale'
                }`}
              >
                {badge.unlocked ? (
                  badge.icon
                ) : (
                  <FluentOutlineIcon name="lock_closed" size={20} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className={`font-bold text-xs truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{badge.title}</h4>
                  {badge.unlocked && (
                    <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                      UNLOCKED
                    </span>
                  )}
                </div>

                <p className={`text-[11px] leading-snug mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {badge.description}
                </p>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1a1a28]' : 'bg-zinc-200'}`}>
                    <div
                      className={`h-full rounded-full ${
                        badge.unlocked ? 'bg-[#8338ec]' : 'bg-zinc-400'
                      }`}
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {badge.currentValue}/{badge.targetValue}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
