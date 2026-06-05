import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '@/context/ProfileContext';

/**
 * AuthGuard — Route guard that redirects to /profiles if no profile is active.
 * Used to protect finance/habits/settings routes.
 *
 * Validates: Requirements 17.4 (state preservation on navigation)
 */
export default function AuthGuard() {
  const { isAuthenticated } = useProfile();

  if (!isAuthenticated) {
    return <Navigate to="/profiles" replace />;
  }

  return <Outlet />;
}
