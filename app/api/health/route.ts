import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasNextAuthSecret = Boolean(process.env.NEXTAUTH_SECRET);
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? null;
  const vercelUrl = process.env.VERCEL_URL ?? null;

  let dbOk = false;
  let dbError: string | null = null;

  try {
    await prisma.user.count();
    dbOk = true;
  } catch (e) {
    dbOk = false;
    dbError = e instanceof Error ? e.message : "Unknown DB error";
  }

  return NextResponse.json({
    ok: hasDatabaseUrl && hasNextAuthSecret && dbOk,
    env: {
      hasDatabaseUrl,
      hasNextAuthSecret,
      nextAuthUrl,
      vercelUrl,
    },
    db: {
      ok: dbOk,
      error: dbError,
    },
  });
}
