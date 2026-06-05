import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/components/shared/AppLayout';
import AuthGuard from '@/components/shared/AuthGuard';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Page components (lazy-loaded in production, direct imports for now)
import ProfilesPage from '@/pages/ProfilesPage';
import ProfileAuthPage from '@/pages/ProfileAuthPage';
import FinanceDashboardPage from '@/pages/FinanceDashboardPage';
import IncomePage from '@/pages/IncomePage';
import CategoriesPage from '@/pages/CategoriesPage';
import ExpensesPage from '@/pages/ExpensesPage';
import WeeklyStatsPage from '@/pages/WeeklyStatsPage';
import HabitsPage from '@/pages/HabitsPage';
import HabitManagePage from '@/pages/HabitManagePage';
import HabitStatsPage from '@/pages/HabitStatsPage';
import SettingsPage from '@/pages/SettingsPage';
import RootRedirect from '@/components/shared/RootRedirect';

/**
 * Application router configuration.
 * 
 * Route structure:
 * /                       → Redirect to /profiles or /finance (if authenticated)
 * /profiles               → Profile selection / creation
 * /profiles/auth/:id      → Authentication gate for a profile
 * /finance                → Finance Dashboard (charts + summary)
 * /finance/income         → Income management
 * /finance/categories     → Category management
 * /finance/expenses       → Expense list and entry
 * /finance/weekly         → Weekly statistics
 * /habits                 → Daily habit checklist
 * /habits/manage          → Habit/Category/Group CRUD
 * /habits/stats           → Weekly habit statistics
 * /settings               → Settings (notifications, export/import, auth, about)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Root redirect — context-aware
      {
        index: true,
        element: <RootRedirect />,
      },

      // Profile routes (no auth guard)
      {
        path: 'profiles',
        element: <ProfilesPage />,
      },
      {
        path: 'profiles/auth/:id',
        element: <ProfileAuthPage />,
      },

      // Protected routes (require active profile)
      {
        element: <AuthGuard />,
        children: [
          // Finance module
          {
            path: 'finance',
            element: <ErrorBoundary moduleName="Finance"><FinanceDashboardPage /></ErrorBoundary>,
          },
          {
            path: 'finance/income',
            element: <ErrorBoundary moduleName="Finance"><IncomePage /></ErrorBoundary>,
          },
          {
            path: 'finance/categories',
            element: <ErrorBoundary moduleName="Finance"><CategoriesPage /></ErrorBoundary>,
          },
          {
            path: 'finance/expenses',
            element: <ErrorBoundary moduleName="Finance"><ExpensesPage /></ErrorBoundary>,
          },
          {
            path: 'finance/weekly',
            element: <ErrorBoundary moduleName="Finance"><WeeklyStatsPage /></ErrorBoundary>,
          },

          // Habits module
          {
            path: 'habits',
            element: <ErrorBoundary moduleName="Habits"><HabitsPage /></ErrorBoundary>,
          },
          {
            path: 'habits/manage',
            element: <ErrorBoundary moduleName="Habits"><HabitManagePage /></ErrorBoundary>,
          },
          {
            path: 'habits/stats',
            element: <ErrorBoundary moduleName="Habits"><HabitStatsPage /></ErrorBoundary>,
          },

          // Settings
          {
            path: 'settings',
            element: <ErrorBoundary moduleName="Settings"><SettingsPage /></ErrorBoundary>,
          },
        ],
      },

      // Catch-all redirect
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
