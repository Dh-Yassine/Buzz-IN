import { Link } from "react-router-dom";
import { BuzzFlightPath } from "../components/buzz/BuzzFlightPath";
import { BuzzMascot } from "../components/buzz/BuzzMascot";
import { HoneycombBackdrop, PollenSparkles } from "../components/buzz/BuzzHiveDecor";
import { BuzzLinkButton } from "../components/buzz/BuzzLinkButton";
import { BuzzLogo } from "../components/buzz/BuzzLogo";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-buzz-cream">
      <HoneycombBackdrop className="z-[1] opacity-[0.08]" />
      <PollenSparkles className="z-[1]" />

      {/* Split background — mobile stacks; desktop mirrors mock */}
      <div className="absolute inset-0 z-0 flex flex-col md:flex-row">
        <div className="h-[42%] rounded-br-[4rem] bg-gradient-to-br from-buzz-sage to-buzz-sage-deep md:h-auto md:w-[58%] md:rounded-br-[5rem] md:rounded-tr-none" />
        <div className="flex-1 bg-buzz-cream md:rounded-tl-[4rem]" />
      </div>
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 h-44 w-44 rounded-bl-[100px] bg-gradient-to-bl from-buzz-sage/90 to-buzz-honey/40 md:h-56 md:w-56"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-52 rounded-tr-[3rem] bg-gradient-to-tr from-buzz-sage/65 to-transparent md:h-48 md:w-60"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-16 pt-10 md:max-w-5xl md:flex-row md:items-center md:justify-between md:gap-16 md:px-12 md:py-16 lg:max-w-6xl">
        <div className="relative flex flex-1 flex-col gap-8 md:max-w-md">
          <div className="flex justify-end md:justify-start">
            <div className="relative">
              <BuzzFlightPath className="absolute -left-28 top-1 hidden h-12 w-36 md:block" />
              <BuzzLogo to={user ? "/dashboard" : "/"} />
            </div>
          </div>

          <header className="space-y-4">
            <p className="flex flex-wrap items-center gap-2 font-display text-sm font-medium lowercase tracking-wide text-buzz-forest/85">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/60 py-1 pl-2 pr-3 shadow-sm ring-1 ring-buzz-sage/30 backdrop-blur-sm">
                <BuzzMascot variant="thumbs_up" size="xs" alt="" aria-hidden className="rounded-full" />
                <span>busy bees welcome</span>
              </span>
            </p>
            <h1 className="bg-gradient-to-r from-buzz-forest via-buzz-sage-deep to-buzz-forest bg-clip-text font-display text-4xl font-bold lowercase leading-tight tracking-tight text-transparent md:text-5xl">
              sort. drop. claim.
            </h1>
            <p className="font-display text-lg lowercase leading-relaxed text-buzz-forest/85 md:text-xl">
              Snap or upload a photo for AI sorting help, then earn 🪙 Buzz-Points at the station.
            </p>
          </header>

          <div className="flex flex-col gap-4 pt-2 md:max-w-sm">
            {user ? (
              <>
                <BuzzLinkButton to="/dashboard">open activity</BuzzLinkButton>
                <BuzzLinkButton
                  to="/scan"
                  className="!bg-white !text-buzz-forest ring-2 ring-buzz-forest/20 hover:!bg-buzz-cream"
                >
                  scan item
                </BuzzLinkButton>
              </>
            ) : (
              <>
                <BuzzLinkButton to="/login">sign in</BuzzLinkButton>
                <Link
                  to="/register"
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border-2 border-buzz-forest/25 bg-white/90 px-8 py-3.5 font-display text-lg font-semibold lowercase text-buzz-forest shadow-md transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98] md:min-h-[56px] md:text-xl"
                >
                  create account
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="relative mt-14 flex flex-1 justify-center md:mt-0 lg:flex-[1.1]">
          <div className="relative w-full max-w-sm rounded-[2.5rem] bg-white/75 p-8 pt-14 shadow-2xl ring-2 ring-buzz-sage/35 backdrop-blur-md md:max-w-md motion-safe:transition-transform motion-safe:hover:scale-[1.02]">
            <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 md:-top-12">
              <BuzzMascot
                variant="throw_trash"
                size="md"
                alt=""
                aria-hidden
                className="motion-safe:transition-transform motion-safe:hover:scale-105"
              />
            </div>
            <p className="font-display text-lg font-semibold lowercase text-buzz-forest">quick steps</p>
            <ol className="mt-5 space-y-4 font-display text-base lowercase leading-snug text-buzz-forest/90">
              <li className="transition hover:translate-x-1">
                <span className="font-bold text-buzz-mustard">1.</span> Photo from camera or gallery
              </li>
              <li className="transition hover:translate-x-1">
                <span className="font-bold text-buzz-mustard">2.</span> AI suggests the right bin
              </li>
              <li className="transition hover:translate-x-1">
                <span className="font-bold text-buzz-mustard">3.</span> Drop, then scan the machine QR for 🪙
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
