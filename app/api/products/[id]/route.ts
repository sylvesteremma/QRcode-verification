import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProductJson } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin("AUDITOR");

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const productJson: ProductJson = {
      id: product.id,
      name: product.name,
      type: product.type,
      size: product.size,
      sku: product.sku,
      description: product.description,
      imageUrl: product.imageUrl,
      status: product.status,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    return NextResponse.json({ product: productJson });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
        ? "AUDITOR privileges required."
        : status === 404
        ? error.message
        : "Failed to retrieve product.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin("OPERATIONS");

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length < 2) {
        return NextResponse.json(
          { error: "Invalid name. Must be at least 2 characters." },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }
    if (body.type !== undefined) {
      if (typeof body.type !== "string" || body.type.trim().length < 2) {
        return NextResponse.json(
          { error: "Invalid type. Must be at least 2 characters." },
          { status: 400 }
        );
      }
      updateData.type = body.type.trim();
    }
    if (body.size !== undefined) {
      updateData.size = body.size === "" ? null : body.size;
    }
    if (body.sku !== undefined) {
      if (typeof body.sku !== "string" || body.sku.trim().length < 2) {
        return NextResponse.json(
          { error: "Invalid SKU. Must be at least 2 characters." },
          { status: 400 }
        );
      }
      const skuTrimmed = body.sku.trim();
      if (skuTrimmed !== existing.sku) {
        const duplicate = await prisma.product.findUnique({
          where: { sku: skuTrimmed },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: "A product with this SKU already exists." },
            { status: 409 }
          );
        }
      }
      updateData.sku = skuTrimmed;
    }
    if (body.description !== undefined) {
      updateData.description = body.description === "" ? null : body.description;
    }
    if (body.imageUrl !== undefined) {
      updateData.imageUrl = body.imageUrl === "" ? null : body.imageUrl;
    }
    if (body.status !== undefined) {
      if (!["ACTIVE", "INACTIVE", "DRAFT"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be ACTIVE, INACTIVE, or DRAFT." },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });

    const productJson: ProductJson = {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      size: updated.size,
      sku: updated.sku,
      description: updated.description,
      imageUrl: updated.imageUrl,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ product: productJson });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
        ? "OPERATIONS privileges required."
        : status === 404 || status === 400 || status === 409
        ? error.message
        : "Failed to update product.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin("ADMIN");

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
        ? "ADMIN privileges required."
        : status === 404
        ? error.message
        : "Failed to delete product.";
    return NextResponse.json({ error: message }, { status });
  }
}
