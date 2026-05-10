import { Link, type LinkProps } from "react-router-dom";

export function BuzzLinkButton({ className = "", children, ...rest }: LinkProps) {
  return (
    <Link
      className={`inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-buzz-forest px-8 py-3.5 font-display text-lg font-semibold lowercase tracking-wide text-buzz-mustard shadow-lg transition-all hover:scale-[1.02] hover:bg-buzz-forest/90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-buzz-forest md:min-h-[56px] md:text-xl ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
