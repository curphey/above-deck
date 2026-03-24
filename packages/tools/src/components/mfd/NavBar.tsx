import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'home', icon: '⊞', label: 'Home', href: '/' },
  { id: 'solar', icon: '☀', label: 'Solar', href: '/tools/solar' },
  { id: 'vhf', icon: '📻', label: 'VHF', href: '/tools/vhf' },
  { id: 'chart', icon: '◈', label: 'Chart', href: '/tools/chart' },
] as const;

const GITHUB_SVG = (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

type ScreenId = (typeof NAV_ITEMS)[number]['id'];

interface NavBarProps {
  screenId?: string;
}

export function NavBar({ screenId }: NavBarProps) {
  const [active, setActive] = useState<string>(screenId || 'home');

  useEffect(() => {
    // Detect active screen from current URL path
    const path = window.location.pathname;
    const match = NAV_ITEMS.find((item) => item.href !== '/' && path.startsWith(item.href));
    if (match) setActive(match.id);
    else if (path === '/' || path === '') setActive('home');
  }, []);

  return (
    <div className="nav-bar">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.id}
          className={`nav-btn ${active === item.id ? 'active' : ''}`}
          href={item.href}
          aria-label={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </a>
      ))}
      <a
        className="nav-btn"
        href="https://github.com/abovedeck"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <span className="nav-icon">{GITHUB_SVG}</span>
        <span className="nav-label">GitHub</span>
      </a>
    </div>
  );
}
