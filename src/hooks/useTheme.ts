import { useState } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('minimal_habit_theme_v1');
      if (saved) return saved === 'dark';
    } catch {}
    return true;
  });

  const toggleTheme = (e?: React.MouseEvent<HTMLButtonElement>) => {
    const nextDark = !isDarkMode;
    const canAnimate =
      typeof document !== 'undefined' &&
      (document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }).startViewTransition &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      (navigator.hardwareConcurrency == null || navigator.hardwareConcurrency > 4);

    const persist = () => {
      setIsDarkMode(nextDark);
      try {
        localStorage.setItem('minimal_habit_theme_v1', nextDark ? 'dark' : 'light');
      } catch {}
    };

    if (!canAnimate) {
      persist();
      return;
    }

    // Lightweight circular reveal — 260ms (was 420ms) for instant feel
    const x = e ? e.clientX : window.innerWidth - 24;
    const y = e ? e.clientY : 32;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const t = doc.startViewTransition!(persist);
    t.ready.then(() => {
      const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] },
        { duration: 260, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };

  return { isDarkMode, toggleTheme };
}
