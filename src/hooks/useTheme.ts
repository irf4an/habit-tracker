import { useState } from 'react';
import { flushSync } from 'react-dom';

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
    const x = e ? e.clientX : window.innerWidth - 24;
    const y = e ? e.clientY : 32;
    const apply = () =>
      flushSync(() => {
        setIsDarkMode(nextDark);
        try {
          localStorage.setItem('minimal_habit_theme_v1', nextDark ? 'dark' : 'light');
        } catch {}
      });

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply();
      return;
    }

    const t = doc.startViewTransition(apply);
    t.ready.then(() => {
      const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] },
        { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  };

  return { isDarkMode, toggleTheme };
}
