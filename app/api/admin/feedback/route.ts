import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FeedbackJson, Paginated } from "@/lib/types";

export async function GET(req: Request) {
  try {
    await requireAdmin("AUDITOR");

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );
    const status = searchParams.get("status")?.trim();
    const newsPostId = searchParams.get("newsPostId")?.trim();

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (newsPostId) where.newsPostId = newsPostId;

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          newsPost: { select: { title: true } },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const data: FeedbackJson[] = feedback.map((f: any) => ({
      id: f.id,
      newsPostId: f.newsPostId,
      newsPostTitle: f.newsPost?.title,
      name: f.name,
      email: f.email,
      message: f.message,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
      moderatedAt: f.moderatedAt ? f.moderatedAt.toISOString() : null,
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const response: Paginated<FeedbackJson> = {
      data,
      page,
      pageSize,
      total,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : "Failed to retrieve feedback.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const { ids, status, moderateAll } = body;

    const validStatuses = ["APPROVED", "REJECTED", "PENDING"] as const;
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED, REJECTED, or PENDING." },
        { status: 400 },
      );
    }

    let where: any = {};
    if (moderateAll) {
      if (status !== "PENDING") {
        where.status = "PENDING";
      }
    } else {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { error: "No feedback IDs provided." },
          { status: 400 },
        );
      }
      where.id = { in: ids };
    }

    const result = await prisma.feedback.updateMany({
      where,
      data: {
        status,
        moderatedAt: new Date(),
      },
    });

    return NextResponse.json({ updated: result.count });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : "Failed to moderate feedback.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin("ADMIN");

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No feedback IDs provided." },
        { status: 400 },
      );
    }

    const result = await prisma.feedback.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "Admin privileges required."
          : "Failed to delete feedback.";
    return NextResponse.json({ error: message }, { status });
  }
}
