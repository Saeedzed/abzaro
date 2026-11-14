/**
 * Abzaro brand mark — a rounded app-icon tile with the Persian letter «ا»
 * (alef) drawn as a toolbar glyph, on a blue gradient. Inline SVG keeps it
 * crisp at every size and needs no extra network request.
 */
export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="abzaro-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#abzaro-logo-grad)" />
      {/* alef stroke — the upright of «ابزارو», shaped like a tool shaft */}
      <path
        d="M20.6 9.2c-.62 0-1.1.48-1.1 1.1v14.9c0 2.36.92 3.9 3.42 3.9 1.2 0 2.16-.42 2.9-1.18"
        stroke="#ffffff"
        strokeWidth="3.1"
        strokeLinecap="round"
        fill="none"
      />
      {/* small spark / wrench socket */}
      <circle cx="27.4" cy="12.6" r="2.1" fill="#ffffff" />
      <circle cx="27.4" cy="12.6" r="0.95" fill="#2563eb" />
    </svg>
  );
}
