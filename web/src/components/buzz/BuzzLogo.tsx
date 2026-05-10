import { Link } from "react-router-dom";
import { BuzzFlightPath } from "./BuzzFlightPath";
import { BuzzMascot } from "./BuzzMascot";

export function BuzzLogo({ to = "/" }: { to?: string }) {
  return (
    <div className="relative">
      <BuzzFlightPath className="absolute -right-8 top-0 h-12 w-28 md:h-14 md:w-32" />
      <Link
        to={to}
        className="relative inline-flex items-center gap-2 rounded-full bg-buzz-forest py-2 pl-4 pr-2.5 shadow-md ring-2 ring-buzz-forest/90 transition-transform hover:scale-[1.02] active:scale-[0.98] md:gap-2.5 md:py-2.5 md:pl-5 md:pr-3"
      >
        <span className="font-display text-base font-bold tracking-[0.14em] text-buzz-mustard md:text-lg">
          BUZZ-IN
        </span>
        <span className="relative shrink-0">
          <BuzzMascot
            variant="logo"
            size="sm"
            alt=""
            aria-hidden
            className="rounded-lg bg-transparent"
          />
        </span>
      </Link>
    </div>
  );
}
