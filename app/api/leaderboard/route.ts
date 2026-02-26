import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyJwt } from "@/lib/jwt";
import { getCurrentWeekStartDate } from "@/lib/week";

const AUTH_COOKIE_NAME = "auth_token";

export async function GET(req: NextRequest) {
  try {
    // Auth: read JWT from cookie
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.sub;
    const weekStartDate = getCurrentWeekStartDate();

    // Get all friend ids
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const friendIds = (
      friendships as Array<{ user1Id: string; user2Id: string }>
    ).map((f) => (f.user1Id === userId ? f.user2Id : f.user1Id));

    const allUserIds = [userId, ...friendIds];

    // Fetch this week's stats for all users, include user info
    const allStats = await prisma.weeklyStats.findMany({
      where: {
        userId: { in: allUserIds },
        weekStartDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    type StatsWithUser = Prisma.WeeklyStatsGetPayload<{
      include: {
        user: {
          select: { id: true; name: true; email: true; image: true };
        };
      };
    }>;

    interface LeaderboardRow {
      id: string;
      name: string;
      email: string | null;
      image: string | null;
      tasksCompleted: number;
      focusMinutes: number;
      plannedTasks: number;
      isCurrentUser: boolean;
    }

    // Sort: primary = tasksCompleted desc, secondary = focusMinutes desc
    const sorted: LeaderboardRow[] = (allStats as StatsWithUser[])
      .map((s) => ({
        id: s.userId,
        name: s.user.name ?? s.user.email ?? "Unknown",
        email: s.user.email,
        image: s.user.image,
        tasksCompleted: s.totalTasksCompleted,
        focusMinutes: s.totalFocusMinutes,
        plannedTasks: s.totalPlannedTasks,
        isCurrentUser: s.userId === userId,
      }))
      .sort((a: LeaderboardRow, b: LeaderboardRow) => {
        if (b.tasksCompleted !== a.tasksCompleted) {
          return b.tasksCompleted - a.tasksCompleted;
        }
        return b.focusMinutes - a.focusMinutes;
      });

    return NextResponse.json({ leaderboard: sorted }, { status: 200 });
  } catch (error) {
    console.error("Leaderboard error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
