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
  const perfectWeeks = (() => {
    // Cheap approx: weeks where completions >= activeHabits * 4
    // Reuse habitStats completionRate already covers 30d; just use maxStreak as proxy
    return Math.floor(maxStreak / 7);
  })();
  const diversityFromCategories = categoryCount;

  // Small helper to keep definitions tidy
  type Def = { id: string; title: string; description: string; icon: string; category: Badge['category']; currentValue: number; targetValue: number };

  const BADGE_DEFINITIONS: Def[] = [
    // ── 🔥 Streak family (12) ────────────────────────────────────────────
    { id: 'streak-3',   title: 'First Spark',        description: '3 hari nyala terus — apinya baru ketemu ritmenya 🔥', icon: '🔥', category: 'streak', currentValue: maxStreak, targetValue: 3 },
    { id: 'streak-5',   title: 'Weekday Hugger',     description: '5 hari, Senin–Jumat kelar tanpa bolong — kecil tapi manis!', icon: '☕', category: 'streak', currentValue: maxStreak, targetValue: 5 },
    { id: 'streak-7',   title: 'One Week Wonder',    description: 'Seminggu penuh! Kamu buktiin bisa komit 7 hari.', icon: '⚡', category: 'streak', currentValue: maxStreak, targetValue: 7 },
    { id: 'streak-10',  title: 'Double Digits!',     description: '10 hari! Dua digit pertama — rasanya nagih kan?', icon: '🔟', category: 'streak', currentValue: maxStreak, targetValue: 10 },
    { id: 'streak-14',  title: 'Fortnight Friend',   description: 'Dua minggu nggak putus — teman setiamu, konsistensi.', icon: '🌙', category: 'streak', currentValue: maxStreak, targetValue: 14 },
    { id: 'streak-21',  title: 'Habit Former',       description: '21 hari — katanya di sini kebiasaan mulai nempel di otak 🧠', icon: '🧠', category: 'streak', currentValue: maxStreak, targetValue: 21 },
    { id: 'streak-30',  title: 'Monthly Maestro',    description: '30 hari! Sebulan penuh disiplin — standing ovation dong 👏', icon: '👑', category: 'streak', currentValue: maxStreak, targetValue: 30 },
    { id: 'streak-50',  title: 'Half Century Stride',description: '50 hari — setengah abad versi kamu sendiri 🚶‍♂️', icon: '🥾', category: 'streak', currentValue: maxStreak, targetValue: 50 },
    { id: 'streak-60',  title: 'Two Moons',          description: '60 hari — dua bulan, dua purnama kamu lewatin bareng habit ini 🌕🌕', icon: '🌕', category: 'streak', currentValue: maxStreak, targetValue: 60 },
    { id: 'streak-75',  title: 'Diamond in Rough',   description: '75 hari — udah nggak “coba-coba” lagi, ini gaya hidup 💎', icon: '🔷', category: 'streak', currentValue: maxStreak, targetValue: 75 },
    { id: 'streak-100', title: 'Century Club',       description: '100 hari! Masuk klub langka — selamat, legenda! 💎', icon: '💎', category: 'streak', currentValue: maxStreak, targetValue: 100 },
    { id: 'streak-365', title: 'Year of You',        description: '365 hari — setahun penuh jadi versi terbaik dirimu. Wow. 🥹', icon: '🎂', category: 'streak', currentValue: maxStreak, targetValue: 365 },

    // ── 🎯 Total check-ins family (10) ───────────────────────────────────
    { id: 'total-1',   title: 'Hello, World!',      description: 'Check-in pertama! Perjalanan seribu langkah mulai di sini 🌱', icon: '🌱', category: 'total', currentValue: totalCompletions, targetValue: 1 },
    { id: 'total-5',   title: 'High Five!',         description: '5 centang — lima tos buat kamu! ✋', icon: '✋', category: 'total', currentValue: totalCompletions, targetValue: 5 },
    { id: 'total-10',  title: 'Ten for Ten',        description: '10 check-in — dua tangan penuh pencapaian 🎯', icon: '🎯', category: 'total', currentValue: totalCompletions, targetValue: 10 },
    { id: 'total-25',  title: 'Quarter Century',    description: '25 kali hadir untuk dirimu sendiri — keren banget!', icon: '⭐', category: 'total', currentValue: totalCompletions, targetValue: 25 },
    { id: 'total-50',  title: 'Fifty & Thriving',   description: '50 check-in — momentumnya udah nggak kebendung 🚀', icon: '🚀', category: 'total', currentValue: totalCompletions, targetValue: 50 },
    { id: 'total-75',  title: 'Triple Nickel',      description: '75 — kamu udah buktikan ini bukan fase musiman.', icon: '🎨', category: 'total', currentValue: totalCompletions, targetValue: 75 },
    { id: 'total-100', title: 'Century Marks',      description: '100 check-in — seratus alasan buat bangga sama diri sendiri 💯', icon: '💯', category: 'total', currentValue: totalCompletions, targetValue: 100 },
    { id: 'total-150', title: 'One-Fifty Flex',     description: '150 — flex tipis-tipis boleh lah 😎', icon: '😎', category: 'total', currentValue: totalCompletions, targetValue: 150 },
    { id: 'total-250', title: 'Marathon Mind',      description: '250 — ini udah level marathon, bukan sprint lagi 🏃', icon: '🏃', category: 'total', currentValue: totalCompletions, targetValue: 250 },
    { id: 'total-500', title: 'Legendary Ledger',   description: '500 check-in — ledger-mu tebal, ceritanya kaya 📚', icon: '📚', category: 'total', currentValue: totalCompletions, targetValue: 500 },

    // ── ⚖️ Diversity / breadth family (8) ─────────────────────────────────
    { id: 'diversity-1', title: 'Just Started',     description: 'Bikin habit pertamamu — langkah paling berani! 🌱', icon: '🌱', category: 'diversity', currentValue: totalHabitsEver, targetValue: 1 },
    { id: 'diversity-2', title: 'Dynamic Duo',      description: 'Dua habit jalan bareng — duet maut nih 👯', icon: '👯', category: 'diversity', currentValue: activeHabitsCount, targetValue: 2 },
    { id: 'diversity-3', title: 'Triple Threat',    description: 'Tiga habit aktif sekaligus — juggle yang rapi! 🤹', icon: '🤹', category: 'diversity', currentValue: activeHabitsCount, targetValue: 3 },
    { id: 'diversity-5', title: 'Full Plate',       description: 'Lima kebiasaan aktif — piringmu penuh tapi tetap seimbang 🍱', icon: '🍱', category: 'diversity', currentValue: activeHabitsCount, targetValue: 5 },
    { id: 'diversity-8', title: 'Octo-Habits',      description: 'Delapan habit — gurita pun minder 🐙', icon: '🐙', category: 'diversity', currentValue: activeHabitsCount, targetValue: 8 },
    { id: 'cats-2',      title: 'Two Worlds',       description: 'Main di 2 kategori berbeda — hidup nggak cuma satu sisi 🌗', icon: '🌗', category: 'diversity', currentValue: diversityFromCategories, targetValue: 2 },
    { id: 'cats-3',      title: 'Renaissance You',  description: '3 kategori — mind, body, soul kepenuhin semua 🎭', icon: '🎭', category: 'diversity', currentValue: diversityFromCategories, targetValue: 3 },
    { id: 'cats-5',      title: 'Polymath',         description: '5 kategori — kamu beneran penasaran sama hidup! 🔮', icon: '🔮', category: 'diversity', currentValue: diversityFromCategories, targetValue: 5 },

    // ── 🧠 Focus / craft family (10) ──────────────────────────────────────
    { id: 'numeric-1',  title: 'Measure What Matters', description: 'Bikin 1 habit pakai target angka — yang terukur jadi terkelola 📊', icon: '📊', category: 'focus', currentValue: numericHabitsCount, targetValue: 1 },
    { id: 'numeric-3',  title: 'Numbers Nerd',      description: '3 habit pakai angka — kamu cinta data, kami cinta kamu 🤓', icon: '🤓', category: 'focus', currentValue: numericHabitsCount, targetValue: 3 },
    { id: 'note-1',     title: 'Dear Diary',        description: 'Nulis catatan refleksi pertama — hati jadi lebih ringan 📝', icon: '📝', category: 'focus', currentValue: totalNotes, targetValue: 1 },
    { id: 'note-10',    title: 'Storyteller',       description: '10 catatan — jurnal mini-mu udah bisa dibukukan! 📖', icon: '📖', category: 'focus', currentValue: totalNotes, targetValue: 10 },
    { id: 'note-30',    title: 'Chronicler',        description: '30 catatan — sebulan cerita, sebulan tumbuh 🌿', icon: '🌿', category: 'focus', currentValue: totalNotes, targetValue: 30 },
    { id: 'freeze-1',   title: 'Safety Net',        description: 'Pakai Streak Freeze sekali — pintar jaga ritme, bukan maksa ❄️', icon: '❄️', category: 'focus', currentValue: frozenCount, targetValue: 1 },
    { id: 'freeze-5',   title: 'Strategist',        description: '5 freeze terpakai dengan bijak — istirahat juga bagian dari rencana 🧊', icon: '🧊', category: 'focus', currentValue: frozenCount, targetValue: 5 },
    { id: 'reminder-1', title: 'Gentle Nudge',      description: 'Aktifin pengingat harian — biar habit nyapa kamu duluan ⏰', icon: '⏰', category: 'focus', currentValue: reminderCount, targetValue: 1 },
    { id: 'reminder-3', title: 'Notification Ninja',description: '3 habit pakai pengingat — nggak ada alasan “lupa” lagi 🥷', icon: '🥷', category: 'focus', currentValue: reminderCount, targetValue: 3 },
    { id: 'perfect-week-2', title: 'Perfect Weeks', description: '2 minggu sempurna (semua habit kelar tiap hari) — chef’s kiss 👨‍🍳', icon: '👨‍🍳', category: 'focus', currentValue: perfectWeeks, targetValue: 2 },

    // ── ✨ Extra playful / surprise family (10) ───────────────────────────
    { id: 'comeback',   title: 'The Comeback Kid',  description: 'Streak sempat putus tapi kamu balik lagi — itu yang paling keren 💪', icon: '💪', category: 'streak', currentValue: maxStreak >= 3 && totalCompletions >= 10 ? 1 : 0, targetValue: 1 },
    { id: 'early-bird', title: 'Early Bird',        description: 'Kumpulin 5 habit sebelum jam 9 pagi (psst, atur pengingat pagi!) 🐦', icon: '🐦', category: 'diversity', currentValue: activeHabitsCount >= 5 ? 1 : 0, targetValue: 1 },
    { id: 'night-owl',  title: 'Night Owl',         description: 'Suka beresin habit malam? Burung hantu approved 🦉', icon: '🦉', category: 'focus', currentValue: reminderCount >= 1 ? 1 : 0, targetValue: 1 },
    { id: 'weekend-warrior', title: 'Weekend Warrior', description: 'Konsisten di Sabtu-Minggu juga — weekend nggak jadi alasan 🛡️', icon: '🛡️', category: 'streak', currentValue: maxStreak >= 7 ? 1 : 0, targetValue: 1 },
    { id: 'consistency-king', title: 'Steady Heart', description: 'Completion rate 90%+ selama 30 hari — hatimu se-steady itu 💜', icon: '💜', category: 'total', currentValue: Math.max(...habitStats.map(s => s.completionRate), 0), targetValue: 90 },
    { id: 'collector',  title: 'Badge Collector',   description: 'Kumpulin 25 lencana — lemari pialamu penuh! 🏆', icon: '🏆', category: 'diversity', currentValue: 0, targetValue: 25 }, // placeholder, computed below
    { id: 'explorer',   title: 'Explorer',          description: 'Coba semua kategori yang ada — petualang sejati 🗺️', icon: '🗺️', category: 'diversity', currentValue: diversityFromCategories, targetValue: 4 },
    { id: 'minimalist', title: 'Less is More',     description: 'Cuma 1 habit tapi streak 14 hari — fokus itu seksi ✨', icon: '✨', category: 'focus', currentValue: activeHabitsCount === 1 && maxStreak >= 14 ? 1 : 0, targetValue: 1 },
    { id: 'social-butterfly', title: 'Share the Love', description: 'Bagikan streak card sekali — pamer dikit boleh, biar nular semangat 📣', icon: '📣', category: 'total', currentValue: totalCompletions >= 5 ? 1 : 0, targetValue: 1 },
    { id: 'pomodoro-pro', title: 'Pomodoro Pro',    description: 'Selesaikan 5 sesi fokus Pomodoro — otakmu bilang makasih 🍅', icon: '🍅', category: 'focus', currentValue: totalCompletions >= 5 ? 1 : 0, targetValue: 1 },
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
    { xp: 0,    title: 'Benih Kecil 🌱' },
    { xp: 150,  title: 'Tunas Semangat 🌿' },
    { xp: 400,  title: 'Si Rajin Pagi ☀️' },
    { xp: 750,  title: 'Penjaga Ritme 🥁' },
    { xp: 1200, title: 'Ksatria Konsisten ⚔️' },
    { xp: 1800, title: 'Arsitek Kebiasaan 🏗️' },
    { xp: 2500, title: 'Sang Disiplin 👑' },
    { xp: 3500, title: 'Legenda Harian 🌟' },
    { xp: 5000, title: 'Dewa Rutinitas ✨' },
    { xp: 7500, title: 'Transenden — Kamu Adalah Kebiasaan Itu 🪐' },
  ];

  let level = 1;
  let levelTitle = LEVELS[0].title;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp) { level = i + 1; levelTitle = LEVELS[i].title; break; }
  }

  return { badges, unlockedCount, totalCount, level, levelTitle, totalXp };
}
