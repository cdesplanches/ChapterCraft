import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/types";
import { getAuthSecretForMiddleware } from "@/lib/auth/token";

const PUBLIC_PATHS = [
  "/",
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/logout",
];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  return false;
}

function unauthorized(request: NextRequest) {
  if (pathnameIsApi(request.nextUrl.pathname)) {
    return NextResponse.json({ errorKey: "unauthorized" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("auth", "required");
  return NextResponse.redirect(url);
}

function pathnameIsApi(pathname: string) {
  return pathname.startsWith("/api/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return unauthorized(request);
  }

  try {
    await jwtVerify(token, getAuthSecretForMiddleware());
    return NextResponse.next();
  } catch {
    return unauthorized(request);
  }
}

export const config = {
  matcher: [
    "/project/:path*",
    "/settings",
    "/api/projects/:path*",
    "/api/settings/:path*",
    "/api/ai/:path*",
  ],
};
