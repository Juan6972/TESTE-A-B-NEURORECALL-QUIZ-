import type { ReactNode } from 'react';

// The same four Lucide SVG drawings previously used here; see licenses/lucide.txt.
function Icon({ name, size = 24, children }: { name: string; size?: number; children: ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`lucide lucide-${name}`}>
      {children}
    </svg>
  );
}

export function Headphones({ size }: { size?: number }) {
  return <Icon name="headphones" size={size}><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /></Icon>;
}

export function Menu({ size }: { size?: number }) {
  return <Icon name="menu" size={size}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></Icon>;
}

export function Play() {
  return <Icon name="play"><polygon points="6 3 20 12 6 21 6 3" /></Icon>;
}

export function RotateCcw() {
  return <Icon name="rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Icon>;
}
