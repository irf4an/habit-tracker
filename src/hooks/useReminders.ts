import { useEffect } from 'react';
import { Habit, QuietHours } from '../types';
import { getTodayString } from '../utils';
import { sendHabitNotification, isInQuietHours } from '../notification';

export function useReminders(
  habits: Habit[],
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>,
  quietHours: QuietHours
) {
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const todayStr = getTodayString();
      const nowMs = Date.now();

      if (quietHours.enabled && isInQuietHours(quietHours.start, quietHours.end, now)) return;

      habits.forEach((habit) => {
        if (!habit.reminderEnabled || habit.archived) return;
        // Snoozed?
        if (habit.snoozedUntil && nowMs < habit.snoozedUntil) return;
        // Only fire once per day per habit, unless snoozed
        const isTime = habit.reminderTime === currentTimeStr;
        if (!isTime) return;
        if (habit.lastNotifiedDate === todayStr) return;
        const isDone = (habit.history[todayStr] || 0) >= (habit.targetValue || 1);
        if (isDone) return;

        // Snooze handler via notification
        const snoozeMs = 10 * 60 * 1000;
        sendHabitNotification(
          `Waktunya ${habit.name}!`,
          `Tap untuk buka — snooze 10 menit jika belum sempat.`,
          habit.emoji
        );

        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id
              ? { ...h, lastNotifiedDate: todayStr, snoozedUntil: nowMs + snoozeMs }
              : h
          )
        );

        setTimeout(() => {
          setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, snoozedUntil: undefined } : h)));
        }, snoozeMs + 1000);
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [habits, quietHours, setHabits]);
}
