import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  label?: string;
}

/**
 * iOS-style back button for sub-page navigation.
 */
export function BackButton({ to, label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1 text-[15px] font-normal px-4 py-2"
      style={{
        color: 'var(--color-ios-blue)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        minHeight: '44px',
      }}
    >
      <svg
        width="10"
        height="16"
        viewBox="0 0 10 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8.5 1.5L1.5 8L8.5 14.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
