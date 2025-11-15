'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get initial theme
    const stored = localStorage.getItem('api-mapper-theme') || 'light';
    setCurrentTheme(stored);
    applyTheme(stored);
  }, []);

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes
    root.classList.remove('light', 'dark');

    // Apply new theme
    if (theme === 'dark') {
      root.classList.add('dark');
      body.style.backgroundColor = '#0f172a'; // slate-900
      body.style.color = '#f8fafc'; // slate-50
    } else if (theme === 'light') {
      root.classList.add('light');
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#0f172a';
    } else {
      // system
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
        body.style.backgroundColor = '#0f172a';
        body.style.color = '#f8fafc';
      } else {
        root.classList.add('light');
        body.style.backgroundColor = '#ffffff';
        body.style.color = '#0f172a';
      }
    }

    console.log('🎨 Applied theme:', theme, 'Root classes:', root.className);
  };

  const toggleTheme = () => {
    let newTheme: string;
    if (currentTheme === 'light') {
      newTheme = 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = 'system';
    } else {
      newTheme = 'light';
    }

    console.log('🎨 Changing theme from', currentTheme, 'to', newTheme);
    setCurrentTheme(newTheme);
    localStorage.setItem('api-mapper-theme', newTheme);
    applyTheme(newTheme);
  };

  const getIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />;

    if (currentTheme === 'dark') {
      return <Moon className="h-4 w-4" />;
    } else if (currentTheme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (!mounted) return 'Loading...';
    return currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-12 h-6 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-9 h-9 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="flex items-center gap-2">
      {/* Theme indicator */}
      <div
        className="px-2 py-1 text-xs rounded font-medium transition-colors"
        style={{
          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          color: isDark ? '#f8fafc' : '#0f172a',
          border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`
        }}
      >
        {getLabel()}
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center justify-center w-9 h-9 p-0 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a',
          border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f8fafc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#ffffff';
        }}
      >
        {getIcon()}
      </button>
    </div>
  );
}
