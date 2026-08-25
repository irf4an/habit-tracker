// Date helper utilities for minimal habit tracker grid

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
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  monthName: string; // e.g. "Jan", "Feb"
  isFirstDayOfMonth: boolean;
}

// Generate columns for 52-53 weeks (full year backward or compact)
export function getYearDays(numWeeks: number = 52): {
  weeks: Array<Array<{ date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }>>;
  monthLabels: Array<{ name: string; colIndex: number }>;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // We want the last column to end on Saturday of the current week
  const currentDayOfWeek = today.getDay(); // 0: Sun, 6: Sat
  const endSaturday = new Date(today);
  endSaturday.setDate(today.getDate() + (6 - currentDayOfWeek));

  const totalDays = numWeeks * 7;
  const startDate = new Date(endSaturday);
  startDate.setDate(endSaturday.getDate() - totalDays + 1);

  const weeks: Array<Array<{ date: Date; dateStr: string; dayOfWeek: number; isFuture: boolean }>> = [];
  const monthLabels: Array<{ name: string; colIndex: number }> = [];

  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

// Calculate streaks and percentages (with Streak Freeze awareness)
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

  // If today is done or frozen, start from today, else start from yesterday
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

  // Calculate best streak & total count in last 365 days
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

  // Rate in past 30 days
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
