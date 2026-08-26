import React, { useState } from 'react';
import { Habit } from '../types';
import { calculateBadges } from '../achievements';
import { Trophy, Award, Lock, Sparkles, X, Flame, Zap } from 'lucide-react';

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

  const nextLevelXp = level === 1 ? 200 : level === 2 ? 500 : level === 3 ? 1000 : 2000;
  const levelProgress = Math.min(100, Math.round((totalXp / nextLevelXp) * 100));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in" role="dialog" aria-modal="true" aria-label="Pencapaian dan lencana" onClick={onClose}>
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#12121a] border-[#8338ec]/35 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'}`}
        style={{
          boxShadow: isDarkMode ? `0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(131,56,236,0.18)` : `0 20px 50px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Header with Close */}
        <div className={`flex items-center justify-between border-b pb-4 mb-5 ${isDarkMode ? 'border-[#20202e]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Achievements & Badges
              </h2>
              <p className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Unlock milestone badges as you build your consistency.
              </p>
            </div>
          </div>

          <button type="button" aria-label="Tutup pencapaian" onClick={onClose} className={`p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1e1e2c]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
            <X className="w-5 h-5" aria-hidden />
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
                  CURRENT RANK
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
              { id: 'all', label: `All (${badges.length})` },
              { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
              { id: 'locked', label: `Locked (${totalCount - unlockedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
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
                {badge.unlocked ? badge.icon : <Lock className={`w-4 h-4 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />}
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
