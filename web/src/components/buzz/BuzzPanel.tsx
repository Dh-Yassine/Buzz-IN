import type { ReactNode } from "react";

export function BuzzPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[1.75rem] bg-buzz-panel px-5 py-4 text-center shadow-inner backdrop-blur-sm md:rounded-[2rem] md:px-8 md:py-5 ${className}`}
    >
      {children}
    </div>
  );
}
