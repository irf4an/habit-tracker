import React, { useMemo, useState, useEffect } from 'react';
import { Habit, DailyMood } from '../types';
import { getTodayString, getYearDays, calculateStreak, canFreezeOnDate, freezeRemaining, FREEZE_WEEKLY_LIMIT } from '../utils';
import { MaterialIcon } from './MaterialIcon';
import confetti from 'canvas-confetti';
import { playCheckSound, playUncheckSound } from '../sound';

interface HabitCardProps {
  habit: Habit;
  isFullView: boolean;
  isDarkMode?: boolean;
  onToggleDate: (habitId: string, dateStr: string, value?: number) => void;
  onToggleFreeze?: (habitId: string, dateStr: string) => void;
  onSaveNote?: (habitId: string, dateStr: string, note: string, mood?: DailyMood) => void;
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
  const isNegative = habit.type === 'negative';
  const targetVal = habit.targetValue || 1;
  const currentTodayVal = habit.history[todayStr] || 0;
  // For negative habit: completed means clean (not relapsed, value === 0)
  const isTodayCompleted = isNegative ? currentTodayVal === 0 : isNumeric ? currentTodayVal >= targetVal : currentTodayVal === 1;
  const isTodayRelapsed = isNegative && currentTodayVal > 0;
  const isTodayFrozen = (habit.frozenDates || []).includes(todayStr);

  const streakStats = useMemo(
    () => calculateStreak(habit.history, habit.frozenDates || [], habit),
    [habit.history, habit.frozenDates, habit.frequency, habit.weeklyTargetDays, habit.type, habit.targetValue, habit.createdAt]
  );

  // Selected cell for note/detail modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [cellVal, setCellVal] = useState<number>(0);
  const [selectedMood, setSelectedMood] = useState<DailyMood | undefined>(undefined);

