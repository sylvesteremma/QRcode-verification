import { NextResponse } from "next/server";
import type { Product } from "@prisma/client";
import { getCurrentSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation";
import type { ProductJson, Paginated } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    const hierarchy: Record<string, number> = {
      AUDITOR: 1,
      OPERATIONS: 2,
      ADMIN: 3,
    };
    const canViewNonActive = session
      ? hierarchy[session.role] >= hierarchy["AUDITOR"]
      : false;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (!canViewNonActive) {
      where.status = "ACTIVE";
    } else if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
        { type: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    const data: ProductJson[] = products.map((p: Product) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      size: p.size,
      sku: p.sku,
      description: p.description,
      imageUrl: p.imageUrl,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const result: Paginated<ProductJson> = {
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
          : "Failed to retrieve products.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin("OPERATIONS");

    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const existing = await prisma.product.findUnique({
      where: { sku: parsed.data.sku },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A product with this SKU already exists." },
        { status: 409 },
      );
    }

    const created = await prisma.product.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        size: parsed.data.size || null,
        sku: parsed.data.sku,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
        status: parsed.data.status,
      },
    });

    const productJson: ProductJson = {
      id: created.id,
      name: created.name,
      type: created.type,
      size: created.size,
      sku: created.sku,
      description: created.description,
      imageUrl: created.imageUrl,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    return NextResponse.json({ product: productJson }, { status: 201 });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "OPERATIONS privileges required."
          : status === 400 || status === 409
            ? error.message
            : "Failed to create product.";
    return NextResponse.json({ error: message }, { status });
  }
}
