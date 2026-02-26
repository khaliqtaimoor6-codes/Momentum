import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCurrentWeekStartDate } from "@/lib/week";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      email: true,
      bio: true,
      image: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const weekStartDate = getCurrentWeekStartDate();
  const weeklyStats = await prisma.weeklyStats.findUnique({
    where: {
      userId_weekStartDate: { userId: session.user.id, weekStartDate },
    },
    select: {
      totalTasksCompleted: true,
      totalPlannedTasks: true,
      totalFocusMinutes: true,
    },
  });

  return NextResponse.json({ ...user, weeklyStats: weeklyStats ?? null });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bio } = await req.json();

  if (typeof bio !== "string") {
    return NextResponse.json({ error: "Invalid bio" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { bio: bio.trim().slice(0, 300) },
    select: { bio: true, username: true, name: true },
  });

  return NextResponse.json(updated);
}
