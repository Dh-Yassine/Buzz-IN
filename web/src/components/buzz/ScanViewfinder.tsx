import type { RefObject } from "react";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  previewUrl: string | null;
  cameraActive: boolean;
};

export function ScanViewfinder({ videoRef, previewUrl, cameraActive }: Props) {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-md md:max-w-xl">
      <div className="absolute inset-0 rounded-[2rem] bg-buzz-sage/40 md:rounded-[2.5rem]" />

      <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[2rem] bg-zinc-900/5 md:rounded-[2.5rem]">
        {previewUrl && !cameraActive ? (
          <img
            src={previewUrl}
            alt="Selected photo for analysis"
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            aria-label="Camera preview"
            className={`h-full w-full object-cover ${cameraActive ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {!previewUrl && !cameraActive && (
          <p className="absolute px-6 text-center font-display text-sm lowercase text-buzz-forest/70 md:text-base">
            Open the camera or choose a photo from your gallery to analyze
          </p>
        )}

        {/* Corner brackets */}
        <span className="pointer-events-none absolute left-4 top-4 h-10 w-10 border-l-4 border-t-4 border-buzz-forest md:left-6 md:top-6 md:h-12 md:w-12" />
        <span className="pointer-events-none absolute right-4 top-4 h-10 w-10 border-r-4 border-t-4 border-buzz-forest md:right-6 md:top-6 md:h-12 md:w-12" />
        <span className="pointer-events-none absolute bottom-4 left-4 h-10 w-10 border-b-4 border-l-4 border-buzz-forest md:bottom-6 md:left-6 md:h-12 md:w-12" />
        <span className="pointer-events-none absolute bottom-4 right-4 h-10 w-10 border-b-4 border-r-4 border-buzz-forest md:bottom-6 md:right-6 md:h-12 md:w-12" />

        {/* Scan line */}
        {(cameraActive || previewUrl) && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-buzz-sage/90 shadow-[0_0_12px_rgba(180,196,154,0.9)]" />
        )}
      </div>
    </div>
  );
}
