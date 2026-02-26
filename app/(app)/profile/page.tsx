import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getCurrentWeekStartDate } from "@/lib/week";
import ProfileClient from "@/components/ProfileClient";

export const metadata = {
  title: "Profile | Momentum",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      email: true,
      bio: true,
      image: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const weeklyStats = await prisma.weeklyStats.findUnique({
    where: {
      userId_weekStartDate: {
        userId,
        weekStartDate: getCurrentWeekStartDate(),
      },
    },
    select: {
      totalTasksCompleted: true,
      totalPlannedTasks: true,
      totalFocusMinutes: true,
    },
  });

  return (
    <ProfileClient
      name={user.name}
      username={user.username}
      email={user.email}
      bio={user.bio}
      image={user.image}
      createdAt={(user.createdAt ?? new Date(0)).toISOString()}
      weeklyStats={weeklyStats ?? null}
      isOwnProfile={true}
    />
  );
}
