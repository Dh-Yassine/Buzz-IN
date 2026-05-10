/** Buzz-Points brand mark — coin emoji as the “logo” for currency. */
export function BuzzPointsBadge({
  amount,
  size = "md",
  className = "",
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const coinSizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl md:text-5xl",
  } as const;
  const numSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl md:text-4xl",
  } as const;

  return (
    <div
      role="img"
      aria-label={`${amount} Buzz-Points`}
      className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-100/90 via-yellow-50 to-amber-100/80 px-4 py-2 shadow-md ring-2 ring-amber-200/60 ring-offset-2 ring-offset-buzz-cream motion-safe:shadow-lg motion-safe:ring-amber-300/70 ${className}`}
    >
      <span className={`${coinSizes[size]} select-none leading-none buzz-bounce`} aria-hidden>
        🪙
      </span>
      <span
        className={`font-display font-bold tabular-nums leading-none text-buzz-forest ${numSizes[size]}`}
        aria-hidden
      >
        {amount}
      </span>
    </div>
  );
}

export function BuzzCoinIconOnly({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex select-none leading-none buzz-bounce ${className}`} aria-hidden>
      🪙
    </span>
  );
}
