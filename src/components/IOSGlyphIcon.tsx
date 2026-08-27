import React from 'react';

export type IOSGlyphName =
  | 'calendar_fill'
  | 'chart_fill'
  | 'sliders_fill'
  | 'person_fill'
  | 'plus_fill'
  | 'avatar_placeholder'
  | 'flame_fill'
  | 'check_circle_fill'
  | 'gear_fill'
  | 'trophy_fill';

interface IOSGlyphIconProps {
  name: IOSGlyphName | string;
  size?: number;
  className?: string;
  color?: string;
  ariaHidden?: boolean;
  style?: React.CSSProperties;
}

// SF Symbols / iOS Glyph — Solid fill, super minimal, bold & premium Apple aesthetics (Monochrome True / follows text color)
const iosGlyphPaths: Record<string, React.ReactNode> = {
  // SF Symbol: calendar (solid filled body with header cutout)
  calendar_fill: (
    <path d="M19 4h-1V2.5a1 1 0 00-2 0V4H8V2.5a1 1 0 00-2 0V4H5C3.34 4 2 5.34 2 7v12c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3zM4 9h16v10c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V9zm3 3h3v3H7v-3zm5 0h3v3h-3v-3z" />
  ),
  // SF Symbol: chart.bar.xaxis (solid bold bars with rounded caps)
  chart_fill: (
    <path d="M5 9.5A1.5 1.5 0 016.5 8h1A1.5 1.5 0 019 9.5V19a1 1 0 01-1 1H6a1 1 0 01-1-1V9.5zm5.5-5A1.5 1.5 0 0112 3h1a1.5 1.5 0 011.5 1.5V19a1 1 0 01-1 1h-2a1 1 0 01-1-1V4.5zm5.5 8a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5V19a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6.5z" />
  ),
  // SF Symbol: slider.horizontal.3 (solid iOS control sliders)
  sliders_fill: (
    <path d="M3 6.5A1.5 1.5 0 014.5 5h1a1.5 1.5 0 011.5 1.5v.25H20a1.25 1.25 0 010 2.5H7v.25A1.5 1.5 0 015.5 11h-1A1.5 1.5 0 013 9.5v-3zm14 6a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v.25H20a1.25 1.25 0 010 2.5h-.25v.25a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-3zm-13 1.25a1.25 1.25 0 000 2.5H15v-2.5H4zm6 5.25a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v.25H20a1.25 1.25 0 010 2.5h-7.5v.25a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-3zm-6 1.25a1.25 1.25 0 000 2.5H10v-2.5H4z" />
  ),
  // SF Symbol: person.fill (solid bold iOS silhouette)
  person_fill: (
    <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2.5c-3.73 0-11 1.88-11 5.62V21a1 1 0 001 1h20a1 1 0 001-1v-.88c0-3.74-7.27-5.62-11-5.62z" />
  ),
  // SF Symbol: plus (iOS rounded thick plus)
  plus_fill: (
    <path d="M12 4a1.75 1.75 0 011.75 1.75v4.5h4.5a1.75 1.75 0 010 3.5h-4.5v4.5a1.75 1.75 0 01-3.5 0v-4.5h-4.5a1.75 1.75 0 010-3.5h4.5v-4.5A1.75 1.75 0 0112 4z" />
  ),
  // SF Symbol: person.crop.circle.fill (avatar placeholder)
  avatar_placeholder: (
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3.5c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  ),
  // SF Symbol: flame.fill (solid streak flame)
  flame_fill: (
    <path d="M12 2c-.6 0-1.12.37-1.34.92-.85 2.15-2.22 3.8-3.69 5.37C5.35 9.98 4 12.21 4 14.75 4 19.3 7.58 23 12 23s8-3.7 8-8.25c0-4.32-3.13-7.55-5.69-10.15-.88-.9-1.74-1.77-2.31-2.6-.26-.38-.68-.6-1.13-.6-.35 0-.69.14-.94.39-.42.42-.76 1.01-.93 1.61zM12 18c-1.66 0-3-1.34-3-3 0-1.5 1.2-2.8 2.2-3.8.3-.3.6-.6.8-1 .3.4.6.7.8 1 1 1 2.2 2.3 2.2 3.8 0 1.66-1.34 3-3 3z" />
  ),
  // SF Symbol: checkmark.circle.fill
  check_circle_fill: (
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.6l-4.1-4.1a1 1 0 011.41-1.41L10.8 13.8l6.89-6.9a1 1 0 111.41 1.42l-7.6 7.6a1 1 0 01-1.41 0z" />
  ),
  // SF Symbol: gearshape.fill
  gear_fill: (
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.484.484 0 0014 2h-4c-.25 0-.46.18-.49.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 00-.59.22L2.63 8.47c-.13.22-.09.49.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  ),
  // SF Symbol: trophy.fill
  trophy_fill: (
    <path d="M19 4h-2V3a1 1 0 00-1-1H8a1 1 0 00-1 1v1H5C3.34 4 2 5.34 2 7v1c0 2.55 1.92 4.63 4.39 4.94A5.992 5.992 0 0011 16.9V19H8a1 1 0 000 2h8a1 1 0 000-2h-3v-2.1c2.1-.42 3.86-1.85 4.61-3.96C20.08 12.63 22 10.55 22 8V7c0-1.66-1.34-3-3-3zM4 8V7c0-.55.45-1 1-1h2v4.82C5.84 10.4 4.8 9.3 4 8zm16 0c-.8 1.3-1.84 2.4-3 2.82V6h2c.55 0 1 .45 1 1v1z" />
  ),
};

export const IOSGlyphIcon: React.FC<IOSGlyphIconProps> = ({
  name,
  size = 30,
  className = '',
  color,
  ariaHidden = true,
  style,
}) => {
  const path = iosGlyphPaths[name] || iosGlyphPaths['person_fill'];

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

export default IOSGlyphIcon;
