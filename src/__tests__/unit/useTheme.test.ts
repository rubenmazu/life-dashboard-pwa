import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

describe('useTheme', () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void>;
  let matchMediaMatches: boolean;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Remove dark class from document
    document.documentElement.classList.remove('dark');

    matchMediaListeners = [];
    matchMediaMatches = false;

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: matchMediaMatches,
        media: query,
        addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
          matchMediaListeners.push(handler);
        },
        removeEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
          matchMediaListeners = matchMediaListeners.filter((h) => h !== handler);
        },
      })),
    });
  });

  it('defaults to system preference when no stored value', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('reads stored preference from localStorage', () => {
    localStorage.setItem('theme_preference', 'dark');
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('applies .dark class to html element when dark mode', () => {
    localStorage.setItem('theme_preference', 'dark');
    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes .dark class when switching to light', () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme_preference', 'light');
    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists preference to localStorage on setPreference', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setPreference('dark');
    });

    expect(localStorage.getItem('theme_preference')).toBe('dark');
    expect(result.current.preference).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('follows system preference when set to system and system is dark', () => {
    matchMediaMatches = true;
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('updates in real-time when system preference changes and preference is system', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.resolvedTheme).toBe('light');

    // Simulate system dark mode change
    matchMediaMatches = true;
    act(() => {
      matchMediaListeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does not react to system changes when preference is explicitly set', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setPreference('light');
    });

    // Simulate system going dark
    matchMediaMatches = true;
    act(() => {
      matchMediaListeners.forEach((listener) => listener({ matches: true }));
    });

    // Should remain light since preference is explicit
    expect(result.current.resolvedTheme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('handles invalid localStorage values gracefully', () => {
    localStorage.setItem('theme_preference', 'invalid_value');
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('system');
  });
});
