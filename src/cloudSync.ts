import { Habit, UserProfile } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

// 1. Fetch habits from Supabase
export async function fetchCloudHabits(userId: string): Promise<Habit[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;

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

// 2. Sync / Upsert a habit to Supabase
export async function syncHabitToCloud(userId: string, habit: Habit) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase.from('habits').upsert({
      id: habit.id,
      user_id: userId,
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      category: habit.category,
      type: habit.type,
      target_value: habit.targetValue,
      unit: habit.unit,
      frequency: habit.frequency,
      weekly_target_days: habit.weeklyTargetDays,
      archived: habit.archived,
      frozen_dates: habit.frozenDates || [],
      reminder_enabled: habit.reminderEnabled,
      reminder_time: habit.reminderTime,
      history: habit.history,
      notes: habit.notes || {},
      created_at: habit.createdAt,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to sync habit to cloud:', err);
  }
}

// 3. Delete habit from Supabase
export async function deleteHabitFromCloud(userId: string, habitId: string) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (err) {
    console.error('Failed to delete habit from cloud:', err);
  }
}

// 4. Fetch profile from Supabase
export async function fetchCloudProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      name: data.name || 'Champion',
      bio: data.bio || 'Building daily momentum 🚀',
      avatarEmoji: data.avatar_emoji || '⚡',
      joinedDate: 'Akun Cloud',
    };
  } catch (err) {
    console.error('Failed to fetch cloud profile:', err);
    return null;
  }
}

// 5. Sync profile to Supabase
export async function syncProfileToCloud(userId: string, profile: UserProfile) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      name: profile.name,
      bio: profile.bio,
      avatar_emoji: profile.avatarEmoji,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to sync profile to cloud:', err);
  }
}
