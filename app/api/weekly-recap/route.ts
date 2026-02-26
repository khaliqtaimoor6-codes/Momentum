import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function getLastWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const diffToMonday = (day + 6) % 7;
  const thisMonday = new Date(now);
  thisMonday.setUTCDate(now.getUTCDate() - diffToMonday);
  thisMonday.setUTCHours(0, 0, 0, 0);
  // Go back 7 days for last week's Monday
  const lastMonday = new Date(thisMonday);
  lastMonday.setUTCDate(thisMonday.getUTCDate() - 7);
  return lastMonday;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const lastWeekStart = getLastWeekStart();

  // Get user's last week stats
  const myStats = await prisma.weeklyStats.findUnique({
    where: {
      userId_weekStartDate: { userId, weekStartDate: lastWeekStart },
    },
  });

  // Get friend IDs
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    select: { user1Id: true, user2Id: true },
  });

  const friendIds = (friendships as Array<{ user1Id: string; user2Id: string }>).map(
    (f) => (f.user1Id === userId ? f.user2Id : f.user1Id)
  );

  const allIds = [userId, ...friendIds];

  // Get all stats for last week
  const allStats = await prisma.weeklyStats.findMany({
    where: { userId: { in: allIds }, weekStartDate: lastWeekStart },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  type StatsWithUser = Prisma.WeeklyStatsGetPayload<{
    include: { user: { select: { id: true; name: true; email: true } } };
  }>;

  // Determine winner
  const sorted = [...allStats].sort((a: StatsWithUser, b: StatsWithUser) => {
    if (b.totalTasksCompleted !== a.totalTasksCompleted)
      return b.totalTasksCompleted - a.totalTasksCompleted;
    return b.totalFocusMinutes - a.totalFocusMinutes;
  });

  const topEntry = sorted[0] as StatsWithUser | undefined;
  const winner = topEntry
    ? {
        name: topEntry.user.name ?? topEntry.user.email ?? "Unknown",
        tasksCompleted: topEntry.totalTasksCompleted,
        focusMinutes: topEntry.totalFocusMinutes,
        isCurrentUser: topEntry.userId === userId,
      }
    : null;

  return NextResponse.json({
    lastWeekStart: lastWeekStart.toISOString(),
    yourStats: {
      tasksCompleted: myStats?.totalTasksCompleted ?? 0,
      focusMinutes: myStats?.totalFocusMinutes ?? 0,
    },
    winner,
  });
}
