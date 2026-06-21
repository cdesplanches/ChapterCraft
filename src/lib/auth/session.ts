import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findUserById } from "./users";
import { signSessionToken, verifySessionToken } from "./token";
import { SESSION_COOKIE, SESSION_MAX_AGE, SessionUser } from "./types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await findUserById(payload.sub);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function setSessionCookieOnResponse(
  response: NextResponse,
  token: string
) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function createSessionTokenForUser(user: SessionUser) {
  return signSessionToken(user);
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function clearSessionCookieOnResponse(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
}
