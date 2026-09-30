import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { batchSchema } from "@/lib/validation";
import type { BatchJson, Paginated } from "@/lib/types";

const batchWithProduct = Prisma.validator<Prisma.BatchArgs>()({
  include: { product: { select: { name: true } } },
});
type BatchWithProduct = Prisma.BatchGetPayload<typeof batchWithProduct>;

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

    const where = search
      ? {
          number: { contains: search, mode: "insensitive" as const },
        }
      : undefined;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true } },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    const data: BatchJson[] = batches.map((b: BatchWithProduct) => ({
      id: b.id,
      number: b.number,
      productId: b.productId,
      productName: b.product?.name,
      productionDate: b.productionDate.toISOString(),
      expiryDate: b.expiryDate ? b.expiryDate.toISOString() : null,
      quantity: b.quantity,
      generatedCodes: b.generatedCodes,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const result: Paginated<BatchJson> = {
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
          : "Failed to retrieve batches.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const productExists = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
    });

    if (!productExists) {
      return NextResponse.json(
        { error: "The specified product does not exist." },
        { status: 404 },
      );
    }

    const productionDate = new Date(parsed.data.productionDate);
    if (Number.isNaN(productionDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid production date format." },
        { status: 400 },
      );
    }

    const expiryDate = parsed.data.expiryDate
      ? new Date(parsed.data.expiryDate)
      : null;
    if (
      parsed.data.expiryDate &&
      expiryDate &&
      Number.isNaN(expiryDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid expiry date format." },
        { status: 400 },
      );
    }

    const existing = await prisma.batch.findUnique({
      where: { number: parsed.data.number },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A batch with this number already exists." },
        { status: 409 },
      );
    }

    const created = await prisma.batch.create({
      data: {
        number: parsed.data.number,
        productId: parsed.data.productId,
        productionDate,
        expiryDate,
        quantity: parsed.data.quantity,
        status: parsed.data.status,
      },
      include: {
        product: { select: { name: true } },
      },
    });

    const batchJson: BatchJson = {
      id: created.id,
      number: created.number,
      productId: created.productId,
      productName: created.product?.name,
      productionDate: created.productionDate.toISOString(),
      expiryDate: created.expiryDate ? created.expiryDate.toISOString() : null,
      quantity: created.quantity,
      generatedCodes: created.generatedCodes,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json({ batch: batchJson }, { status: 201 });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "OPERATIONS privileges required."
          : status === 400 || status === 409 || status === 404
            ? error.message
            : "Failed to create batch.";
    return NextResponse.json({ error: message }, { status });
  }
}
