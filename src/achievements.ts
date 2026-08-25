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
    ...calculateStreak(h.history),
  }));

  const totalCompletions = habitStats.reduce((acc, s) => acc + s.totalCompleted, 0);
  const maxStreak = Math.max(0, ...habitStats.map((s) => s.bestStreak));
  const activeHabitsCount = habits.filter((h) => !h.archived).length;
  const numericHabitsCount = habits.filter((h) => h.type === 'numeric').length;

  const BADGE_DEFINITIONS: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'streak' | 'total' | 'diversity' | 'focus';
    currentValue: number;
    targetValue: number;
  }> = [
    // Streak Badges
    {
      id: 'streak-3',
      title: 'Ignition Spark',
      description: 'Capai streak berturut-turut selama 3 hari.',
      icon: '🔥',
      category: 'streak',
      currentValue: maxStreak,
      targetValue: 3,
    },
    {
      id: 'streak-7',
      title: '7-Day Warrior',
      description: 'Konsisten menyelesaikan habit selama 1 minggu penuh.',
      icon: '⚡',
      category: 'streak',
      currentValue: maxStreak,
      targetValue: 7,
    },
    {
      id: 'streak-21',
      title: 'Habit Former',
      description: 'Capai streak 21 hari (fase pembentukan kebiasaan baru).',
      icon: '🧠',
      category: 'streak',
      currentValue: maxStreak,
      targetValue: 21,
    },
    {
      id: 'streak-30',
      title: 'Discipline Master',
      description: 'Kuasai streak selama 30 hari tanpa jeda.',
      icon: '👑',
      category: 'streak',
      currentValue: maxStreak,
      targetValue: 30,
    },
    {
      id: 'streak-100',
      title: 'Centurion Legend',
      description: 'Luar biasa! Capai 100 hari streak berturut-turut.',
      icon: '💎',
      category: 'streak',
      currentValue: maxStreak,
      targetValue: 100,
    },

    // Total Check-in Badges
    {
      id: 'total-10',
      title: 'First Milestone',
      description: 'Total 10 kali check-in berhasil dicatat.',
      icon: '🎯',
      category: 'total',
      currentValue: totalCompletions,
      targetValue: 10,
    },
    {
      id: 'total-50',
      title: 'Momentum Builder',
      description: 'Kumpulkan total 50 check-in di seluruh habit.',
      icon: '🚀',
      category: 'total',
      currentValue: totalCompletions,
      targetValue: 50,
    },
    {
      id: 'total-200',
      title: 'Unstoppable Force',
      description: 'Mencapai total 200 check-in seumur hidup.',
      icon: '🌟',
      category: 'total',
      currentValue: totalCompletions,
      targetValue: 200,
    },

    // Diversity / Organization Badges
    {
      id: 'diversity-3',
      title: 'Balanced Life',
      description: 'Miliki setidaknya 3 habit aktif di waktu bersamaan.',
      icon: '⚖️',
      category: 'diversity',
      currentValue: activeHabitsCount,
      targetValue: 3,
    },
    {
      id: 'numeric-tracker',
      title: 'Data Quantifier',
      description: 'Buat dan lacak setidaknya 1 habit bertipe target numerik.',
      icon: '📊',
      category: 'focus',
      currentValue: numericHabitsCount,
      targetValue: 1,
    },
  ];

  const badges: Badge[] = BADGE_DEFINITIONS.map((def) => {
    const unlocked = def.currentValue >= def.targetValue;
    const progress = Math.min(100, Math.round((def.currentValue / def.targetValue) * 100));
    return {
      ...def,
      unlocked,
      progress,
    };
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  // XP & Level calculations
  // Each unlocked badge = 100 XP, each check-in = 10 XP
  const totalXp = unlockedCount * 100 + totalCompletions * 10;
  
  let level = 1;
  let levelTitle = 'Novice Starter';

  if (totalXp >= 2000) {
    level = 5;
    levelTitle = 'Transcendent Master';
  } else if (totalXp >= 1000) {
    level = 4;
    levelTitle = 'Discipline Champion';
  } else if (totalXp >= 500) {
    level = 3;
    levelTitle = 'Consistent Achiever';
  } else if (totalXp >= 200) {
    level = 2;
    levelTitle = 'Routine Builder';
  }

  return {
    badges,
    unlockedCount,
    totalCount,
    level,
    levelTitle,
    totalXp,
  };
}
