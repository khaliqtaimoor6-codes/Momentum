import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import FocusTimer, { type FocusTask } from "@/components/FocusTimer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Focus | Momentum",
};

export default async function FocusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Fetch only pending tasks for the task selector
  const rawTasks = await prisma.task.findMany({
    where: { userId: session.user.id, status: "pending" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  const tasks: FocusTask[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
  }));

  return <FocusTimer tasks={tasks} />;
}
