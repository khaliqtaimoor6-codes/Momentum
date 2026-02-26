import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/friends/requests — incoming pending requests for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: session.user.id, status: "pending" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      sender: {
        select: { name: true, username: true, image: true },
      },
    },
  });

  return NextResponse.json({ requests, count: requests.length });
}
