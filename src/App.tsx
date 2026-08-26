import React, { useState, useEffect, useRef } from 'react';
import { Habit, ViewTab } from './types';
import { HabitCard } from './components/HabitCard';
import { HabitModal } from './components/HabitModal';
import { StatsView } from './components/StatsView';
import { ManageView } from './components/ManageView';
import { ShareCardModal } from './components/ShareCardModal';
import { OnboardingModal } from './components/OnboardingModal';
import { PomodoroTimer, PomodoroSession } from './components/PomodoroTimer';
import { AchievementsModal } from './components/AchievementsModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { HelpModal } from './components/HelpModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { calculateBadges } from './achievements';
import { sendHabitNotification, isInQuietHours } from './notification';
import { playCheckSound, playCelebrationSound } from './sound';
import { UserProfile, QuietHours } from './types';
import { getTodayString, formatDate } from './utils';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  fetchCloudHabits,
  syncHabitToCloud,
  deleteHabitFromCloud,
  fetchCloudProfile,
  syncProfileToCloud,
} from './cloudSync';
import {
  Calendar as CalendarIcon,
  BarChart3,
  SlidersHorizontal,
  HelpCircle,
  Sparkles,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'minimal_habit_tracker_data_v2';

// Initial realistic demo habits resembling the screenshot + advanced fields
const generateDemoHabits = (): Habit[] => {
  const today = new Date();
  const gymHistory: Record<string, number> = {};
  const readingHistory: Record<string, number> = {};
  const videoHistory: Record<string, number> = {};

  // Fill sample patterns over the last 150 days
  for (let i = 0; i < 150; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);

    // Gym pattern: recent 3 days checked, occasional gaps
    if (i < 3) {
      gymHistory[dateStr] = 1;
    } else if (i % 7 === 1 || i % 7 === 2 || i % 7 === 4 || i % 5 === 0) {
      gymHistory[dateStr] = 1;
    }

    // Reading pattern: numeric pages (e.g. 20 pages)
    if (i >= 2 && i < 15) {
      readingHistory[dateStr] = 20;
    } else if (i >= 20 && i < 35 && i % 2 === 0) {
      readingHistory[dateStr] = 15;
    }

    // Video pattern: newly started
    if (i === 1 || i === 4) {
      videoHistory[dateStr] = 1;
    }
  }

  return [
    {
      id: 'habit-1',
      name: 'gym',
      emoji: '💪',
      color: '#3b82f6', // sky blue
      category: 'Fitness',
      type: 'boolean',
      frequency: 'everyday',
      createdAt: '2026-05-10',
      history: gymHistory,
      notes: {},
    },
    {
      id: 'habit-2',
      name: 'reading',
      emoji: '📚',
      color: '#eab308', // amber yellow
      category: 'Learning',
      type: 'numeric',
      targetValue: 20,
      unit: 'pages',
      frequency: 'everyday',
      createdAt: '2026-06-01',
      history: readingHistory,
      notes: {},
    },
    {
      id: 'habit-3',
      name: '1 manware video',
      emoji: '🔥',
      color: '#f97316', // bright orange
      category: 'Productivity',
      type: 'boolean',
      frequency: 'everyday',
      createdAt: '2026-08-15',
      history: videoHistory,
      notes: {},
    },
  ];
};

