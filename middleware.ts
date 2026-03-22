import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/studio", "/home", "/view"];
const PUBLIC_ROUTES = ["/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("drifnet_session")?.value;

  let validToken = false;

  if (token) {
    try {
      // Call API to validate token
      const res = await fetch(`${req.nextUrl.origin}/api/auth/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      validToken = data.valid;
    } catch (err) {
      console.error("Middleware token validation failed:", err);
    }
  }

  // Block unauthenticated users from protected routes
  if (
    !validToken &&
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Prevent authenticated users from visiting auth pages
  if (validToken && PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/view/:path*",
    "/home/:path*",
    "/community/:path*",
    "/studio/:path*",
    "/api/graphql",
    "/auth/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
