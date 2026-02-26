import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 },
      );
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== "pending") {
      return NextResponse.json(
        { error: "Friend request not found or not pending" },
        { status: 404 },
      );
    }

    if (request.receiverId !== userId) {
      return NextResponse.json(
        { error: "Only the receiver can accept this request" },
        { status: 403 },
      );
    }

    const [user1Id, user2Id] = [request.senderId, request.receiverId].sort();

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        user1Id,
        user2Id,
      },
    });

    if (!existingFriendship) {
      await prisma.friendship.create({
        data: {
          user1Id,
          user2Id,
        },
      });
    }

    await prisma.friendRequest.delete({ where: { id: request.id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Accept friend request error", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
