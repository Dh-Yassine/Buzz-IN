import { Html5Qrcode } from "html5-qrcode";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dispatchWalletUpdated } from "../hooks/useWalletSync";
import { apiDevMintDemoDrop, apiRedeemDrop } from "../lib/api";

export function ClaimPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const regionId = useRef(`qr-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);

  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [paste, setPaste] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [busy, setBusy] = useState(false);

  const applyRaw = useCallback(
    async (raw: string) => {
      if (!user || !token) return;
      setMessage(null);
      setBusy(true);
      try {
        await apiRedeemDrop(token, raw.trim());
        dispatchWalletUpdated();
        navigate("/dashboard");
      } catch (e) {
        const code = e instanceof Error ? e.message : "redeem_failed";
        const text =
          code === "already_redeemed"
            ? "This reward was already claimed."
            : code === "invalid_drop_token"
              ? "Invalid or expired station token. Scan the latest QR from the machine."
              : code.replace(/_/g, " ");
        setMessage({ type: "err", text });
      } finally {
        setBusy(false);
      }
    },
    [user, token, navigate],
  );

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current;
    if (!s || !scanningRef.current) return;
    try {
      await s.stop();
      s.clear();
    } catch {
      /* ignore */
    }
    scanningRef.current = false;
    scannerRef.current = null;
    setScannerActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (scanningRef.current) return;
    setMessage(null);
    const elId = regionId.current;
    const qr = new Html5Qrcode(elId, { verbose: false });
    scannerRef.current = qr;
    scanningRef.current = true;
    setScannerActive(true);
    try {
      await qr.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          void (async () => {
            await stopScanner();
            await applyRaw(decoded);
          })();
        },
        () => {},
      );
    } catch (e) {
      scanningRef.current = false;
      scannerRef.current = null;
      setScannerActive(false);
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Could not start the QR scanner.",
      });
    }
  }, [applyRaw, stopScanner]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  function onPasteSubmit(e: FormEvent) {
    e.preventDefault();
    void applyRaw(paste);
  }

  async function onMintDemo() {
    if (!import.meta.env.DEV) return;
    setMessage(null);
    setBusy(true);
    try {
      const { dropToken } = await apiDevMintDemoDrop();
      setPaste(dropToken);
      setMessage({
        type: "ok",
        text: "Demo drop token loaded. Tap redeem or scan it.",
      });
    } catch {
      setMessage({
        type: "err",
        text: "Could not mint demo token. Is the API running with ALLOW_DEV_MINT=true?",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold lowercase text-buzz-forest">claim points</h1>
        <p className="mt-2 font-display text-sm lowercase leading-relaxed text-buzz-forest/75">
          The station encodes a <strong className="font-semibold text-buzz-forest">signed drop JWT</strong>{" "}
          in the QR. Your session redeems it on the server so points cannot be forged.
        </p>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-[1.25rem] px-4 py-3 font-display text-sm lowercase ${
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200"
              : "bg-red-50 text-red-900 ring-1 ring-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="rounded-[2rem] border border-buzz-sage/35 bg-white p-6 shadow-lg ring-1 ring-buzz-sage/15">
        <p className="font-display text-xs font-semibold lowercase tracking-wide text-buzz-forest/60">
          qr scanner
        </p>
        <div
          id={regionId.current}
          className="mt-4 min-h-[200px] overflow-hidden rounded-2xl bg-buzz-cream/80 ring-1 ring-buzz-sage/25"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void startScanner()}
            disabled={scannerActive || busy}
            className="rounded-full bg-buzz-forest px-5 py-2.5 font-display text-sm font-semibold lowercase text-buzz-mustard shadow-md hover:bg-buzz-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            start scanner
          </button>
          <button
            type="button"
            onClick={() => void stopScanner()}
            className="rounded-full border border-buzz-sage/40 bg-white px-5 py-2.5 font-display text-sm font-semibold lowercase text-buzz-forest hover:bg-buzz-cream"
          >
            stop
          </button>
        </div>
      </div>

      <form
        onSubmit={onPasteSubmit}
        className="space-y-4 rounded-[2rem] border border-buzz-sage/35 bg-white p-6 shadow-lg ring-1 ring-buzz-sage/15"
      >
        <label htmlFor="paste" className="font-display text-xs font-semibold lowercase text-buzz-forest/60">
          paste drop token (jwt string)
        </label>
        <textarea
          id="paste"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-buzz-sage/45 px-4 py-3 font-mono text-xs text-buzz-forest outline-none ring-buzz-sage/25 focus:border-buzz-forest focus:ring-4"
          placeholder="eyJhbGciOiJIUzI1NiJ9..."
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-buzz-forest px-5 py-2.5 font-display text-sm font-semibold lowercase text-buzz-mustard shadow-md hover:bg-buzz-forest/90 disabled:opacity-50"
          >
            redeem pasted token
          </button>
          {import.meta.env.DEV && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onMintDemo()}
              className="rounded-full border border-buzz-sage/40 px-5 py-2.5 font-display text-sm font-semibold lowercase text-buzz-forest hover:bg-buzz-cream disabled:opacity-50"
            >
              mint demo token (dev)
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
