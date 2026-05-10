export function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).replace(/\/$/, "");
  }
  return import.meta.env.DEV ? "/api" : "";
}

/** Production static hosts (Netlify) have no /auth/* API unless you set VITE_API_BASE. */
function ensureWorkerConfigured(): void {
  if (import.meta.env.DEV) return;
  if (String(import.meta.env.VITE_API_BASE ?? "").trim() !== "") return;
  throw new Error("api_not_configured");
}

function looksLikeHtmlErrorPage(text: string): boolean {
  const t = text.trim().slice(0, 500).toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.includes("page not found");
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (looksLikeHtmlErrorPage(text)) {
    throw new Error("api_html_response");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.length > 180 ? "bad_response" : text || res.statusText || "bad_response");
  }
}

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
};

export type LedgerEntry = {
  id: string;
  at: string;
  delta: number;
  item?: string;
  bin?: string;
  claimId?: string;
  reason: string;
};

export async function apiRegister(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ token: string; user: ApiUser }> {
  ensureWorkerConfigured();
  const res = await fetch(`${apiBase()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ token?: string; user?: ApiUser; error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? "register_failed");
  if (!data.token || !data.user) throw new Error("register_failed");
  return { token: data.token, user: data.user };
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<{ token: string; user: ApiUser }> {
  ensureWorkerConfigured();
  const res = await fetch(`${apiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<{ token?: string; user?: ApiUser; error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? "login_failed");
  if (!data.token || !data.user) throw new Error("login_failed");
  return { token: data.token, user: data.user };
}

export async function apiMe(token: string): Promise<{ user: ApiUser; balance: number } | null> {
  ensureWorkerConfigured();
  const res = await fetch(`${apiBase()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return null;
  const data = await parseJson<{ user?: ApiUser; balance?: number }>(res);
  if (!res.ok || !data.user) return null;
  return { user: data.user, balance: Number(data.balance ?? 0) };
}

export async function apiWalletSummary(token: string): Promise<{
  balance: number;
  ledger: LedgerEntry[];
}> {
  ensureWorkerConfigured();
  const res = await fetch(`${apiBase()}/wallet/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson<{ balance?: number; ledger?: LedgerEntry[]; error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? "wallet_failed");
  return {
    balance: Number(data.balance ?? 0),
    ledger: Array.isArray(data.ledger) ? data.ledger : [],
  };
}

export async function apiRedeemDrop(token: string, raw: string): Promise<{
  newBalance: number;
  entry: LedgerEntry;
}> {
  ensureWorkerConfigured();
  const res = await fetch(`${apiBase()}/claims/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ raw }),
  });
  const data = await parseJson<{
    ok?: boolean;
    newBalance?: number;
    entry?: LedgerEntry;
    error?: string;
  }>(res);
  if (!res.ok) throw new Error(data.error ?? "redeem_failed");
  if (!data.entry || data.newBalance == null) throw new Error("redeem_failed");
  return { newBalance: data.newBalance, entry: data.entry };
}

export async function apiDevMintDemoDrop(): Promise<{ dropToken: string }> {
  ensureWorkerConfigured();
  const res = await fetch(`${apiBase()}/dev/mint-demo-drop`, { method: "POST" });
  const data = await parseJson<{ dropToken?: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? "mint_demo_failed");
  if (!data.dropToken) throw new Error("mint_demo_failed");
  return { dropToken: data.dropToken };
}
