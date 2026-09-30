import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Paginated, ScanEventJson } from "@/lib/types";

export async function GET(req: Request) {
  try {
    await requireAdmin("AUDITOR");

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );

    const result = searchParams.get("result")?.trim();
    const riskLevel = searchParams.get("riskLevel")?.trim();
    const productId = searchParams.get("productId")?.trim();
    const batchId = searchParams.get("batchId")?.trim();
    const dateFrom = searchParams.get("dateFrom")?.trim();
    const dateTo = searchParams.get("dateTo")?.trim();

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (result) where.result = result;
    if (riskLevel) where.riskLevel = riskLevel;
    if (productId) where.productId = productId;
    if (batchId) where.batchId = batchId;
    if (dateFrom)
      where.timestamp = { ...where.timestamp, gte: new Date(dateFrom) };
    if (dateTo) where.timestamp = { ...where.timestamp, lte: new Date(dateTo) };

    const [scans, total] = await Promise.all([
      prisma.scanEvent.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: "desc" },
        include: {
          product: { select: { name: true } },
          batch: { select: { number: true } },
        },
      }),
      prisma.scanEvent.count({ where }),
    ]);

    const data: ScanEventJson[] = scans.map((s: any) => ({
      id: s.id,
      timestamp: s.timestamp.toISOString(),
      code: s.code,
      productId: s.productId,
      productName: s.product?.name,
      batchId: s.batchId,
      batchNumber: s.batch?.number,
      result: s.result,
      riskLevel: s.riskLevel,
      country: s.country,
      city: s.city,
      deviceType: s.deviceType,
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const response: Paginated<ScanEventJson> = {
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
          : "Failed to retrieve scans.";
    return NextResponse.json({ error: message }, { status });
  }
}
