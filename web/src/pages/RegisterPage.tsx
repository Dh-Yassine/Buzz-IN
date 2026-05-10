import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function humanize(err: string): string {
  if (err === "password_too_short") return "Password must be at least 8 characters.";
  if (err === "email_in_use") return "That email is already registered.";
  if (err === "invalid_email") return "Enter a valid university email.";
  if (err === "api_not_configured") {
    return "Hosted API is not linked. In Netlify → Site configuration → Environment variables, set VITE_API_BASE to your Cloudflare Worker URL (no trailing slash), then redeploy.";
  }
  if (err === "api_html_response") {
    return "The API URL returned a web page instead of JSON. Fix VITE_API_BASE so it points to your Buzz-IN Worker, redeploy, and try again.";
  }
  return err.replace(/_/g, " ");
}

export function RegisterPage() {
  const { user, register, bootstrapping } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (bootstrapping) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-buzz-cream font-display text-sm lowercase text-buzz-forest/60">
        loading…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register({
        email,
        password,
        displayName: displayName.trim() || undefined,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "register_failed";
      setError(humanize(raw));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-buzz-cream px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-block font-display text-sm font-semibold lowercase text-buzz-forest underline decoration-buzz-sage"
        >
          ← back to home
        </Link>
        <div className="rounded-[2rem] border border-buzz-sage/40 bg-white p-8 shadow-lg ring-1 ring-buzz-sage/20">
          <h1 className="font-display text-3xl font-bold lowercase text-buzz-forest">create account</h1>
          <p className="mt-2 font-display text-sm lowercase leading-relaxed text-buzz-forest/75">
            BUZZ-IN stores credentials in Cloudflare D1 when you use the hosted API. Local dev uses
            the same flows against <code className="rounded bg-buzz-cream px-1 text-xs">wrangler dev</code>.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="reg-email"
                className="block font-display text-xs font-semibold lowercase text-buzz-forest/65"
              >
                email
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-buzz-sage/50 px-4 py-3 font-display text-buzz-forest outline-none ring-buzz-sage/30 transition focus:border-buzz-forest focus:ring-4"
                placeholder="you@university.edu"
                required
              />
            </div>
            <div>
              <label
                htmlFor="reg-name"
                className="block font-display text-xs font-semibold lowercase text-buzz-forest/65"
              >
                display name (optional)
              </label>
              <input
                id="reg-name"
                name="displayName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-buzz-sage/50 px-4 py-3 font-display text-buzz-forest outline-none ring-buzz-sage/30 transition focus:border-buzz-forest focus:ring-4"
                placeholder="Alex"
              />
            </div>
            <div>
              <label
                htmlFor="reg-password"
                className="block font-display text-xs font-semibold lowercase text-buzz-forest/65"
              >
                password
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-buzz-sage/50 px-4 py-3 font-display text-buzz-forest outline-none ring-buzz-sage/30 transition focus:border-buzz-forest focus:ring-4"
                placeholder="at least 8 characters"
                minLength={8}
                required
              />
            </div>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 font-display text-sm lowercase text-red-800 ring-1 ring-red-200" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center rounded-full bg-buzz-forest py-3.5 font-display text-sm font-semibold lowercase text-buzz-mustard shadow-lg transition hover:bg-buzz-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "creating account…" : "create account"}
            </button>

            <p className="text-center font-display text-sm lowercase text-buzz-forest/70">
              already have an account?{" "}
              <Link to="/login" className="font-semibold text-buzz-forest underline decoration-buzz-sage">
                sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
