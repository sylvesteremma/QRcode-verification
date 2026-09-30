import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QRCodeJson } from "@/lib/types";

const qrCodeWithRelations = Prisma.validator<Prisma.QRCodeArgs>()({
  include: {
    product: { select: { name: true } },
    batch: { select: { number: true } },
  },
});
type QRCodeWithRelations = Prisma.QRCodeGetPayload<typeof qrCodeWithRelations>;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("AUDITOR");

    const code = await prisma.qRCode.findUnique({
      where: { id: params.id },
      include: {
        product: { select: { name: true } },
        batch: { select: { number: true } },
      },
    });

    if (!code) {
      return NextResponse.json(
        { error: "QR code not found." },
        { status: 404 },
      );
    }

    const codeJson: QRCodeJson = {
      id: code.id,
      code: code.code,
      productId: code.productId,
      productName: code.product?.name,
      batchId: code.batchId,
      batchNumber: code.batch?.number,
      status: code.status,
      scanCount: code.scanCount,
      firstScannedAt: code.firstScannedAt
        ? code.firstScannedAt.toISOString()
        : null,
      lastScannedAt: code.lastScannedAt
        ? code.lastScannedAt.toISOString()
        : null,
      expiresAt: code.expiresAt ? code.expiresAt.toISOString() : null,
      createdAt: code.createdAt.toISOString(),
    };

    return NextResponse.json({ code: codeJson });
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
            : "Failed to retrieve QR code.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("OPERATIONS");

    const existing = await prisma.qRCode.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "QR code not found." },
        { status: 404 },
      );
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ["ACTIVE", "REVOKED", "EXPIRED", "USED"];
    if (status === undefined || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be one of: ACTIVE, REVOKED, EXPIRED, USED.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.qRCode.update({
      where: { id: params.id },
      data: { status },
      include: {
        product: { select: { name: true } },
        batch: { select: { number: true } },
      },
    });

    const codeJson: QRCodeJson = {
      id: updated.id,
      code: updated.code,
      productId: updated.productId,
      productName: updated.product?.name,
      batchId: updated.batchId,
      batchNumber: updated.batch?.number,
      status: updated.status,
      scanCount: updated.scanCount,
      firstScannedAt: updated.firstScannedAt
        ? updated.firstScannedAt.toISOString()
        : null,
      lastScannedAt: updated.lastScannedAt
        ? updated.lastScannedAt.toISOString()
        : null,
      expiresAt: updated.expiresAt ? updated.expiresAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };

    return NextResponse.json({ code: codeJson });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    const message =
      status === 401
        ? "Authentication required."
        : status === 403
          ? "OPERATIONS privileges required."
          : status === 404 || status === 400
            ? error.message
            : "Failed to update QR code status.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin("ADMIN");

    const existing = await prisma.qRCode.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "QR code not found." },
        { status: 404 },
      );
    }

    await prisma.qRCode.delete({
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
            : "Failed to delete QR code.";
    return NextResponse.json({ error: message }, { status });
  }
}
