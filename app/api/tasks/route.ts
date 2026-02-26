import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { incrementCurrentWeekPlannedTasks } from "@/lib/weeklyStats";

// GET /api/tasks — fetch all tasks for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
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

  return NextResponse.json({ tasks });
}

// POST /api/tasks — create a new task
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, priority, difficulty, deadline } = await req.json();

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const validPriorities = ["low", "medium", "high"];
  const validDifficulties = ["easy", "medium", "hard"];

  if (priority && !validPriorities.includes(priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }
  if (difficulty && !validDifficulties.includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      title: title.trim().slice(0, 200),
      priority: priority ?? "medium",
      difficulty: difficulty ?? "medium",
      deadline: deadline ? new Date(deadline) : null,
    },
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

  // Count this as a planned task for the week
  await incrementCurrentWeekPlannedTasks(session.user.id);

  return NextResponse.json({ task }, { status: 201 });
}
