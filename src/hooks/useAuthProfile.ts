import { useState, useEffect, useRef } from 'react';
import { UserProfile, Habit } from '../types';
import { fetchCloudHabits, syncHabitToCloud, fetchCloudProfile, syncProfileToCloud } from '../cloudSync';

export function useAuthProfile(
  habits: Habit[],
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>
) {
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

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('minimal_habit_profile_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    const today = new Date();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return {
      name: 'Pengguna',
      bio: '1% lebih baik setiap hari 🚀',
      avatarEmoji: '⚡',
      joinedDate: `${monthNames[today.getMonth()]} ${today.getFullYear()}`,
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
        habits.forEach((h) => syncHabitToCloud(user.id, h));
      }

      const cloudProfile = await fetchCloudProfile(user.id);
      if (cloudProfile) {
        setUserProfile(cloudProfile);
      } else {
        syncProfileToCloud(user.id, userProfile);
      }
    } catch (e) {
      console.error('Failed to handle auth success:', e);
    }
  };

  const handleSignOut = () => {
    setUserId(null);
    setUserEmail(null);
    try {
      localStorage.removeItem('minimal_habit_auth_user_id');
      localStorage.removeItem('minimal_habit_auth_email');
    } catch (e) {
      console.error('Failed to sign out:', e);
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
      console.error('Failed to save profile:', e);
    }
  };

  return {
    userId,
    userEmail,
    userProfile,
    handleAuthSuccess,
    handleSignOut,
    handleSaveProfile,
  };
}
