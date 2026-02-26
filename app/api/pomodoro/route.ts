import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { addFocusMinutes } from "@/lib/weeklyStats";

// POST /api/pomodoro — record a completed focus session
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { minutes } = await req.json();

  if (typeof minutes !== "number" || minutes < 1 || minutes > 180) {
    return NextResponse.json({ error: "Invalid minutes value" }, { status: 400 });
  }

  await addFocusMinutes(session.user.id, minutes);

  return NextResponse.json({ success: true, minutesAdded: minutes });
}
