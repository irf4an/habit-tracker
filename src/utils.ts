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
  habit?: Pick<Habit, 'frequency' | 'weeklyTargetDays' | 'type' | 'targetValue'>
): {
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
  totalCompleted: number;
  frozenCount: number;
} {
  const targetForHabit = habit?.targetValue ?? 1;
  const isNumericHabit = habit?.type === 'numeric';
  const isDayCompleted = (dateStr: string) => {
    const v = history[dateStr] ?? 0;
    if (isNumericHabit) return v >= targetForHabit;
    return v === 1;
  };

  const isDoneOrFrozen = (dateStr: string) => {
    return isDayCompleted(dateStr) || frozenDates.includes(dateStr);
  };

  const isActuallyDone = (dateStr: string) => {
    return isDayCompleted(dateStr);
  };

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

  // Daily / weekdays / weekends: streak harian (existing logic)
  const todayStr = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  let currentStreak = 0;
  let checkDate = new Date();

  if (isDoneOrFrozen(todayStr)) {
    while (true) {
      const s = formatDate(checkDate);
      if (isDoneOrFrozen(s)) {
        if (isActuallyDone(s)) currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (isDoneOrFrozen(yesterdayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const s = formatDate(checkDate);
      if (isDoneOrFrozen(s)) {
        if (isActuallyDone(s)) currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  let bestStreak = 0;
  let tempStreak = 0;
  let completedCount = 0;

  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 364);

  const cur = new Date(yearAgo);
  const today2 = new Date();

  while (cur.getTime() <= today2.getTime()) {
    const s = formatDate(cur);
    if (isDoneOrFrozen(s)) {
      if (isActuallyDone(s)) {
        completedCount++;
        tempStreak++;
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (currentStreak > bestStreak) bestStreak = currentStreak;

  const past30 = new Date();
  past30.setDate(past30.getDate() - 29);
  let past30Completed = 0;
  const pCur = new Date(past30);
  while (pCur.getTime() <= today2.getTime()) {
    const s = formatDate(pCur);
    if (isActuallyDone(s)) past30Completed++;
    pCur.setDate(pCur.getDate() + 1);
  }

  const completionRate = Math.round((past30Completed / 30) * 100);

  return {
    currentStreak,
    bestStreak,
    completionRate,
    totalCompleted: completedCount,
    frozenCount: frozenDates.length,
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
