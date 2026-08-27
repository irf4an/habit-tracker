import React from 'react';

export type FluentOutlineName =
  | 'sparkle'
  | 'keyboard'
  | 'dismiss'
  | 'trophy'
  | 'lock_closed'
  | 'plant'
  | 'leaf'
  | 'target'
  | 'lightbulb'
  | 'book_open'
  | 'info'
  | 'star';

interface FluentOutlineIconProps {
  name: FluentOutlineName | string;
  size?: number;
  className?: string;
  color?: string;
  ariaHidden?: boolean;
  style?: React.CSSProperties;
}

// Fluent UI Outline 24px (Windows 11) — Rounded corner radius, friendly soft contours (Monochrome True / follows text color)
const fluentPaths: Record<string, React.ReactNode> = {
  // Fluent: Sparkle / Sparkles 24 Outline
  sparkle: (
    <path
      d="M12 2.5c.34 0 .64.21.76.53l1.83 4.88c.3.8 1 1.5 1.8 1.8l4.88 1.83c.32.12.53.42.53.76s-.21.64-.53.76l-4.88 1.83c-.8.3-1.5 1-1.8 1.8l-1.83 4.88c-.12.32-.42.53-.76.53s-.64-.21-.76-.53l-1.83-4.88c-.3-.8-1-1.5-1.8-1.8L2.73 13.26c-.32-.12-.53-.42-.53-.76s.21-.64.53-.76l4.88-1.83c.8-.3 1.5-1 1.8-1.8L11.24 3.03c.12-.32.42-.53.76-.53zm0 2.92l-1.34 3.57a4.52 4.52 0 01-2.57 2.57L4.52 12.5l3.57 1.34a4.52 4.52 0 012.57 2.57l1.34 3.57 1.34-3.57a4.52 4.52 0 012.57-2.57l3.57-1.34-3.57-1.34a4.52 4.52 0 01-2.57-2.57L12 5.42z"
      fill="currentColor"
    />
  ),
  // Fluent: Keyboard 24 Outline
  keyboard: (
    <path
      d="M5.5 5A3.5 3.5 0 002 8.5v7A3.5 3.5 0 005.5 19h13a3.5 3.5 0 003.5-3.5v-7A3.5 3.5 0 0018.5 5h-13zM3.5 8.5a2 2 0 012-2h13a2 2 0 012 2v7a2 2 0 01-2 2h-13a2 2 0 01-2-2v-7zm3 1a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2zm-12 3.5a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1z"
      fill="currentColor"
    />
  ),
  // Fluent: Dismiss / Close 24 Outline (rounded soft ends)
  dismiss: (
    <path
      d="M4.29 4.29a1 1 0 011.42 0L12 10.59l6.29-6.3a1 1 0 111.42 1.42L13.41 12l6.3 6.29a1 1 0 01-1.42 1.42L12 13.41l-6.29 6.3a1 1 0 01-1.42-1.42L10.59 12 4.29 5.71a1 1 0 010-1.42z"
      fill="currentColor"
    />
  ),
  // Fluent: Trophy 24 Outline
  trophy: (
    <path
      d="M6 3.5A2.5 2.5 0 003.5 6v1.25a4.75 4.75 0 004.28 4.72A5.76 5.76 0 0011 15.82V18.5H8.75a1 1 0 100 2h6.5a1 1 0 100-2H13v-2.68a5.76 5.76 0 003.22-3.85 4.75 4.75 0 004.28-4.72V6A2.5 2.5 0 0018 3.5H6zM5 6a1 1 0 011-1h.5v5.77A3.26 3.26 0 015 7.25V6zm14 1.25c0 1.58-.94 2.94-2.5 3.52V5H18a1 1 0 011 1v1.25zM8 5h8v5.5a4 4 0 01-8 0V5z"
      fill="currentColor"
    />
  ),
  // Fluent: Lock Closed 24 Outline
  lock_closed: (
    <path
      d="M12 2a5 5 0 00-5 5v2.25A3.75 3.75 0 003.25 13v5A3.75 3.75 0 007 21.75h10A3.75 3.75 0 0020.75 18v-5A3.75 3.75 0 0017 9.25V7a5 5 0 00-5-5zm-3.5 5a3.5 3.5 0 017 0v2.25H8.5V7zm-3.75 6A2.25 2.25 0 017 10.75h10a2.25 2.25 0 012.25 2.25v5A2.25 2.25 0 0117 20.25H7A2.25 2.25 0 014.75 18v-5zm7.25 1.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z"
      fill="currentColor"
    />
  ),
  // Fluent: Plant / Sprout 24 Outline (for empty states)
  plant: (
    <path
      d="M12 21.25a.75.75 0 01-.75-.75v-7.5c0-1.8-1.46-3.25-3.25-3.25H6.5a4.5 4.5 0 01-4.5-4.5V4.5a.75.75 0 01.75-.75h.75a9.75 9.75 0 019.75 9.75v5.75a.75.75 0 01-.75.75zM3.5 5.25v.75a3 3 0 003 3H8c.97 0 1.75.78 1.75 1.75v1.89A8.26 8.26 0 003.5 5.25zm13.75 4.5a.75.75 0 01-.75-.75v-.75a3 3 0 00-3-3H12a.75.75 0 010-1.5h1.5a4.5 4.5 0 014.5 4.5v.75a.75.75 0 01-.75.75z"
      fill="currentColor"
    />
  ),
  // Fluent: Leaf 24 Outline
  leaf: (
    <path
      d="M20.75 3.25a.75.75 0 00-.75.75v.5A13.5 13.5 0 016.5 18H5a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-.75h.75A15 15 0 0021.5 4.5v-.5a.75.75 0 00-.75-.75zM19.98 5.76A13.48 13.48 0 018 16.48 11.97 11.97 0 014.02 12c0-5.8 4.2-10.5 9.5-10.5h6.46v4.26z"
      fill="currentColor"
    />
  ),
  // Fluent: Target 24 Outline
  target: (
    <path
      d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18.5a8.5 8.5 0 110-17 8.5 8.5 0 010 17zm0-14.5a6 6 0 100 12 6 6 0 000-12zm0 10.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9zm0-6.5a2 2 0 100 4 2 2 0 000-4z"
      fill="currentColor"
    />
  ),
  // Fluent: Lightbulb 24 Outline
  lightbulb: (
    <path
      d="M12 2a7 7 0 00-4.9 12c.96.96 1.65 2.19 1.84 3.5h6.12c.19-1.31.88-2.54 1.84-3.5A7 7 0 0012 2zm3.43 10.94a7.48 7.48 0 01-1.93 3.56H10.5a7.48 7.48 0 01-1.93-3.56A5.5 5.5 0 1115.43 12.94zM9 19a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1zm1.5 2.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z"
      fill="currentColor"
    />
  ),
  // Fluent: Book Open 24 Outline
  book_open: (
    <path
      d="M12 5.5c-2.14-1.2-4.66-1.5-7.25-1.5A2.75 2.75 0 002 6.75v11A2.75 2.75 0 004.75 20.5c2.59 0 5.11.3 7.25 1.5 2.14-1.2 4.66-1.5 7.25-1.5A2.75 2.75 0 0022 17.75v-11A2.75 2.75 0 0019.25 4c-2.59 0-5.11.3-7.25 1.5zm-6.5.75c2.4 0 4.74.3 6.75 1.43v11.58A14.28 14.28 0 004.75 19a1.25 1.25 0 01-1.25-1.25v-11c0-.69.56-1.25 1.25-1.25zm15 11.5c0 .69-.56 1.25-1.25 1.25a14.28 14.28 0 00-7.5-.26V7.68c2.01-1.13 4.35-1.43 6.75-1.43.69 0 1.25.56 1.25 1.25v11z"
      fill="currentColor"
    />
  ),
  // Fluent: Info 24 Outline
  info: (
    <path
      d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18.5a8.5 8.5 0 110-17 8.5 8.5 0 010 17zM12 7a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm0 4.5a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z"
      fill="currentColor"
    />
  ),
  // Fluent: Star 24 Outline
  star: (
    <path
      d="M12 2.5a1.25 1.25 0 011.14.74l2.5 5.06 5.58.81a1.25 1.25 0 01.69 2.13l-4.04 3.94.95 5.56a1.25 1.25 0 01-1.81 1.32L12 19.44l-4.99 2.62a1.25 1.25 0 01-1.81-1.32l.95-5.56-4.04-3.94a1.25 1.25 0 01.69-2.13l5.58-.81 2.5-5.06A1.25 1.25 0 0112 2.5zm0 2.82l-2.16 4.37a1.25 1.25 0 01-.94.68l-4.82.7 3.49 3.4a1.25 1.25 0 01.36 1.1l-.82 4.8 4.31-2.27a1.25 1.25 0 011.16 0l4.31 2.27-.82-4.8a1.25 1.25 0 01.36-1.1l3.49-3.4-4.82-.7a1.25 1.25 0 01-.94-.68L12 5.32z"
      fill="currentColor"
    />
  ),
};

export const FluentOutlineIcon: React.FC<FluentOutlineIconProps> = ({
  name,
  size = 24,
  className = '',
  color,
  ariaHidden = true,
  style,
}) => {
  const path = fluentPaths[name] || fluentPaths['sparkle'];

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color || 'currentColor'}
      aria-hidden={ariaHidden}
      className={`shrink-0 inline-block align-middle transition-transform select-none ${className}`.trim()}
      style={{
        minWidth: size,
        minHeight: size,
        ...style,
      }}
    >
      {path}
    </svg>
  );
};

export default FluentOutlineIcon;
