import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AlertJson, Paginated } from "@/lib/types";

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
    const severity = searchParams.get("severity")?.trim();

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.alert.count({ where }),
    ]);

    const data: AlertJson[] = alerts.map((a: any) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      status: a.status,
      title: a.title,
      description: a.description,
      productId: a.productId,
      batchId: a.batchId,
      codeId: a.codeId,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const response: Paginated<AlertJson> = {
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
          : "Failed to retrieve alerts.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No alert IDs provided." },
        { status: 400 },
      );
    }

    const validStatuses = ["OPEN", "INVESTIGATING", "RESOLVED"] as const;
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be OPEN, INVESTIGATING, or RESOLVED." },
        { status: 400 },
      );
    }

    const result = await prisma.alert.updateMany({
      where: { id: { in: ids } },
      data: { status },
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
          : "Failed to update alerts.";
    return NextResponse.json({ error: message }, { status });
  }
}
