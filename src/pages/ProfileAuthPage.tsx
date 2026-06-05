import AuthGate from '@/components/profile/AuthGate';

/**
 * ProfileAuthPage — Authentication gate page for a specific profile.
 * Requirements 3.1, 3.3, 3.5, 3.6: Biometric/PIN auth with lockout.
 */
export default function ProfileAuthPage() {
  return <AuthGate />;
}
