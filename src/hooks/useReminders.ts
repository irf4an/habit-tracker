import { useEffect } from 'react';
import { Habit, QuietHours } from '../types';
import { getTodayString } from '../utils';
import { sendHabitNotification, isInQuietHours } from '../notification';

const EVENING_RECAP_KEY = 'minimal_habit_last_evening_recap';

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

      // 1. Per-Habit Reminder (waktu custom per habit)
      habits.forEach((habit) => {
        if (!habit.reminderEnabled || habit.archived) return;
        if (habit.snoozedUntil && nowMs < habit.snoozedUntil) return;
        const isTime = habit.reminderTime === currentTimeStr;
        if (!isTime) return;
        if (habit.lastNotifiedDate === todayStr) return;
        const isDone = (habit.history[todayStr] || 0) >= (habit.targetValue || 1);
        if (isDone) return;

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

      // 2. Evening Push Notification Recap (Jam 21:00 / Pukul 9 Malam)
      // Memicu notifikasi ringkasan jika masih ada habit aktif yang belum dicentang hari ini
      if (currentTimeStr === '21:00') {
        const lastRecapDate = localStorage.getItem(EVENING_RECAP_KEY);
        if (lastRecapDate !== todayStr) {
          const activeList = habits.filter((h) => !h.archived);
          const remaining = activeList.filter((h) => {
            const val = h.history[todayStr] || 0;
            const target = h.targetValue || 1;
            return h.type === 'numeric' ? val < target : val !== 1;
          });

          if (remaining.length > 0) {
            sendHabitNotification(
              `Evaluasi Malam: ${remaining.length} Kebiasaan Tersisa`,
              `Yuk selesaikan ${remaining.map((h) => h.name).slice(0, 3).join(', ')}${remaining.length > 3 ? '...' : ''} sebelum tidur agar streak tetap aman.`,
              '🌙'
            );
            localStorage.setItem(EVENING_RECAP_KEY, todayStr);
          }
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [habits, quietHours, setHabits]);
}
