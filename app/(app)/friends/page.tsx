import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import FriendsClient from "@/components/FriendsClient";

export const metadata = {
  title: "Friends | Momentum",
};

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  if (!userId) redirect("/login");

  // Incoming pending requests
  const pendingRequests = await prisma.friendRequest.findMany({
    where: { receiverId: userId, status: "pending" },
    include: { sender: { select: { name: true, username: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Friendships
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      user1: { select: { name: true, username: true, image: true } },
      user2: { select: { name: true, username: true, image: true } },
    },
  });

  type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
    include: {
      user1: { select: { name: true; username: true; image: true } };
      user2: { select: { name: true; username: true; image: true } };
    };
  }>;

  const friends = friendships.map((f: FriendshipWithUsers) => {
    const friend = f.user1Id === userId ? f.user2 : f.user1;
    return { name: friend.name, username: friend.username, image: friend.image };
  });

  const pending = pendingRequests.map((r) => ({
    id: r.id, // request ID only — sender ID never exposed
    sender: { name: r.sender.name, username: r.sender.username, image: r.sender.image },
  }));

  return <FriendsClient friends={friends} pendingRequests={pending} />;
}
