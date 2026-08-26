import React, { useMemo, useState } from 'react';
import { Habit } from '../types';
import { getTodayString, getYearDays, calculateStreak } from '../utils';
import { Check, Trash2, Edit3, Flame, Plus, Minus, Share2, Timer, Snowflake } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCheckSound, playUncheckSound } from '../sound';

interface HabitCardProps {
  habit: Habit;
  isFullView: boolean;
  isDarkMode?: boolean;
  onToggleDate: (habitId: string, dateStr: string, value?: number) => void;
  onToggleFreeze?: (habitId: string, dateStr: string) => void;
  onSaveNote?: (habitId: string, dateStr: string, note: string) => void;
  onDeleteHabit?: (habitId: string) => void;
  onEditHabit?: (habit: Habit) => void;
  onShareHabit?: (habit: Habit) => void;
  onStartPomodoro?: (habit: Habit) => void;
  index: number;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isFullView,
  isDarkMode = true,
  onToggleDate,
  onToggleFreeze,
  onSaveNote,
  onDeleteHabit,
  onEditHabit,
  onShareHabit,
  onStartPomodoro,
  index,
}) => {
  const todayStr = getTodayString();
  const isNumeric = habit.type === 'numeric';
  const targetVal = habit.targetValue || 1;
  const currentTodayVal = habit.history[todayStr] || 0;
  const isTodayCompleted = isNumeric ? currentTodayVal >= targetVal : currentTodayVal === 1;
  const isTodayFrozen = (habit.frozenDates || []).includes(todayStr);

  // Streak stats (aware of freeze)
  const streakStats = useMemo(
    () => calculateStreak(habit.history, habit.frozenDates || []),
    [habit.history, habit.frozenDates]
  );

  // Selected cell for note/detail modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [cellVal, setCellVal] = useState<number>(0);

  // Exact 310-320px width on mobile (19 weeks)
  const numWeeks = isFullView ? 52 : 19;
  const { weeks, monthLabels } = useMemo(() => getYearDays(numWeeks), [numWeeks]);

  const handleCheckToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNumeric) {
      const next = currentTodayVal >= targetVal ? 0 : targetVal;
      onToggleDate(habit.id, todayStr, next);
      if (next >= targetVal) {
        playCheckSound();
        triggerConfetti();
      } else {
        playUncheckSound();
      }
    } else {
      const next = isTodayCompleted ? 0 : 1;
      onToggleDate(habit.id, todayStr, next);
      if (next === 1) {
        playCheckSound();
        triggerConfetti();
      } else {
        playUncheckSound();
      }
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: [habit.color, '#ffffff', '#a78bfa'],
      disableForReducedMotion: true,
    });
  };

  const handleCellClick = (dateStr: string, e: React.MouseEvent) => {
    if (e.shiftKey || isNumeric) {
      setSelectedDate(dateStr);
      setNoteText(habit.notes?.[dateStr] || '');
      setCellVal(habit.history[dateStr] || 0);
    } else {
      const current = habit.history[dateStr] || 0;
      onToggleDate(habit.id, dateStr, current === 1 ? 0 : 1);
    }
  };

  const saveCellDetails = () => {
    if (!selectedDate) return;
    onToggleDate(habit.id, selectedDate, cellVal);
    if (onSaveNote) {
      onSaveNote(habit.id, selectedDate, noteText);
    }
    setSelectedDate(null);
  };

  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const getFrequencyLabel = () => {
    if (!habit.frequency || habit.frequency === 'everyday') return null;
    if (habit.frequency === 'weekdays') return 'Hari Kerja';
    if (habit.frequency === 'weekends') return 'Akhir Pekan';
    if (habit.frequency === 'weekly_target') return `${habit.weeklyTargetDays || 4}x/mgg`;
    return null;
  };

  const freqLabel = getFrequencyLabel();

  return (
    <div
      className={`transition-all rounded-2xl p-4 sm:p-5 mb-4 relative overflow-hidden group border ${
        isDarkMode
          ? 'bg-[#111116] border-[#8338ec]/35 hover:border-[#8338ec]/60'
          : 'bg-white border-[#8338ec]/25 hover:border-[#8338ec]/50'
      }`}
      style={{
        boxShadow: isDarkMode
          ? `0 12px 36px rgba(0, 0, 0, 0.55), 0 0 24px rgba(131, 56, 236, 0.18)`
          : `0 8px 30px rgba(131, 56, 236, 0.08), 0 0 1px rgba(131, 56, 236, 0.25)`,
      }}
    >
      {/* Top Header: Clean 3-Tier Hierarchy */}
      <div className="flex flex-col gap-1.5 mb-3">
        {/* Tier 1: Check in + Emoji + Title on Left, Action Toolbar on Right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Check Circle Button */}
            <button
              onClick={handleCheckToday}
              title={
                isTodayCompleted
                  ? `Selesai! (${currentTodayVal}/${targetVal} ${habit.unit || ''})`
                  : `Centang hari ini (${currentTodayVal}/${targetVal} ${habit.unit || ''})`
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer border shrink-0 ${
                isTodayCompleted
                  ? 'border-transparent text-white shadow-md transform active:scale-95'
                  : isDarkMode
                  ? 'border-[#2e2e3d] bg-[#16161f] text-zinc-500 hover:border-zinc-400 hover:text-zinc-200'
                  : 'border-zinc-300 bg-zinc-100 text-zinc-400 hover:border-zinc-500 hover:text-zinc-700'
              }`}
              style={{
                backgroundColor: isTodayCompleted ? habit.color : undefined,
                boxShadow: isTodayCompleted ? `0 0 16px ${habit.color}66` : undefined,
              }}
            >
              {isTodayCompleted ? (
                <Check className="w-5 h-5 stroke-[2.8]" />
              ) : isNumeric && currentTodayVal > 0 ? (
                <span className={`text-[11px] font-mono font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {currentTodayVal}
                </span>
              ) : (
                <div className={`w-3.5 h-3.5 rounded-full border border-dashed group-hover:scale-110 transition-transform ${isDarkMode ? 'border-zinc-500' : 'border-zinc-400'}`} />
              )}
            </button>

            {/* Emoji & Name */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl sm:text-3xl select-none shrink-0">{habit.emoji || '🎯'}</span>
              <h3 className={`font-extrabold text-lg sm:text-xl tracking-tight truncate leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                {habit.name}
              </h3>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            {onToggleFreeze && (
              <button
                onClick={() => onToggleFreeze(habit.id, todayStr)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                  isTodayFrozen
                    ? 'text-cyan-500 bg-cyan-500/15 border-cyan-500/30'
                    : isDarkMode
                    ? 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/20 border-transparent'
                    : 'text-zinc-600 hover:text-cyan-700 hover:bg-cyan-50 border-zinc-200 bg-zinc-50'
                }`}
                title={
                  isTodayFrozen
                    ? 'Streak Freeze aktif hari ini (Klik untuk batal)'
                    : 'Aktifkan Streak Freeze hari ini (Rest Day)'
                }
              >
                <Snowflake className="w-3.5 h-3.5" />
              </button>
            )}
            {onStartPomodoro && (
              <button
                onClick={() => onStartPomodoro(habit)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-amber-300 hover:bg-amber-950/30 border-transparent'
                    : 'text-zinc-600 hover:text-amber-700 hover:bg-amber-50 border-zinc-200 bg-zinc-50'
                }`}
                title="Mulai Pomodoro Focus Timer"
              >
                <Timer className="w-3.5 h-3.5" />
              </button>
            )}
            {onShareHabit && (
              <button
                onClick={() => onShareHabit(habit)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-indigo-300 hover:bg-indigo-950/30 border-transparent'
                    : 'text-zinc-600 hover:text-indigo-700 hover:bg-indigo-50 border-zinc-200 bg-zinc-50'
                }`}
                title="Bagikan Kartu Streak"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onEditHabit && (
              <button
                onClick={() => onEditHabit(habit)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a24] border-transparent'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-200 bg-zinc-50'
                }`}
                title="Ubah Pengaturan Habit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteHabit && (
              <button
                onClick={() => onDeleteHabit(habit.id)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 border-transparent'
                    : 'text-zinc-600 hover:text-rose-600 hover:bg-rose-50 border-zinc-200 bg-zinc-50'
                }`}
                title="Hapus Habit"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: BADGES & GOAL ROW (Horizontal Tags) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category */}
          {habit.category && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${
              isDarkMode ? 'text-zinc-300 bg-[#171724] border-[#29293e]' : 'text-zinc-600 bg-zinc-100 border-zinc-200'
            }`}>
              {habit.category}
            </span>
          )}

          {/* Frequency */}
          {freqLabel && (
            <span className="text-[10px] font-medium text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md shrink-0">
              {freqLabel}
            </span>
          )}

          {/* Streak Badge */}
          <span
            className="font-bold px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 shrink-0"
            style={{
              backgroundColor: `${habit.color}25`,
              color: habit.color,
            }}
          >
            <Flame className="w-3 h-3" />
            {streakStats.currentStreak > 0
              ? `${streakStats.currentStreak}h streak`
              : 'No streak'}
          </span>

          {/* Target */}
          {isNumeric && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border shrink-0 ${
              isDarkMode ? 'text-zinc-300 bg-[#161622] border-[#242434]' : 'text-zinc-700 bg-zinc-100 border-zinc-200'
            }`}>
              {targetVal} {habit.unit || 'unit'}
            </span>
          )}
        </div>

        {/* Tier 3: STATS ROW (Record & Completion Rate - Separate Row) */}
        <div className={`text-[10.5px] font-mono font-light tracking-wide ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Rekor: <span className={`font-normal ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{streakStats.bestStreak}h</span> • {streakStats.completionRate}% (30h)
        </div>
      </div>

      {/* Grid Container (100% Fit Inside Card on Mobile) */}
      <div className="w-full overflow-hidden flex justify-center py-0.5">
        <div className="w-full overflow-x-auto pb-1 no-scrollbar touch-pan-x flex flex-col items-start sm:items-center">
          <div className="w-fit flex flex-col gap-1 select-none">
            {/* Months Row */}
            <div className={`flex text-[9.5px] font-mono pl-5 mb-1 relative h-4 w-full ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {monthLabels.map((m: { name: string; colIndex: number }, idx: number) => (
                <div
                  key={idx}
                  className="absolute transform"
                  style={{
                    left: `calc(1.35rem + ${m.colIndex * 14}px)`,
                  }}
                >
                  {m.name}
                </div>
              ))}
            </div>

            {/* Grid Layout: 7 rows for days, N columns for weeks */}
            <div className="flex gap-1 items-start">
              {/* Day Labels (Sun, Mon, ...) */}
              <div className={`flex flex-col gap-[2px] text-[8px] font-mono pr-1 pt-[1px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400 font-medium'}`}>
                {dayLabels.map((lbl: string, dIdx: number) => (
                  <div key={dIdx} className="h-3 leading-3 w-3.5 text-right">
                    {dIdx % 2 === 0 ? lbl : ''}
                  </div>
                ))}
              </div>

              {/* Matrix of Blocks */}
              <div className="flex gap-[2px]">
                {weeks.map((week: Array<{ date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }>, wIdx: number) => (
                  <div key={wIdx} className="flex flex-col gap-[2px]">
                    {week.map((day: { date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }) => {
                      const rawVal = habit.history[day.dateStr] || 0;
                      const isDone = isNumeric ? rawVal >= targetVal : rawVal === 1;
                      const isPartial = isNumeric && rawVal > 0 && rawVal < targetVal;
                      const isFrozen = (habit.frozenDates || []).includes(day.dateStr);
                      const isToday = day.dateStr === todayStr;
                      const hasNote = !!habit.notes?.[day.dateStr];

                      return (
                        <button
                          key={day.dateStr}
                          disabled={day.isFuture}
                          onClick={(e) => handleCellClick(day.dateStr, e)}
                          title={`${day.dateStr}${isFrozen ? ' [❄️ Streak Freeze]' : ''}${rawVal > 0 ? ` (${rawVal}${habit.unit ? ' ' + habit.unit : ''})` : ''}${hasNote ? ' [Note attached]' : ''}${isToday ? ' - Today' : ''}`}
                          className={`w-3 h-3 rounded-[2px] transition-transform duration-100 relative touch-manipulation ${
                            day.isFuture
                              ? 'bg-[#15151e] opacity-20 cursor-not-allowed'
                              : 'cursor-pointer hover:scale-125 active:scale-95'
                          } ${
                            isToday && !isDone && !isFrozen ? 'ring-1 ring-zinc-400' : ''
                          }`}
                          style={{
                            backgroundColor: isDone
                              ? habit.color
                              : isFrozen
                              ? '#0284c7'
                              : isPartial
                              ? `${habit.color}88`
                              : day.isFuture
                              ? (isDarkMode ? '#14141c' : '#f4f4f5')
                              : (isDarkMode ? '#1e1e28' : '#e4e4e7'),
                            boxShadow: isDone
                              ? `0 0 6px ${habit.color}88`
                              : isFrozen
                              ? '0 0 8px rgba(2,132,199,0.7)'
                              : undefined,
                          }}
                        >
                          {hasNote && (
                            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-white rounded-full" />
                          )}
                          {isFrozen && (
                            <div className="absolute inset-0 flex items-center justify-center text-[7px] text-white">
                              ❄
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Minimalist Mobile Footer Legend */}
            <div className={`flex items-center justify-end gap-1.5 text-[10px] font-mono mt-2 pr-1 w-full ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              <span>Kurang</span>
              <div className={`w-2.5 h-2.5 rounded-[2px] ${isDarkMode ? 'bg-[#1e1e28]' : 'bg-[#e4e4e7]'}`} />
              <div
                className="w-2.5 h-2.5 rounded-[2px]"
                style={{ backgroundColor: `${habit.color}66` }}
              />
              <div
                className="w-2.5 h-2.5 rounded-[2px]"
                style={{ backgroundColor: habit.color }}
              />
              <span>Rutin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Popover Modal for Single Day Log */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`border rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 ${
              isDarkMode
                ? 'bg-[#15151d] border-[#8338ec]/40'
                : 'bg-white border-zinc-300 shadow-xl'
            }`}
            style={{
              boxShadow: isDarkMode ? `0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(131,56,236,0.2)` : `0 16px 40px rgba(0,0,0,0.12)`,
            }}
          >
            <div className={`flex items-center justify-between border-b pb-2.5 ${isDarkMode ? 'border-[#242434]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{habit.emoji}</span>
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{habit.name}</h4>
                  <p className={`text-[11px] font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{selectedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className={`p-1 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                ✕
              </button>
            </div>

            {/* Target Value Input */}
            {isNumeric ? (
              <div>
                <label className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Catat Angka ({habit.unit || 'unit'} - Target: {targetVal})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCellVal((v) => Math.max(0, v - 1))}
                    className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#1f1f2c] text-zinc-300 hover:bg-[#2a2a3c]' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={cellVal}
                    onChange={(e) => setCellVal(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full border rounded-lg px-3 py-2 text-center font-mono text-sm ${
                      isDarkMode
                        ? 'bg-[#0e0e14] border-[#28283a] text-white focus:border-[#8338ec]'
                        : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-[#8338ec]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setCellVal((v) => v + 1)}
                    className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#1f1f2c] text-zinc-300 hover:bg-[#2a2a3c]' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Status Tanggal {selectedDate}
                </label>
                <button
                  type="button"
                  onClick={() => setCellVal((v) => (v === 1 ? 0 : 1))}
                  className={`w-full py-2 rounded-xl font-medium text-xs border transition-all ${
                    cellVal === 1
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-500 font-semibold'
                      : isDarkMode
                      ? 'bg-[#181822] border-[#29293a] text-zinc-400'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {cellVal === 1 ? '✓ Sudah Selesai' : '○ Belum Dikerjakan'}
                </button>
              </div>
            )}

            {/* Reflection Note */}
            <div>
              <label className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Catatan Harian (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Bagaimana progres kebiasaanmu hari ini?"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#8338ec] ${
                  isDarkMode
                    ? 'bg-[#0e0e14] border-[#28283a] text-white placeholder-zinc-600'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                }`}
              />
            </div>

            <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDarkMode ? 'border-[#222230]' : 'border-zinc-200'}`}>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className={`px-3 py-1.5 text-xs ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveCellDetails}
                className="px-4 py-1.5 text-xs font-semibold bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-lg transition-all shadow-md shadow-[#8338ec]/30"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
