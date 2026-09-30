import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BatchJson } from "@/lib/types";

const batchWithProduct = Prisma.validator<Prisma.BatchArgs>()({
  include: { product: { select: { name: true } } },
});
type BatchWithProduct = Prisma.BatchGetPayload<typeof batchWithProduct>;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("OPERATIONS");

    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: {
        product: { select: { name: true } },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const batchJson: BatchJson = {
      id: batch.id,
      number: batch.number,
      productId: batch.productId,
      productName: batch.product?.name,
      productionDate: batch.productionDate.toISOString(),
      expiryDate: batch.expiryDate ? batch.expiryDate.toISOString() : null,
      quantity: batch.quantity,
      generatedCodes: batch.generatedCodes,
      status: batch.status,
      createdAt: batch.createdAt.toISOString(),
    };

    return NextResponse.json({ batch: batchJson });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "OPERATIONS privileges required."
          : status === 404
            ? error.message
            : "Failed to retrieve batch.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("OPERATIONS");

    const existing = await prisma.batch.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.number !== undefined) {
      if (typeof body.number !== "string" || body.number.trim().length < 2) {
        return NextResponse.json(
          { error: "Invalid batch number. Must be at least 2 characters." },
          { status: 400 },
        );
      }
      const numberTrimmed = body.number.trim();
      if (numberTrimmed !== existing.number) {
        const duplicate = await prisma.batch.findUnique({
          where: { number: numberTrimmed },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: "A batch with this number already exists." },
            { status: 409 },
          );
        }
      }
      updateData.number = numberTrimmed;
    }
    if (body.productId !== undefined) {
      if (typeof body.productId !== "string" || !body.productId.trim()) {
        return NextResponse.json(
          { error: "Invalid product ID." },
          { status: 400 },
        );
      }
      const productExists = await prisma.product.findUnique({
        where: { id: body.productId },
      });
      if (!productExists) {
        return NextResponse.json(
          { error: "The specified product does not exist." },
          { status: 404 },
        );
      }
      updateData.productId = body.productId;
    }
    if (body.productionDate !== undefined) {
      const pd = new Date(body.productionDate);
      if (Number.isNaN(pd.getTime())) {
        return NextResponse.json(
          { error: "Invalid production date format." },
          { status: 400 },
        );
      }
      updateData.productionDate = pd;
    }
    if (body.expiryDate !== undefined) {
      if (body.expiryDate === "" || body.expiryDate === null) {
        updateData.expiryDate = null;
      } else {
        const ed = new Date(body.expiryDate);
        if (Number.isNaN(ed.getTime())) {
          return NextResponse.json(
            { error: "Invalid expiry date format." },
            { status: 400 },
          );
        }
        updateData.expiryDate = ed;
      }
    }
    if (body.quantity !== undefined) {
      if (
        typeof body.quantity !== "number" ||
        !Number.isInteger(body.quantity) ||
        body.quantity <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid quantity. Must be a positive integer." },
          { status: 400 },
        );
      }
      updateData.quantity = body.quantity;
    }
    if (body.status !== undefined) {
      if (!["ACTIVE", "COMPLETED", "REVOKED"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be ACTIVE, COMPLETED, or REVOKED." },
          { status: 400 },
        );
      }
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 },
      );
    }

    const updated = await prisma.batch.update({
      where: { id: params.id },
      data: updateData,
      include: {
        product: { select: { name: true } },
      },
    });

    const batchJson: BatchJson = {
      id: updated.id,
      number: updated.number,
      productId: updated.productId,
      productName: updated.product?.name,
      productionDate: updated.productionDate.toISOString(),
      expiryDate: updated.expiryDate ? updated.expiryDate.toISOString() : null,
      quantity: updated.quantity,
      generatedCodes: updated.generatedCodes,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json({ batch: batchJson });
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
            : "Failed to update batch.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("ADMIN");

    const existing = await prisma.batch.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    await prisma.batch.delete({
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
            : "Failed to delete batch.";
    return NextResponse.json({ error: message }, { status });
  }
}
