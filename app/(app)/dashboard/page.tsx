import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, type User } from "@prisma/client";
import { getCurrentWeekStartDate } from "@/lib/week";
import DashboardClient from "@/components/DashboardClient";
import type { LeaderboardEntry } from "@/components/Leaderboard";
import type { Task } from "@/components/TaskList";

export const metadata = {
  title: "Dashboard | Momentum",
};

export default async function DashboardPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("Dashboard: getServerSession failed", err);
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  const { user: sessionUser } = session;
  const userId = sessionUser.id;

  if (!userId) {
    redirect("/login");
  }

  try {

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true, image: true },
  });

  const weekStartDate = getCurrentWeekStartDate();

  // Upsert current week stats
  const weeklyStats = await prisma.weeklyStats.upsert({
    where: {
      userId_weekStartDate: {
        userId,
        weekStartDate,
      },
    },
    update: {},
    create: {
      userId,
      weekStartDate,
    },
  });

  // Fetch friendships
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
    },
  });

  type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
    include: { user1: true; user2: true };
  }>;

  const friendUsers: User[] = friendships.map((f: FriendshipWithUsers) =>
    f.user1Id === userId ? f.user2 : f.user1,
  );

  // Build leaderboard: current user + friends, with this week's stats
  const allUserIds = [userId, ...friendUsers.map((f) => f.id)];

  const allStats = await prisma.weeklyStats.findMany({
    where: {
      userId: { in: allUserIds },
      weekStartDate,
    },
    include: { user: true },
  });

  type WeeklyStatsWithUser = Prisma.WeeklyStatsGetPayload<{
    include: { user: true };
  }>;

  const leaderboard: LeaderboardEntry[] = allStats
    .map((s: WeeklyStatsWithUser) => ({
      id: s.userId,
      name: s.user.name ?? s.user.email ?? "Unknown",
      image: s.user.image,
      tasksCompleted: s.totalTasksCompleted,
      focusMinutes: s.totalFocusMinutes,
      isCurrentUser: s.userId === userId,
    }))
    .sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
      if (b.tasksCompleted !== a.tasksCompleted) return b.tasksCompleted - a.tasksCompleted;
      return b.focusMinutes - a.focusMinutes;
    });

  // Fetch initial tasks
  const rawTasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      difficulty: true,
      deadline: true,
      completedAt: true,
      createdAt: true,
    },
  });

  const tasks: Task[] = rawTasks.map((t) => ({
    ...t,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <DashboardClient
      userName={user?.name ?? "friend"}
      userUsername={user?.username ?? null}
      totalTasksCompleted={weeklyStats.totalTasksCompleted}
      totalFocusMinutes={weeklyStats.totalFocusMinutes}
      totalPlannedTasks={weeklyStats.totalPlannedTasks}
      leaderboard={leaderboard}
      tasks={tasks}
    />
  );
  } catch (err) {
    console.error("Dashboard data fetch error:", err);
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f1] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <h1 className="text-xl font-bold text-stone-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-stone-500">
            Could not load dashboard data. This usually means the database is unreachable.
          </p>
          <p className="mt-4 text-xs text-stone-400 font-mono break-all">
            {err instanceof Error ? err.message : "Unknown error"}
          </p>
          <a href="/login" className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition">
            Back to Login
          </a>
        </div>
      </div>
    );
  }
}
