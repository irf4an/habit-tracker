import { Habit } from './types';

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getTodayString(): string {
  return formatDate(new Date());
}

export function formatFocusMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}j` : `${h}j ${m}m`;
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayName = dayNames[d.getDay()];
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

export interface GridColumn {
  date: Date;
  dateStr: string;
  dayOfWeek: number;
  monthName: string;
  isFirstDayOfMonth: boolean;
}

// Generate columns for weeks
export function getYearDays(numWeeks: number = 52): {
  weeks: Array<Array<{ date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }>>;
  monthLabels: Array<{ name: string; colIndex: number }>;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDayOfWeek = today.getDay();
  const endSaturday = new Date(today);
  endSaturday.setDate(today.getDate() + (6 - currentDayOfWeek));

  const totalDays = numWeeks * 7;
  const startDate = new Date(endSaturday);
  startDate.setDate(endSaturday.getDate() - totalDays + 1);

  const weeks: Array<Array<{ date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }>> = [];
  const monthLabels: Array<{ name: string; colIndex: number }> = [];

  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  let lastLabeledMonth = -1;

  for (let w = 0; w < numWeeks; w++) {
    const weekDays: Array<{ date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }> = [];
    // Count days per month in this week to find the dominant month
    const monthCounts = new Map<number, number>();
    for (let d = 0; d < 7; d++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + (w * 7 + d));
      const dateStr = formatDate(curDate);
      const isFuture = curDate.getTime() > today.getTime();
      weekDays.push({ date: curDate, dateStr, dayOfWeek: d, isFuture });
      const m = curDate.getMonth();
      monthCounts.set(m, (monthCounts.get(m) || 0) + 1);
    }
    // Pick dominant month (most days in the week) for label — fixes "Agu" in late-August
    let candidate = -1; let best = -1;
    for (const [m, c] of monthCounts.entries()) { if (c > best) { best = c; candidate = m; } }
    if (candidate !== -1 && candidate !== lastLabeledMonth) {
      monthLabels.push({ name: shortMonths[candidate], colIndex: w });
      lastLabeledMonth = candidate;
    }
    weeks.push(weekDays);
  }

  return { weeks, monthLabels };
}

export const FREEZE_WEEKLY_LIMIT = 2;

export function countFreezesInLast7Days(frozenDates: string[], anchorDate: Date = new Date()): number {
  const a = new Date(anchorDate); a.setHours(0, 0, 0, 0);
  const start = new Date(a); start.setDate(a.getDate() - 6);
  return frozenDates.filter((d) => {
    const dt = parseDate(d); dt.setHours(0, 0, 0, 0);
    return dt.getTime() >= start.getTime() && dt.getTime() <= a.getTime();
  }).length;
}

export function canFreezeOnDate(frozenDates: string[], dateStr: string, weeklyLimit: number = FREEZE_WEEKLY_LIMIT): boolean {
  if (frozenDates.includes(dateStr)) return true; // sudah freeze → boleh batal
  const d = parseDate(dateStr);
  return countFreezesInLast7Days(frozenDates, d) < weeklyLimit;
}

export function freezeRemaining(frozenDates: string[], dateStr: string, weeklyLimit: number = FREEZE_WEEKLY_LIMIT): number {
  if (frozenDates.includes(dateStr)) return weeklyLimit - countFreezesInLast7Days(frozenDates.filter((x) => x !== dateStr), parseDate(dateStr));
  return Math.max(0, weeklyLimit - countFreezesInLast7Days(frozenDates, parseDate(dateStr)));
}

// Schedule helpers for streak logic per frequency
function isScheduledDate(d: Date, freq?: Habit['frequency']): boolean {
  if (!freq || freq === 'everyday' || freq === 'weekly_target') return true;
  const day = d.getDay(); // 0 Sun .. 6 Sat
  if (freq === 'weekdays') return day >= 1 && day <= 5;
  if (freq === 'weekends') return day === 0 || day === 6;
  return true;
}

function getWeekStart(d: Date): Date {
  // Monday = 0 .. Sunday = 6 (ISO)
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(d.getDate() + diff);
  return m;
}

function startOfToday(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

function countDoneInRange(history: Record<string, number>, frozenDates: string[], start: Date, end: Date): number {
  let c = 0;
  const cur = new Date(start);
  while (cur.getTime() <= end.getTime()) {
    const s = formatDate(cur);
    if ((history[s] && history[s] > 0) || frozenDates.includes(s)) {
      // freeze tidak hitung sebagai selesai untuk weekly_target, tapi jaga streak — ditangani di weekly logic
      if (history[s] && history[s] > 0) c++;
      else if (frozenDates.includes(s)) c++; // freeze dihitung sebagai selesai untuk weekly
    }
    cur.setDate(cur.getDate() + 1);
  }
  return c;
}

function isWeeklyTargetMetForWeek(history: Record<string, number>, frozenDates: string[], weekStart: Date, target: number): boolean {
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const done = countDoneInRange(history, frozenDates, weekStart, weekEnd);
  return done >= target;
}

// Calculate streaks and percentages — aware of frequency + numeric target
export function calculateStreak(
  history: Record<string, number>,
  frozenDates: string[] = [],
  habit?: Pick<Habit, 'frequency' | 'weeklyTargetDays' | 'type' | 'targetValue' | 'createdAt'>
): {
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
  totalCompleted: number;
  frozenCount: number;
} {
  const targetForHabit = habit?.targetValue ?? 1;
  const isNumericHabit = habit?.type === 'numeric';
  const isNegativeHabit = habit?.type === 'negative';

  // For negative habits: history[dateStr] === 1 means "RELAPSE" (failed day)
  // Clean day = not relapsed (history is 0 / undefined)
  const isDayCompleted = (dateStr: string) => {
    const v = history[dateStr] ?? 0;
    if (isNegativeHabit) {
      return v === 0; // 0 = Clean (success), 1 = Relapse (failed)
    }
    if (isNumericHabit) return v >= targetForHabit;
    return v === 1;
  };

  const isDoneOrFrozen = (dateStr: string) => {
    return isDayCompleted(dateStr) || frozenDates.includes(dateStr);
  };

  const isActuallyDone = (dateStr: string) => {
    return isDayCompleted(dateStr);
  };

  // Special Logic for Anti-Habit / Negative Habits (Clean Days Streak)
  if (isNegativeHabit) {
    const today = startOfToday();
    const createdDate = habit?.createdAt ? parseDate(habit.createdAt) : new Date(today);
    createdDate.setHours(0, 0, 0, 0);

    // 1. Calculate Current Clean Streak (counting back from today until latest relapse)
    let currentStreak = 0;
    let curCheck = new Date(today);
    while (curCheck.getTime() >= createdDate.getTime()) {
      const s = formatDate(curCheck);
      const isRelapsed = (history[s] ?? 0) > 0;
      if (!isRelapsed || frozenDates.includes(s)) {
        currentStreak++;
        curCheck.setDate(curCheck.getDate() - 1);
      } else {
        break;
      }
    }

    // 2. Calculate Best Clean Streak & Total Clean Days
    let bestStreak = 0;
    let tempStreak = 0;
    let cleanDaysTotal = 0;
    let curScan = new Date(createdDate);

    while (curScan.getTime() <= today.getTime()) {
      const s = formatDate(curScan);
      const isRelapsed = (history[s] ?? 0) > 0;
      if (!isRelapsed || frozenDates.includes(s)) {
        cleanDaysTotal++;
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      curScan.setDate(curScan.getDate() + 1);
    }
    if (currentStreak > bestStreak) bestStreak = currentStreak;

    // 3. Completion Rate 30D (clean days / 30)
    const past30 = new Date(today);
    past30.setDate(past30.getDate() - 29);
    let past30Clean = 0;
    let pCur = new Date(past30);
    while (pCur.getTime() <= today.getTime()) {
      const s = formatDate(pCur);
      const isRelapsed = (history[s] ?? 0) > 0;
      if (!isRelapsed || frozenDates.includes(s)) past30Clean++;
      pCur.setDate(pCur.getDate() + 1);
    }
    const completionRate = Math.round((past30Clean / 30) * 100);

    return {
      currentStreak,
      bestStreak,
      completionRate,
      totalCompleted: cleanDaysTotal,
      frozenCount: frozenDates.length,
    };
  }

  // Weekly-target streak (e.g. 4x/minggu): streak = minggu beruntun yang targetnya tercapai
  const isWeekly = habit?.frequency === 'weekly_target';
  const weeklyTarget = habit?.weeklyTargetDays ?? 4;

  if (isWeekly) {
    const today = startOfToday();
    // completedCount tetap hitung hari selesai
    let completedCount = 0;
    const yA = new Date(today); yA.setDate(today.getDate() - 364);
    const c = new Date(yA);
    while (c.getTime() <= today.getTime()) {
      const s = formatDate(c);
      if (history[s] && history[s] > 0) completedCount++;
      c.setDate(c.getDate() + 1);
    }

    // Current weekly streak: hitung mundur per minggu dari minggu ini
    let currentStreak = 0;
    let ws = getWeekStart(today);
    // Jika minggu ini belum tercapai, tapi masih ada sisa hari, jangan pecah streak dulu — anggap grace
    // Tapi kalau minggu ini sudah lewat 7 hari dan belum tercapai → pecah
    // Sederhananya: mulai dari minggu ini, jika belum tercapai dan hari ini bukan akhir minggu, cek minggu lalu dulu
    const thisWeekMet = isWeeklyTargetMetForWeek(history, frozenDates, ws, weeklyTarget);
    const isEndOfWeek = today.getDay() === 0; // Minggu
    if (!thisWeekMet && !isEndOfWeek) {
      // minggu ini masih berjalan → jangan hitung pecah, mulai dari minggu lalu
      ws = new Date(ws); ws.setDate(ws.getDate() - 7);
    }
    let cursor = new Date(ws);
    while (true) {
      if (isWeeklyTargetMetForWeek(history, frozenDates, cursor, weeklyTarget)) {
        currentStreak++;
        cursor = new Date(cursor); cursor.setDate(cursor.getDate() - 7);
      } else {
        break;
      }
    }

    // Best weekly streak: scan 52 minggu ke belakang
    let bestStreak = currentStreak;
    let temp = 0;
    const earliest = new Date(today); earliest.setDate(today.getDate() - 364);
    let scan = getWeekStart(earliest);
    const endWeek = getWeekStart(today);
    while (scan.getTime() <= endWeek.getTime()) {
      if (isWeeklyTargetMetForWeek(history, frozenDates, scan, weeklyTarget)) {
        temp++;
        if (temp > bestStreak) bestStreak = temp;
      } else {
        temp = 0;
      }
      scan = new Date(scan); scan.setDate(scan.getDate() + 7);
    }

    // Completion rate mingguan: 4 minggu terakhir
    let weeksTotal = 0, weeksMet = 0;
    let w4 = getWeekStart(today);
    for (let i = 0; i < 4; i++) {
      const s = new Date(w4); s.setDate(w4.getDate() - i * 7);
      // hanya hitung minggu yang sudah selesai atau berjalan
      weeksTotal++;
      if (isWeeklyTargetMetForWeek(history, frozenDates, s, weeklyTarget)) weeksMet++;
    }
    const completionRate = weeksTotal ? Math.round((weeksMet / weeksTotal) * 100) : 0;

    return {
      currentStreak,
      bestStreak,
      completionRate,
      totalCompleted: completedCount,
      frozenCount: frozenDates.length,
    };
  }

  // Daily / weekdays / weekends: streak harian terjadwal (mengabaikan off-days)
  const freq = habit?.frequency || 'everyday';
  const today = startOfToday();

  // Cari tanggal terjadwal terakhir (hari ini jika terjadwal, atau tanggal jadwal sebelumnya)
  const getPreviousScheduledDate = (from: Date): Date => {
    const cur = new Date(from);
    cur.setDate(cur.getDate() - 1);
    while (!isScheduledDate(cur, freq)) {
      cur.setDate(cur.getDate() - 1);
    }
    return cur;
  };

  const getLatestScheduledDate = (from: Date): Date => {
    const cur = new Date(from);
    while (!isScheduledDate(cur, freq)) {
      cur.setDate(cur.getDate() - 1);
    }
    return cur;
  };

  let currentStreak = 0;
  const isTodaySched = isScheduledDate(today, freq);
  const latestSched = getLatestScheduledDate(today);
  const latestSchedStr = formatDate(latestSched);

  if (isTodaySched) {
    if (isDoneOrFrozen(latestSchedStr)) {
      let cur = new Date(latestSched);
      while (true) {
        const s = formatDate(cur);
        if (isDoneOrFrozen(s)) {
          if (isActuallyDone(s)) currentStreak++;
          cur = getPreviousScheduledDate(cur);
        } else {
          break;
        }
      }
    } else {
      // Hari ini terjadwal tapi belum dicentang, cek apakah jadwal sebelumnya selesai (grace period)
      const prevSched = getPreviousScheduledDate(latestSched);
      const prevSchedStr = formatDate(prevSched);
      if (isDoneOrFrozen(prevSchedStr)) {
        let cur = new Date(prevSched);
        while (true) {
          const s = formatDate(cur);
          if (isDoneOrFrozen(s)) {
            if (isActuallyDone(s)) currentStreak++;
            cur = getPreviousScheduledDate(cur);
          } else {
            break;
          }
        }
      }
    }
  } else {
    // Hari ini adalah off-day (mis. sekarang hari kerja untuk habit weekend), streak tetap utuh dari weekend terakhir
    if (isDoneOrFrozen(latestSchedStr)) {
      let cur = new Date(latestSched);
      while (true) {
        const s = formatDate(cur);
        if (isDoneOrFrozen(s)) {
          if (isActuallyDone(s)) currentStreak++;
          cur = getPreviousScheduledDate(cur);
        } else {
          break;
        }
      }
    }
  }

  // Hitung best streak sepanjang 365 hari ke belakang
  let bestStreak = currentStreak;
  let tempStreak = 0;
  let completedCount = 0;

  const yearAgo = new Date(today);
  yearAgo.setDate(yearAgo.getDate() - 364);

  let curScan = new Date(yearAgo);
  while (curScan.getTime() <= today.getTime()) {
    const s = formatDate(curScan);
    if (isScheduledDate(curScan, freq)) {
      if (isDoneOrFrozen(s)) {
        if (isActuallyDone(s)) {
          completedCount++;
          tempStreak++;
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    curScan.setDate(curScan.getDate() + 1);
  }

  if (currentStreak > bestStreak) bestStreak = currentStreak;

  // Completion rate 30 hari: hanya bandingkan dengan jumlah hari terjadwal dalam 30 hari terakhir
  const past30 = new Date(today);
  past30.setDate(past30.getDate() - 29);
  let past30ScheduledCount = 0;
  let past30Completed = 0;
  let pCur = new Date(past30);
  while (pCur.getTime() <= today.getTime()) {
    if (isScheduledDate(pCur, freq)) {
      past30ScheduledCount++;
      const s = formatDate(pCur);
      if (isActuallyDone(s)) past30Completed++;
    }
    pCur.setDate(pCur.getDate() + 1);
  }

  const completionRate = past30ScheduledCount > 0
    ? Math.round((past30Completed / past30ScheduledCount) * 100)
    : 0;

  return {
    currentStreak,
    bestStreak,
    completionRate,
    totalCompleted: completedCount,
    frozenCount: frozenDates.length,
  };
}

// Weekly Review & Automated Digest Helper (ISO Week: Monday - Sunday)
// Formatter tanggal natural Indonesia (17–23 Agustus)
function formatNaturalWeekRange(start: Date, end: Date): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const sameMonth = start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${monthNames[end.getMonth()]}`;
  }

  // Cross-month: 29 Agustus – 4 September
  return `${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]}`;
}

