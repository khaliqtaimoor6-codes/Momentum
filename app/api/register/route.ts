import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/username";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { name, email, password, username: requestedUsername } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }

    // If user requested a specific username, validate & check availability
    let finalUsername: string;
    if (requestedUsername) {
      const slug = requestedUsername
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      if (slug.length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters" },
          { status: 400 },
        );
      }
      const conflict = await prisma.user.findUnique({
        where: { username: slug },
        select: { id: true },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 },
        );
      }
      finalUsername = slug;
    } else {
      // Auto-generate from name or email prefix
      const hint = name ?? email.split("@")[0];
      finalUsername = await generateUniqueUsername(hint);
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name ?? null,
        username: finalUsername,
        email,
        passwordHash,
      },
    });

    return NextResponse.json(
      {
        email: user.email,
        name: user.name,
        username: user.username,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
