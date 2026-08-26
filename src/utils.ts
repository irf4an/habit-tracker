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
    let firstDayInWeekMonth = -1;

    for (let d = 0; d < 7; d++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + (w * 7 + d));
      const dateStr = formatDate(curDate);
      const isFuture = curDate.getTime() > today.getTime();

      weekDays.push({
        date: curDate,
        dateStr,
        dayOfWeek: d,
        isFuture,
      });

      if (curDate.getDate() <= 7 && firstDayInWeekMonth === -1) {
        firstDayInWeekMonth = curDate.getMonth();
      }
    }

    if (firstDayInWeekMonth !== -1 && firstDayInWeekMonth !== lastLabeledMonth) {
      monthLabels.push({
        name: shortMonths[firstDayInWeekMonth],
        colIndex: w,
      });
      lastLabeledMonth = firstDayInWeekMonth;
    }

    weeks.push(weekDays);
  }

  return { weeks, monthLabels };
}

// Calculate streaks and percentages
export function calculateStreak(
  history: Record<string, number>,
  frozenDates: string[] = []
): {
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
  totalCompleted: number;
  frozenCount: number;
} {
  const isDoneOrFrozen = (dateStr: string) => {
    return (history[dateStr] && history[dateStr] > 0) || frozenDates.includes(dateStr);
  };

  const isActuallyDone = (dateStr: string) => {
    return history[dateStr] && history[dateStr] > 0;
  };

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
  const today = new Date();

  while (cur.getTime() <= today.getTime()) {
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
  while (pCur.getTime() <= today.getTime()) {
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
