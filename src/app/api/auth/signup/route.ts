import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createUser } from "@/lib/auth/users";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name } = body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email?.trim() || !password) {
    return NextResponse.json({ errorKey: "emailPasswordRequired" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ errorKey: "passwordTooShort" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ errorKey: "invalidEmail" }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email: email.trim(),
      passwordHash,
      name: name?.trim() ?? "",
    });

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return NextResponse.json({ errorKey: "emailTaken" }, { status: 409 });
    }
    return NextResponse.json({ errorKey: "signupFailed" }, { status: 500 });
  }
}
