import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/auth/users";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    return NextResponse.json({ errorKey: "emailPasswordRequired" }, { status: 400 });
  }

  const user = await findUserByEmail(email.trim());
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ errorKey: "invalidCredentials" }, { status: 401 });
  }

  await setSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  });
}
