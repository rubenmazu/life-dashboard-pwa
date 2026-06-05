import { Outlet, useLocation } from 'react-router-dom';
import BottomTabBar from './BottomTabBar';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

/**
 * AppLayout — Main application layout with bottom tab bar and safe area insets.
 * Hides the BottomTabBar on profile/auth routes.
 * Preserves scroll position on navigation.
 *
 * Validates: Requirements 17.1, 17.4, 16.5
 */

/** Routes where the bottom tab bar should NOT be displayed */
const ROUTES_WITHOUT_TAB_BAR = ['/profiles', '/profiles/auth'];

function shouldShowTabBar(pathname: string): boolean {
  return !ROUTES_WITHOUT_TAB_BAR.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

export default function AppLayout() {
  const location = useLocation();
  const showTabBar = shouldShowTabBar(location.pathname);

  // Preserve scroll position across navigations
  useScrollRestoration();

  return (
    <div
      className="flex flex-col min-h-screen max-w-[430px] mx-auto"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Main content area */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: showTabBar ? 'calc(49px + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)',
        }}
      >
        <Outlet />
      </main>

      {/* Bottom navigation — hidden on profile/auth routes */}
      {showTabBar && <BottomTabBar />}
    </div>
  );
}
