import prisma from "@/lib/prisma";
import { getCurrentWeekStartDate } from "@/lib/week";

export async function incrementCurrentWeekPlannedTasks(userId: string) {
  const weekStartDate = getCurrentWeekStartDate();

  await prisma.weeklyStats.upsert({
    where: {
      userId_weekStartDate: {
        userId,
        weekStartDate,
      },
    },
    update: {
      totalPlannedTasks: {
        increment: 1,
      },
    },
    create: {
      userId,
      weekStartDate,
      totalPlannedTasks: 1,
    },
  });
}

export async function incrementCurrentWeekCompletedTasks(userId: string) {
  const weekStartDate = getCurrentWeekStartDate();

  await prisma.weeklyStats.upsert({
    where: {
      userId_weekStartDate: {
        userId,
        weekStartDate,
      },
    },
    update: {
      totalTasksCompleted: {
        increment: 1,
      },
    },
    create: {
      userId,
      weekStartDate,
      totalTasksCompleted: 1,
    },
  });
}

export async function addFocusMinutes(userId: string, minutes: number) {
  const weekStartDate = getCurrentWeekStartDate();

  await prisma.weeklyStats.upsert({
    where: {
      userId_weekStartDate: {
        userId,
        weekStartDate,
      },
    },
    update: {
      totalFocusMinutes: {
        increment: minutes,
      },
    },
    create: {
      userId,
      weekStartDate,
      totalFocusMinutes: minutes,
    },
  });
}
