import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/minitasks — create a new mini task (completed or active)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, timeLimit, isCompleted } = await req.json();

  if (!title || typeof timeLimit !== "number") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const task = await prisma.miniTask.create({
    data: {
      userId: session.user.id,
      title,
      timeLimit,
      isCompleted: isCompleted ?? false,
    },
  });

  return NextResponse.json(task);
}

// GET /api/minitasks — list user's mini tasks
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.miniTask.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(tasks);
}
