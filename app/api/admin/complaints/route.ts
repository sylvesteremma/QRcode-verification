import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ComplaintJson, Paginated } from "@/lib/types";

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
    const status = searchParams.get("status")?.trim();

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: "insensitive" as const } },
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { submittedAt: "desc" },
      }),
      prisma.complaint.count({ where }),
    ]);

    const data: ComplaintJson[] = complaints.map((c: any) => ({
      id: c.id,
      reference: c.reference,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      category: c.category,
      subject: c.subject,
      message: c.message,
      productId: c.productId,
      batchNumber: c.batchNumber,
      verificationCode: c.verificationCode,
      status: c.status,
      statusMessage: c.statusMessage,
      submittedAt: c.submittedAt.toISOString(),
      lastUpdatedAt: c.lastUpdatedAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const response: Paginated<ComplaintJson> = {
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
          : "Failed to retrieve complaints.";
    return NextResponse.json({ error: message }, { status });
  }
}