export interface WeeklyReviewReport {
  lastWeekStartStr: string; // Natural date (17–23 Agustus)
  lastWeekEndStr: string;   // YYYY-MM-DD raw (Minggu, untuk compat)
  hasData: boolean;
  score: number; // 0 - 100%
  previousScore: number | null; // null jika 2 pekan lalu kosong
  trendDiff: number | null; // e.g. +12 or -5
  bestHabit: { name: string; emoji: string; color: string; rate: number } | null;
  needsAttentionHabit: { name: string; emoji: string; color: string; rate: number } | null;
  habitBreakdown: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
    completedDays: number;
    scheduledDays: number;
    rate: number;
  }>;
}

export function getWeeklyReviewData(habits: Habit[]): WeeklyReviewReport {
  const today = startOfToday();
  const currentMonday = getWeekStart(today);

  // Pekan Lalu: Senin s/d Minggu lalu
  const lastWeekStart = new Date(currentMonday);
  lastWeekStart.setDate(currentMonday.getDate() - 7);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

  // Dua Pekan Lalu: Senin s/d Minggu 2 pekan lalu
  const prevWeekStart = new Date(lastWeekStart);
  prevWeekStart.setDate(lastWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(prevWeekStart);
  prevWeekEnd.setDate(prevWeekStart.getDate() + 6);

  const activeHabits = habits.filter((h) => !h.archived);

  // Helper evaluator per habit dalam rentang tanggal
  const evaluateRange = (start: Date, end: Date) => {
    let totalScheduled = 0;
    let totalDone = 0;
    const perHabit: Array<{ id: string; name: string; emoji: string; color: string; completedDays: number; scheduledDays: number; rate: number }> = [];

    activeHabits.forEach((h) => {
      let schedCount = 0;
      let doneCount = 0;
      const target = h.targetValue || 1;
      const isNeg = h.type === 'negative';
      const isNum = h.type === 'numeric';

      const cur = new Date(start);
      const habitCreatedStr = h.createdAt || '1970-01-01';

      while (cur.getTime() <= end.getTime()) {
        const s = formatDate(cur);
        // Kebiasaan hanya dihitung jika tanggal yang dievaluasi >= tanggal kebiasaan dibuat
        const isAfterCreated = s >= habitCreatedStr;

        if (isAfterCreated && isScheduledDate(cur, h.frequency)) {
          schedCount++;
          const val = h.history[s] ?? 0;
          const isFrozen = (h.frozenDates || []).includes(s);

          if (isNeg) {
            // Negative: clean (val === 0) or frozen
            if (val === 0 || isFrozen) doneCount++;
          } else if (isNum) {
            if (val >= target || isFrozen) doneCount++;
          } else {
            if (val === 1 || isFrozen) doneCount++;
          }
        }
        cur.setDate(cur.getDate() + 1);
      }

      totalScheduled += schedCount;
      totalDone += doneCount;
      const rate = schedCount > 0 ? Math.round((doneCount / schedCount) * 100) : 0;
      perHabit.push({
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        completedDays: doneCount,
        scheduledDays: schedCount,
        rate,
      });
    });

    const score = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;
    return { score, totalScheduled, totalDone, perHabit };
  };

  const lastWeek = evaluateRange(lastWeekStart, lastWeekEnd);
  const prevWeek = evaluateRange(prevWeekStart, prevWeekEnd);

  const hasData = activeHabits.length > 0 && lastWeek.totalScheduled > 0;
  const hasPrevData = activeHabits.length > 0 && prevWeek.totalDone > 0;

  const previousScore = hasPrevData ? prevWeek.score : null;
  const trendDiff = previousScore !== null ? lastWeek.score - previousScore : null;

  // Filter out habits that were created after the evaluated week (scheduledDays === 0)
  const evaluatedHabits = lastWeek.perHabit.filter((h) => h.scheduledDays > 0);
  const sortedHabits = [...evaluatedHabits].sort((a, b) => b.rate - a.rate);
  const bestHabit = sortedHabits.length > 0 && sortedHabits[0].rate > 0 ? sortedHabits[0] : null;
  const lowestHabit = sortedHabits.length > 0 ? sortedHabits[sortedHabits.length - 1] : null;
  const needsAttentionHabit = lowestHabit && lowestHabit.rate < 100 ? lowestHabit : null;

  return {
    lastWeekStartStr: formatNaturalWeekRange(lastWeekStart, lastWeekEnd),
    lastWeekEndStr: formatDate(lastWeekEnd),
    hasData: evaluatedHabits.length > 0 && lastWeek.totalScheduled > 0,
    score: lastWeek.score,
    previousScore,
    trendDiff,
    bestHabit,
    needsAttentionHabit,
    habitBreakdown: sortedHabits,
  };
}

// Export habits data to CSV for Excel / Google Sheets
export function exportHabitsToCSV(habits: Habit[]) {
  const rows: string[][] = [
    ['Habit ID', 'Habit Name', 'Category', 'Type', 'Target Goal', 'Unit', 'Date (YYYY-MM-DD)', 'Status', 'Logged Value', 'Reflection Note', 'Streak Freeze']
  ];

  habits.forEach((habit) => {
    const dates = Object.keys(habit.history).sort();
    if (dates.length === 0) {
      rows.push([
        habit.id,
        habit.name,
        habit.category || 'General',
        habit.type || 'boolean',
        String(habit.targetValue || 1),
        habit.unit || '',
        habit.createdAt,
        'Created',
        '0',
        '',
        'No'
      ]);
    } else {
      dates.forEach((dateStr) => {
        const val = habit.history[dateStr] || 0;
        const target = habit.targetValue || 1;
        const isDone = habit.type === 'numeric' ? val >= target : val === 1;
        const isFrozen = (habit.frozenDates || []).includes(dateStr);
        const note = habit.notes?.[dateStr] || '';

        rows.push([
          habit.id,
          `"${habit.name.replace(/"/g, '""')}"`,
          habit.category || 'General',
          habit.type || 'boolean',
          String(target),
          habit.unit || '',
          dateStr,
          isDone ? 'Completed' : isFrozen ? 'Frozen' : 'Incomplete',
          String(val),
          `"${note.replace(/"/g, '""')}"`,
          isFrozen ? 'Yes' : 'No'
        ]);
      });
    }
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `habit-tracker-export-${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
