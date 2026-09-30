import { NextResponse } from "next/server";
import { getCurrentSession, serializeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const serialized = serializeUser(user);
    return NextResponse.json({ user: serialized });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve user session." },
      { status: 500 }
    );
  }
}
