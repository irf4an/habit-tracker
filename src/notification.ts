// Browser Web Notifications Helper — now with snooze + quiet-hours utils

import { playReminderChime } from './sound';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    alert('Browser kamu belum mendukung Web Notifications.');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function sendHabitNotification(title: string, body: string, iconEmoji: string = '🎯'): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;
  // Local chime + haptic — Web Notifications on desktop are silent by spec, mobile needs vibrate
  try { playReminderChime(); } catch {}
  try { if ('vibrate' in navigator) navigator.vibrate([220, 100, 220]); } catch {}
  try {
    const notif = new Notification(`${iconEmoji} ${title}`, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `habit-reminder-${Date.now()}`,
    } as NotificationOptions);
    notif.onclick = () => { window.focus(); notif.close(); };
    return notif;
  } catch (err) {
    console.error('Failed to trigger notification:', err);
    return null;
  }
}

/** Returns true if current time falls inside quiet-hours window. Handles overnight wraparound. */
export function isInQuietHours(start: string, end: string, now: Date = new Date()): boolean {
  const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = toMin(start), e = toMin(end);
  if (s === e) return false;
  if (s < e) return cur >= s && cur < e;
  return cur >= s || cur < e; // overnight e.g. 22:00-07:00
}
