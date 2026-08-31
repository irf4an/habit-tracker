import { useMemo } from 'react';
import { Habit } from '../types';
import { calculateBadges } from '../achievements';

// Custom Hook to memoize heavy badge & XP calculations (ADR-0004)
export function useAchievements(habits: Habit[]) {
  // Create a lightweight fingerprint of habits history length to prevent recomputing on unrelated state changes
  const habitsFingerprint = useMemo(() => {
    return habits
      .map((h) => `${h.id}-${Object.keys(h.history).length}-${h.frozenDates?.length || 0}-${h.archived ? 1 : 0}`)
      .join('|');
  }, [habits]);

  const badgeData = useMemo(() => {
    return calculateBadges(habits);
  }, [habitsFingerprint, habits]);

  return badgeData;
}
