import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCurrentWeekStartDate } from "@/lib/week";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch this week's public stats for the user
  const foundUser = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  const weeklyStats = foundUser
    ? await prisma.weeklyStats.findUnique({
        where: {
          userId_weekStartDate: {
            userId: foundUser.id,
            weekStartDate: getCurrentWeekStartDate(),
          },
        },
        select: {
          totalTasksCompleted: true,
          totalPlannedTasks: true,
          totalFocusMinutes: true,
        },
      })
    : null;

  return NextResponse.json({ ...user, weeklyStats: weeklyStats ?? null });
}
