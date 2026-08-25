// Browser Web Notifications Helper

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    alert('Browser kamu belum mendukung Web Notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  return false;
}

export function sendHabitNotification(title: string, body: string, iconEmoji: string = '🎯') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(`${iconEmoji} ${title}`, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `habit-reminder-${Date.now()}`,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.error('Failed to trigger notification:', err);
  }
}
