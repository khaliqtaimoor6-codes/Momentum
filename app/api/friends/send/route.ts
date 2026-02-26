import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/friends/send
// Body: { query: string }  — @username  OR  email address
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const senderId = session.user.id;
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Username or email is required" },
        { status: 400 },
      );
    }

    const q = query.trim();

    // Find receiver by username OR email — ID is never returned to the caller
    const receiver = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: q, mode: "insensitive" } },
          { email:    { equals: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, username: true, name: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (receiver.id === senderId) {
      return NextResponse.json(
        { error: "You cannot send a request to yourself" },
        { status: 400 },
      );
    }

    // Already friends?
    const [u1, u2] = [senderId, receiver.id].sort();
    const existingFriendship = await prisma.friendship.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });
    if (existingFriendship) {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }

    // Duplicate request?
    const existingRequest = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId: receiver.id } },
    });
    if (existingRequest) {
      return NextResponse.json(
        { error: "Friend request already sent" },
        { status: 409 },
      );
    }

    await prisma.friendRequest.create({
      data: { senderId, receiverId: receiver.id },
    });

    return NextResponse.json(
      { success: true, to: receiver.username ?? receiver.name ?? "user" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Send friend request error", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
