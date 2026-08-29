import { Habit, UserProfile } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const OUTBOX_KEY = 'minimal_habit_sync_outbox_v1';

export type OutboxPayload =
  | { type: 'UPSERT_HABIT'; userId: string; habit: Habit }
  | { type: 'DELETE_HABIT'; userId: string; habitId: string }
  | { type: 'UPSERT_PROFILE'; userId: string; profile: UserProfile };

export type OutboxAction = OutboxPayload & { id: string; timestamp: number };

// Helper: Read outbox queue from LocalStorage
export function getOutboxQueue(): OutboxAction[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper: Save outbox queue to LocalStorage
function saveOutboxQueue(queue: OutboxAction[]) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save outbox queue:', err);
  }
}

// Enqueue a mutation into outbox
function enqueueOutbox(action: OutboxPayload) {
  const queue = getOutboxQueue();
  const item: OutboxAction = {
    ...action,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  // De-duplicate pending queue per entity to save bandwidth
  let filtered = queue;
  if (item.type === 'UPSERT_HABIT') {
    filtered = queue.filter((q) => !(q.type === 'UPSERT_HABIT' && q.habit.id === item.habit.id));
  } else if (item.type === 'DELETE_HABIT') {
    filtered = queue.filter((q) => !((q.type === 'UPSERT_HABIT' || q.type === 'DELETE_HABIT') && (q as any).habitId === item.habitId || (q as any).habit?.id === item.habitId));
  } else if (item.type === 'UPSERT_PROFILE') {
    filtered = queue.filter((q) => q.type !== 'UPSERT_PROFILE');
  }

  saveOutboxQueue([...filtered, item]);
}

// Flush all pending outbox actions to Supabase with retry logic
let isFlushing = false;
export async function flushOutboxQueue(): Promise<boolean> {
  if (isFlushing || !isSupabaseConfigured || !supabase || !navigator.onLine) {
    return false;
  }

  const queue = getOutboxQueue();
  if (queue.length === 0) return true;

  isFlushing = true;
  const remainingQueue: OutboxAction[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'UPSERT_HABIT') {
        const { error } = await supabase.from('habits').upsert({
          id: item.habit.id,
          user_id: item.userId,
          name: item.habit.name,
          emoji: item.habit.emoji,
          color: item.habit.color,
          category: item.habit.category,
          type: item.habit.type,
          target_value: item.habit.targetValue,
          unit: item.habit.unit,
          frequency: item.habit.frequency,
          weekly_target_days: item.habit.weeklyTargetDays,
          time_of_day: item.habit.timeOfDay,
          archived: item.habit.archived,
          frozen_dates: item.habit.frozenDates || [],
          reminder_enabled: item.habit.reminderEnabled,
          reminder_time: item.habit.reminderTime,
          history: item.habit.history,
          notes: item.habit.notes || {},
          created_at: item.habit.createdAt,
          updated_at: new Date(item.timestamp).toISOString(),
        });
        if (error) throw error;
      } else if (item.type === 'DELETE_HABIT') {
        const { error } = await supabase
          .from('habits')
          .delete()
          .eq('id', item.habitId)
          .eq('user_id', item.userId);
        if (error) throw error;
      } else if (item.type === 'UPSERT_PROFILE') {
        const { error } = await supabase.from('profiles').upsert({
          id: item.userId,
          name: item.profile.name,
          bio: item.profile.bio,
          avatar_emoji: item.profile.avatarEmoji,
          updated_at: new Date(item.timestamp).toISOString(),
        });
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Failed flushing outbox item, will retry next time:', item, err);
      remainingQueue.push(item);
    }
  }

  saveOutboxQueue(remainingQueue);
  isFlushing = false;
  return remainingQueue.length === 0;
}

// Global Network Listeners (Online / Visibility change auto-flush)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOutboxQueue();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      flushOutboxQueue();
    }
  });

  // Periodic flush every 60 seconds
  setInterval(() => {
    flushOutboxQueue();
  }, 60000);
}

// 1. Fetch habits from Supabase
export async function fetchCloudHabits(userId: string): Promise<Habit[] | null> {
  if (!isSupabaseConfigured || !supabase || !navigator.onLine) return null;

  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!data) return [];

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      color: item.color,
      category: item.category,
      type: item.type,
      targetValue: item.target_value,
      unit: item.unit,
      frequency: item.frequency,
      weeklyTargetDays: item.weekly_target_days,
      timeOfDay: item.time_of_day || 'anytime',
      archived: item.archived,
      frozenDates: item.frozen_dates || [],
      reminderEnabled: item.reminder_enabled,
      reminderTime: item.reminder_time,
      history: item.history || {},
      notes: item.notes || {},
      createdAt: item.created_at,
    }));
  } catch (err) {
    console.error('Failed to fetch cloud habits:', err);
    return null;
  }
}

// 2. Local-First Sync / Upsert a habit (Local write + Outbox Enqueue + Immediate Background Flush)
export async function syncHabitToCloud(userId: string, habit: Habit) {
  if (!userId) return;

  // Selalu catat ke outbox terlebih dahulu (Local-First Guarantee)
  enqueueOutbox({
    type: 'UPSERT_HABIT',
    userId,
    habit,
  });

  // Coba flush langsung jika online
  if (navigator.onLine) {
    flushOutboxQueue();
  }
}

// 3. Local-First Delete habit
export async function deleteHabitFromCloud(userId: string, habitId: string) {
  if (!userId) return;

  enqueueOutbox({
    type: 'DELETE_HABIT',
    userId,
    habitId,
  });

  if (navigator.onLine) {
    flushOutboxQueue();
  }
}

// 4. Fetch profile from Supabase
export async function fetchCloudProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase || !navigator.onLine) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      name: data.name || 'Pengguna',
      bio: data.bio || '1% lebih baik setiap hari 🚀',
      avatarEmoji: data.avatar_emoji || '⚡',
      joinedDate: 'Akun Cloud',
    };
  } catch (err) {
    console.error('Failed to fetch cloud profile:', err);
    return null;
  }
}

// 5. Local-First Sync profile
export async function syncProfileToCloud(userId: string, profile: UserProfile) {
  if (!userId) return;

  enqueueOutbox({
    type: 'UPSERT_PROFILE',
    userId,
    profile,
  });

  if (navigator.onLine) {
    flushOutboxQueue();
  }
}