  // Adaptive weeks based on screen width: 18 weeks on small mobile (fits 320-375px), 26 on tablet, 52 on full view
  const [windowWidth, setWindowWidth] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth : 380));

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const numWeeks = isFullView ? 52 : windowWidth < 380 ? 17 : windowWidth < 640 ? 19 : 28;
  const { weeks, monthLabels } = useMemo(() => getYearDays(numWeeks), [numWeeks]);

  const handleCheckToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNegative) {
      // Toggle Relapse: 0 = Clean, 1 = Relapse
      const next = isTodayRelapsed ? 0 : 1;
      onToggleDate(habit.id, todayStr, next);
      if (next === 0) {
        playCheckSound();
        triggerConfetti();
      } else {
        playUncheckSound();
      }
    } else if (isNumeric) {
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

  // Hari ini: 1-tap toggle langsung (anti-friction). Tanggal lampau/masa depan: buka modal detail (cegah isi acak)
  const handleCellClick = (dateStr: string, e: React.MouseEvent | React.KeyboardEvent) => {
    const isToday = dateStr === todayStr;
    const requiresModal = e.shiftKey || isNumeric || !isToday;
    if (!requiresModal && isToday) {
      const cur = habit.history[dateStr] || 0;
      const target = habit.targetValue || 1;
      const isDone = habit.type === 'numeric' ? cur >= target : cur === 1;
      if (isDone) {
        playUncheckSound();
      } else {
        playCheckSound();
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.75 }, colors: [habit.color, '#ffffff', '#a78bfa'], disableForReducedMotion: true });
      }
      onToggleDate(habit.id, dateStr, isDone ? 0 : target);
      return;
    }
    setSelectedDate(dateStr);
    setNoteText(habit.notes?.[dateStr] || '');
    setCellVal(habit.history[dateStr] || 0);
    setSelectedMood(habit.moods?.[dateStr]);
  };

  const saveCellDetails = () => {
    if (!selectedDate) return;
    onToggleDate(habit.id, selectedDate, cellVal);
    if (onSaveNote) {
      onSaveNote(habit.id, selectedDate, noteText, selectedMood);
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
      className={`transition-all rounded-3xl p-4 sm:p-5 mb-4 relative overflow-hidden group border ${
        isDarkMode
          ? 'bg-[#111116] border-[#8338ec]/35 hover:border-[#8338ec]/60'
          : 'bg-white border-[#8338ec]/25 hover:border-[#8338ec]/50 shadow-sm'
      }`}
      style={{
        boxShadow: isDarkMode
          ? `0 12px 36px rgba(0, 0, 0, 0.55), 0 0 24px rgba(131, 56, 236, 0.18)`
          : `0 8px 30px rgba(131, 56, 236, 0.08), 0 0 1px rgba(131, 56, 236, 0.25)`,
      }}
    >
      {/* Top Header: 3-tier */}
      <div className="flex flex-col gap-2.5 mb-3.5">
        {/* Tier 1: Check In + Title on Left, Action Toolbar on Right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={handleCheckToday}
              aria-label={
                isNegative
                  ? isTodayRelapsed
                    ? `Hari ini tercatat kambuh untuk ${habit.name}. Klik untuk tandai bersih.`
                    : `Hari ini bersih untuk ${habit.name}. Klik jika mengalami kambuh/relapse.`
                  : isTodayCompleted
                  ? `Batalkan selesai hari ini untuk ${habit.name}`
                  : `Tandai selesai hari ini untuk ${habit.name}${isNumeric ? ` (${targetVal} ${habit.unit || 'unit'})` : ''}`
              }
              aria-pressed={isTodayCompleted}
              title={
                isNegative
                  ? isTodayRelapsed
                    ? 'Kambuh hari ini (klik untuk batalkan)'
                    : 'Bersih & bebas hari ini ✓'
                  : isTodayCompleted
                  ? `Selesai! (${currentTodayVal}/${targetVal} ${habit.unit || ''})`
                  : `Centang hari ini (${currentTodayVal}/${targetVal} ${habit.unit || ''})`
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer border shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                isNegative
                  ? isTodayRelapsed
                    ? 'bg-rose-500 text-white border-transparent shadow-md'
                    : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 shadow-sm'
                  : isTodayCompleted
                  ? 'border-transparent text-white shadow-md transform active:scale-95'
                  : isDarkMode
                  ? 'border-[#2e2e3d] bg-[#16161f] text-zinc-500 hover:border-zinc-400 hover:text-zinc-200'
                  : 'border-zinc-300 bg-zinc-100 text-zinc-400 hover:border-zinc-500 hover:text-zinc-700'
              }`}
              style={{
                backgroundColor: isNegative ? (isTodayRelapsed ? '#f43f5e' : undefined) : isTodayCompleted ? habit.color : undefined,
                boxShadow: isNegative && !isTodayRelapsed ? `0 0 10px rgba(16,185,129,0.2)` : isTodayCompleted ? `0 0 16px ${habit.color}66` : undefined,
              }}
            >
              {isNegative ? (
                isTodayRelapsed ? (
                  <span className="text-xs font-bold leading-none">✕</span>
                ) : (
                  <span className="text-xs leading-none">🛡️</span>
                )
              ) : isTodayCompleted ? (
                <MaterialIcon name="check" size={20} color="#ffffff" />
              ) : isNumeric && currentTodayVal > 0 ? (
                <span className={`text-[11px] font-mono font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} aria-hidden>
                  {currentTodayVal}
                </span>
              ) : (
                <span aria-hidden className={`w-3.5 h-3.5 rounded-full border border-dashed group-hover:scale-110 transition-transform ${isDarkMode ? 'border-zinc-500' : 'border-zinc-400'}`} />
              )}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl select-none shrink-0 leading-none">{habit.emoji || '🎯'}</span>
              <h3 className={`font-extrabold text-base sm:text-lg tracking-tight truncate leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                {habit.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" role="toolbar" aria-label={`Aksi untuk ${habit.name}`}>
            {onToggleFreeze && (() => {
              const canFreeze = canFreezeOnDate(habit.frozenDates || [], todayStr);
              const remaining = freezeRemaining(habit.frozenDates || [], todayStr);
              const disabled = !isTodayFrozen && !canFreeze;
              return (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={isTodayFrozen ? `Batalkan freeze ${habit.name} hari ini` : `Bekukan streak ${habit.name} — sisa ${remaining}/${FREEZE_WEEKLY_LIMIT} minggu ini`}
                  aria-pressed={isTodayFrozen}
                  onClick={() => onToggleFreeze(habit.id, todayStr)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isTodayFrozen
                      ? 'text-cyan-500 bg-cyan-500/15 border-cyan-500/30'
                      : isDarkMode
                      ? 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/20 border-[#262636] bg-[#14141d]'
                      : 'text-zinc-600 hover:text-cyan-700 hover:bg-cyan-50 border-zinc-300 bg-white shadow-xs'
                  }`}
                  title={isTodayFrozen ? `Beku aktif — sisa ${remaining}/${FREEZE_WEEKLY_LIMIT} minggu ini (klik batal)` : disabled ? `Kuota habis (maks ${FREEZE_WEEKLY_LIMIT}x/7 hari)` : `Bekukan hari ini — sisa ${remaining}/${FREEZE_WEEKLY_LIMIT} minggu ini`}
                >
                  <MaterialIcon name="ac_unit" size={16} />
                </button>
              );
            })()}
            {onStartPomodoro && (
              <button
                type="button"
                aria-label={`Mulai timer fokus Pomodoro untuk ${habit.name}`}
                onClick={() => onStartPomodoro(habit)}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-1 ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-amber-300 hover:bg-amber-950/30 border-[#262636] bg-[#14141d]'
                    : 'text-zinc-600 hover:text-amber-700 hover:bg-amber-50 border-zinc-300 bg-white shadow-xs'
                }`}
                title="Mulai Pomodoro Focus Timer"
              >
                <MaterialIcon name="timer" size={16} />
              </button>
            )}
            {onShareHabit && (
              <button
                type="button"
                aria-label={`Bagikan kartu streak ${habit.name}`}
                onClick={() => onShareHabit(habit)}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-1 ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-indigo-300 hover:bg-indigo-950/30 border-[#262636] bg-[#14141d]'
                    : 'text-zinc-600 hover:text-indigo-700 hover:bg-indigo-50 border-zinc-300 bg-white shadow-xs'
                }`}
                title="Bagikan Kartu Streak"
              >
                <MaterialIcon name="share" size={16} />
              </button>
            )}
            {onEditHabit && (
              <button
                type="button"
                aria-label={`Ubah pengaturan ${habit.name}`}
                onClick={() => onEditHabit(habit)}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-1 ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-white hover:bg-[#1a1a24] border-[#262636] bg-[#14141d]'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-300 bg-white shadow-xs'
                }`}
                title="Ubah Pengaturan Habit"
              >
                <MaterialIcon name="edit" size={16} />
              </button>
            )}
            {onDeleteHabit && (
              <button
                type="button"
                aria-label={`Hapus ${habit.name}`}
                onClick={() => onDeleteHabit(habit.id)}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 ${
                  isDarkMode
                    ? 'text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 border-[#262636] bg-[#14141d]'
                    : 'text-zinc-600 hover:text-rose-600 hover:bg-rose-50 border-zinc-300 bg-white shadow-xs'
                }`}
                title="Hapus Habit"
              >
                <MaterialIcon name="delete" size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: BADGES & GOAL ROW (Horizontal Tags) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Time of Day Badge (Habit Stacking v1.1) */}
          {habit.timeOfDay && habit.timeOfDay !== 'anytime' && (
            <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 inline-flex items-center gap-1 leading-none ${
              habit.timeOfDay === 'morning'
                ? isDarkMode ? 'text-amber-300 bg-amber-500/10 border-amber-500/25' : 'text-amber-800 bg-amber-50 border-amber-300'
                : habit.timeOfDay === 'afternoon'
                ? isDarkMode ? 'text-sky-300 bg-sky-500/10 border-sky-500/25' : 'text-sky-800 bg-sky-50 border-sky-300'
                : isDarkMode ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/25' : 'text-indigo-800 bg-indigo-50 border-indigo-300'
            }`}>
              <span>{habit.timeOfDay === 'morning' ? '🌤️ Pagi' : habit.timeOfDay === 'afternoon' ? '☀️ Siang' : '🌙 Malam'}</span>
            </span>
          )}

          {/* Category */}
          {habit.category && (
            <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border shrink-0 inline-flex items-center gap-1 leading-none ${
              isDarkMode ? 'text-zinc-300 bg-[#171724] border-[#29293e]' : 'text-zinc-600 bg-zinc-100 border-zinc-200'
            }`}>
              <MaterialIcon name="label" size={12} />
              {habit.category}
            </span>
          )}

          {/* Frequency */}
          {freqLabel && (
            <span className="text-[10px] font-medium text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1 leading-none">
              <MaterialIcon name="repeat" size={12} color="#6366f1" />
              {freqLabel}
            </span>
          )}

          {/* Streak Badge */}
          <span
            className="font-bold px-2.5 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 shrink-0 border leading-none"
            style={{
              backgroundColor: isNegative ? '#10b98118' : `${habit.color}18`,
              color: isNegative ? '#10b981' : habit.color,
              borderColor: isNegative ? '#10b98130' : `${habit.color}30`,
            }}
          >
            <MaterialIcon name={isNegative ? 'check' : 'local_fire_department'} size={12} color={isNegative ? '#10b981' : habit.color} />
            {isNegative
              ? `${streakStats.currentStreak} hari bebas`
              : streakStats.currentStreak > 0
              ? `${streakStats.currentStreak} hari`
              : 'Belum ada streak'}
          </span>

          {/* Anti-Habit Mode Badge */}
          {isNegative && (
            <span className="text-[10px] font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1 leading-none">
              <span>🛡️ Anti-Habit</span>
            </span>
          )}

          {/* Target */}
          {isNumeric && (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border shrink-0 inline-flex items-center gap-1 leading-none ${
              isDarkMode ? 'text-zinc-300 bg-[#161622] border-[#242434]' : 'text-zinc-700 bg-zinc-100 border-zinc-200'
            }`}>
              <MaterialIcon name="flag" size={12} color="#8338ec" />
              {targetVal} {habit.unit || 'unit'}
            </span>
          )}

          {/* Daily Reminder */}
          {habit.reminderEnabled && (
            <span
              title={`Pengingat aktif setiap jam ${habit.reminderTime || '20:00'}`}
              className={`px-2.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0 text-[10px] font-medium leading-none ${
                isDarkMode
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                  : 'text-amber-600 bg-amber-50 border-amber-200'
              }`}
            >
              <MaterialIcon name="notifications" size={12} color="#f59e0b" />
              {habit.reminderTime || '20:00'}
            </span>
          )}
        </div>

        <div className={`flex items-center gap-1.5 text-[10.5px] font-mono font-light tracking-wide ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          <span>Rekor: <span className={`font-normal ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{streakStats.bestStreak}h</span> • {streakStats.completionRate}% (30h)</span>
          <button
            type="button"
            aria-label={`Tulis catatan hari ini untuk ${habit.name}${habit.notes?.[todayStr] ? ' — sudah ada catatan' : ''}`}
            onClick={() => {
              setSelectedDate(todayStr);
              setNoteText(habit.notes?.[todayStr] || '');
              setCellVal(habit.history[todayStr] || 0);
              setSelectedMood(habit.moods?.[todayStr]);
            }}
            className={`ml-1 w-6 h-6 flex items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${
              isTodayCompleted || habit.notes?.[todayStr]
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600'
                : isDarkMode
                ? 'border-[#262636] bg-[#14141d] text-zinc-400 hover:text-zinc-200'
                : 'border-zinc-300 bg-white text-zinc-600 hover:text-zinc-900 shadow-xs'
            }`}
            title={habit.notes?.[todayStr] ? `Catatan hari ini: "${habit.notes?.[todayStr]?.slice(0, 40)}" — klik edit` : isTodayCompleted ? 'Sudah selesai hari ini — tulis catatan' : 'Tulis catatan hari ini'}
          >
            <MaterialIcon name="edit_note" size={14} />
          </button>
          {(isTodayCompleted || habit.notes?.[todayStr]) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />}
        </div>
      </div>

      {/* Grid Container — Full Responsive Width & Aligned Month Header */}
      <div className="w-full flex flex-col pt-1">
        <div
          className="w-full overflow-x-auto pb-1 no-scrollbar touch-pan-x"
          role="region"
          aria-label={`Kalender ${habit.name} — ${weeks.length} minggu`}
          tabIndex={0}
        >
          <div className="min-w-fit mx-auto flex flex-col gap-1 select-none">
            {/* Months Header — ColIndex-based precision alignment */}
            <div
              aria-hidden
              className={`flex text-[9px] sm:text-[10px] font-mono mb-1 relative h-3.5 w-full pl-6 ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              {monthLabels.map((m: { name: string; colIndex: number }, idx: number) => (
                <div
                  key={idx}
                  className="absolute"
                  style={{
                    left: `calc(1.5rem + ${m.colIndex * 15}px)`,
                  }}
                >
                  {m.name}
                </div>
              ))}
            </div>

            {/* Grid Row */}
            <div
              className="flex items-start gap-1.5"
              role="grid"
              aria-label={`${habit.name} heatmap — gunakan Tab dan Enter untuk ubah hari`}
            >
              {/* Day Labels (Min, Sel, Kam, Sab) */}
              <div
                aria-hidden
                className={`flex flex-col gap-[3px] text-[8px] sm:text-[8.5px] font-mono pr-0.5 pt-[1px] ${
                  isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                {dayLabels.map((lbl: string, dIdx: number) => (
                  <div key={dIdx} className="h-3 leading-3 w-4 text-right">
                    {dIdx % 2 === 0 ? lbl : ''}
                  </div>
                ))}
              </div>

              {/* Matrix Columns */}
              <div className="flex gap-[3px]" role="rowgroup">
                {weeks.map((week: Array<{ date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }>, wIdx: number) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]" role="row">
                    {week.map((day: { date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }) => {
                      const rawVal = habit.history[day.dateStr] || 0;
                      const isRelapsed = isNegative && rawVal > 0;
                      const isDone = isNegative
                        ? !day.isFuture && !isRelapsed && (!habit.createdAt || day.dateStr >= habit.createdAt)
                        : isNumeric
                        ? rawVal >= targetVal
                        : rawVal === 1;
                      const isPartial = !isNegative && isNumeric && rawVal > 0 && rawVal < targetVal;
                      const isFrozen = (habit.frozenDates || []).includes(day.dateStr);
                      const isToday = day.dateStr === todayStr;
                      const hasNote = !!habit.notes?.[day.dateStr];
                      const ariaLabel = isNegative
                        ? `${day.dateStr}: ${isRelapsed ? 'kambuh (relapse)' : 'bersih'}${hasNote ? ', ada catatan' : ''}`
                        : `${day.dateStr}: ${isFrozen ? 'beku, ' : ''}${isDone ? `selesai ${rawVal}${habit.unit ? ' ' + habit.unit : ''}` : isPartial ? `sebagian ${rawVal} dari ${targetVal}` : 'belum selesai'}${hasNote ? ', ada catatan' : ''}${isToday ? ', hari ini' : ''}`;

                      return (
                        <button
                          key={day.dateStr}
                          role="gridcell"
                          aria-label={ariaLabel}
                          aria-pressed={isDone || isFrozen}
                          aria-disabled={day.isFuture}
                          disabled={day.isFuture}
                          onClick={(ev) => handleCellClick(day.dateStr, ev as unknown as React.KeyboardEvent)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCellClick(day.dateStr, e as unknown as React.MouseEvent); }
                          }}
                          title={`${day.dateStr}${isRelapsed ? ' [⚠️ Relapse/Kambuh]' : isNegative && isDone ? ' [🛡️ Bersih]' : ''}${isFrozen ? ' [❄️ Streak Freeze]' : ''}${hasNote ? ' [Note attached]' : ''}${isToday ? ' - Today' : ''}`}
                          className={`w-3 h-3 rounded-[2.5px] relative touch-manipulation transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent ${
                            day.isFuture ? 'bg-[#15151e] opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-125 active:scale-95'
                          } ${isToday && !isDone && !isFrozen ? 'ring-1.5 ring-[#8338ec]' : ''}`}
                          style={{
                            backgroundColor: isRelapsed
                              ? '#f43f5e'
                              : isDone
                              ? (isNegative ? '#10b981' : habit.color)
                              : isFrozen
                              ? '#0284c7'
                              : isPartial
                              ? `${habit.color}88`
                              : day.isFuture
                              ? (isDarkMode ? '#14141c' : '#f4f4f5')
                              : (isDarkMode ? '#1e1e28' : '#e4e4e7'),
                            boxShadow: isRelapsed
                              ? '0 0 6px rgba(244,63,94,0.7)'
                              : isDone
                              ? `0 0 6px ${isNegative ? '#10b98188' : habit.color + '88'}`
                              : isFrozen
                              ? '0 0 8px rgba(2,132,199,0.7)'
                              : undefined,
                          }}
                        >
                          {hasNote && <span aria-hidden className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full border border-black/20" />}
                          {isFrozen && <span aria-hidden className="absolute inset-0 flex items-center justify-center text-[7px] text-white">❄</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Footer Legend */}
            <div
              className={`flex items-center justify-end gap-1.5 text-[10px] font-mono mt-2 pr-1 w-full ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-overlay duration-150"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail hari ${selectedDate} — ${habit.name}`}
          onClick={() => setSelectedDate(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedDate(null)}
        >
          <div
            role="document"
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-2xl p-5 max-w-sm w-full shadow-2xl modal-card space-y-4 ${isDarkMode ? 'bg-[#15151d] border-[#8338ec]/40' : 'bg-white border-zinc-300 shadow-xl'}`}
            style={{ boxShadow: isDarkMode ? `0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(131,56,236,0.2)` : `0 16px 40px rgba(0,0,0,0.12)` }}
          >
            <div className={`flex items-center justify-between border-b pb-2.5 ${isDarkMode ? 'border-[#242434]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>{habit.emoji}</span>
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{habit.name}</h4>
                  <p className={`text-[11px] font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{selectedDate}</p>
                </div>
              </div>
              <button type="button" aria-label="Tutup detail hari" onClick={() => setSelectedDate(null)} className={`p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1f1f2e]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
                ✕
              </button>
            </div>

            {isNegative ? (
              <div>
                <p id={`habit-day-status-${habit.id}-${selectedDate}`} className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Status Anti-Habit {selectedDate}</p>
                <button
                  type="button"
                  aria-describedby={`habit-day-status-${habit.id}-${selectedDate}`}
                  aria-pressed={cellVal === 1}
                  onClick={() => setCellVal((v) => (v === 1 ? 0 : 1))}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${
                    cellVal === 1
                      ? 'bg-rose-500/20 border-rose-500 text-rose-500'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                  }`}
                >
                  {cellVal === 1 ? '⚠️ Tercatat Kambuh (Relapse)' : '🛡️ Bersih & Berhasil Menahan Diri'}
                </button>
              </div>
            ) : isNumeric ? (
              <div>
                <label htmlFor={`habit-day-value-${habit.id}-${selectedDate}`} className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Catat Angka ({habit.unit || 'unit'} - Target: {targetVal})
                </label>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Kurangi nilai" onClick={() => setCellVal((v) => Math.max(0, v - 1))} className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#1f1f2c] border-[#2e2e40] text-zinc-300 hover:bg-[#2a2a3c]' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>
                    <MaterialIcon name="remove" size={16} />
                  </button>
                  <input id={`habit-day-value-${habit.id}-${selectedDate}`} type="number" inputMode="numeric" min={0} value={cellVal} onChange={(e) => setCellVal(Math.max(0, parseInt(e.target.value) || 0))} className={`w-full border rounded-lg px-3 py-2 text-center font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0e0e14] border-[#28283a] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`} />
                  <button type="button" aria-label="Tambah nilai" onClick={() => setCellVal((v) => v + 1)} className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#1f1f2c] border-[#2e2e40] text-zinc-300 hover:bg-[#2a2a3c]' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>
                    <MaterialIcon name="add" size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p id={`habit-day-status-${habit.id}-${selectedDate}`} className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Status Tanggal {selectedDate}</p>
                <button type="button" aria-describedby={`habit-day-status-${habit.id}-${selectedDate}`} aria-pressed={cellVal === 1} onClick={() => setCellVal((v) => (v === 1 ? 0 : 1))} className={`w-full py-2 rounded-xl font-medium text-xs border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${cellVal === 1 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-600 font-semibold' : isDarkMode ? 'bg-[#181822] border-[#29293a] text-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:bg-zinc-200'}`}>
                  {cellVal === 1 ? '✓ Sudah Selesai' : '○ Belum Dikerjakan'}
                </button>
              </div>
            )}
            {/* Mood Selector (Mini Mood Tracker v1.2) */}
            <div>
              <p className={`block text-[11px] font-mono mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Mood / Suasana Hati</p>
              <div className={`flex items-center justify-between gap-1.5 p-1 rounded-xl border ${
                isDarkMode ? 'bg-[#0e0e14] border-[#252538]' : 'bg-zinc-100 border-zinc-300'
              }`}>
                {[
                  { id: 'happy', emoji: '😊', label: 'Senang' },
                  { id: 'energetic', emoji: '⚡', label: 'Semangat' },
                  { id: 'focused', emoji: '🔥', label: 'Fokus' },
                  { id: 'tired', emoji: '😴', label: 'Lelah' },
                  { id: 'stressed', emoji: '🌧️', label: 'Berat' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(selectedMood === m.id ? undefined : (m.id as DailyMood))}
                    className={`flex-1 py-1.5 rounded-lg flex flex-col items-center gap-0.5 text-center transition-all cursor-pointer ${
                      selectedMood === m.id
                        ? 'bg-[#8338ec] text-white shadow-xs font-bold'
                        : isDarkMode
                        ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                        : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200/80'
                    }`}
                    title={m.label}
                  >
                    <span className="text-base leading-none">{m.emoji}</span>
                    <span className="text-[9.5px] leading-none font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor={`habit-day-note-${habit.id}-${selectedDate}`} className={`block text-[11px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Catatan Harian (Opsional)</label>
              <textarea id={`habit-day-note-${habit.id}-${selectedDate}`} rows={2} placeholder="Bagaimana progres kebiasaanmu hari ini?" value={noteText} onChange={(e) => setNoteText(e.target.value)} className={`w-full border rounded-lg p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'bg-[#0e0e14] border-[#28283a] text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'}`} />
            </div>

            <div className={`flex items-center justify-between gap-2 pt-2 border-t ${isDarkMode ? 'border-[#222230]' : 'border-zinc-200'}`}>
              <div className="flex items-center">
                {selectedDate && (() => {
                  const isSelectedFrozen = (habit.frozenDates || []).includes(selectedDate);
                  const canFreeze = canFreezeOnDate(habit.frozenDates || [], selectedDate);
                  const remaining = freezeRemaining(habit.frozenDates || [], selectedDate);
                  const disabled = !isSelectedFrozen && !canFreeze;
                  return (
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={isSelectedFrozen ? 'Batalkan bekukan hari ini' : `Bekukan hari ini — sisa ${remaining}/${FREEZE_WEEKLY_LIMIT}`}
                      onClick={() => {
                        if (disabled) return;
                        onToggleFreeze?.(habit.id, selectedDate);
                        // refresh frozen visual without closing modal
                        setSelectedDate(selectedDate);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 ${isSelectedFrozen ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600' : 'bg-sky-500/10 border-sky-500/20 text-sky-600 hover:bg-sky-500/15'}`}
                      title={isSelectedFrozen ? 'Sudah dibekukan — klik batal' : disabled ? `Kuota habis (${FREEZE_WEEKLY_LIMIT}x/7 hari)` : `Bekukan — sisa ${remaining}/${FREEZE_WEEKLY_LIMIT}/minggu`}
                    >
                      <MaterialIcon name="ac_unit" size={14} /> {isSelectedFrozen ? 'Batal beku' : 'Bekukan'}
                    </button>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setSelectedDate(null)} className={`px-3 py-1.5 text-xs rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-[#1f1f2e]' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'}`}>Batal</button>
                <button type="button" onClick={saveCellDetails} className="px-4 py-1.5 text-xs font-semibold bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-lg transition-all shadow-md shadow-[#8338ec]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8338ec] focus-visible:ring-offset-2">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
