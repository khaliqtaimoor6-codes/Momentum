import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { signJwt } from "@/lib/jwt";

const AUTH_COOKIE_NAME = "auth_token";

function createAuthCookie(token: string) {
  const isProd = process.env.NODE_ENV === "production";

  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "strict" as const,
    path: "/",
  };
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signJwt({
      sub: user.id,
      email: user.email!,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 200 },
    );

    response.cookies.set(createAuthCookie(token));

    return response;
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
