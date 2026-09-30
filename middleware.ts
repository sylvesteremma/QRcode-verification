/* =============================================================================
   Next.js Middleware — protects /admin routes by checking the signed session
   cookie. Redirects unauthenticated requests to /admin/login.
   ============================================================================= */

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "semek_admin_session";
const PUBLIC_ADMIN_ROUTES = ["/admin/login"];

function getSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET || "dev-secret-change-me-please";
  return new TextEncoder().encode(raw);
}

async function validateToken(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret(), { issuer: "semek" });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* Only protect /admin routes */
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (PUBLIC_ADMIN_ROUTES.some((r) => pathname === r)) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const ok = await validateToken(token);
  if (ok) return NextResponse.next();

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
