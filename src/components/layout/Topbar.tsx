import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Theme = 'light' | 'dark' | 'system';

export default function Topbar({ title }: { title: string }) {
  const { profile } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light');
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const initials = profile?.displayName
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>

      <div className="topbar-search" style={{ marginLeft: 24 }}>
        <span className="topbar-search-icon">
          <Search size={15} />
        </span>
        <input type="search" placeholder="Search transactions, items, parties…" />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" onClick={cycleTheme} title={`Theme: ${theme}`}>
          <ThemeIcon size={18} />
        </button>

        <button className="icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>

        <div className="user-avatar" title={profile?.displayName}>
          {initials}
        </div>
      </div>
    </header>
  );
}
