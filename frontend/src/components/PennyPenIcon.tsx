interface PennyPenIconProps {
  size?: number;
  className?: string;
}

/**
 * Custom icon representing the Readia.io brand concept:
 * An article/document with a coin overlay symbolizing micropayments for content
 */
function PennyPenIcon({ size = 24, className = '' }: PennyPenIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Document/Article background */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />

      {/* Article content lines */}
      <line x1="7" y1="13" x2="12" y2="13" strokeWidth="1.5" />
      <line x1="7" y1="17" x2="11" y2="17" strokeWidth="1.5" />

      {/* Coin/Penny circle overlay */}
      <circle cx="16" cy="16" r="4.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="16" cy="16" r="4.5" />

      {/* Cent symbol (¢) inside coin */}
      <path d="M17.2 14.5a1.8 1.8 0 0 0-1.8 1.5" strokeWidth="1.5" />
      <path d="M17.2 17.5a1.8 1.8 0 0 1-1.8-1.5" strokeWidth="1.5" />
      <line x1="16" y1="13.5" x2="16" y2="18.5" strokeWidth="1.5" />
    </svg>
  );
}

export default PennyPenIcon;
