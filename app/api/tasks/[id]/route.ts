import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { incrementCurrentWeekCompletedTasks } from "@/lib/weeklyStats";

// PATCH /api/tasks/[id] — mark complete or update fields
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { status, title, priority, difficulty, deadline } = body;

  const wasCompleted = existing.status === "completed";
  const nowCompleted = status === "completed";

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title && { title: String(title).trim().slice(0, 200) }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(difficulty && { difficulty }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      // Set completedAt when transitioning to completed
      ...(!wasCompleted && nowCompleted ? { completedAt: new Date() } : {}),
      // Clear completedAt when reverting to pending
      ...(wasCompleted && status === "pending" ? { completedAt: null } : {}),
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

  // Increment weekly stats only on fresh completion
  if (!wasCompleted && nowCompleted) {
    await incrementCurrentWeekCompletedTasks(session.user.id);
  }

  return NextResponse.json({ task: updated });
}

// DELETE /api/tasks/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
