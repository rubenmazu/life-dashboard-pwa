import ProfileSelector from '@/components/profile/ProfileSelector';

/**
 * ProfilesPage - Profile selection and creation screen.
 * Renders the ProfileSelector component which handles:
 * - Displaying a grid of profile cards (Requirement 2.2)
 * - Redirecting to profile creation on first launch (Requirement 2.8)
 * - Navigating to auth gate or setting active profile on selection
 */
export default function ProfilesPage() {
  return <ProfileSelector />;
}