export function App() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      // Migrate v1 data if present
      const v1 = localStorage.getItem('minimal_habit_tracker_data_v1');
      if (v1) {
        return JSON.parse(v1);
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }
    return generateDemoHabits();
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('calendar');
  const [isFullView, setIsFullView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // Default false (compact fit) on mobile screens!
    }
    return true;
  });
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [shareHabit, setShareHabit] = useState<Habit | null>(null);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('minimal_habit_auth_user_id');
    } catch {
      return null;
    }
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('minimal_habit_auth_email');
    } catch {
      return null;
    }
  });
  const [pomodoroSession, setPomodoroSession] = useState<PomodoroSession | null>(null);
  const [quietHours, setQuietHours] = useState<QuietHours>(() => {
    try {
      const raw = localStorage.getItem('minimal_habit_quiet_hours_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { enabled: false, start: '22:00', end: '07:00' };
  });
  useEffect(() => {
    try { localStorage.setItem('minimal_habit_quiet_hours_v1', JSON.stringify(quietHours)); } catch {}
  }, [quietHours]);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('minimal_habit_profile_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // default
    }
    return {
      name: 'Irfan',
      bio: 'Konsisten setiap hari 🚀',
      avatarEmoji: '⚡',
      joinedDate: 'Mei 2026',
    };
  });

  const handleAuthSuccess = async (user: { id: string; email: string }) => {
    setUserId(user.id);
    setUserEmail(user.email);
    try {
      localStorage.setItem('minimal_habit_auth_user_id', user.id);
      localStorage.setItem('minimal_habit_auth_email', user.email);

      // Load cloud data on login
      const cloudHabits = await fetchCloudHabits(user.id);
      if (cloudHabits && cloudHabits.length > 0) {
        setHabits(cloudHabits);
      } else {
        // Upload current local habits to cloud
        habits.forEach((h) => syncHabitToCloud(user.id, h));
      }

      const cloudProfile = await fetchCloudProfile(user.id);
      if (cloudProfile) {
        setUserProfile(cloudProfile);
      } else {
        syncProfileToCloud(user.id, userProfile);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = () => {
    setUserId(null);
    setUserEmail(null);
    try {
      localStorage.removeItem('minimal_habit_auth_user_id');
      localStorage.removeItem('minimal_habit_auth_email');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    if (userId) {
      syncProfileToCloud(userId, updated);
    }
    try {
      localStorage.setItem('minimal_habit_profile_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('minimal_habit_theme_v1');
      if (saved) return saved === 'dark';
    } catch {
      // default dark
    }
    return true;
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('minimal_habit_theme_v1', next ? 'dark' : 'light');
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('minimal_habit_onboarded_v1');
    } catch {
      return false;
    }
  });

  const handleStartPomodoro = (habit: Habit) => {
    setPomodoroSession({
      habit,
      totalSeconds: 25 * 60,
      remainingSeconds: 25 * 60,
      isRunning: true,
    });
  };

  const handlePomodoroComplete = (habitId: string, minutesCompleted: number) => {
    const today = getTodayString();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentVal = h.history[today] || 0;
        const newHistory = { ...h.history };

        if (h.type === 'numeric') {
          // Add logged minutes or target
          const target = h.targetValue || 1;
          const nextVal = currentVal > 0 ? currentVal + minutesCompleted : Math.max(target, minutesCompleted);
          newHistory[today] = nextVal;
        } else {
          newHistory[today] = 1;
        }

        return {
          ...h,
          history: newHistory,
        };
      })
    );
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem('minimal_habit_onboarded_v1', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [habits]);

  // Periodic Reminder Checker — snooze + quiet hours + de-dupe per day
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
        // Snooze handler via notification: we attach timeout to re-notify
        const snoozeMs = 10 * 60 * 1000;
        const notif = sendHabitNotification(
          `Waktunya ${habit.name}!`,
          `Tap untuk buka — snooze 10 menit jika belum sempat.`,
          habit.emoji
        );
        // If user focuses app quickly, count as seen; otherwise snooze auto on next tick
        if (notif) {
          notif.onclose = () => {};
        }
        // Mark notified, and schedule snooze window: clear snooze after 10m to allow re-fire once
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id
              ? { ...h, lastNotifiedDate: todayStr, snoozedUntil: nowMs + snoozeMs }
              : h
          )
        );
        // Clear snooze after window so a second daily reminder doesn't spam
        setTimeout(() => {
          setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, snoozedUntil: undefined } : h)));
        }, snoozeMs + 1000);
      });
    };
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [habits, quietHours]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingHabit(null);
        setIsModalOpen(true);
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
          handleToggleDate(targetHabit.id, today, nextVal);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [habits]);

  // Toggle or set habit check value for a specific date
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
        const updatedHabit = {
          ...h,
          history: newHistory,
        };

        // Sync to cloud if user is logged in
        if (userId) {
          syncHabitToCloud(userId, updatedHabit);
        }

        return updatedHabit;
      })
    );
  };

  // Save daily reflection note
  const handleSaveNote = (habitId: string, dateStr: string, note: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const newNotes = { ...(h.notes || {}) };
        if (note.trim()) {
          newNotes[dateStr] = note.trim();
        } else {
          delete newNotes[dateStr];
        }
        return {
          ...h,
          notes: newNotes,
        };
      })
    );
  };

  // Toggle Streak Freeze for a habit on a date
  const handleToggleFreeze = (habitId: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentFrozen = h.frozenDates || [];
        const isFrozen = currentFrozen.includes(dateStr);
        let nextFrozen: string[];

        if (isFrozen) {
          nextFrozen = currentFrozen.filter((d) => d !== dateStr);
        } else {
          nextFrozen = [...currentFrozen, dateStr];
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#0284c7', '#38bdf8', '#ffffff'],
          });
        }

        return {
          ...h,
          frozenDates: nextFrozen,
        };
      })
    );
  };

  // Add / Edit habit
  const handleSaveHabit = (data: Partial<Habit>) => {
    if (data.id) {
      // Edit existing
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== data.id) return h;
          const updated = { ...h, ...data };
          if (userId) syncHabitToCloud(userId, updated);
          return updated;
        })
      );
    } else {
      // Create new
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
        createdAt: getTodayString(),
        history: {},
        notes: {},
        archived: false,
      };
      setHabits((prev) => [...prev, newHabit]);

      if (userId) {
        syncHabitToCloud(userId, newHabit);
      }

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Delete habit
  const handleDeleteHabit = (habitId: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      if (userId) {
        deleteHabitFromCloud(userId, habitId);
      }
    }
  };

  // Toggle archive status
  const handleToggleArchive = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, archived: !h.archived } : h))
    );
  };

  // Open edit modal
  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  // Export JSON
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(habits, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `minimal-habit-tracker-backup-${getTodayString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setHabits(parsed);
          alert('Habits data successfully imported!');
        } else {
          alert('Invalid habit data format in JSON file.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetSample = () => {
    if (window.confirm('Reset all current habits to demo data?')) {
      setHabits(generateDemoHabits());
    }
  };

  // Filter habits for calendar view
  const categories = ['All', ...Array.from(new Set(habits.map((h) => h.category).filter(Boolean)))];
  const activeHabits = habits.filter((h) => !h.archived);
  const { unlockedCount, totalCount, level } = calculateBadges(habits);
  const filteredHabits = activeHabits.filter((h) => {
    if (selectedCategory === 'All') return true;
    return h.category === selectedCategory;
  });

  return (
    <div className={`min-h-[100dvh] flex flex-col transition-colors duration-200 ${
      isDarkMode
        ? 'bg-[#0b0b0e] text-zinc-100 selection:bg-indigo-600 selection:text-white'
        : 'bg-[#fbfbfe] text-zinc-900 selection:bg-indigo-500 selection:text-white'
    }`}>
      {/* Hidden file input for backup imports */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* FIXED TOP NAVIGATION BAR */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors ${
        isDarkMode
          ? 'bg-[#0b0b0e]/90 border-[#1c1c26]'
          : 'bg-[#fbfbfe]/90 border-zinc-200'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left: Help & Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-sm ${
                isDarkMode
                  ? 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 hover:text-white border-[#282838]'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border-zinc-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panduan</span>
              <span className="sm:hidden">Help</span>
            </button>

            <button
              onClick={() => setShowAchievements(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                isDarkMode
                  ? 'bg-gradient-to-r from-amber-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 text-amber-300 hover:text-amber-200 border-amber-500/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <span>🏆</span>
              <span>Lv.{level}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                isDarkMode ? 'text-zinc-400 bg-[#161622] border-amber-500/20' : 'text-amber-900 bg-amber-100 border-amber-300'
              }`}>
                {unlockedCount}/{totalCount}
              </span>
            </button>
          </div>

          {/* Center Tabs: [Calendar] [Statistics] [Manage] (Hidden on mobile < sm, use MobileBottomNav instead) */}
          <div
            className={`hidden sm:flex items-center p-1 rounded-full border shadow-inner ${
              isDarkMode ? 'bg-[#14141d] border-[#8338ec]/35' : 'bg-zinc-100 border-[#8338ec]/25'
            }`}
            style={{
              boxShadow: `0 0 16px rgba(131, 56, 236, 0.12)`,
            }}
          >
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-white text-zinc-950 font-semibold shadow-md'
                  : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>

            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'statistics'
                  ? 'bg-white text-zinc-950 font-semibold shadow-md'
                  : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Statistics
            </button>

            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'manage'
                  ? 'bg-white text-zinc-950 font-semibold shadow-md'
                  : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Manage
            </button>
          </div>

          {/* Right Controls: Only Switch Theme & Profile Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-[#161620] hover:bg-[#20202c] text-amber-300 border-[#282838]'
                  : 'bg-white hover:bg-zinc-100 text-indigo-600 border-zinc-300 shadow-sm'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => setShowProfile(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer select-none transition-transform active:scale-95 text-base ${
                isDarkMode
                  ? 'bg-[#1a1a28] border-[#8338ec]/40 shadow-sm shadow-[#8338ec]/20'
                  : 'bg-indigo-50 border-indigo-200'
              }`}
              title="Profil Pengguna"
            >
              {userProfile.avatarEmoji}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-10">
        {/* Category Filter & Full View Toggle Bar */}
        {activeTab === 'calendar' && (
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat!)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-[#8338ec] border-[#8338ec] text-white font-medium shadow-md shadow-[#8338ec]/25'
                      : isDarkMode
                      ? 'bg-[#14141c] border-[#8338ec]/25 text-zinc-400 hover:text-zinc-200'
                      : 'bg-white border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Full View Toggle */}
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-mono select-none ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Full View</span>
              <button
                type="button"
                onClick={() => setIsFullView((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isFullView ? 'bg-[#8338ec]' : isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isFullView ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENTS */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            {filteredHabits.map((habit, index) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                index={index}
                isFullView={isFullView}
                isDarkMode={isDarkMode}
                onToggleDate={handleToggleDate}
                onToggleFreeze={handleToggleFreeze}
                onSaveNote={handleSaveNote}
                onDeleteHabit={handleDeleteHabit}
                onEditHabit={handleOpenEdit}
                onShareHabit={setShareHabit}
                onStartPomodoro={handleStartPomodoro}
              />
            ))}

            {filteredHabits.length === 0 && (
              <div className={`border rounded-2xl p-8 sm:p-10 text-center ${isDarkMode ? 'bg-[#111116] border-[#1e1e28]' : 'bg-white border-zinc-200'}`}>
                <div className="text-3xl mb-3" aria-hidden>🌱</div>
                <h3 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {habits.length === 0 ? 'Belum ada kebiasaan' : 'Tidak ada yang cocok'}
                </h3>
                <p className={`text-sm mb-5 max-w-sm mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {habits.length === 0
                    ? 'Mulai dari satu yang paling gampang — nanti kebiasaan lain tinggal ditambah.'
                    : 'Coba ganti filter kategori atau buat kebiasaan baru.'}
                </p>
                <button
                  onClick={() => { setEditingHabit(null); setIsModalOpen(true); }}
                  className="px-5 py-2.5 bg-[#8338ec] hover:bg-[#722ed1] text-white rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-[#8338ec]/20 transition-all"
                >
                  Buat kebiasaan pertama
                </button>
                {habits.length === 0 && (
                  <p className={`text-xs mt-3 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Tips: tekan N di keyboard untuk cepat.</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && <StatsView habits={activeHabits} isDarkMode={isDarkMode} />}

        {activeTab === 'manage' && (
          <ManageView
            habits={habits}
            isDarkMode={isDarkMode}
            quietHours={quietHours}
            onQuietHoursChange={setQuietHours}
            onAddHabit={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
            onEditHabit={handleOpenEdit}
            onDeleteHabit={handleDeleteHabit}
            onToggleArchive={handleToggleArchive}
            onReorderHabits={setHabits}
            onExport={handleExport}
            onImport={handleImportClick}
            onResetSample={handleResetSample}
          />
        )}
      </main>

      {/* Floating Keyboard Legend (Desktop only) */}
      <footer className="hidden sm:flex sticky bottom-4 right-4 max-w-fit ml-auto mr-4 pointer-events-none z-20">
        <div className="bg-[#12121ad9] backdrop-blur-md border border-[#242432] text-zinc-400 text-[11px] font-mono px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#1f1f2c] text-zinc-200 rounded border border-[#2e2e40]">N</kbd>
            <span>New habit</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#1f1f2c] text-zinc-200 rounded border border-[#2e2e40]">1-5</kbd>
            <span>Toggle</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav (<640px) */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingHabit(null);
          setIsModalOpen(true);
        }}
        onOpenProfile={() => setShowProfile(true)}
        isDarkMode={isDarkMode}
      />

      {/* Pomodoro Timer Modal & Floating Widget */}
      <PomodoroTimer
        session={pomodoroSession}
        onUpdateSession={setPomodoroSession}
        onCompleteHabit={handlePomodoroComplete}
        isDarkMode={isDarkMode}
      />

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
        isDarkMode={isDarkMode}
      />

      {/* Share Card Modal */}
      {shareHabit && (
        <ShareCardModal habit={shareHabit} onClose={() => setShareHabit(null)} isDarkMode={isDarkMode} />
      )}

      {/* Help / Shortcuts Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        isDarkMode={isDarkMode}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        habits={habits}
        userEmail={userEmail}
        onOpenAuth={() => setShowAuth(true)}
        isDarkMode={isDarkMode}
      />

      {/* Auth / Cloud Sync Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        userEmail={userEmail}
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
        isDarkMode={isDarkMode}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        habits={habits}
        isDarkMode={isDarkMode}
      />

      {/* Interactive Onboarding Tour */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        onStartHabit={() => {
          setEditingHabit(null);
          setIsModalOpen(true);
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;
