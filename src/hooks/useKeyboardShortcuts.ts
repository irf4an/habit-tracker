import { useEffect } from 'react';
import { Habit } from '../types';
import { getTodayString } from '../utils';

interface KeyboardShortcutsOptions {
  habits: Habit[];
  onOpenNewHabit: () => void;
  onToggleDate: (habitId: string, dateStr: string, value?: number) => void;
}

export function useKeyboardShortcuts({
  habits,
  onOpenNewHabit,
  onToggleDate,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard against input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onOpenNewHabit();
      }

      // Keys 1 to 9 toggle today's check for habit index
      const num = parseInt(e.key, 10);
      const activeList = habits.filter((h) => !h.archived);
      if (!isNaN(num) && num >= 1 && num <= activeList.length) {
        const targetHabit = activeList[num - 1];
        if (targetHabit) {
          const today = getTodayString();
          const curVal = targetHabit.history[today] || 0;
          const targetGoal = targetHabit.targetValue || 1;
          const nextVal = curVal >= targetGoal ? 0 : targetGoal;
          onToggleDate(targetHabit.id, today, nextVal);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [habits, onOpenNewHabit, onToggleDate]);
}
