import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function humanize(err: string): string {
  if (err === "invalid_credentials") return "Email or password is incorrect.";
  if (err === "login_failed") return "Could not sign in.";
  if (err === "api_not_configured") {
    return "Hosted API is not linked. In Netlify set VITE_API_BASE to your Cloudflare Worker URL, then redeploy.";
  }
  if (err === "api_html_response") {
    return "The API URL returned HTML (often Netlify 404). Fix VITE_API_BASE to your Worker URL and redeploy.";
  }
  if (err === "jwt_secret_missing") {
    return "The API is not fully configured. In the project server folder run: npx wrangler secret put JWT_SECRET (long random value), then try again.";
  }
  return err.replace(/_/g, " ");
}

export function LoginPage() {
  const { user, login, bootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "login_failed";
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
          <h1 className="font-display text-3xl font-bold lowercase text-buzz-forest">sign in</h1>
          <p className="mt-2 font-display text-sm lowercase leading-relaxed text-buzz-forest/75">
            Use your university email. The API issues a JWT and stores a password hash (PBKDF2) in
            D1 when you run the Cloudflare Worker locally or in production.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block font-display text-xs font-semibold lowercase text-buzz-forest/65">
                email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-buzz-sage/50 px-4 py-3 font-display text-buzz-forest outline-none ring-buzz-sage/30 transition focus:border-buzz-forest focus:ring-4"
                placeholder="you@university.edu"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-display text-xs font-semibold lowercase text-buzz-forest/65">
                password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-buzz-sage/50 px-4 py-3 font-display text-buzz-forest outline-none ring-buzz-sage/30 transition focus:border-buzz-forest focus:ring-4"
                placeholder="••••••••"
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
              {pending ? "signing in…" : "continue"}
            </button>

            <p className="text-center font-display text-sm lowercase text-buzz-forest/70">
              new here?{" "}
              <Link to="/register" className="font-semibold text-buzz-forest underline decoration-buzz-sage">
                create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
