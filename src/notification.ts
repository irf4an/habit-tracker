// Browser Web Notifications Helper — with ServiceWorker push support for mobile/desktop

import { playReminderChime } from './sound';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

export async function sendHabitNotification(
  title: string,
  body: string,
  iconEmoji: string = '🎯',
  tag?: string
): Promise<Notification | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  // Local chime + haptic — Web Notifications on desktop are silent by spec, mobile needs vibrate
  try { playReminderChime(); } catch {}
  try { if ('vibrate' in navigator) navigator.vibrate([220, 100, 220]); } catch {}

  const notificationTitle = `${iconEmoji} ${title}`;
  const options = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: tag || `habit-reminder-${Date.now()}`,
    vibrate: [200, 100, 200],
  } as NotificationOptions & { vibrate?: number[] };

  // 1. Coba via ServiceWorker Registration jika tersedia (wajib untuk Android Chrome / PWA standalone)
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(notificationTitle, options);
        return null;
      }
    }
  } catch (err) {
    console.warn('ServiceWorker showNotification failed, falling back to Notification constructor', err);
  }

  // 2. Fallback ke window.Notification constructor biasa (Desktop Windows/Mac)
  try {
    const notif = new Notification(notificationTitle, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
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
