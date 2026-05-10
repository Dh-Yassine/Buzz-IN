/** Soft dot “pollen / hive” texture — purely decorative, GPU‑cheap. */
export function HoneycombBackdrop({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 opacity-[0.11] ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle at center, #3d5a45 0.55px, transparent 0.65px)",
        backgroundSize: "22px 22px",
      }}
      aria-hidden
    />
  );
}

export function PollenSparkles({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      {[...Array(12)].map((_, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-buzz-mustard/50 buzz-twinkle"
          style={{
            left: `${8 + (i * 7) % 84}%`,
            top: `${10 + (i * 13) % 75}%`,
            animationDelay: `${i * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}
