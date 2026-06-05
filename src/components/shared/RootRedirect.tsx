import { Navigate } from 'react-router-dom';
import { useProfile } from '@/context/ProfileContext';

/**
 * RootRedirect — Redirects `/` to either `/finance` (if authenticated)
 * or `/profiles` (if no active profile).
 */
export default function RootRedirect() {
  const { isAuthenticated } = useProfile();

  if (isAuthenticated) {
    return <Navigate to="/finance" replace />;
  }

  return <Navigate to="/profiles" replace />;
}
