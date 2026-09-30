import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuditLogJson, Paginated } from "@/lib/types";

export async function GET(req: Request) {
  try {
    await requireAdmin("AUDITOR");

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );
    const search = searchParams.get("search")?.trim() ?? "";

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search) {
      where.OR = [
        { summary: { contains: search, mode: "insensitive" as const } },
        { entity: { contains: search, mode: "insensitive" as const } },
        { userEmail: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const data: AuditLogJson[] = logs.map((l: any) => ({
      id: l.id,
      userId: l.userId,
      userEmail: l.userEmail,
      action: l.action,
      entity: l.entity,
      reference: l.reference,
      summary: l.summary,
      timestamp: l.timestamp.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const response: Paginated<AuditLogJson> = {
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
          : "Failed to retrieve audit logs.";
    return NextResponse.json({ error: message }, { status });
  }
}
