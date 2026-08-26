export type HabitType = 'boolean' | 'numeric';

export type FrequencyType = 'everyday' | 'weekdays' | 'weekends' | 'weekly_target';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // e.g. '#3b82f6'
  createdAt: string; // YYYY-MM-DD
  history: Record<string, number>; // date "YYYY-MM-DD" -> value (1 for boolean complete, or numeric count like 5)
  notes?: Record<string, string>; // date "YYYY-MM-DD" -> optional reflection/note
  
  // Advanced features
  type?: HabitType; // 'boolean' | 'numeric'
  targetValue?: number; // e.g. 50 (pages/pushups/glasses)
  unit?: string; // e.g. 'pages', 'mins', 'ml', 'km'
  frequency?: FrequencyType;
  weeklyTargetDays?: number;
  category?: string;
  archived?: boolean;

  // Streak Freeze & Rest Days
  frozenDates?: string[]; // array of "YYYY-MM-DD" protected by freeze
  streakFreezes?: number; // available freeze tokens

  // Reminder Notification features
  reminderEnabled?: boolean;
  reminderTime?: string; // "HH:mm" e.g. "08:00", "20:30"
  lastNotifiedDate?: string; // "YYYY-MM-DD" to avoid multiple alerts per day
}

export type ViewTab = 'calendar' | 'statistics' | 'manage';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'total' | 'diversity' | 'focus';
  unlocked: boolean;
  progress: number; // 0 to 100
  currentValue: number;
  targetValue: number;
  unlockedAt?: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  avatarEmoji: string;
  joinedDate: string;
}
