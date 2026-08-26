import React, { useMemo } from 'react';
import { Habit } from '../types';
import {
  Trophy,
  Flame,
  Target,
  Clock,
  TrendingUp,
  Layers,
  BarChart2,
} from 'lucide-react';
import { calculateStreak, formatDate, getYearDays } from '../utils';
import { motion, useReducedMotion } from 'motion/react';

interface StatsViewProps {
  habits: Habit[];
  isDarkMode?: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({ habits, isDarkMode = true }) => {
  const reduceMotion = useReducedMotion();

  const stats = useMemo(
    () =>
      habits.map((h) => ({
        habit: h,
        ...calculateStreak(h.history, h.frozenDates || []),
      })),
    [habits]
  );

  const totalCompletions = stats.reduce((acc, s) => acc + s.totalCompleted, 0);
  const bestOverallStreak = Math.max(0, ...stats.map((s) => s.bestStreak));
  const activeHabitsCount = habits.length;

  const avg30DayRate =
    habits.length > 0
      ? Math.round(stats.reduce((acc, s) => acc + s.completionRate, 0) / habits.length)
      : 0;

  const dayOfWeekPerformance = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const s = formatDate(d);
      const dayIdx = d.getDay();
      habits.forEach((h) => {
        if (h.history[s] && h.history[s] > 0) counts[dayIdx]++;
      });
    }
    const maxCount = Math.max(1, ...counts);
    return dayNames.map((name, idx) => ({
      name,
      count: counts[idx],
      percent: Math.round((counts[idx] / maxCount) * 100),
    }));
  }, [habits]);

  const { weeks, monthLabels } = useMemo(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;
    return getYearDays(isDesktop ? 30 : 18);
  }, []);
  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const metricCardAnim = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 } as const,
        whileInView: { opacity: 1, y: 0 } as const,
        viewport: { once: true, amount: 0.3 } as const,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 2x2 METRIC GRID - stagger entrance */}
      <motion.div
        className="grid grid-cols-2 gap-3 sm:gap-4"
        initial={reduceMotion ? undefined : 'hidden'}
        whileInView={reduceMotion ? undefined : 'visible'}
        viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
        variants={
          reduceMotion
            ? undefined
            : {
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
              }
        }
      >
        {[
          { icon: Clock, color: '#8338ec', label: 'TOTAL SELESAI', value: totalCompletions, sub: 'Kebiasaan tercatat' },
          {
            icon: Trophy,
            color: '#f59e0b',
            label: 'REKOR STREAK',
            value: `${bestOverallStreak}`,
            suffix: ' hari',
            sub: 'Konsistensi terpanjang',
          },
          { icon: TrendingUp, color: '#10b981', label: 'KONSISTENSI 30H', value: `${avg30DayRate}%`, sub: 'Rata-rata 30 hari ini' },
          { icon: Layers, color: '#06b6d4', label: 'KEBIASAAN AKTIF', value: activeHabitsCount, sub: 'Rutinitas saat ini' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: { opacity: 0, y: 14 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
                  }
            }
            className={`border rounded-2xl p-4 transition-all flex flex-col items-center justify-center text-center will-change-transform ${
              isDarkMode
                ? 'bg-[#121217] border-[#8338ec]/35 hover:border-[#8338ec]/60'
                : 'bg-white border-[#8338ec]/25 hover:border-[#8338ec]/50 shadow-sm'
            }`}
            style={{
              boxShadow: isDarkMode
                ? `0 10px 30px rgba(0,0,0,0.5), 0 0 16px rgba(131,56,236,0.12)`
                : `0 8px 24px rgba(131,56,236,0.06)`,
            }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              <span className={`text-[10.5px] sm:text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                {m.label}
              </span>
            </div>
            <motion.div
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-sans my-0.5 flex items-baseline justify-center gap-1 ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}
              initial={reduceMotion ? undefined : { scale: 0.92 }}
              whileInView={reduceMotion ? undefined : { scale: 1 }}
              viewport={reduceMotion ? undefined : { once: true }}
              transition={reduceMotion ? undefined : { delay: 0.12 + i * 0.06, type: 'spring', stiffness: 260, damping: 18 }}
            >
              {m.value}
              {m.suffix && <span className={`text-xs sm:text-sm font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{m.suffix}</span>}
            </motion.div>
            <p className={`text-[10.5px] sm:text-[11px] font-light font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{m.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* HEATMAP */}
      <motion.div
        {...metricCardAnim}
        className={`border rounded-2xl p-4 sm:p-5 transition-all ${isDarkMode ? 'bg-[#121217] border-[#8338ec]/30 hover:border-[#8338ec]/50' : 'bg-white border-[#8338ec]/20 hover:border-[#8338ec]/40'}`}
        style={{ boxShadow: isDarkMode ? `0 12px 36px rgba(0,0,0,0.55), 0 0 20px rgba(131,56,236,0.12)` : `0 8px 30px rgba(131,56,236,0.08)` }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            <Layers className="w-4 h-4 text-indigo-500" /> Aktivitas Harian
          </h3>
          <span className={`text-[10.5px] font-light tracking-wide font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>30 Minggu Terakhir</span>
        </div>
        <div className="overflow-x-auto pb-1 no-scrollbar touch-pan-x flex justify-start sm:justify-center">
          <div className="min-w-fit flex flex-col gap-1 select-none">
            <div className={`flex text-[9.5px] font-mono pl-6 mb-1 relative h-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {monthLabels.map((m, idx) => (
                <div key={idx} className="absolute transform" style={{ left: `calc(1.5rem + ${m.colIndex * 16}px)` }}>
                  {m.name}
                </div>
              ))}
            </div>
            <div className="flex gap-1 items-start">
              <div className={`flex flex-col gap-[2.5px] text-[8.5px] font-mono pr-1 pt-[1px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {dayLabels.map((lbl, dIdx) => (
                  <div key={dIdx} className="h-3 leading-[12px] w-4 text-right">
                    {dIdx % 2 === 0 ? lbl : ''}
                  </div>
                ))}
              </div>
              <div className="flex gap-[2.5px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[2.5px]">
                    {week.map((day) => {
                      let doneCount = 0;
                      habits.forEach((h) => {
                        const v = h.history[day.dateStr] || 0;
                        const target = h.targetValue || 1;
                        if (h.type === 'numeric' ? v >= target : v === 1) doneCount++;
                      });
                      const intensity = habits.length > 0 ? doneCount / habits.length : 0;
                      return (
                        <div
                          key={day.dateStr}
                          title={`${day.dateStr}: ${doneCount} dari ${habits.length} kebiasaan selesai`}
                          className={`w-3 h-3 rounded-[2px] ${day.isFuture ? 'opacity-15 bg-[#14141c]' : 'cursor-pointer'}`}
                          style={{
                            backgroundColor:
                              doneCount === 0
                                ? (isDarkMode ? '#181824' : '#e4e4e7')
                                : intensity === 1
                                ? '#8338ec'
                                : intensity >= 0.66
                                ? '#9b5de5'
                                : intensity >= 0.33
                                ? '#b5838d'
                                : (isDarkMode ? '#24143a' : '#ddd6fe'),
                            boxShadow: intensity === 1 ? '0 0 6px rgba(131,56,236,0.6)' : undefined,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-[9.5px] font-mono text-zinc-500 mt-2 pr-1">
              <span>0</span>
              <div className={`w-2.5 h-2.5 rounded-[2px] ${isDarkMode ? 'bg-[#181824]' : 'bg-[#e4e4e7]'}`} />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#ddd6fe]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#b5838d]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#9b5de5]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#8338ec]" />
              <span>Semua</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* HARI PALING PRODUKTIF - scroll-reveal bars */}
      <motion.div
        {...metricCardAnim}
        className={`border rounded-2xl p-4 sm:p-5 shadow-xl ${isDarkMode ? 'bg-[#121217] border-[#8338ec]/30' : 'bg-white border-zinc-200'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            <BarChart2 className="w-4 h-4 text-emerald-500" /> Hari Paling Produktif
          </h3>
          <span className={`text-[10.5px] font-light tracking-wide font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>90 Hari Terakhir</span>
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center font-mono pt-1" role="img" aria-label={`Konsistensi per hari: ${dayOfWeekPerformance.map((d) => `${d.name} ${d.percent}%`).join(', ')}`}>
          {dayOfWeekPerformance.map((day, idx) => (
            <div key={day.name} className="flex flex-col items-center gap-2 group">
              <span className={`text-[10px] sm:text-xs font-semibold ${day.percent > 75 ? 'text-emerald-600' : isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`} aria-hidden>
                {day.percent}%
              </span>
              <div className={`w-full h-24 sm:h-32 rounded-2xl flex items-end justify-center p-1.5 overflow-hidden ${isDarkMode ? 'bg-[#181824] group-hover:bg-[#1f1f2e]' : 'bg-zinc-100 group-hover:bg-zinc-200'} transition-colors`} aria-hidden>
                <motion.div
                  className="w-full rounded-xl will-change-transform"
                  initial={reduceMotion ? false : { height: '10%' }}
                  whileInView={reduceMotion ? undefined : { height: `${Math.max(10, day.percent)}%` }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={reduceMotion ? undefined : { duration: 0.7, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
                  style={{
                    backgroundColor: day.percent > 75 ? '#10b981' : '#8338ec',
                    boxShadow: day.percent > 75 ? '0 0 12px rgba(16,185,129,0.3)' : '0 0 12px rgba(131,56,236,0.2)',
                  }}
                />
              </div>
              <div className="flex flex-col items-center" aria-hidden>
                <span className={`text-[11px] sm:text-xs font-bold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{day.name}</span>
                <span className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{day.count}x</span>
              </div>
              <span className="sr-only">{day.name}: {day.percent}% — {day.count} selesai</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* PERINGKAT */}
      <motion.div
        {...metricCardAnim}
        className={`border rounded-2xl p-4 sm:p-5 shadow-xl ${isDarkMode ? 'bg-[#121217] border-[#8338ec]/30' : 'bg-white border-zinc-200'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            <Target className="w-4 h-4 text-[#8338ec]" /> Peringkat Kebiasaan
          </h3>
          <span className={`text-[10.5px] font-light tracking-wide font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Urut Streak</span>
        </div>
        <div role="list" aria-label="Peringkat kebiasaan — urut streak tertinggi" className="space-y-2">
          {stats
            .sort((a, b) => b.currentStreak - a.currentStreak)
            .map(({ habit, currentStreak, bestStreak, completionRate, totalCompleted }, rank) => (
              <motion.div
                key={habit.id}
                role="listitem"
                aria-label={`${rank + 1}. ${habit.name} — ${currentStreak} hari beruntun, ${completionRate}% 30 hari`}
                initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={reduceMotion ? undefined : { once: true, amount: 0.15 }}
                transition={reduceMotion ? undefined : { duration: 0.4, delay: rank * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 will-change-transform focus-within:ring-2 focus-within:ring-[#8338ec] ${isDarkMode ? 'bg-[#0f0f15] border-[#1e1e28] hover:border-[#8338ec]/40' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'}`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${rank === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : isDarkMode ? 'bg-[#181824] text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>
                    {rank + 1}
                  </span>
                  <span className="text-xl select-none shrink-0">{habit.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`font-bold text-[13.5px] sm:text-[15px] leading-snug truncate ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>{habit.name}</h4>
                      {habit.category && (
                        <span className={`text-[9.5px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-medium border shrink-0 ${isDarkMode ? 'text-zinc-300 bg-[#161622] border-[#272738]' : 'text-zinc-600 bg-white border-zinc-200'}`}>
                          {habit.category}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] sm:text-[12px] font-normal mt-0.5 leading-tight ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {totalCompleted}x selesai • Rekor: <span className={isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}>{bestStreak} hari</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex flex-col items-end w-20" aria-hidden>
                    <span className={`text-[10px] font-mono font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{completionRate}% (30h)</span>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden mt-0.5 ${isDarkMode ? 'bg-[#1a1a24]' : 'bg-zinc-200'}`}>
                      <motion.div className="h-full rounded-full" initial={reduceMotion ? false : { width: 0 }} whileInView={reduceMotion ? undefined : { width: `${completionRate}%` }} viewport={{ once: true }} transition={reduceMotion ? undefined : { duration: 0.8, delay: 0.2 + rank * 0.04, ease: [0.16, 1, 0.3, 1] as const }} style={{ backgroundColor: habit.color }} />
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 shrink-0" style={{ backgroundColor: `${habit.color}20`, color: habit.color }}>
                    <Flame className="w-3.5 h-3.5" />
                    {currentStreak}h
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};
