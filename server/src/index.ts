import { Hono } from "hono";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import * as jose from "jose";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  DROP_SECRET: string;
  STATION_BEARER: string;
  ALLOW_DEV_MINT?: string;
  ENVIRONMENT?: string;
}

type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      return origin;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 86400,
  }),
);

/** WebCrypto on Workers caps PBKDF2 iterations at 100k (120k fails at hash time). */
const PBKDF2_ITER = 100_000;

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuf(s: string): ArrayBuffer {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITER,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return `pbkdf2-sha256$${PBKDF2_ITER}$${bufToB64(salt.buffer)}$${bufToB64(bits)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iter = Number(parts[1]);
  if (!Number.isFinite(iter) || iter < 1) return false;
  const salt = new Uint8Array(b64ToBuf(parts[2]));
  const expected = new Uint8Array(b64ToBuf(parts[3]));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    keyMaterial,
    expected.byteLength * 8,
  );
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

function jwtKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

async function signUserAccess(env: Env, userId: string): Promise<string> {
  return new jose.SignJWT({ typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtKey(env.JWT_SECRET));
}

async function verifyUserAccess(env: Env, token: string): Promise<string> {
  const { payload } = await jose.jwtVerify(token, jwtKey(env.JWT_SECRET), {
    algorithms: ["HS256"],
  });
  if (payload.typ !== "access" || !payload.sub) {
    throw new Error("bad_token");
  }
  return payload.sub;
}

async function signDropToken(
  env: Env,
  input: { claimId: string; pts: number; item?: string; bin?: string },
): Promise<string> {
  const { claimId, pts, item, bin } = input;
  return new jose.SignJWT({
    typ: "drop",
    claimId,
    pts,
    item: item ?? null,
    bin: bin ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claimId)
    .setJti(claimId)
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(jwtKey(env.DROP_SECRET));
}

async function verifyDropToken(
  env: Env,
  token: string,
): Promise<{ claimId: string; pts: number; item?: string; bin?: string }> {
  const { payload } = await jose.jwtVerify(token, jwtKey(env.DROP_SECRET), {
    algorithms: ["HS256"],
  });
  if (payload.typ !== "drop") throw new Error("bad_drop");
  const claimId = String(payload.claimId ?? payload.jti ?? "");
  const pts = Number(payload.pts);
  if (!claimId || !Number.isFinite(pts) || pts < 0 || pts > 1000) {
    throw new Error("bad_drop");
  }
  return {
    claimId,
    pts,
    item: payload.item != null ? String(payload.item) : undefined,
    bin: payload.bin != null ? String(payload.bin) : undefined,
  };
}

const userAuth: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) return c.json({ error: "missing_token" }, 401);
  try {
    const userId = await verifyUserAccess(c.env, m[1].trim());
    c.set("userId", userId);
    await next();
  } catch {
    return c.json({ error: "invalid_token" }, 401);
  }
};

app.get("/health", (c) => c.json({ ok: true }));

app.post("/auth/register", async (c) => {
  try {
    const body = await c.req.json<{ email?: string; password?: string; displayName?: string }>();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const displayName = (body.displayName ?? "").trim() || email.split("@")[0] || "Student";
    if (!email.includes("@")) return c.json({ error: "invalid_email" }, 400);
    if (password.length < 8) return c.json({ error: "password_too_short" }, 400);

    const jwtSecret = c.env.JWT_SECRET;
    if (typeof jwtSecret !== "string" || jwtSecret.length < 16) {
      return c.json({ error: "jwt_secret_missing" }, 503);
    }

    const id = crypto.randomUUID();
    const hash = await hashPassword(password);
    const now = new Date().toISOString();

    try {
      await c.env.DB.prepare(
        "INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)",
      )
        .bind(id, email, hash, displayName, now)
        .run();
      await c.env.DB.prepare("INSERT INTO wallets (user_id, balance) VALUES (?, 0)").bind(id).run();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("UNIQUE")) return c.json({ error: "email_in_use" }, 409);
      throw e;
    }

    const token = await signUserAccess(c.env, id);
    return c.json({
      token,
      user: { id, email, displayName },
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[auth/register]", detail);
    const dev = (c.env.ENVIRONMENT ?? "") !== "production";
    return c.json({ error: "internal_error", ...(dev ? { detail } : {}) }, 500);
  }
});

app.post("/auth/login", async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) return c.json({ error: "invalid_body" }, 400);

  const jwtSecret = c.env.JWT_SECRET;
  if (typeof jwtSecret !== "string" || jwtSecret.length < 16) {
    return c.json({ error: "jwt_secret_missing" }, 503);
  }

  const row = await c.env.DB.prepare(
    "SELECT id, password_hash, display_name FROM users WHERE email = ? LIMIT 1",
  )
    .bind(email)
    .first<{ id: string; password_hash: string; display_name: string }>();

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return c.json({ error: "invalid_credentials" }, 401);
  }

  const token = await signUserAccess(c.env, row.id);
  return c.json({
    token,
    user: { id: row.id, email, displayName: row.display_name },
  });
});

app.get("/auth/me", userAuth, async (c) => {
  const userId = c.get("userId");
  const row = await c.env.DB.prepare(
    "SELECT u.id, u.email, u.display_name, w.balance FROM users u JOIN wallets w ON w.user_id = u.id WHERE u.id = ? LIMIT 1",
  )
    .bind(userId)
    .first<{ id: string; email: string; display_name: string; balance: number }>();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({
    user: {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
    },
    balance: row.balance,
  });
});

app.get("/wallet/summary", userAuth, async (c) => {
  const userId = c.get("userId");
  const w = await c.env.DB.prepare("SELECT balance FROM wallets WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<{ balance: number }>();
  const balance = w?.balance ?? 0;

  const { results } = await c.env.DB.prepare(
    "SELECT id, at, delta, item, bin, claim_id as claimId, reason FROM ledger_entries WHERE user_id = ? ORDER BY datetime(at) DESC LIMIT 100",
  )
    .bind(userId)
    .all<{
      id: string;
      at: string;
      delta: number;
      item: string | null;
      bin: string | null;
      claimId: string | null;
      reason: string;
    }>();

  return c.json({
    balance,
    ledger: (results ?? []).map((r) => ({
      id: r.id,
      at: r.at,
      delta: r.delta,
      item: r.item ?? undefined,
      bin: r.bin ?? undefined,
      claimId: r.claimId ?? undefined,
      reason: r.reason,
    })),
  });
});

app.post("/claims/redeem", userAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ raw?: string }>();
  const raw = (body.raw ?? "").trim();
  if (!raw) return c.json({ error: "empty" }, 400);

  let drop: { claimId: string; pts: number; item?: string; bin?: string };
  try {
    drop = await verifyDropToken(c.env, raw);
  } catch {
    return c.json({ error: "invalid_drop_token" }, 400);
  }

  const now = new Date().toISOString();
  const ledgerId = crypto.randomUUID();

  const insRedeemed = c.env.DB.prepare(
    "INSERT INTO redeemed_claims (claim_id, user_id, redeemed_at) VALUES (?, ?, ?)",
  ).bind(drop.claimId, userId, now);

  const updWallet = c.env.DB.prepare(
    "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
  ).bind(drop.pts, userId);

  const insLedger = c.env.DB.prepare(
    "INSERT INTO ledger_entries (id, user_id, at, delta, item, bin, claim_id, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(
    ledgerId,
    userId,
    now,
    drop.pts,
    drop.item ?? null,
    drop.bin ?? null,
    drop.claimId,
    "machine_qr",
  );

  try {
    await c.env.DB.batch([insRedeemed, updWallet, insLedger]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("constraint")) {
      return c.json({ error: "already_redeemed" }, 409);
    }
    throw e;
  }

  const w = await c.env.DB.prepare("SELECT balance FROM wallets WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<{ balance: number }>();

  return c.json({
    ok: true,
    newBalance: w?.balance ?? 0,
    entry: {
      id: ledgerId,
      at: now,
      delta: drop.pts,
      item: drop.item,
      bin: drop.bin,
      claimId: drop.claimId,
      reason: "machine_qr",
    },
  });
});

/** Station firmware calls this after sensors confirm a drop. */
app.post("/station/mint-drop", async (c) => {
  const header = c.req.header("Authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m || m[1].trim() !== c.env.STATION_BEARER) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const body = await c.req.json<{ pts?: number; item?: string; bin?: string }>();
  const pts = Number(body.pts);
  if (!Number.isFinite(pts) || pts < 0 || pts > 1000) {
    return c.json({ error: "invalid_pts" }, 400);
  }

  const claimId = crypto.randomUUID();
  const item = body.item != null ? String(body.item) : undefined;
  const bin = body.bin != null ? String(body.bin) : undefined;

  const dropToken = await signDropToken(c.env, { claimId, pts, item, bin });

  return c.json({
    dropToken,
    claimId,
    expiresInMinutes: 30,
  });
});

/** Local-only helper so the web UI can paste a real signed token without sharing STATION_BEARER. */
app.post("/dev/mint-demo-drop", async (c) => {
  if (c.env.ALLOW_DEV_MINT !== "true") {
    return c.json({ error: "disabled" }, 404);
  }
  const dropToken = await signDropToken(c.env, {
    claimId: crypto.randomUUID(),
    pts: 1,
    item: "PET plastic bottle",
    bin: "plastic",
  });
  return c.json({ dropToken });
});

export default app;
