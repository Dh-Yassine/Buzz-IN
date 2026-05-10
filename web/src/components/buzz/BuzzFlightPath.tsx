/** Decorative dashed flight trail — not a bee graphic. */
export function BuzzFlightPath({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none text-buzz-forest/30 ${className}`}
      viewBox="0 0 120 60"
      aria-hidden
      fill="none"
    >
      <path
        d="M10 8 Q40 2 70 18 T110 35 Q95 50 60 48 T15 40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 10"
        className="buzz-dash"
      />
    </svg>
  );
}
