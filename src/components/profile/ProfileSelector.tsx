import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfiles, type ProfileMeta } from '@/services/profile.service';
import { useProfile } from '@/context/ProfileContext';

/**
 * ProfileSelector — Grid of profile cards with "Create Profile" action.
 * Requirements 2.2: Shows all profiles by name on launch.
 * Requirements 2.8: Redirects to creation if no profiles exist.
 */
export default function ProfileSelector() {
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setActiveProfile } = useProfile();

  useEffect(() => {
    const loadedProfiles = getProfiles();
    setProfiles(loadedProfiles);
    setLoading(false);

    // Requirement 2.8: First launch with no profiles → redirect to creation
    if (loadedProfiles.length === 0) {
      navigate('/profiles/create', { replace: true });
    }
  }, [navigate]);

  const handleProfileSelect = (profile: ProfileMeta) => {
    if (profile.hasAuth) {
      // Navigate to auth gate for profiles with authentication
      navigate(`/profiles/auth/${profile.id}`);
    } else {
      // Directly set active profile if no auth required (Requirement 3.6)
      setActiveProfile(profile.id);
      navigate('/finance', { replace: true });
    }
  };

  const handleCreateProfile = () => {
    navigate('/profiles/create');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-8 h-8 rounded-full border-2 border-[var(--color-ios-blue)] border-t-transparent animate-spin"
          aria-label="Loading profiles"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 pt-12 pb-8">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-[var(--color-ios-text-primary)] mb-2">
        Who's using?
      </h1>
      <p className="text-[var(--color-ios-text-tertiary)] text-base mb-8">
        Select your profile to continue
      </p>

      {/* Profile Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[360px]">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleProfileSelect(profile)}
            className="ios-card flex flex-col items-center justify-center gap-2 aspect-square cursor-pointer transition-transform active:scale-95"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label={`Select profile ${profile.name}${profile.hasAuth ? ', password protected' : ''}`}
          >
            {/* Avatar circle with first letter */}
            <div className="w-14 h-14 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center text-white text-xl font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </div>

            {/* Name + auth indicator */}
            <div className="flex items-center gap-1.5">
              <span className="text-base font-medium text-[var(--color-ios-text-primary)] truncate max-w-[100px]">
                {profile.name}
              </span>
              {profile.hasAuth && (
                <LockIcon />
              )}
            </div>
          </button>
        ))}

        {/* Create Profile Card */}
        <button
          onClick={handleCreateProfile}
          className="ios-card flex flex-col items-center justify-center gap-2 aspect-square cursor-pointer border-2 border-dashed border-[var(--color-ios-separator)] bg-transparent transition-transform active:scale-95"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Create new profile"
        >
          <div className="w-14 h-14 rounded-full bg-[var(--color-ios-bg)] flex items-center justify-center">
            <PlusIcon />
          </div>
          <span className="text-base font-medium text-[var(--color-ios-blue)]">
            Create
          </span>
        </button>
      </div>
    </div>
  );
}

/** Lock icon SVG — indicates profile has authentication enabled */
function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-ios-text-tertiary)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** Plus icon SVG for the "Create Profile" card */
function PlusIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-ios-blue)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
