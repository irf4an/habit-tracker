-- SQL Schema for Minimal Habit Tracker in Supabase

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT DEFAULT 'Champion',
  bio TEXT DEFAULT 'Building daily momentum 🚀',
  avatar_emoji TEXT DEFAULT '⚡',
  theme_preference TEXT DEFAULT 'dark',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habits Table (Lengkap dengan fitur V1.1, V1.2 & V2.0: Habit Stacking, Moods, Pomodoro Log)
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#3b82f6',
  category TEXT DEFAULT 'Fitness',
  type TEXT DEFAULT 'boolean',
  target_value NUMERIC DEFAULT 1,
  unit TEXT,
  frequency TEXT DEFAULT 'everyday',
  weekly_target_days NUMERIC,
  time_of_day TEXT DEFAULT 'anytime',
  archived BOOLEAN DEFAULT false,
  frozen_dates TEXT[] DEFAULT '{}',
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TEXT,
  history JSONB DEFAULT '{}'::jsonb,
  notes JSONB DEFAULT '{}'::jsonb,
  moods JSONB DEFAULT '{}'::jsonb,
  focus_log JSONB DEFAULT '{}'::jsonb,
  focus_sessions JSONB DEFAULT '{}'::jsonb,
  created_at TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Migration Safe Alters (Jika tabel sudah pernah dibuat sebelumnya di Supabase)
DO $$
BEGIN
  -- time_of_day (Habit Stacking v1.1)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habits' AND column_name='time_of_day') THEN
    ALTER TABLE public.habits ADD COLUMN time_of_day TEXT DEFAULT 'anytime';
  END IF;

  -- moods (Daily Reflection Mood v1.2)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habits' AND column_name='moods') THEN
    ALTER TABLE public.habits ADD COLUMN moods JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- focus_log (Pomodoro Minutes v2.0)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habits' AND column_name='focus_log') THEN
    ALTER TABLE public.habits ADD COLUMN focus_log JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- focus_sessions (Pomodoro Session Count v2.0)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habits' AND column_name='focus_sessions') THEN
    ALTER TABLE public.habits ADD COLUMN focus_sessions JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 4. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Habits Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='habits' AND policyname='Users can view own habits') THEN
    CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='habits' AND policyname='Users can insert own habits') THEN
    CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='habits' AND policyname='Users can update own habits') THEN
    CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='habits' AND policyname='Users can delete own habits') THEN
    CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
