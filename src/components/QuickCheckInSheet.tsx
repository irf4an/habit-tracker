import React from 'react';
import { Habit } from '../types';
import { getTodayString } from '../utils';
import { MaterialIcon } from './MaterialIcon';
import confetti from 'canvas-confetti';
import { playCheckSound, playUncheckSound } from '../sound';

interface QuickCheckInSheetProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  isDarkMode?: boolean;
  onToggleDate: (habitId: string, dateStr: string, value?: number) => void;
}

export const QuickCheckInSheet: React.FC<QuickCheckInSheetProps> = ({
  isOpen,
  onClose,
  habits,
  isDarkMode = true,
  onToggleDate,
}) => {
  const todayStr = getTodayString();

  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const remainingHabits = habits.filter((h) => {
    const val = h.history[todayStr] || 0;
    const target = h.targetValue || 1;
    const isDone = h.type === 'numeric' ? val >= target : val === 1;
    return !isDone;
  });

  const completedCount = habits.length - remainingHabits.length;

  const handleToggle = (habit: Habit) => {
    const cur = habit.history[todayStr] || 0;
    const target = habit.targetValue || 1;
    const isDone = habit.type === 'numeric' ? cur >= target : cur === 1;
    const next = isDone ? 0 : target;

    if (next > 0) {
      playCheckSound();
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.85 },
        colors: [habit.color, '#ffffff', '#a78bfa'],
        disableForReducedMotion: true,
      });
    } else {
      playUncheckSound();
    }

    onToggleDate(habit.id, todayStr, next);

    // If this was the last one, celebrate and auto-close shortly
    if (remainingHabits.length === 1 && next > 0) {
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        onClose();
      }, 600);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Check-in cepat hari ini"
      onClick={onClose}
    >
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-md max-h-[82vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl border-t sm:border shadow-2xl modal-card flex flex-col overflow-hidden ${
          isDarkMode
            ? 'bg-[#12121a] border-[#8338ec]/35 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
        style={{
          boxShadow: isDarkMode
            ? `0 -10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(131,56,236,0.15)`
            : `0 -10px 40px rgba(0,0,0,0.12)`,
        }}
      >
        {/* Drag Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-[#2a2a3a]' : 'bg-zinc-300'}`} />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${isDarkMode ? 'border-[#222230]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8338ec] flex items-center justify-center text-white shadow-md">
              <MaterialIcon name="check" size={20} color="#ffffff" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Selesaikan Hari Ini</h3>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {completedCount}/{habits.length} selesai • {remainingHabits.length} tersisa
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup check-in"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a28]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-3">
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1a1a28]' : 'bg-zinc-200'}`}>
            <div
              className="h-full bg-[#8338ec] rounded-full transition-all duration-500"
              style={{ width: `${habits.length ? (completedCount / habits.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2">
          {habits.length === 0 ? (
            <p className={`text-center py-8 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Belum ada kebiasaan aktif.</p>
          ) : remainingHabits.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🎉</div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Semua selesai hari ini!</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Keren banget — istirahat dengan tenang malam ini.</p>
            </div>
          ) : (
            remainingHabits.map((habit) => {
              const target = habit.targetValue || 1;
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => handleToggle(habit)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#0f0f15] border-[#1e1e28] hover:border-[#8338ec]/40 hover:bg-[#15151d]'
                      : 'bg-zinc-50 border-zinc-200 hover:border-[#8338ec]/30 hover:bg-white'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-dashed transition-all"
                    style={{ borderColor: habit.color, backgroundColor: `${habit.color}12` }}
                  >
                    <span className="text-lg leading-none">{habit.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{habit.name}</div>
                    <div className={`text-xs flex items-center gap-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <span className="inline-flex items-center gap-1">
                        {habit.timeOfDay && habit.timeOfDay !== 'anytime' && (
                          <span className="text-[11px]">
                            {habit.timeOfDay === 'morning' ? '🌅' : habit.timeOfDay === 'afternoon' ? '☀️' : '🌙'}
                          </span>
                        )}
                        {habit.category}
                      </span>
                      {habit.type === 'numeric' && (
                        <span className="text-[11px] font-mono">• {target} {habit.unit || 'unit'}</span>
                      )}
                    </div>
                  </div>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-md"
                    style={{ backgroundColor: habit.color }}
                  >
                    <MaterialIcon name="check" size={18} color="#ffffff" />
                  </div>
                </button>
              );
            })
          )}

          {/* Completed section (collapsible subtle) */}
          {completedCount > 0 && remainingHabits.length > 0 && (
            <div className={`pt-2 mt-1 border-t ${isDarkMode ? 'border-[#1e1e28]' : 'border-zinc-200'}`}>
              <p className={`text-[11px] font-mono mb-2 px-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Sudah selesai ({completedCount})</p>
              {habits
                .filter((h) => {
                  const v = h.history[todayStr] || 0;
                  const t = h.targetValue || 1;
                  return h.type === 'numeric' ? v >= t : v === 1;
                })
                .map((h) => (
                  <div
                    key={h.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs opacity-60 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
                  >
                    <MaterialIcon name="check" size={14} color="#22c55e" />
                    <span className="truncate">{h.emoji} {h.name}</span>
                    <span className="ml-auto text-[11px] font-mono text-emerald-500">Selesai</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${isDarkMode ? 'border-[#1e1e28] bg-[#0f0f15]' : 'border-zinc-200 bg-zinc-50'}`}>
          <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Tap kartu untuk centang cepat</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-full text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickCheckInSheet;
