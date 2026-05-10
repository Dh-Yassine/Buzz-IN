import { Link, NavLink, Outlet } from "react-router-dom";
import { HoneycombBackdrop } from "./buzz/BuzzHiveDecor";
import { BuzzPointsBadge } from "./buzz/BuzzPointsBadge";
import { useAuth } from "../context/AuthContext";
import { useBuzzBalance } from "../hooks/useWalletSync";

const navCls = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-2 text-center font-display text-sm font-medium lowercase transition-all md:text-left",
    isActive
      ? "scale-[1.02] bg-white/30 text-white shadow-inner"
      : "text-white/85 hover:scale-[1.02] hover:bg-white/15 hover:text-white",
  ].join(" ");

export function AppShell() {
  const { user, logout } = useAuth();
  const points = useBuzzBalance();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="relative flex shrink-0 flex-col overflow-hidden border-b border-buzz-forest/20 bg-buzz-sage-deep/95 md:min-h-dvh md:w-64 md:border-b-0 md:border-r md:border-buzz-forest/10">
        <HoneycombBackdrop />

        <div className="relative z-10 flex flex-col gap-2 p-4 md:pb-2">
          <Link
            to="/dashboard"
            className="font-display text-base font-bold tracking-[0.12em] text-buzz-forest transition-transform hover:scale-[1.03] md:text-lg"
          >
            BUZZ-IN
          </Link>
          <div className="hidden md:flex md:justify-center">
            <BuzzPointsBadge amount={points} size="sm" />
          </div>
        </div>
        <nav className="relative z-10 flex flex-1 gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-2 md:px-4 md:pb-4">
          <NavLink to="/dashboard" className={navCls} end>
            activity
          </NavLink>
          <NavLink to="/scan" className={navCls}>
            scan item
          </NavLink>
          <NavLink to="/claim" className={navCls}>
            claim points
          </NavLink>
        </nav>
        <div className="relative z-10 hidden border-t border-buzz-forest/15 p-4 text-xs text-buzz-forest/90 md:block">
          <p className="truncate font-display font-semibold lowercase">{user?.displayName}</p>
          <p className="truncate opacity-80">{user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-full border border-buzz-forest/25 bg-white/20 py-2 font-display text-sm font-medium lowercase text-buzz-forest transition hover:scale-[1.02] hover:bg-white/35 active:scale-[0.98]"
          >
            log out
          </button>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col bg-buzz-cream">
        <HoneycombBackdrop className="opacity-[0.06]" />
        <header className="relative z-10 flex items-center justify-between gap-3 border-b border-buzz-sage-deep/30 bg-buzz-cream/95 px-4 py-3 backdrop-blur-md md:hidden">
          <BuzzPointsBadge amount={points} size="sm" />
          <button
            type="button"
            onClick={logout}
            className="font-display text-sm font-semibold lowercase text-buzz-forest underline decoration-buzz-sage"
          >
            log out
          </button>
        </header>
        <main className="relative z-10 flex-1 p-4 md:p-8 lg:px-12 lg:py-10 xl:px-16">
          <div className="mx-auto max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
