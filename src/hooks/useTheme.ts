import { useState, useEffect, useCallback } from 'react';

/**
 * Theme preference type:
 * - 'light': always light mode
 * - 'dark': always dark mode
 * - 'system': follows prefers-color-scheme media query
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/** The resolved (applied) theme — always either light or dark */
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme_preference';

/**
 * Reads the stored theme preference from localStorage.
 * Falls back to 'system' if nothing is stored or value is invalid.
 */
function getStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'system';
}

/**
 * Returns the system's preferred color scheme.
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolves the effective theme based on the preference.
 */
function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

/**
 * Applies or removes the `.dark` class on the <html> element.
 */
function applyThemeToDOM(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * useTheme — Dark mode detection/toggle hook
 *
 * Requirements 16.3:
 * - Reads user preference from localStorage
 * - Falls back to prefers-color-scheme media query (when 'system')
 * - Applies/removes `.dark` class on <html>
 * - Updates in real-time if system preference changes
 *
 * @returns {object} theme state and setter
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredPreference())
  );

  // Apply theme to DOM whenever resolved theme changes
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for system preference changes (real-time update)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // Only react to system changes when preference is 'system'
      if (preference === 'system') {
        const newResolved = getSystemTheme();
        setResolvedTheme(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preference]);

  /**
   * Set the theme preference and persist to localStorage.
   */
  const setPreference = useCallback((newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    setResolvedTheme(resolveTheme(newPreference));
    try {
      localStorage.setItem(STORAGE_KEY, newPreference);
    } catch {
      // localStorage write failed — preference will not persist
    }
  }, []);

  return {
    /** The user's stored preference ('light' | 'dark' | 'system') */
    preference,
    /** The currently applied theme ('light' | 'dark') */
    resolvedTheme,
    /** Update the theme preference */
    setPreference,
    /** Whether dark mode is currently active */
    isDark: resolvedTheme === 'dark',
  };
}
