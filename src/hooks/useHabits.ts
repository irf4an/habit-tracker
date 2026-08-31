import { useState, useEffect, useRef, useTransition, startTransition } from 'react';
import { Habit } from '../types';
import { getTodayString, formatDate } from '../utils';
import { syncHabitToCloud, deleteHabitFromCloud } from '../cloudSync';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'minimal_habit_tracker_data_v2';

export function useHabits(userId: string | null) {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      const v1 = localStorage.getItem('minimal_habit_tracker_data_v1');
      if (v1) return JSON.parse(v1);
    } catch (e) {
      console.error('Failed to load habits from localStorage', e);
    }
    return [];
  });

  // Keep a ref to latest userId for callbacks
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.error('Failed to save habits to localStorage', e);
    }
  }, [habits]);

  // Toggle check/value for specific date
  const handleToggleDate = (habitId: string, dateStr: string, value?: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentVal = h.history[dateStr] || 0;
        const targetGoal = h.targetValue || 1;
        const nextVal = value !== undefined ? value : (currentVal >= targetGoal ? 0 : targetGoal);

        const newHistory = { ...h.history };
        if (nextVal > 0) {
          newHistory[dateStr] = nextVal;
        } else {
          delete newHistory[dateStr];
        }
        const updated = { ...h, history: newHistory };
        if (userIdRef.current) syncHabitToCloud(userIdRef.current, updated);
        return updated;
      })
    );
  };

  // Save daily reflection note & optional mood
  const handleSaveNote = (habitId: string, dateStr: string, note: string, mood?: import('../types').DailyMood) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const newNotes = { ...(h.notes || {}) };
        const newMoods = { ...(h.moods || {}) };

        if (note.trim()) {
          newNotes[dateStr] = note.trim();
        } else {
          delete newNotes[dateStr];
        }

        if (mood) {
          newMoods[dateStr] = mood;
        } else if (!note.trim()) {
          delete newMoods[dateStr];
        }

        const updated = { ...h, notes: newNotes, moods: newMoods };
        if (userIdRef.current) syncHabitToCloud(userIdRef.current, updated);
        return updated;
      })
    );
  };

  // Toggle Streak Freeze
  const handleToggleFreeze = (habitId: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentFrozen = h.frozenDates || [];
        const isFrozen = currentFrozen.includes(dateStr);
        const nextFrozen = isFrozen
          ? currentFrozen.filter((d) => d !== dateStr)
          : [...currentFrozen, dateStr];

        if (!isFrozen) {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#0284c7', '#38bdf8', '#ffffff'],
          });
        }

        const updated = { ...h, frozenDates: nextFrozen };
        if (userIdRef.current) syncHabitToCloud(userIdRef.current, updated);
        return updated;
      })
    );
  };

  // Save or Create Habit
  const handleSaveHabit = (data: Partial<Habit>) => {
    if (data.id) {
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== data.id) return h;
          const updated = { ...h, ...data };
          if (userIdRef.current) syncHabitToCloud(userIdRef.current, updated);
          return updated;
        })
      );
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        name: data.name || 'New Habit',
        emoji: data.emoji || '🎯',
        color: data.color || '#3b82f6',
        category: data.category || 'Fitness',
        type: data.type || 'boolean',
        targetValue: data.targetValue || 1,
        unit: data.unit,
        frequency: data.frequency || 'everyday',
        weeklyTargetDays: data.weeklyTargetDays,
        timeOfDay: data.timeOfDay || 'anytime',
        reminderEnabled: Boolean(data.reminderEnabled),
        reminderTime: data.reminderTime || '20:00',
        createdAt: getTodayString(),
        history: {},
        notes: {},
        archived: false,
      };
      setHabits((prev) => [...prev, newHabit]);
      if (userIdRef.current) syncHabitToCloud(userIdRef.current, newHabit);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Delete Habit
  const handleDeleteHabit = (habitId: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      if (userIdRef.current) deleteHabitFromCloud(userIdRef.current, habitId);
    }
  };

  // Toggle Archive
  const handleToggleArchive = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const updated = { ...h, archived: !h.archived };
        if (userIdRef.current) syncHabitToCloud(userIdRef.current, updated);
        return updated;
      })
    );
  };

  // Complete Pomodoro session for habit — also accumulates focusLog per day
  const handlePomodoroComplete = (habitId: string, minutesCompleted: number) => {
    const today = getTodayString();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentVal = h.history[today] || 0;
        const newHistory = { ...h.history };
        const newFocusLog = { ...(h.focusLog || {}) };
        const newSessions = { ...(h.focusSessions || {}) };
        newFocusLog[today] = (newFocusLog[today] || 0) + minutesCompleted;
        newSessions[today] = (newSessions[today] || 0) + 1;

        if (h.type === 'numeric') {
          const target = h.targetValue || 1;
          const nextVal = currentVal > 0 ? currentVal + minutesCompleted : Math.max(target, minutesCompleted);
          newHistory[today] = nextVal;
        } else {
          newHistory[today] = 1;
        }

        const updated = { ...h, history: newHistory, focusLog: newFocusLog, focusSessions: newSessions };
        if (userIdRef.current) syncHabitToCloud(userIdRef.current, updated);
        return updated;
      })
    );
  };

  // Production: clear all habits (hapus semua, bukan seeder demo)
  const handleResetSample = () => {
    if (habits.length === 0) return;
    if (window.confirm('Hapus semua kebiasaan? Aksi ini tidak bisa dibatalkan.')) {
      const ids = habits.map((h) => h.id);
      setHabits([]);
      if (userIdRef.current) ids.forEach((id) => deleteHabitFromCloud(userIdRef.current!, id));
    }
  };

  return {
    habits,
    setHabits,
    handleToggleDate,
    handleSaveNote,
    handleToggleFreeze,
    handleSaveHabit,
    handleDeleteHabit,
    handleToggleArchive,
    handlePomodoroComplete,
    handleResetSample,
  };
}
