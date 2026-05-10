import { Link } from "react-router-dom";
import { HoneycombBackdrop, PollenSparkles } from "../components/buzz/BuzzHiveDecor";
import { BuzzMascot } from "../components/buzz/BuzzMascot";
import { BuzzLinkButton } from "../components/buzz/BuzzLinkButton";
import { BuzzPointsBadge } from "../components/buzz/BuzzPointsBadge";
import { useAuth } from "../context/AuthContext";
import { useBuzzBalance, useBuzzLedger } from "../hooks/useWalletSync";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function DashboardPage() {
  const { user } = useAuth();
  const balance = useBuzzBalance();
  const ledger = useBuzzLedger();

  const firstName = user?.displayName?.split(/\s+/)[0] ?? "there";

  return (
    <div className="relative space-y-8 md:space-y-10">
      <HoneycombBackdrop className="opacity-[0.09]" />
      <PollenSparkles />

      {/* Desktop sage accents — anchored inside column (no negative inset) so shapes aren’t clipped */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 hidden h-44 w-52 rounded-bl-[4rem] bg-gradient-to-bl from-buzz-sage/55 via-buzz-sage/35 to-buzz-honey/25 lg:block xl:h-52 xl:w-64 xl:rounded-bl-[5rem]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 top-[38%] z-0 hidden h-32 w-40 rounded-tr-[3rem] bg-gradient-to-tr from-buzz-sage/35 to-transparent md:top-[40%] lg:block xl:h-40 xl:w-48 xl:rounded-tr-[3.5rem]"
        aria-hidden
      />

      <header className="relative z-10 flex flex-wrap items-end justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-buzz-mustard via-amber-300 to-amber-500 font-display text-2xl font-bold text-white shadow-lg ring-4 ring-white"
            aria-hidden
          >
            {firstName.slice(0, 1).toUpperCase()}
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-md">
              🪙
            </span>
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-3 font-display text-sm lowercase text-buzz-forest/65">
              <BuzzMascot variant="throw_trash" size="xs" alt="" aria-hidden className="rounded-full opacity-95" />
              <span>hive dashboard</span>
            </p>
            <h1 className="font-display text-3xl font-bold lowercase leading-tight text-buzz-forest md:text-4xl">
              hello {firstName}!
            </h1>
          </div>
        </div>
      </header>

      <div className="relative z-10 grid gap-5 sm:grid-cols-2 lg:gap-6">
        <div className="flex flex-col justify-center gap-4 rounded-[2rem] bg-white/95 p-6 shadow-xl ring-2 ring-buzz-sage/30 backdrop-blur-sm md:p-7">
          <p className="font-display text-center text-sm font-semibold lowercase text-buzz-forest/70 md:text-left">
            buzz-points
          </p>
          <div className="flex justify-center sm:justify-start">
            <BuzzPointsBadge amount={balance} size="lg" />
          </div>
          <p className="text-center font-display text-xs lowercase text-buzz-forest/50 sm:text-left">
            each 🪙 is one buzz-point · earned at the station
          </p>
        </div>

        <div className="relative flex items-center gap-4 rounded-[2rem] bg-gradient-to-br from-orange-100/90 to-amber-50 p-6 opacity-95 shadow-xl ring-2 ring-orange-200/40 md:p-7">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-400/95 font-display text-2xl font-bold text-white shadow-inner">
            %
          </div>
          <div>
            <p className="font-display text-lg font-semibold lowercase leading-tight text-buzz-forest md:text-xl">
              use my vouchers
            </p>
            <p className="mt-1 font-display text-xs lowercase text-buzz-forest/55">coming soon · buzz!</p>
          </div>
        </div>
      </div>

      <section className="relative z-10 rounded-[2rem] bg-white/95 shadow-xl ring-2 ring-buzz-sage/25 backdrop-blur-sm">
        <div className="relative border-b border-buzz-sage/15 px-6 py-5 md:px-8">
          <h2 className="font-display text-lg font-semibold lowercase text-buzz-forest">history</h2>
          <p className="mt-1 font-display text-xs lowercase text-buzz-forest/55">
            rewards from machine QR codes
          </p>
        </div>
        {ledger.length === 0 ? (
          <p className="px-6 py-12 text-center font-display text-sm lowercase text-buzz-forest/50 md:px-8">
            no claims yet — after you drop waste, scan the QR on the station.
          </p>
        ) : (
          <ul className="divide-y divide-buzz-sage/10">
            {ledger.map((row) => (
              <li key={row.id} className="px-6 py-4 transition-colors hover:bg-buzz-honey/20 md:px-8">
                <p className="font-display text-sm font-medium lowercase text-buzz-forest">
                  <span className="mr-1" aria-hidden>
                    🪙
                  </span>
                  +{row.delta} pts
                  {row.item ? <span className="font-normal text-buzz-forest/60"> · {row.item}</span> : null}
                </p>
                <p className="font-display text-xs lowercase text-buzz-forest/45">{formatDate(row.at)}</p>
                {row.bin ? (
                  <p className="mt-1 font-display text-xs lowercase text-buzz-sage-deep">bin: {row.bin}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="relative z-10 space-y-4 pt-2">
        <BuzzLinkButton to="/scan" className="relative overflow-visible !py-5 !text-xl !font-bold !tracking-[0.12em] !shadow-xl md:!text-2xl">
          BUZZ-IN
          <span className="absolute -right-1 -top-12 md:-right-2 md:-top-14">
            <BuzzMascot variant="thumbs_up" size="sm" alt="" aria-hidden className="rounded-full" />
          </span>
        </BuzzLinkButton>
        <p className="text-center font-display text-sm lowercase text-buzz-forest/65">
          <Link
            to="/claim"
            className="font-semibold text-buzz-forest underline decoration-buzz-sage decoration-wavy underline-offset-4 transition hover:text-buzz-sage-deep"
          >
            claim points from station QR
          </Link>
        </p>
      </div>
    </div>
  );
}
