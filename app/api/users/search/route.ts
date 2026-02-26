import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 1) {
    return NextResponse.json({ users: [] });
  }

  // Get IDs of existing friends so we can mark them
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }] },
    select: { user1Id: true, user2Id: true },
  });
  const friendIds = new Set(
    friendships.map((f) =>
      f.user1Id === session.user.id ? f.user2Id : f.user1Id
    )
  );

  // Get IDs of users with pending outgoing requests
  const sentRequests = await prisma.friendRequest.findMany({
    where: { senderId: session.user.id, status: "pending" },
    select: { receiverId: true },
  });
  const pendingIds = new Set(sentRequests.map((r) => r.receiverId));

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: session.user.id } },
        {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
    },
    take: 10,
  });

  const results = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    image: u.image,
    bio: u.bio,
    isFriend: friendIds.has(u.id),
    isPending: pendingIds.has(u.id),
  }));

  return NextResponse.json({ users: results });
}
