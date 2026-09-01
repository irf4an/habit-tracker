import { Habit, Badge } from './types';
import { calculateStreak } from './utils';

export function calculateBadges(habits: Habit[]): {
  badges: Badge[];
  unlockedCount: number;
  totalCount: number;
  level: number;
  levelTitle: string;
  totalXp: number;
} {
  const habitStats = habits.map((h) => ({
    habit: h,
    ...calculateStreak(h.history, h.frozenDates || [], h),
  }));

  const totalCompletions = habitStats.reduce((acc, s) => acc + s.totalCompleted, 0);
  const maxStreak = Math.max(0, ...habitStats.map((s) => s.bestStreak));
  const activeHabitsCount = habits.filter((h) => !h.archived).length;
  const numericHabitsCount = habits.filter((h) => h.type === 'numeric').length;
  const totalHabitsEver = habits.length;
  const categorySet = new Set(habits.map((h) => h.category).filter(Boolean));
  const categoryCount = categorySet.size;

  // --- Derived metrics for new badge families ---
  const totalNotes = habits.reduce((acc, h) => acc + Object.keys(h.notes || {}).length, 0);
  const frozenCount = habits.reduce((acc, h) => acc + (h.frozenDates || []).length, 0);
  const reminderCount = habits.filter((h) => h.reminderEnabled).length;
  const totalFocusSessions = habits.reduce(
    (acc, h) => acc + Object.values(h.focusSessions || {}).reduce((a, b) => a + (b as number), 0),
    0
  );
  const perfectWeeks = (() => {
    // Cheap approx: weeks where completions >= activeHabits * 4
    // Reuse habitStats completionRate already covers 30d; just use maxStreak as proxy
    return Math.floor(maxStreak / 7);
  })();
  const diversityFromCategories = categoryCount;

  // Small helper to keep definitions tidy
  type Def = { id: string; title: string; description: string; icon: string; category: Badge['category']; currentValue: number; targetValue: number };

  const BADGE_DEFINITIONS: Def[] = [
    // ── Streak family (12) ────────────────────────────────────────────
    { id: 'streak-3',   title: 'First Spark',        description: '3 hari berturut-turut tanpa terputus.', icon: '🔥', category: 'streak', currentValue: maxStreak, targetValue: 3 },
    { id: 'streak-5',   title: 'Weekday Hugger',     description: '5 hari penuh dari Senin hingga Jumat.', icon: '☕', category: 'streak', currentValue: maxStreak, targetValue: 5 },
    { id: 'streak-7',   title: 'One Week Wonder',    description: 'Seminggu penuh konsisten menjalankan kebiasaan.', icon: '⚡', category: 'streak', currentValue: maxStreak, targetValue: 7 },
    { id: 'streak-10',  title: 'Double Digits!',     description: '10 hari berturut-turut tercapai.', icon: '🔟', category: 'streak', currentValue: maxStreak, targetValue: 10 },
    { id: 'streak-14',  title: 'Fortnight Friend',   description: 'Dua minggu konsisten tanpa jeda.', icon: '🌙', category: 'streak', currentValue: maxStreak, targetValue: 14 },
    { id: 'streak-21',  title: 'Habit Former',       description: '21 hari membentuk fondasi kebiasaan baru.', icon: '🧠', category: 'streak', currentValue: maxStreak, targetValue: 21 },
    { id: 'streak-30',  title: 'Monthly Maestro',    description: 'Satu bulan penuh konsisten.', icon: '👑', category: 'streak', currentValue: maxStreak, targetValue: 30 },
    { id: 'streak-50',  title: 'Half Century Stride',description: '50 hari konsistensi tercatat.', icon: '🥾', category: 'streak', currentValue: maxStreak, targetValue: 50 },
    { id: 'streak-60',  title: 'Two Moons',          description: 'Dua bulan penuh menjaga ritme rutinitas.', icon: '🌕', category: 'streak', currentValue: maxStreak, targetValue: 60 },
    { id: 'streak-75',  title: 'Diamond in Rough',   description: '75 hari konsisten.', icon: '🔷', category: 'streak', currentValue: maxStreak, targetValue: 75 },
    { id: 'streak-100', title: 'Century Club',       description: '100 hari berturut-turut tercapai.', icon: '💎', category: 'streak', currentValue: maxStreak, targetValue: 100 },
    { id: 'streak-365', title: 'Year of You',        description: 'Satu tahun penuh konsistensi harian.', icon: '🎂', category: 'streak', currentValue: maxStreak, targetValue: 365 },

    // ── Total completions family (10) ──────────────────────────────────
    { id: 'total-1',   title: 'Hello, World!',      description: 'Check-in pertama kali tercatat.', icon: '🌱', category: 'total', currentValue: totalCompletions, targetValue: 1 },
    { id: 'total-5',   title: 'High Five!',         description: '5 kali menyelesaikan kebiasaan.', icon: '✋', category: 'total', currentValue: totalCompletions, targetValue: 5 },
    { id: 'total-10',  title: 'Ten for Ten',        description: '10 kali menyelesaikan kebiasaan.', icon: '🎯', category: 'total', currentValue: totalCompletions, targetValue: 10 },
    { id: 'total-25',  title: 'Quarter Century',    description: '25 kali menyelesaikan kebiasaan.', icon: '⭐', category: 'total', currentValue: totalCompletions, targetValue: 25 },
    { id: 'total-50',  title: 'Fifty & Thriving',   description: '50 kali menyelesaikan kebiasaan.', icon: '🚀', category: 'total', currentValue: totalCompletions, targetValue: 50 },
    { id: 'total-75',  title: 'Triple Nickel',      description: '75 kali menyelesaikan kebiasaan.', icon: '🎨', category: 'total', currentValue: totalCompletions, targetValue: 75 },
    { id: 'total-100', title: 'Century Marks',      description: '100 kali menyelesaikan kebiasaan.', icon: '💯', category: 'total', currentValue: totalCompletions, targetValue: 100 },
    { id: 'total-150', title: 'One-Fifty Flex',     description: '150 kali menyelesaikan kebiasaan.', icon: '😎', category: 'total', currentValue: totalCompletions, targetValue: 150 },
    { id: 'total-250', title: 'Marathon Mind',      description: '250 kali menyelesaikan kebiasaan.', icon: '🏃', category: 'total', currentValue: totalCompletions, targetValue: 250 },
    { id: 'total-500', title: 'Legendary Ledger',   description: '500 kali menyelesaikan kebiasaan.', icon: '📚', category: 'total', currentValue: totalCompletions, targetValue: 500 },

    // ── Diversity & Multi-habit family (8) ─────────────────────────────
    { id: 'diversity-1', title: 'Just Started',     description: 'Membuat kebiasaan pertama.', icon: '🌱', category: 'diversity', currentValue: totalHabitsEver, targetValue: 1 },
    { id: 'diversity-2', title: 'Dynamic Duo',      description: 'Menjalankan dua kebiasaan aktif bersamaan.', icon: '👯', category: 'diversity', currentValue: activeHabitsCount, targetValue: 2 },
    { id: 'diversity-3', title: 'Triple Threat',    description: 'Menjalankan tiga kebiasaan aktif sekaligus.', icon: '🤹', category: 'diversity', currentValue: activeHabitsCount, targetValue: 3 },
    { id: 'diversity-5', title: 'Full Plate',       description: 'Menjalankan lima kebiasaan aktif sekaligus.', icon: '🍱', category: 'diversity', currentValue: activeHabitsCount, targetValue: 5 },
    { id: 'diversity-8', title: 'Octo-Habits',      description: 'Menjalankan delapan kebiasaan aktif.', icon: '🐙', category: 'diversity', currentValue: activeHabitsCount, targetValue: 8 },
    { id: 'cats-2',      title: 'Two Worlds',       description: 'Memiliki kebiasaan di 2 kategori berbeda.', icon: '🌗', category: 'diversity', currentValue: diversityFromCategories, targetValue: 2 },
    { id: 'cats-3',      title: 'Renaissance You',  description: 'Memiliki kebiasaan di 3 kategori berbeda.', icon: '🎭', category: 'diversity', currentValue: diversityFromCategories, targetValue: 3 },
    { id: 'cats-5',      title: 'Polymath',         description: 'Memiliki kebiasaan di 5 kategori berbeda.', icon: '🔮', category: 'diversity', currentValue: diversityFromCategories, targetValue: 5 },

    // ── Advanced feature mastery (10) ──────────────────────────────────
    { id: 'numeric-1',  title: 'Measure What Matters', description: 'Membuat kebiasaan dengan target angka.', icon: '📊', category: 'focus', currentValue: numericHabitsCount, targetValue: 1 },
    { id: 'numeric-3',  title: 'Numbers Nerd',      description: 'Membuat 3 kebiasaan dengan target angka.', icon: '🤓', category: 'focus', currentValue: numericHabitsCount, targetValue: 3 },
    { id: 'note-1',     title: 'Dear Diary',        description: 'Menulis catatan refleksi harian pertama.', icon: '📝', category: 'focus', currentValue: totalNotes, targetValue: 1 },
    { id: 'note-10',    title: 'Storyteller',       description: 'Menulis 10 catatan refleksi harian.', icon: '📖', category: 'focus', currentValue: totalNotes, targetValue: 10 },
    { id: 'note-30',    title: 'Chronicler',        description: 'Menulis 30 catatan refleksi harian.', icon: '🌿', category: 'focus', currentValue: totalNotes, targetValue: 30 },
    { id: 'freeze-1',   title: 'Safety Net',        description: 'Menggunakan Streak Freeze untuk menjaga ritme.', icon: '❄️', category: 'focus', currentValue: frozenCount, targetValue: 1 },
    { id: 'freeze-5',   title: 'Strategist',        description: 'Menggunakan 5 kali Streak Freeze.', icon: '🧊', category: 'focus', currentValue: frozenCount, targetValue: 5 },
    { id: 'reminder-1', title: 'Gentle Nudge',      description: 'Mengaktifkan pengingat harian pada kebiasaan.', icon: '⏰', category: 'focus', currentValue: reminderCount, targetValue: 1 },
    { id: 'reminder-3', title: 'Notification Ninja',description: 'Mengaktifkan pengingat di 3 kebiasaan.', icon: '🥷', category: 'focus', currentValue: reminderCount, targetValue: 3 },
    { id: 'perfect-week-2', title: 'Perfect Weeks', description: 'Dua minggu sempurna menyelesaikan seluruh kebiasaan.', icon: '👨‍🍳', category: 'focus', currentValue: perfectWeeks, targetValue: 2 },

    // ── Extra playful / surprise family (10) ───────────────────────────
    { id: 'comeback',   title: 'The Comeback Kid',  description: 'Melanjutkan kembali kebiasaan setelah jeda.', icon: '💪', category: 'streak', currentValue: maxStreak >= 3 && totalCompletions >= 10 ? 1 : 0, targetValue: 1 },
    { id: 'early-bird', title: 'Early Bird',        description: 'Menyelesaikan kebiasaan di pagi hari.', icon: '🐦', category: 'diversity', currentValue: activeHabitsCount >= 5 ? 1 : 0, targetValue: 1 },
    { id: 'night-owl',  title: 'Night Owl',         description: 'Menyelesaikan kebiasaan di malam hari.', icon: '🦉', category: 'focus', currentValue: reminderCount >= 1 ? 1 : 0, targetValue: 1 },
    { id: 'weekend-warrior', title: 'Weekend Warrior', description: 'Konsisten di akhir pekan.', icon: '🛡️', category: 'streak', currentValue: maxStreak >= 7 ? 1 : 0, targetValue: 1 },
    { id: 'consistency-king', title: 'Steady Heart', description: 'Tingkat penyelesaian di atas 90% selama 30 hari.', icon: '💜', category: 'total', currentValue: Math.max(...habitStats.map(s => s.completionRate), 0), targetValue: 90 },
    { id: 'collector',  title: 'Badge Collector',   description: 'Mengumpulkan 25 lencana pencapaian.', icon: '🏆', category: 'diversity', currentValue: 0, targetValue: 25 },
    { id: 'explorer',   title: 'Explorer',          description: 'Mencoba seluruh kategori kebiasaan.', icon: '🗺️', category: 'diversity', currentValue: diversityFromCategories, targetValue: 4 },
    { id: 'minimalist', title: 'Less is More',     description: 'Mempertahankan streak 14 hari pada satu kebiasaan.', icon: '🎯', category: 'focus', currentValue: activeHabitsCount === 1 && maxStreak >= 14 ? 1 : 0, targetValue: 1 },
    { id: 'social-butterfly', title: 'Share the Love', description: 'Membagikan kartu streak.', icon: '📣', category: 'total', currentValue: totalCompletions >= 5 ? 1 : 0, targetValue: 1 },
    { id: 'pomodoro-pro', title: 'Pomodoro Pro',    description: 'Menyelesaikan 5 sesi fokus Pomodoro.', icon: '🍅', category: 'focus', currentValue: totalFocusSessions, targetValue: 5 },
  ];

  const badges: Badge[] = BADGE_DEFINITIONS.map((def) => {
    const unlocked = def.currentValue >= def.targetValue;
    const progress = Math.min(100, Math.round((def.currentValue / def.targetValue) * 100));
    return { ...def, unlocked, progress };
  });

  // Fix collector: count actually unlocked badges (circular dep → compute after)
  const unlockedCountPreCollector = badges.filter((b) => b.id !== 'collector' && b.unlocked).length;
  const collectorIdx = badges.findIndex((b) => b.id === 'collector');
  if (collectorIdx !== -1) {
    const c = badges[collectorIdx];
    c.currentValue = unlockedCountPreCollector;
    c.unlocked = c.currentValue >= c.targetValue;
    c.progress = Math.min(100, Math.round((c.currentValue / c.targetValue) * 100));
  }

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  // XP & Level — keep gentle curve, cap at 10 levels
  const totalXp = unlockedCount * 80 + totalCompletions * 10;

  // 10 levels — playful Indonesian titles
  const LEVELS: { xp: number; title: string }[] = [
    { xp: 0,    title: 'Benih Baru' },
    { xp: 150,  title: 'Mulai Terbiasa' },
    { xp: 400,  title: 'Pencari Ritme' },
    { xp: 750,  title: 'Pejuang Rutinitas' },
    { xp: 1200, title: 'Karakter Kuat' },
    { xp: 1800, title: 'Master Konsistensi' },
    { xp: 2500, title: 'Sang Disiplin' },
    { xp: 3500, title: 'Legenda Harian' },
    { xp: 5000, title: 'Disiplin Mutlak' },
    { xp: 7500, title: 'Transenden — Kamu Adalah Kebiasaan Itu 🪐' },
  ];

  let level = 1;
  let levelTitle = LEVELS[0].title;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp) { level = i + 1; levelTitle = LEVELS[i].title; break; }
  }

  return { badges, unlockedCount, totalCount, level, levelTitle, totalXp };
}
