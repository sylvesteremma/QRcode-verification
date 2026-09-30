/* =============================================================================
   Server-side authentication & session management using signed JWT cookies
   via the `jose` library. HttpOnly, SameSite=Lax, Secure in production.
   ============================================================================= */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { AdminUserJson } from "./types";

const COOKIE_NAME = "semek_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET || "dev-secret-change-me-please";
  return new TextEncoder().encode(raw);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "OPERATIONS" | "AUDITOR";
  [key: string]: unknown;
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secret = getSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("semek")
    .setSubject(payload.userId)
    .sign(secret);
}

export async function readSessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, { issuer: "semek" });
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role: payload.role as SessionPayload["role"],
    };
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export async function requireAdmin(
  minRole: "ADMIN" | "OPERATIONS" | "AUDITOR" = "AUDITOR",
): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    const error = new Error("UNAUTHENTICATED") as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  const hierarchy: Record<string, number> = { AUDITOR: 1, OPERATIONS: 2, ADMIN: 3 };
  if (hierarchy[session.role] < hierarchy[minRole]) {
    const error = new Error("FORBIDDEN") as Error & { status?: number };
    error.status = 403;
    throw error;
  }
  return session;
}

export function setSessionCookie(token: string): void {
  const store = cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(): void {
  const store = cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<AdminUserJson> {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) {
    const e = new Error("Invalid credentials") as Error & { status?: number };
    e.status = 401;
    throw e;
  }
  if (user.status !== "ACTIVE") {
    const e = new Error("Account is disabled") as Error & { status?: number };
    e.status = 403;
    throw e;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const e = new Error("Invalid credentials") as Error & { status?: number };
    e.status = 401;
    throw e;
  }
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  setSessionCookie(token);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function serializeUser<T extends { passwordHash?: string | null }>(
  u: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _ignored, ...rest } = u;
  void _ignored;
  return rest;
}
