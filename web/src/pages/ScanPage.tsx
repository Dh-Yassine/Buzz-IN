import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BuzzMascot } from "../components/buzz/BuzzMascot";
import { BuzzButton } from "../components/buzz/BuzzButton";
import { HoneycombBackdrop, PollenSparkles } from "../components/buzz/BuzzHiveDecor";
import { BuzzLogo } from "../components/buzz/BuzzLogo";
import { BuzzPanel } from "../components/buzz/BuzzPanel";
import { ScanViewfinder } from "../components/buzz/ScanViewfinder";
import { inferBinFromLabel } from "../lib/bins";
import {
  detectFromImageFile,
  DetectionApiNotConfiguredError,
  videoFrameToJpegFile,
  type DetectionResult,
} from "../lib/detectItem";

export function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [camOn, setCamOn] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [bin, setBin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      revokePreview();
      abortRef.current?.abort();
    };
  }, [stopCamera, revokePreview]);

  const runDetection = useCallback(async (file: File) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true);
    setError(null);
    setDetection(null);
    setBin(null);
    try {
      const result = await detectFromImageFile(file, ac.signal);
      setDetection(result);
      setBin(inferBinFromLabel(result.label));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (e instanceof DetectionApiNotConfiguredError) {
        setError("detection_api_not_configured");
        return;
      }
      setError(e instanceof Error ? e.message : "detection_failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("camera_unavailable");
      return;
    }
    revokePreview();
    setDetection(null);
    setBin(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
    } catch {
      setError("camera_denied");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      setError("pick_an_image");
      return;
    }
    stopCamera();
    revokePreview();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setDetection(null);
    setBin(null);
    void runDetection(file);
  };

  const analyzeCameraFrame = () => {
    const v = videoRef.current;
    if (!v || !camOn) return;
    const file = videoFrameToJpegFile(v);
    if (!file) {
      setError("frame_not_ready");
      return;
    }
    revokePreview();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    stopCamera();
    void runDetection(file);
  };

  const binDisplay = bin ? bin.replace(/-/g, " ") : "";

  return (
    <div className="relative min-h-[calc(100dvh-2rem)] md:min-h-dvh">
      <HoneycombBackdrop className="opacity-[0.06]" />
      <PollenSparkles />
      {/* Decorative sage shapes */}
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-bl-[4rem] rounded-tl-[3rem] bg-buzz-sage/90 md:h-64 md:w-64"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-32 h-40 w-56 rounded-br-[3rem] rounded-tr-[4rem] bg-buzz-sage/70 md:bottom-24 md:h-52 md:w-72"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-md px-4 pb-10 pt-4 md:max-w-3xl md:rounded-[3rem] md:border md:border-buzz-sage-deep/25 md:bg-white/35 md:px-10 md:py-10 md:shadow-xl md:backdrop-blur-sm lg:max-w-5xl">
        <header className="mb-6 flex justify-start">
          <BuzzLogo to="/dashboard" />
        </header>

        <div className="flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-start lg:gap-12">
        <div className="order-2 flex flex-1 flex-col gap-6 lg:sticky lg:top-8 lg:order-1 lg:max-w-sm">

          {detection && (
            <BuzzPanel>
              <p className="font-display text-base font-semibold lowercase leading-snug text-white md:text-lg">
                detected:{" "}
                <span className="text-white/95">{detection.label}</span>
                <span className="mt-1 block text-sm font-normal text-white/85">
                  {Math.round(detection.confidence * 100)}% match
                </span>
              </p>
            </BuzzPanel>
          )}

          {error && (
            <BuzzPanel className="bg-red-100/90 text-red-900">
              <p className="text-sm font-medium lowercase">
                {error === "camera_denied"
                  ? "Allow camera access or pick a photo from your gallery."
                  : error === "camera_unavailable"
                    ? "Camera not supported in this browser."
                    : error === "pick_an_image"
                      ? "Choose an image file."
                      : error === "frame_not_ready"
                        ? "Wait for the camera preview, then try again."
                        : error === "detection_api_not_configured"
                          ? "Add VITE_DETECT_API_URL in web/.env (e.g. http://127.0.0.1:8788/detect) and restart the dev server. Run npm run dev:detect-svc for the Recycling-Net API."
                          : error.replace(/_/g, " ")}
              </p>
            </BuzzPanel>
          )}

          <div className="flex flex-col gap-4">
            <BuzzButton onClick={startCamera} disabled={busy}>
              scan here
            </BuzzButton>

            <input
              id="scan-gallery-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onFileChange}
            />
            <label
              htmlFor="scan-gallery-input"
              className="flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-buzz-forest/35 bg-white/70 px-8 py-3.5 text-center font-display text-lg font-semibold lowercase text-buzz-forest shadow-md transition hover:bg-white md:min-h-[56px] md:text-xl"
            >
              choose from gallery
            </label>

            {camOn && (
              <BuzzButton variant="outline" onClick={analyzeCameraFrame} disabled={busy}>
                use this frame
              </BuzzButton>
            )}

            {busy && (
              <p className="text-center font-display text-sm lowercase text-buzz-forest/80">
                analyzing…
              </p>
            )}
          </div>

        </div>

        <div className="order-1 flex flex-1 flex-col gap-6 lg:order-2">
          <ScanViewfinder
            videoRef={videoRef}
            previewUrl={previewUrl}
            cameraActive={camOn}
          />

          {detection && bin && (
            <BuzzPanel>
              <p className="font-display text-base font-medium lowercase text-white md:text-lg">
                this item goes to:
              </p>
              <p className="mt-2 font-display text-3xl font-bold uppercase tracking-wider text-buzz-mustard md:text-4xl">
                {binDisplay}
              </p>
            </BuzzPanel>
          )}

          <p className="text-center font-display text-xs lowercase leading-relaxed text-buzz-forest/75 md:text-sm">
            After you drop it at the station, open{" "}
            <Link to="/claim" className="font-semibold text-buzz-forest underline decoration-buzz-sage underline-offset-2">
              claim points
            </Link>{" "}
            and scan the machine QR.
          </p>

          <div className="relative mt-2">
            <Link
              to="/claim"
              className="relative inline-flex w-full items-center justify-center gap-2 rounded-full bg-buzz-forest py-4 pl-6 pr-10 font-display text-lg font-bold tracking-[0.12em] text-buzz-mustard shadow-lg transition hover:bg-buzz-forest/90 md:text-xl"
            >
              BUZZ-IN
              <span className="absolute -right-2 -top-11 md:-right-3 md:-top-12">
                <BuzzMascot variant="throw_trash" size="sm" alt="" aria-hidden className="rounded-full" />
              </span>
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
