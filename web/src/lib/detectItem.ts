/**
 * Recycling-Net-11 via your detect API.
 *
 * Set `VITE_DETECT_API_URL` (POST multipart field `image` → JSON `{ "label": string, "confidence"?: number }`).
 */
export type DetectionResult = {
  label: string;
  confidence: number;
};

export class DetectionApiNotConfiguredError extends Error {
  readonly code = "detection_api_not_configured" as const;
  constructor() {
    super(
      "VITE_DETECT_API_URL is not set. Point it at your detect service, e.g. http://127.0.0.1:8788/detect",
    );
    this.name = "DetectionApiNotConfiguredError";
  }
}

export async function detectFromImageFile(
  file: File,
  signal?: AbortSignal,
): Promise<DetectionResult> {
  const endpoint = import.meta.env.VITE_DETECT_API_URL as string | undefined;
  const trimmed = endpoint?.trim();

  if (!trimmed) {
    throw new DetectionApiNotConfiguredError();
  }

  const body = new FormData();
  body.append("image", file, file.name || "capture.jpg");
  const res = await fetch(trimmed, { method: "POST", body, signal });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `detection_http_${res.status}`);
  }
  const data = (await res.json()) as { label?: unknown; confidence?: unknown };
  const label = String(data.label ?? "").trim();
  if (!label) throw new Error("detection_empty_label");
  const confidence = Number(data.confidence);
  return {
    label,
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.9,
  };
}

export function videoFrameToJpegFile(video: HTMLVideoElement, quality = 0.85): File | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const bin = atob(dataUrl.split(",")[1] ?? "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], "camera-frame.jpg", { type: "image/jpeg" });
}
