import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get Monday 00:00 UTC of current week
function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? 6 : day - 1; // shift so Mon=0
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

// GET — fetch this week's timetable
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekStart = getCurrentWeekStart();

  const entries = await prisma.timetableEntry.findMany({
    where: { userId: session.user.id, weekStart },
    select: { day: true, hour: true, activity: true },
  });

  // Build a map: { "day-hour": activity }
  const map: Record<string, string> = {};
  for (const e of entries) {
    map[`${e.day}-${e.hour}`] = e.activity;
  }

  return NextResponse.json({ weekStart: weekStart.toISOString(), entries: map });
}

// PUT — save/update timetable entries (bulk)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const entries: { day: number; hour: number; activity: string }[] = body.entries;

  if (!Array.isArray(entries))
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const weekStart = getCurrentWeekStart();
  const validActivities = ["sleep", "study", "gym", "skills", "none"];

  // Upsert each entry
  const ops = entries
    .filter(
      (e) =>
        typeof e.day === "number" &&
        e.day >= 0 &&
        e.day <= 6 &&
        typeof e.hour === "number" &&
        e.hour >= 0 &&
        e.hour <= 23 &&
        validActivities.includes(e.activity)
    )
    .map((e) =>
      prisma.timetableEntry.upsert({
        where: {
          userId_weekStart_day_hour: {
            userId: session.user!.id,
            weekStart,
            day: e.day,
            hour: e.hour,
          },
        },
        update: { activity: e.activity as never },
        create: {
          userId: session.user!.id,
          weekStart,
          day: e.day,
          hour: e.hour,
          activity: e.activity as never,
        },
      })
    );

  await Promise.all(ops);

  return NextResponse.json({ ok: true });
}
