import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  children: ReactNode;
};

export function BuzzButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex min-h-[52px] w-full items-center justify-center rounded-full px-8 py-3.5 font-display text-lg font-semibold lowercase tracking-wide shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 md:min-h-[56px] md:text-xl";
  const styles =
    variant === "primary"
      ? "bg-buzz-forest text-buzz-mustard hover:bg-buzz-forest/90 focus-visible:outline-buzz-forest"
      : "border-2 border-buzz-forest/30 bg-white/80 text-buzz-forest hover:bg-white";

  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
