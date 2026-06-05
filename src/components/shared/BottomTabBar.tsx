import { useNavigate, useLocation } from 'react-router-dom';

/**
 * BottomTabBar - iOS-style bottom navigation with frosted glass effect.
 * 3 tabs: Finance, Habits, Settings
 * 
 * Validates: Requirements 16.4, 16.8, 17.1, 17.2, 17.3
 */

interface Tab {
  label: string;
  path: string;
  icon: (active: boolean) => React.ReactNode;
}

const FinanceIcon = ({ active }: { active: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? 'var(--color-ios-blue)' : 'var(--color-ios-gray)'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const HabitsIcon = ({ active }: { active: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? 'var(--color-ios-blue)' : 'var(--color-ios-gray)'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const SettingsIcon = ({ active }: { active: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? 'var(--color-ios-blue)' : 'var(--color-ios-gray)'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
  </svg>
);

const tabs: Tab[] = [
  {
    label: 'Finance',
    path: '/finance',
    icon: (active) => <FinanceIcon active={active} />,
  },
  {
    label: 'Habits',
    path: '/habits',
    icon: (active) => <HabitsIcon active={active} />,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: (active) => <SettingsIcon active={active} />,
  },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      {/* Frosted glass container */}
      <div
        className="mx-auto max-w-[430px] border-t border-[var(--color-ios-separator)]"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Dark mode override via CSS class */}
        <div className="dark:hidden absolute inset-0 -z-10" />
        <ul className="flex items-center justify-around h-[49px] m-0 p-0 list-none">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <li key={tab.path} className="flex-1">
                <button
                  type="button"
                  onClick={() => navigate(tab.path)}
                  aria-current={active ? 'page' : undefined}
                  className="flex flex-col items-center justify-center w-full min-h-[44px] min-w-[44px] gap-0.5 bg-transparent border-none cursor-pointer select-none [-webkit-tap-highlight-color:transparent] transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-ios)]"
                  style={{ padding: '4px 0' }}
                >
                  {tab.icon(active)}
                  <span
                    className="text-[10px] font-medium leading-none"
                    style={{
                      color: active
                        ? 'var(--color-ios-blue)'
                        : 'var(--color-ios-gray)',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Dark mode frosted glass style */}
      <style>{`
        .dark nav[aria-label="Main navigation"] > div:first-child {
          background-color: rgba(28, 28, 30, 0.88);
        }
      `}</style>
    </nav>
  );
}
