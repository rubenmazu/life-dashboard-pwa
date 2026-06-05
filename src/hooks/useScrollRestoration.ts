import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useScrollRestoration — Preserves and restores scroll position on navigation.
 * Stores scroll positions per path so returning to a route restores where the user left off.
 *
 * Validates: Requirements 17.4
 */

const scrollPositions = new Map<string, number>();

export function useScrollRestoration() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    // Save the scroll position for the previous path
    const prevPath = prevPathRef.current;
    if (prevPath !== location.pathname) {
      scrollPositions.set(prevPath, mainElement.scrollTop);
      prevPathRef.current = location.pathname;

      // Restore scroll position for the new path (if exists)
      const savedPosition = scrollPositions.get(location.pathname);
      if (savedPosition !== undefined) {
        // Use requestAnimationFrame to wait for DOM to update
        requestAnimationFrame(() => {
          mainElement.scrollTop = savedPosition;
        });
      } else {
        mainElement.scrollTop = 0;
      }
    }
  }, [location.pathname]);
}
