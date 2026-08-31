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

  // Complete Pomodoro session for habit
  const handlePomodoroComplete = (habitId: string, minutesCompleted: number) => {
    const today = getTodayString();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentVal = h.history[today] || 0;
        const newHistory = { ...h.history };

        if (h.type === 'numeric') {
          const target = h.targetValue || 1;
          const nextVal = currentVal > 0 ? currentVal + minutesCompleted : Math.max(target, minutesCompleted);
          newHistory[today] = nextVal;
        } else {
          newHistory[today] = 1;
        }

        const updated = { ...h, history: newHistory };
        if (userIdRef.current) syncHabitToCloud(userIdRef.current, updated);
        return updated;
      })
    );
  };

  // Demo sample reset (Realistic multi-habit test data for 2-4 weeks with random pattern)
  const handleResetSample = () => {
    if (window.confirm('Muat contoh kebiasaan demo dengan riwayat 2-4 pekan terakhir?')) {
      const today = new Date();
      const gymHistory: Record<string, number> = {};
      const readingHistory: Record<string, number> = {};
      const codingHistory: Record<string, number> = {};
      const noSugarHistory: Record<string, number> = {};
      const bikingHistory: Record<string, number> = {};

      const notesDemo: Record<string, string> = {};
      const moodsDemo: Record<string, import('../types').DailyMood> = {};

      // Seed 28 days back (4 weeks)
      for (let i = 0; i < 28; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = formatDate(d);
        const dayOfWeek = d.getDay(); // 0 Sun .. 6 Sat

        // 1. Olahraga Pagi: rajin di weekdays (75% random)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          if (i % 3 !== 1) gymHistory[dateStr] = 1;
        }

        // 2. Baca Buku: target 20 halaman (random 15 - 30 pages)
        if (i % 2 === 0 || i === 1) {
          readingHistory[dateStr] = i % 4 === 0 ? 30 : 20;
          if (i === 1 || i === 4 || i === 8) {
            notesDemo[dateStr] = i === 1 ? 'Baca bab 4 tentang habits loop' : 'Refleksi bab 2 sangat aplikatif';
            moodsDemo[dateStr] = i === 1 ? 'focused' : 'happy';
          }
        }

        // 3. Coding 60 Menit: 5x seminggu
        if (i % 7 !== 0 && i % 7 !== 4) {
          codingHistory[dateStr] = 60;
        }

        // 4. Anti-Habit (No Sugar): hanya relapse di hari ke-6 dan ke-15
        if (i === 6 || i === 15) {
          noSugarHistory[dateStr] = 1; // Relapse
        }

        // 5. Gowes Weekend: hanya Sabtu & Minggu
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          if (i < 20) bikingHistory[dateStr] = 1;
        }
      }

      const startMonthAgo = new Date(today);
      startMonthAgo.setDate(today.getDate() - 30);
      const createdDateStr = formatDate(startMonthAgo);

      const demoHabits: Habit[] = [
        {
          id: 'demo-1',
          name: 'Olahraga Pagi',
          emoji: '💪',
          color: '#3b82f6',
          category: 'Fitness',
          type: 'boolean',
          frequency: 'weekdays',
          timeOfDay: 'morning',
          createdAt: createdDateStr,
          history: gymHistory,
          notes: {},
        },
        {
          id: 'demo-2',
          name: 'Baca Buku',
          emoji: '📚',
          color: '#eab308',
          category: 'Learning',
          type: 'numeric',
          targetValue: 20,
          unit: 'halaman',
          frequency: 'everyday',
          timeOfDay: 'evening',
          createdAt: createdDateStr,
          history: readingHistory,
          notes: notesDemo,
          moods: moodsDemo,
        },
        {
          id: 'demo-3',
          name: 'Fokus Belajar Coding',
          emoji: '💻',
          color: '#8338ec',
          category: 'Productivity',
          type: 'numeric',
          targetValue: 60,
          unit: 'menit',
          frequency: 'everyday',
          timeOfDay: 'afternoon',
          createdAt: createdDateStr,
          history: codingHistory,
          notes: {},
        },
        {
          id: 'demo-4',
          name: 'No Sugar / Manis',
          emoji: '🛡️',
          color: '#10b981',
          category: 'Health',
          type: 'negative',
          frequency: 'everyday',
          timeOfDay: 'anytime',
          createdAt: createdDateStr,
          history: noSugarHistory,
          notes: {},
        },
        {
          id: 'demo-5',
          name: 'Gowes Sepeda',
          emoji: '🚴',
          color: '#06b6d4',
          category: 'Fitness',
          type: 'boolean',
          frequency: 'weekends',
          timeOfDay: 'morning',
          createdAt: createdDateStr,
          history: bikingHistory,
          notes: {},
        },
      ];

      setHabits(demoHabits);
      if (userIdRef.current) demoHabits.forEach((h) => syncHabitToCloud(userIdRef.current!, h));
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
