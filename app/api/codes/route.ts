import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QRCodeJson, Paginated } from "@/lib/types";

const qrCodeWithRelations = Prisma.validator<Prisma.QRCodeArgs>()({
  include: {
    product: { select: { name: true } },
    batch: { select: { number: true } },
  },
});
type QRCodeWithRelations = Prisma.QRCodeGetPayload<typeof qrCodeWithRelations>;

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
    const productId = searchParams.get("productId")?.trim() ?? "";
    const batchId = searchParams.get("batchId")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (search) {
      where.code = { contains: search, mode: "insensitive" as const };
    }
    if (productId) {
      where.productId = productId;
    }
    if (batchId) {
      where.batchId = batchId;
    }
    if (status) {
      where.status = status;
    }

    const [codes, total] = await Promise.all([
      prisma.qRCode.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true } },
          batch: { select: { number: true } },
        },
      }),
      prisma.qRCode.count({ where }),
    ]);

    const data: QRCodeJson[] = codes.map((c: QRCodeWithRelations) => ({
      id: c.id,
      code: c.code,
      productId: c.productId,
      productName: c.product?.name,
      batchId: c.batchId,
      batchNumber: c.batch?.number,
      status: c.status,
      scanCount: c.scanCount,
      firstScannedAt: c.firstScannedAt ? c.firstScannedAt.toISOString() : null,
      lastScannedAt: c.lastScannedAt ? c.lastScannedAt.toISOString() : null,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const result: Paginated<QRCodeJson> = {
      data,
      page,
      pageSize,
      total,
      totalPages,
    };

    return NextResponse.json(result);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "AUDITOR privileges required."
          : "Failed to retrieve QR codes.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const { productId, batchId, status } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "productId is required." },
        { status: 400 },
      );
    }

    const productExists = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productExists) {
      return NextResponse.json(
        { error: "The specified product does not exist." },
        { status: 404 },
      );
    }

    if (batchId) {
      const batchExists = await prisma.batch.findUnique({
        where: { id: batchId },
      });
      if (!batchExists) {
        return NextResponse.json(
          { error: "The specified batch does not exist." },
          { status: 404 },
        );
      }
    }

    const validStatuses = ["ACTIVE", "REVOKED", "EXPIRED", "USED"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be ACTIVE, REVOKED, EXPIRED, or USED." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Use /api/codes/generate for bulk QR code generation.",
    });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "OPERATIONS privileges required."
          : status === 400 || status === 404
            ? error.message
            : "Failed to process request.";
    return NextResponse.json({ error: message }, { status });
  }
}
